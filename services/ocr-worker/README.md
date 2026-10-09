# Experimental local OCR boundary

The authenticated Python service runs the measured Pix2Text-MFR-1.5 candidate on localhost. It proposes bounded single-column regions, recognizes each crop, returns actual pixel-derived bounding boxes, and requires confirmation. No confidence or grading is generated. Its small general-handwriting pilot was poor; this is an experimental correction aid, not production-approved OCR.

Install the separate Python 3.13 candidate environment from `research/ocr-benchmarks/requirements-pix2text-lock.txt`. Configure a random TRACELAB_OCR_TOKEN of at least 32 characters through the environment, then run:

```sh
python services/ocr-worker/python/server.py
```

It binds only 127.0.0.1:8020 (TRACELAB_OCR_PORT can change the port). Configure TRACELAB_OCR_URL=http://127.0.0.1:8020/transcribe and the same token for the TypeScript adapter. `pnpm ocr:smoke <non-sensitive-image-path>` verifies unauthorized rejection and typed extraction, storing an honest provider-only report. No credentials are written to reports.

Images are limited to JPEG/PNG, 5 MiB and 16 megapixels; model inputs are reduced to 2000px. Region proposals are limited to 20, output text to 512 characters per line, and response reads to 128 KiB. Ambiguous layout, crossed-out work, perspective distortion and closely spaced steps remain limitations. Every recognition result needs human review; unsupported LaTeX remains unconverted instead of silently losing symbols.

The provider and service are implemented. Durable application jobs, UI processing/correction integration, retries and production hosting are the next task. The current main application still offers manual transcription until that integration is verified. No Cloudflare queue consumer is claimed.
