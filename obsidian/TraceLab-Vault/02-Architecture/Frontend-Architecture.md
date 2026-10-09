# Frontend Architecture

The current client renders landing, student workspace, curriculum, engineering, and teacher studio views. The API owns durable state; React holds only draft lines, selected image, view selection, and notifications. Editing a line clears confirmation. Confirmed versions are locked. Images can rotate and crop before upload. The current equation editor is labeled plain text; MathLive integration and PWA caching are pending. Browser checks could not execute because listen() was denied.

Related: [[00-START-HERE]] · [[Current-State]]
