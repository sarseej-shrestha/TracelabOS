# Known Issues

Permissions, Git/GitHub authentication, dependencies, localhost and Chromium are restored; the original blockers are resolved. Source, tests and evidence are on the official repository. See [[Current-State]] for exact verified commits and current checks.

Resolved locally in TASK-0021C: student assignment serialization previously spread the stored question and exposed answer-bearing parameters. An explicit StudentQuestion projection now omits parameters, references, seeds and unexpected internal fields, while retaining required presentation data and full teacher/server provenance. Regression tests failed on both databases before the change and pass afterward; CI/merge status is in [[Current-State]]. This controls response disclosure; it does not prevent someone from independently solving a generated mathematics problem.

Hosted Neon/R2 transport and public deployment are unverified without configured provider resources. Experimental local OCR works through correction/confirmation, but the general handwriting pilot had only 3/72 exact matches; camera-photograph accuracy remains unverified. Do not infer production OCR quality from controlled workflow tests.

Reviewed mastery, targeted remediation and the experiment view are implemented and verified. Deterministic milestone replay is locally verified; live WebSockets, distributed quotas, account recovery and automated retention/deletion remain incomplete. Replay snapshots have an explicit 10,000-event bound and cannot prove the existence of records absent before capture. Assignment/submission lists are capped at 100 without a next-page UI. Repeated teacher review requests append decisions; request idempotency is not implemented. Supported math intentionally excludes broad symbolic formulas/nonlinear domains; unsupported inputs require review. No school/minor deployment compliance or learning efficacy has been established.

Related: [[Current-State]] · [[Regression-History]] · [[Master-Roadmap]]
