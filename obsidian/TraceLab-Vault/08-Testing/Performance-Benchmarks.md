# Performance Benchmarks

Measured locally on 2026-10-08T23:55:12.944Z with Apple M4 Max and Node v23.10.0.

- Workload: one four-step distribution/error-propagation solution.
- Warmups: 500; measured iterations: 10,000.
- p50: 0.018834 ms.
- p95: 0.023958 ms.
- p99: 0.062084 ms.

Reproduce with `npm run benchmark`. Machine-readable evidence: artifacts/math-benchmark.json. This is in-process math-engine time, with no network or database. The repeated case is favorable to a warm JIT and does not represent a diverse classroom workload. No API/cloud latency, OCR duration, concurrent-load result, or before/after performance improvement is claimed.

Related: [[Performance-Engineering]] · [[Test-Results]] · [[Current-State]]
