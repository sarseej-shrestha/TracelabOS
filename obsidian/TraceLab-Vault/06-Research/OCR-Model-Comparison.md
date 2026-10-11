# OCR Model Comparison

Actual local and hosted inference evidence follows. No photographed-work production accuracy is established.

Related: [[00-START-HERE]] · [[Current-State]]

## Executed pilot — 2026-10-08

The prior no-inference status is superseded. Actual CPU inference on a fixed 72-image MathWriting human-stroke pilot: pix2tex 0/72 exact, character edit rate 6.1612; Pix2Text-MFR-1.5 3/72 exact, edit rate 0.3403. Local p50/p95 respectively 685.332/1907.442 ms and 77.484/133.850 ms. These are advanced single-expression strokes with synthetic blur/rotation, not grades 5–8 paper photographs. Both models returned outputs without provider exceptions; poor outputs remain in the report. Pix2Text is the better experimental candidate here, but neither result supports a production accuracy claim. See research/ocr-benchmarks/README.md and [[OCR-Benchmark-Results]].

## Hosted pilot — 2026-10-11

Eight fixed MathWriting human-stroke expressions were sent once to each of two Workers AI models. All sixteen HTTP requests returned 200. Moondream 3.1 returned eight empty result objects: zero usable transcriptions, 0/8 exact, edit rate 1.0, p50/p95 237.242/1378.997 ms. The cause of the empty provider output is unresolved; this is not evidence about the model's intrinsic recognition accuracy.

Mistral Small returned seven valid structured transcriptions and one string containing invalid JSON escapes. After fixing the client's assumption that `response` must be a string, offline rescoring gives 0/8 exact, character edit rate 0.4878, p50/p95 870.945/2463.685 ms. Some misses are alternative LaTeX syntax; others change symbols or grouping. No syntax repair or symbolic equivalence is used to inflate fidelity. The requested alias is `@cf/mistralai/mistral-small-3.1-24b-instruct`; all responses identify `@cf/mistralai/mistral-small-3.1-24b-v2`. Reported Mistral usage totals 57.5496 neurons across eight responses; Moondream supplies no usage. This is not an invoice or total-account usage measurement.

Both the initial contract-failure report and corrected report are preserved in artifacts/ocr-hosted-initial-contract.json and artifacts/ocr-hosted-pilot.json. The latter records the former's SHA-256 and zero additional calls. Thirty-seven Python metric/benchmark tests pass, including captured-response regression and concurrent daily budget exhaustion. The first regression assertion expected all Mistral responses to parse; inspecting the eighth raw response established its invalid escapes, and the test now explicitly preserves that rejection.

The research runner reserves at most sixteen requests per UTC day across processes, before sending, including failures; no retries, at most 512 output tokens, no redirects, and bounded response sizes. The day's allowance is exhausted. Research credentials and images stay ignored; no model was activated publicly. These are clean rasterized pen strokes, not camera photographs. Correction frequency, line ordering, supported-domain grading errors and billed cost remain unmeasured. No production model is selected.

Sources: [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/), [Moondream contract](https://developers.cloudflare.com/workers-ai/models/moondream3.1-9B-A2B/), [Mistral contract](https://developers.cloudflare.com/workers-ai/models/mistral-small-3.1-24b-instruct/). Research attribution remains in research/ocr-benchmarks/DATA-LICENSE.md.
