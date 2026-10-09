# TraceLab OS

**Debugging the way humans learn.**

An educational reasoning debugger: generated mathematics, student-confirmed transcription, exact step verification, and teacher review. The repository is under active construction; see the [current state](obsidian/TraceLab-Vault/07-Development-Journal/Current-State.md) for verified capabilities and blockers.

Official repository: https://github.com/sarseej-shrestha/TracelabOS

## Local development

Use Node 22 LTS (22.13+) or Node 24 LTS and pnpm 10.28.2.

```sh
corepack pnpm install --frozen-lockfile
pnpm dev
```

The pnpm lockfile is authoritative. Run `pnpm verify` for type checks, lint, tests and a production build. Open http://localhost:3000. Only fictional adult demo personas may be used. No school deployment or privacy-law compliance is claimed.

## Engineering records

Open [obsidian/TraceLab-Vault](obsidian/TraceLab-Vault/00-START-HERE.md) as an Obsidian vault. It records implementation evidence, limitations, acceptance criteria, and recovery steps. No OCR accuracy, public deployment, learning improvement, or GitHub push is claimed without verification.

## Verified checkpoint

Authenticated teacher/student accounts, isolated visitor demo, classrooms/enrollment, seeded assignments, private database images, confirmed transcription, exact reasoning checks, teacher review and persisted event history work locally. Eighteen skills and thirty-six active templates are available: fractions, algebra and ratios/percentages each have six skills with two templates.

- 1,141 automated TypeScript tests pass, including 8,000 seeded property cases and API workflows on SQLite and PostgreSQL/PGlite.
- Eleven Chromium browser tests pass, including authenticated classroom workflow, OCR correction/cancellation/failure, mobile, keyboard and axe checks. Twenty-four Python metric/region tests and five independent-oracle unit tests pass.
- Independent SymPy: 2,000 existing cases/6,000 comparisons and 1,800 fraction cases/11,700 comparisons and 1,800 algebra cases/11,400 comparisons and 1,800 ratio cases/11,850 comparisons, plus 2,000 metric quantity cases, zero disagreements.
- Typecheck, lint, formatting and production build pass. Dependency audit reports no known vulnerabilities at the recorded checkpoint.

GitHub recovery PR #1 passed CI and is merged. The original source archive is retained; see [recovery](recovery/README.md). PostgreSQL is selected with DATABASE_URL, after `pnpm db:migrate`. `pnpm db:import-sqlite` can copy a preserved local database into an empty migrated target. See the [database decision](obsidian/TraceLab-Vault/11-Architecture-Decisions/ADR-0005-Async-Persistence.md).

Experimental local handwriting OCR now runs through durable jobs, student correction and explicit confirmation. The real-model API and browser smokes passed; the general 72-image handwriting pilot was poor (3 exact matches for Pix2Text), so targeted photographed-work accuracy and production selection remain open. Hosted Neon/R2 verification, full curriculum, mastery, real-time replay and public deployment remain incomplete. Local PostgreSQL verification does not demonstrate hosted performance. [OCR integration evidence](artifacts/ocr-browser-smoke.json), [browser report](artifacts/browser-results.json), [oracle report](artifacts/sympy-results.json).

Private R2 storage is available when all provider credentials are configured; existing local images remain usable. Migration and orphan reconciliation default to dry-run. See the [storage decision](obsidian/TraceLab-Vault/11-Architecture-Decisions/ADR-0006-Private-Object-Storage.md).

## Experimental handwriting workflow

See [OCR service and worker setup](services/ocr-worker/README.md). Configure the authenticated local model URL/token and the same absolute database path for web and worker processes, then run the Python inference service, `pnpm ocr:worker`, and the web app. Save a photo, select **Extract handwritten steps**, review/correct every line, and explicitly confirm before grading. Cancellation and recognition failure preserve manual entry. The original machine transcription remains visible to the authorized student and teacher.

`pnpm test:e2e` starts an isolated database, application and clearly labeled deterministic provider fixture; it never uses cloud credentials or existing application data. Separately, `pnpm ocr:browser-smoke <non-sensitive-image-path>` exercises a running real local service through Chromium, then deliberately substitutes known demo steps to test grading. Neither fixture tests nor that smoke establish photograph accuracy. Configure CHROMIUM_PATH when using an existing local browser.
