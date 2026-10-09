# Research data attribution and restrictions

The pilot uses human-written test strokes from **MathWriting**, published by **Google LLC**: [dataset repository and license](https://github.com/google-research/google-research/tree/master/mathwriting), [archive description](https://github.com/google-research/google-research/blob/master/mathwriting/archive_readme.md), and [paper](https://arxiv.org/abs/2404.10690).

MathWriting data is licensed under [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-nc-sa/4.0/). Its Wikipedia-derived mathematical labels are also identified by the publisher as [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The excerpt is downloaded from the publisher and verified against a pinned SHA-256. Human strokes are scaled/rasterized, then optionally blurred or rotated. No demographic or writer identifiers are used.

Raw samples and derived images stay in ignored `.data/ocr-research/`. They are research material, not unrestricted application assets. The expected labels and dataset-derived portions of `artifacts/ocr-*-pilot.json` retain these attribution and license terms; this notice does not relicense independent application code. Do not reuse these samples for a commercial deployment without appropriate rights.

Model implementations and weights have separate licenses: [pix2tex](https://github.com/lukas-blecher/LaTeX-OCR) is MIT; [Pix2Text-MFR-1.5 model card](https://huggingface.co/breezedeus/pix2text-mfr-1.5) declares MIT. Runtime dependencies retain their own licenses. No third-party source or weights are committed here.
