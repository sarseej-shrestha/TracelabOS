import { timingSafeEqual } from 'node:crypto';
/** Infrastructure authentication is additional to the existing per-user sessions. */
export function bridgeAuthorized(
  request: Request,
  secret: string | undefined,
): boolean {
  const supplied = request.headers.get('x-tracelab-bridge') ?? '';
  if (!/^[a-f0-9]{64}$/.test(secret ?? '') || !/^[a-f0-9]{64}$/.test(supplied))
    return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(secret!));
}
