import type { Page, TestInfo } from 'playwright/test';

/** Fixed labels only: URLs, IDs, query strings, bodies and headers never enter reports. */
export function apiRouteLabel(url: string): string | undefined {
  let path: string;
  try {
    path = new URL(url).pathname;
  } catch {
    return undefined;
  }
  if (!path.startsWith('/api/')) return undefined;
  for (const action of ['transcription', 'confirm', 'process', 'image'])
    if (new RegExp(`^/api/submissions/[^/]+/${action}$`).test(path))
      return `submission-${action}`;
  if (/^\/api\/submissions\/[^/]+$/.test(path)) return 'submission-read';
  if (path === '/api/demo') return 'demo-start';
  if (path === '/api/submissions') return 'submission-create';
  return 'other-api';
}
export function recordApiDiagnostics(page: Page, info: TestInfo) {
  let count = 0;
  page.on('response', (response) => {
    const route = apiRouteLabel(response.url());
    if (!route || count >= 40) return;
    count++;
    const description = `${route}: HTTP ${response.status()}`;
    info.annotations.push({ type: 'api-response', description });
    if (response.status() >= 400) console.info(`[browser API] ${description}`);
  });
  page.on('requestfailed', (request) => {
    const route = apiRouteLabel(request.url());
    if (!route || count >= 40) return;
    count++;
    const description = `${route}: transport failure`;
    info.annotations.push({ type: 'api-response', description });
    console.info(`[browser API] ${description}`);
  });
}
