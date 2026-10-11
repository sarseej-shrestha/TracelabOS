# Handwriting OCR feasibility pilot

Actual local inference was executed for pix2tex 0.1.4 and Pix2Text-MFR-1.5. The fixed pilot contains 24 human-written MathWriting test expressions, each rendered clean, blurred and rotated: 72 images per model. IDs are selected before inference by sorted order and label length, not successful predictions.

| Candidate        | Exact matches | Character edit rate |       Local p50 / p95 |
| ---------------- | ------------: | ------------------: | --------------------: |
| pix2tex          |        0 / 72 |              6.1612 | 685.332 / 1907.442 ms |
| Pix2Text-MFR-1.5 |        3 / 72 |              0.3403 |   77.484 / 133.850 ms |

Character edit rate can exceed one when a model inserts many extra characters. Exact matching removes whitespace and the standalone LaTeX sizing commands `\left`/`\right`; other syntactic alternatives remain different. These are OCR fidelity metrics, not symbolic equivalence or grading accuracy. All predictions, image/dataset/model hashes, load/warmup times and runtime details are retained in `artifacts/ocr-*-pilot.json`.

**Neither result justifies production handwriting accuracy.** Pix2Text is the better experimental candidate in this pilot; student correction and a targeted grades 5–8 photograph benchmark remain mandatory. Most pilot expressions exceed the current grading domain. The dataset is digital human pen strokes rasterized by our script, not camera photographs. Blur and rotation are controlled transformations. Line order, correction frequency, cost, and downstream grading error rate were not measured. Models were run on CPU with four threads; timings are local measurements, not cloud performance.

Create separate Python 3.13 virtual environments for the candidates, install the corresponding pinned requirements lock, and run from the repository root:

```sh
python research/ocr-benchmarks/benchmark.py --model pix2tex
python research/ocr-benchmarks/benchmark.py --model pix2text
```

The default download/render directory is ignored `.data/ocr-research`. pix2tex fetches its upstream checkpoint on first use. Pix2Text uses pinned model revision `1cef9f0bdcd6a4c63df7de1311fb0894593340cc`. Network/model loading are excluded from per-image latency. Each image resets the Torch seed to 20261008. Full package locks document the experiment environments; the Pix2Text experiment uses the model directly through ONNX, not its unrelated document-layout components.

Lightweight CI installs `requirements-test.txt`, then runs `ruff check`, `ruff format --check`, and `pytest` on this directory. It verifies scoring and rendering without downloading models. An arrow-token normalization defect was caught during review, regression-tested, and the pix2tex pilot rerun before publication. `controls.py --font <path>` reproduces three separate typeset sanity controls; recorded controls used macOS Times New Roman, 48px. They are not part of the handwriting score.

Read [data attribution and licensing](DATA-LICENSE.md) before reusing samples or dataset-derived report fields. Do not copy these research samples into unrestricted product fixtures.

## Hosted pilot — 2026-10-11

Eight fixed MathWriting human-stroke expressions were sent once to each of two Workers AI models. All sixteen HTTP requests returned 200. Moondream 3.1 returned eight empty result objects: zero usable transcriptions, 0/8 exact, edit rate 1.0, p50/p95 237.242/1378.997 ms. The cause of the empty provider output is unresolved; this is not evidence about the model's intrinsic recognition accuracy.

Mistral Small returned seven valid structured transcriptions and one string containing invalid JSON escapes. After fixing the client's assumption that `response` must be a string, offline rescoring gives 0/8 exact, character edit rate 0.4878, p50/p95 870.945/2463.685 ms. Some misses are alternative LaTeX syntax; others change symbols or grouping. No syntax repair or symbolic equivalence is used to inflate fidelity. The requested alias is `@cf/mistralai/mistral-small-3.1-24b-instruct`; all responses identify `@cf/mistralai/mistral-small-3.1-24b-v2`. Reported Mistral usage totals 57.5496 neurons across eight responses; Moondream supplies no usage. This is not an invoice or total-account usage measurement.

Both the initial contract-failure report and corrected report are preserved in artifacts/ocr-hosted-initial-contract.json and artifacts/ocr-hosted-pilot.json. The latter records the former's SHA-256 and zero additional calls. Thirty-seven Python metric/benchmark tests pass, including captured-response regression and concurrent daily budget exhaustion. The first regression assertion expected all Mistral responses to parse; inspecting the eighth raw response established its invalid escapes, and the test now explicitly preserves that rejection.

The research runner reserves at most sixteen requests per UTC day across processes, before sending, including failures; no retries, at most 512 output tokens, no redirects, and bounded response sizes. The day's allowance is exhausted. Research credentials and images stay ignored; no model was activated publicly. These are clean rasterized pen strokes, not camera photographs. Correction frequency, line ordering, supported-domain grading errors and billed cost remain unmeasured. No production model is selected.

Sources: [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/), [Moondream contract](https://developers.cloudflare.com/workers-ai/models/moondream3.1-9B-A2B/), [Mistral contract](https://developers.cloudflare.com/workers-ai/models/mistral-small-3.1-24b-instruct/). Research attribution remains in research/ocr-benchmarks/DATA-LICENSE.md.

Reproduce scoring offline without credentials or inference:

```sh
python research/ocr-benchmarks/cloud_benchmark.py --rescore artifacts/ocr-hosted-initial-contract.json --output /tmp/tracelab-rescored.json
```

A fresh bounded run requires `--execute --account-id <existing-account> --wrangler-auth --output <new-report.json>` or a private `TRACELAB_BENCHMARK_TOKEN` environment variable. Existing reports are never overwritten by inference. The ignored daily budget is shared across runs; do not remove/reset it to evade limits. CLI scoring preserves input, raw results, durations and hashes; byte-identical rescoring is reproducible from the preserved report. Research-only prompts request transcription, never grades.
