# OCR Pipeline

The live pipeline is not connected. Implemented steps: choose/capture an image, rotate/crop locally, upload with size/signature checks, server decode and pixel limit, EXIF rotation, normalized JPEG storage, private retrieval, manual transcription, confirmation, evaluation. The provider adapter can validate structured lines and reject timeouts, wrong questions, malformed boxes, and unsupported fields. Do not describe these adapter tests as handwriting recognition. See [[OCR-Model-Comparison]].

Related: [[00-START-HERE]] · [[Current-State]]

## Experimental provider implemented

A localhost Python service now runs the measured Pix2Text-MFR-1.5 model, validates/normalizes images, proposes up to 20 single-column regions and returns computed bounding boxes. Shared-token authentication, 5 MiB/16 MP input bounds, 128 KiB HTTP output bound and structured validation protect the boundary. The TypeScript adapter passes the trusted question ID and never executes photo instructions. Conservative LaTeX conversion leaves unknown constructs unconverted. Real-model service smoke passed; no grading occurred. Durable job/UI integration is still next, so the application remains in manual-entry mode at this checkpoint. See services/ocr-worker/README.md.
