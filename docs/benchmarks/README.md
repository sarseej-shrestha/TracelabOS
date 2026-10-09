# Reproducible evidence

- `npm run benchmark`: local exact-engine timings → `artifacts/math-benchmark.json`.
- `npm run oracle:vectors`: generated TypeScript results → `artifacts/oracle-vectors.json`.
- `python research/symbolic-oracle/verify.py`: independent SymPy/Fraction comparison → `artifacts/sympy-results.json`.
- `npm test -- --reporter=json --outputFile=artifacts/unit-integration-results.json`: automated test report.

Install the pinned SymPy requirements in a Python virtual environment first. The recorded run used Python 3.13.9/SymPy 1.14.0 and Node 23.10.0 on Apple M4 Max. The engine benchmark repeats one case after warmup and should not be extrapolated to server throughput. The symbolic oracle compares generated parameters and does not certify OCR accuracy or all mathematical domains.

A labeled student-reasoning precision benchmark, actual OCR corpus results, database timings, HTTP latency, and concurrent classroom load are not yet available. See the vault's Test-Results and Performance-Benchmarks notes for exact outcomes and blocked checks.
