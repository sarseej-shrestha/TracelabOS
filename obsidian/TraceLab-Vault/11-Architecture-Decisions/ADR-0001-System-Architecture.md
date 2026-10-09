# ADR 0001 System Architecture

Status: accepted for local development. Use a modular monolith with pure mathematical/contracts packages and a single coordinating API. This keeps atomic confirmation/grading/history practical while domain rules evolve. Next.js provides the UI and Hono provides explicit REST boundaries. Production Workers compatibility is not assumed: current Node-only adapters need replacement. Avoid independent services until asynchronous OCR/real-time deployment requires separate runtimes.

Related: [[00-START-HERE]] · [[Current-State]]
