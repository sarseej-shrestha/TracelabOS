import { expect, it } from 'vitest';
import { apiRouteLabel } from '../helpers/browser-diagnostics.ts';
it.each(['transcription', 'confirm', 'process', 'image'])(
  'labels %s without submission IDs or credentials',
  (action) =>
    expect(
      apiRouteLabel(
        `https://user:secret@example.test/api/submissions/private-id/${action}?token=secret#secret`,
      ),
    ).toBe(`submission-${action}`),
);
it.each(['https://example.test/', 'invalid', 'https://example.test/api'])(
  'ignores non-API URLs',
  (url) => expect(apiRouteLabel(url)).toBeUndefined(),
);
it('redacts arbitrary paths', () =>
  expect(
    apiRouteLabel('https://example.test/api/private-secret?password=secret'),
  ).toBe('other-api'));
it('labels submission reads separately from confirmation', () =>
  expect(apiRouteLabel('https://example.test/api/submissions/private-id')).toBe(
    'submission-read',
  ));
