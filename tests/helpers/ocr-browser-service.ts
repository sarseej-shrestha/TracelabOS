/** Deterministic test-only HTTP provider plus the real durable worker; never used by production. */
import { createServer } from 'node:http';
import { openDatabase } from '../../packages/database/src/local.ts';
import { asDatabase } from '../../packages/database/src/adapter.ts';
import { configuredVisionProvider } from '../../packages/vision-adapter/src/http.ts';
import { runOcrJob } from '../../services/api/src/ocr.ts';
const provider = configuredVisionProvider();
if (!provider || !process.env.TRACELAB_DB_PATH)
  throw Error('Test environment missing');
const db = asDatabase(openDatabase(process.env.TRACELAB_DB_PATH));
let mode = 'success',
  stopping = false;
const server = createServer(async (req, res) => {
  if (req.url === '/health') {
    res.end('ready');
    return;
  }
  if (req.url === '/mode' && req.method === 'POST') {
    let text = '';
    for await (const chunk of req) text += chunk;
    mode = JSON.parse(text).mode;
    res.end('ok');
    return;
  }
  if (
    req.url !== '/transcribe' ||
    req.headers.authorization !== `Bearer ${process.env.TRACELAB_OCR_TOKEN}`
  ) {
    res.writeHead(401).end();
    return;
  }
  let text = '';
  for await (const chunk of req) text += chunk;
  const questionId = JSON.parse(text).questionId,
    selected = mode;
  await new Promise((resolve) =>
    setTimeout(resolve, selected === 'slow' ? 2500 : 150),
  );
  res.setHeader('content-type', 'application/json');
  res.end(
    JSON.stringify(
      selected === 'invalid'
        ? { malformed: true }
        : {
            questionId,
            modelVersion: provider.version,
            status: 'needs_confirmation',
            lines: ['3(x-2)=15', '3x-2=15', '3x=17', 'x=17/3'].map(
              (raw, index) => ({ line: index + 1, raw, latex: raw }),
            ),
          },
    ),
  );
});
await new Promise<void>((resolve) => server.listen(8031, '127.0.0.1', resolve));
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => {
    stopping = true;
    server.close();
  });
try {
  while (!stopping) {
    await runOcrJob(db, provider);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
} finally {
  await db.close();
}
