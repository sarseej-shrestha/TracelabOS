import { Client } from 'pg';
import { TLSSocket } from 'node:tls';

// pg 8.23.1 enables PLUS opportunistically; its require policy is not released.
// Isolate the pinned protocol hooks here and test downgrade/sequence rejection.
// pg retains responsibility for SCRAM cryptography and server-proof validation.
interface ProtocolHooks {
  _handleAuthSASL(message: { mechanisms: string[] }): void;
  _handleAuthSASLContinue(message: { data: string }): Promise<void>;
  _handleAuthSASLFinal(message: { data: string }): void;
  _handleReadyForQuery(message: { status: string }): void;
}
const protocol = Client.prototype as unknown as ProtocolHooks;

export class ChannelBoundClient extends Client {
  private authentication:
    'initial' | 'started' | 'continuing' | 'responded' | 'verified' | 'failed' =
    'initial';
  // pg's internal session is cleared only after validating the server proof.
  declare saslSession: { mechanism: string; message: string } | null;

  private rejectAuthentication() {
    if (this.authentication === 'failed') return;
    this.authentication = 'failed';
    const error = new Error(
      'PostgreSQL requires verified TLS and SCRAM-SHA-256-PLUS',
    );
    this.connection.emit('error', error);
    this.connection.stream.destroy();
  }

  _handleAuthCleartextPassword() {
    this.rejectAuthentication();
  }
  _handleAuthMD5Password() {
    this.rejectAuthentication();
  }
  _handleAuthSASL(message: { mechanisms: string[] }) {
    const stream = this.connection.stream;
    if (
      this.authentication !== 'initial' ||
      !(stream instanceof TLSSocket) ||
      !stream.authorized ||
      !message.mechanisms.includes('SCRAM-SHA-256-PLUS')
    )
      return this.rejectAuthentication();
    this.authentication = 'started';
    protocol._handleAuthSASL.call(this, { mechanisms: ['SCRAM-SHA-256-PLUS'] });
  }
  async _handleAuthSASLContinue(message: { data: string }) {
    if (
      this.authentication !== 'started' ||
      this.saslSession?.message !== 'SASLInitialResponse'
    )
      return this.rejectAuthentication();
    this.authentication = 'continuing';
    await protocol._handleAuthSASLContinue.call(this, message);
    if (
      this.authentication === 'continuing' &&
      this.sessionMessage() === 'SASLResponse'
    )
      this.authentication = 'responded';
    else this.rejectAuthentication();
  }
  _handleAuthSASLFinal(message: { data: string }) {
    if (
      this.authentication !== 'responded' ||
      this.saslSession?.mechanism !== 'SCRAM-SHA-256-PLUS' ||
      this.saslSession.message !== 'SASLResponse'
    )
      return this.rejectAuthentication();
    protocol._handleAuthSASLFinal.call(this, message);
    if (this.saslSession === null) this.authentication = 'verified';
    else this.rejectAuthentication();
  }
  _handleReadyForQuery(message: { status: string }) {
    if (this.authentication !== 'verified') return this.rejectAuthentication();
    protocol._handleReadyForQuery.call(this, message);
  }
  private sessionMessage(): string | undefined {
    // Re-read after pg's asynchronous handler mutates the session.
    return this.saslSession?.message;
  }
  get channelBindingVerified() {
    return this.authentication === 'verified';
  }
}
