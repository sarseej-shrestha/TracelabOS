# Security Testing

Integration tests reject unauthenticated requests, cross-origin and missing-Origin mutations, student classroom creation, cross-classroom submissions/photos/events, stale edits, unconfirmed grading, teacher override attempts by students, corrupt/spoofed images, and duplicate grading effects. Session logout invalidation and feedback withholding are covered. Penetration testing, dependency audit, storage deletion, distributed rate limits, and production infrastructure security remain pending.

Related: [[00-START-HERE]] · [[Current-State]]

TASK-0021C response-disclosure regression was reproduced on SQLite and PostgreSQL before the fix (two failing targeted cases). After explicit student field projection, the full 1,385-test suite and thirteen browser workflows pass. Tests verify exclusion of parameters, references, seed and future internal fields, plus exact retention of teacher/server provenance. Evidence: artifacts/student-question-projection-verification.log. This is authorized-student data minimization; it is not a claim that students cannot solve or reproduce a generated problem.

TASK-0022A: mastery endpoints deny anonymous, peer and foreign-teacher reads on SQLite/PostgreSQL. An enrolled student's evidence remains separate in each classroom. Review/evidence/estimate updates roll back together under an injected release-event storage failure.
