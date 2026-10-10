# Known Issues

Permissions, Git/GitHub authentication, dependencies, localhost and Chromium are restored; the original blockers are resolved. Source, tests and evidence are on the official repository. See [[Current-State]] for exact verified commits and current checks.

Open assessment-data issue: student assignment JSON includes generation parameters (for example a solved x), because the baseline serializer spreads the stored Question and only removes reference paths. Fraction task fd5f584 also removed alternate paths, but parameters remain. This exposes unnecessary answer-bearing metadata to an authorized student, not another classroom's records. A dedicated security task must replace that serializer with an explicit student-safe field selection while retaining full teacher/server provenance. Geometry integration discovered the issue; fix follows its merge.

Hosted Neon/R2 transport and public deployment are unverified without configured provider resources. Experimental local OCR works through correction/confirmation, but the general handwriting pilot had only 3/72 exact matches; camera-photograph accuracy remains unverified. Do not infer production OCR quality from controlled workflow tests.

Persisted mastery, remediation assignment workflows, deterministic replay/WebSockets, distributed quotas, account recovery and automated retention/deletion remain incomplete. Assignment/submission lists are capped at 100 without a next-page UI. Repeated teacher review requests append decisions; request idempotency is not implemented. Supported math intentionally excludes broad symbolic formulas/nonlinear domains; unsupported inputs require review. No school/minor deployment compliance or learning efficacy has been established.

Related: [[Current-State]] · [[Regression-History]] · [[Master-Roadmap]]
