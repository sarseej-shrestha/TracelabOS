# OCR Benchmark Results

No handwriting dataset has been evaluated and no model inference has run. Provider-contract tests use synthetic response objects and test validation/recovery only. Exact expression accuracy, line order, symbol accuracy, human correction frequency, cost/image, and downstream grading error are all unmeasured. The corpus manifest and scoring plan in research/ocr-benchmarks must distinguish printed controls from genuine handwriting.

Related: [[00-START-HERE]] · [[Current-State]]

## Actual handwriting pilot

2026-10-08: two local models processed the same 24 human MathWriting test strokes × three variants, 72 images each. pix2tex exact 0/72 (0%); Pix2Text-MFR-1.5 exact 3/72 (4.17%). Reports contain every prediction, error, sample hash, weights hash, runtime and latency. Character edit rates: 6.1612 and 0.3403. Local p50/p95: 685.332/1907.442 ms and 77.484/133.850 ms. These are not photograph or classroom benchmarks. Human correction frequency, line ordering, hosted cost and grading-error impact are unmeasured. No production model is approved by this pilot. Research data remains governed by its NC/share-alike terms; see research/ocr-benchmarks/DATA-LICENSE.md. Eighteen Python regression tests validate metrics/rendering without model downloads.
