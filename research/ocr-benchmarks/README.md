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
