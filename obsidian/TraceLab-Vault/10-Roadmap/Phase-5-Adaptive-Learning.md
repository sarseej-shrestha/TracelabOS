# Phase 5 Adaptive Learning

Implemented TASK-0022A: versioned classroom-scoped BKT estimates from one evidence item per reviewed submission, corrected/retracted evidence replay, transitive prerequisite rules, authorized progress views and independent arithmetic checks. Parameters and readiness cutoffs remain provisional. Historical pre-upgrade reviews are preserved but not backfilled automatically.

Implemented locally in TASK-0022B: teacher-assigned recommended practice for a specific reviewed student, immutable intervention provenance/idempotency, peer isolation, and student completion through the normal workflow. A full browser test verifies the subsequent review and mastery update. PR #17 merged after all checks.

TASK-0022C historical rebuild is implemented with read-only planning, atomic apply and verified preservation; the local demo has been backfilled. PR #18 merged after checks. TASK-0022D now compares baselines/rules/BKT reproducibly on disclosed synthetic data; verification passes locally, with push/CI pending. Next: product-facing experiment view. Do not claim synthetic experiments demonstrate learning gains.

Exit acceptance remains explainable targeted question delivery, exactly-once reviewed mastery, prerequisite handling, uncertainty and reproducible comparisons. The core local workflow and offline comparison are implemented; the product-facing experiment view remains. No real-data calibration or educator validation is claimed.

Related: [[Adaptive-Learning-Engine]] · [[Current-State]]
