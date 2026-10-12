# OCR Benchmark Results

Actual local and hosted inference evidence follows. No photographed-work production accuracy is established.

Related: [[00-START-HERE]] · [[Current-State]]

## Actual handwriting pilot

2026-10-08: two local models processed the same 24 human MathWriting test strokes × three variants, 72 images each. pix2tex exact 0/72 (0%); Pix2Text-MFR-1.5 exact 3/72 (4.17%). Reports contain every prediction, error, sample hash, weights hash, runtime and latency. Character edit rates: 6.1612 and 0.3403. Local p50/p95: 685.332/1907.442 ms and 77.484/133.850 ms. These are not photograph or classroom benchmarks. Human correction frequency, line ordering, hosted cost and grading-error impact are unmeasured. No production model is approved by this pilot. Research data remains governed by its NC/share-alike terms; see research/ocr-benchmarks/DATA-LICENSE.md. Eighteen Python regression tests validate metrics/rendering without model downloads.

## Hosted pilot — 2026-10-11

Eight fixed MathWriting human-stroke expressions were sent once to each of two Workers AI models. All sixteen HTTP requests returned 200. Moondream 3.1 returned eight empty result objects: zero usable transcriptions, 0/8 exact, edit rate 1.0, p50/p95 237.242/1378.997 ms. The cause of the empty provider output is unresolved; this is not evidence about the model's intrinsic recognition accuracy.

Mistral Small returned seven valid structured transcriptions and one string containing invalid JSON escapes. After fixing the client's assumption that `response` must be a string, offline rescoring gives 0/8 exact, character edit rate 0.4878, p50/p95 870.945/2463.685 ms. Some misses are alternative LaTeX syntax; others change symbols or grouping. No syntax repair or symbolic equivalence is used to inflate fidelity. The requested alias is `@cf/mistralai/mistral-small-3.1-24b-instruct`; all responses identify `@cf/mistralai/mistral-small-3.1-24b-v2`. Reported Mistral usage totals 57.5496 neurons across eight responses; Moondream supplies no usage. This is not an invoice or total-account usage measurement.

Both the initial contract-failure report and corrected report are preserved in artifacts/ocr-hosted-initial-contract.json and artifacts/ocr-hosted-pilot.json. The latter records the former's SHA-256 and zero additional calls. Thirty-seven Python metric/benchmark tests pass, including captured-response regression and concurrent daily budget exhaustion. The first regression assertion expected all Mistral responses to parse; inspecting the eighth raw response established its invalid escapes, and the test now explicitly preserves that rejection.

The research runner reserves at most sixteen requests per UTC day across processes, before sending, including failures; no retries, at most 512 output tokens, no redirects, and bounded response sizes. The day's allowance is exhausted. Research credentials and images stay ignored; no model was activated publicly. These are clean rasterized pen strokes, not camera photographs. Correction frequency, line ordering, supported-domain grading errors and billed cost remain unmeasured. No production model is selected.

Sources: [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/), [Moondream contract](https://developers.cloudflare.com/workers-ai/models/moondream3.1-9B-A2B/), [Mistral contract](https://developers.cloudflare.com/workers-ai/models/mistral-small-3.1-24b-instruct/). Research attribution remains in research/ocr-benchmarks/DATA-LICENSE.md.

Adapter regression checkpoint: replayed all eight captured Mistral payloads offline; seven parse and the original invalid JSON remains rejected. No additional inference calls or accuracy claims. A separate malformed-LaTeX case exposed JSON’s valid form-feed escape: hosted lines now reject control characters. The focused adapter/local-provider/durable-job suite passes 87 tests on both SQLite and PostgreSQL emulation where applicable. Public inference remains disabled.
