# Testing Strategy

Vitest unit tests cover exact arithmetic, parser limits, supported/unsupported outcomes, all state edges, question generation, and vision-contract failure paths. fast-check uses fixed seeds for thousands of arithmetic/linear cases. In-memory SQLite/Hono tests cover authentication, authorization, confirmation, concurrency version checks, image decoding, evaluation history, and feedback release. Python SymPy provides an independent generated-case oracle. Playwright tests production workflows and axe when port/browser access is available. Targets and results live separately in [[Test-Matrix]] and [[Test-Results]].

Related: [[00-START-HERE]] · [[Current-State]]
