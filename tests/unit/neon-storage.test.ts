import { describe, expect, it } from 'vitest';
import {
  configuredImageStore,
  NeonImageStore,
} from '../../packages/vision-adapter/src/storage.ts';
const valid = {
  NEON_STORAGE_BUCKET: 'tracelab-submissions',
  NEON_STORAGE_ENDPOINT:
    'https://br-example.storage.c-6.us-east-2.aws.neon.tech',
  NEON_STORAGE_REGION: 'us-east-2',
  NEON_STORAGE_ACCESS_KEY_ID: 'test-only-access',
  NEON_STORAGE_SECRET_ACCESS_KEY: 'test-only-secret',
};
it('selects private Neon storage explicitly', () => {
  const store = configuredImageStore(valid);
  expect(store).toBeInstanceOf(NeonImageStore);
  expect(store?.kind).toBe('private-neon');
});
it.each(Object.keys(valid))('fails closed with missing %s', (missing) => {
  expect(() => configuredImageStore({ ...valid, [missing]: '' })).toThrow(
    'Incomplete Neon',
  );
});
describe('prevents credentials from being sent to unintended endpoints', () => {
  it.each([
    'http://br-example.storage.c-6.us-east-2.aws.neon.tech',
    'https://br-example.storage.c-6.us-east-2.aws.neon.tech.attacker.test',
    'https://127.0.0.1',
    'https://user:password@br-example.storage.c-6.us-east-2.aws.neon.tech',
    'https://br-example.storage.c-6.us-east-2.aws.neon.tech:9000',
    'https://br-example.storage.c-6.us-east-2.aws.neon.tech/private',
    'https://br-example.storage.c-6.us-east-2.aws.neon.tech?token=x',
    'https://br-example.storage.c-6.us-east-2.aws.neon.tech#fragment',
    'invalid',
  ])('rejects %s', (endpoint) => {
    expect(() =>
      configuredImageStore({ ...valid, NEON_STORAGE_ENDPOINT: endpoint }),
    ).toThrow('Invalid Neon storage endpoint');
  });
});
it('rejects mixed providers instead of choosing silently', () => {
  expect(() => configuredImageStore({ ...valid, R2_BUCKET: 'other' })).toThrow(
    'only one',
  );
});
it('rejects a region that does not match the endpoint', () => {
  expect(() =>
    configuredImageStore({ ...valid, NEON_STORAGE_REGION: 'eu-west-1' }),
  ).toThrow('region');
});
it('rejects path-shaped bucket names', () => {
  expect(() =>
    configuredImageStore({ ...valid, NEON_STORAGE_BUCKET: '../private' }),
  ).toThrow('bucket');
});
