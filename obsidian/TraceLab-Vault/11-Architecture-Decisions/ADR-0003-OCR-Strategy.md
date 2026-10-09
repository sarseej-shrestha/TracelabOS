# ADR 0003 OCR Strategy

Status: benchmark decision pending. Separate provider transcription from deterministic grading. Treat all OCR output as untrusted, reject invalid shapes/question/model identifiers, omit unavailable bounding boxes, and require student confirmation. No winner has been selected among Workers AI vision, pix2tex, and Pix2Text. Manual entry keeps the core workflow usable while honest UI messaging identifies unavailable inference.

Related: [[00-START-HERE]] · [[Current-State]]
