# OCR Model Comparison

Candidates: pix2tex for formula-to-LaTeX; Pix2Text for document/layout and formula extraction; Workers AI vision candidates for hosted structured extraction. Source capabilities do not establish accuracy on multi-line student handwriting. No model has been selected by benchmark and no inference was executed. A fair comparison needs consented or controlled handwriting, fixed preprocessing, exact-expression/line-order/symbol accuracy, correction frequency, latency/cost, and downstream error analysis.

Sources: https://github.com/lukas-blecher/LaTeX-OCR ; https://github.com/breezedeus/Pix2Text ; https://developers.cloudflare.com/workers-ai/platform/pricing/ .

Related: [[00-START-HERE]] · [[Current-State]]

## Executed pilot — 2026-10-08

The prior no-inference status is superseded. Actual CPU inference on a fixed 72-image MathWriting human-stroke pilot: pix2tex 0/72 exact, character edit rate 6.1612; Pix2Text-MFR-1.5 3/72 exact, edit rate 0.3403. Local p50/p95 respectively 685.332/1907.442 ms and 77.484/133.850 ms. These are advanced single-expression strokes with synthetic blur/rotation, not grades 5–8 paper photographs. Both models returned outputs without provider exceptions; poor outputs remain in the report. Pix2Text is the better experimental candidate here, but neither result supports a production accuracy claim. See research/ocr-benchmarks/README.md and [[OCR-Benchmark-Results]].
