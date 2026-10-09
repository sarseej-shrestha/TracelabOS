# TraceLab OS

**Debugging the way humans learn.**

An educational reasoning debugger: generated mathematics, student-confirmed transcription, exact step verification, and teacher review. The repository is under active construction; see the [current state](obsidian/TraceLab-Vault/07-Development-Journal/Current-State.md) for verified capabilities and blockers.

Official repository: https://github.com/sarseej-shrestha/TracelabOS

## Local development

Node 22.13+ is required for SQLite. Intended workspace manager: pnpm 10.28.2.

```sh
pnpm install
pnpm dev
```

The initial restricted environment has an npm offline fallback (`npm ci --offline` using a populated cache). Run `npm run verify` for type checks, lint, tests and a production build. Open http://localhost:3000. Only fictional adult demo personas may be used. No school deployment or privacy-law compliance is claimed.

## Engineering records

Open [obsidian/TraceLab-Vault](obsidian/TraceLab-Vault/00-START-HERE.md) as an Obsidian vault. It records implementation evidence, limitations, acceptance criteria, and recovery steps. No OCR accuracy, public deployment, learning improvement, or GitHub push is claimed without verification.

## Verified checkpoint

Implemented locally: authenticated teacher/student accounts, isolated visitor demo, classrooms and enrollment, seeded assignments, private image storage, manual transcription and confirmation, exact reasoning checks, teacher review, and persisted event history. Four skills and four question templates are available.

- 358 automated tests passed; 5,000 seeded property cases.
- Independent SymPy oracle: 2,000 generated cases, 6,000 comparisons, zero disagreements.
- Type checking, linting, formatting, production build, and 84-note vault validation passed.
- Browser/axe tests are configured but blocked by the environment's denial of localhost listening. UI interaction is not yet browser-verified.

Live OCR, PostgreSQL/R2 cloud adapters, full curriculum, mastery, real-time replay, and public deployment remain incomplete. Images use private local SQLite storage; there is no hosted OCR processing. No Git commits or pushes exist because this session denies `.git` writes and GitHub network access. See the [recovery instructions](obsidian/TraceLab-Vault/07-Development-Journal/Recovery-Instructions.md) before initializing or pushing anything.

Verification evidence: [test log](artifacts/final-verification.log), [oracle report](artifacts/sympy-results.json), and [math benchmark](artifacts/math-benchmark.json). Benchmarks are local engine timings, not cloud or API latency. No actual-learning improvement or student-data compliance is claimed.

Recovery checkpoint: a [verified source archive and restore report](recovery/README.md) now preserve the existing 150 files and all 84 notes. The extracted copy passed a clean lockfile install and all prior checks again. Git/push and browser access remain blocked by the active environment. The next import must be one honest baseline commit; see the [baseline runbook](recovery/BASELINE-IMPORT.md).

Full-access recovery update: Git/GitHub and localhost permissions have been restored and a single baseline import is being prepared. Earlier sandbox-blocker notes are historical. Browser checks and online dependency reproducibility are the next verification tasks.
