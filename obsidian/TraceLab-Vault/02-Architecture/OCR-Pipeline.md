# OCR Pipeline

The live pipeline is not connected. Implemented steps: choose/capture an image, rotate/crop locally, upload with size/signature checks, server decode and pixel limit, EXIF rotation, normalized JPEG storage, private retrieval, manual transcription, confirmation, evaluation. The provider adapter can validate structured lines and reject timeouts, wrong questions, malformed boxes, and unsupported fields. Do not describe these adapter tests as handwriting recognition. See [[OCR-Model-Comparison]].

Related: [[00-START-HERE]] · [[Current-State]]
