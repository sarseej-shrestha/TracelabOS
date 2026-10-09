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

Authenticated teacher/student accounts, isolated visitor demo, classrooms/enrollment, seeded assignments, private database images, confirmed transcription, exact reasoning checks, teacher review and persisted event history work locally. Four skills/templates are available.

- 416 automated tests pass, including 5,000 seeded property cases and API workflows on SQLite and PostgreSQL/PGlite.
- Five Chromium browser tests pass, including authenticated classroom workflow, mobile, keyboard and axe checks.
- Independent SymPy: 2,000 cases, 6,000 comparisons, zero disagreements.
- Typecheck, lint, formatting and production build pass. Dependency audit reports no known vulnerabilities at the recorded checkpoint.

GitHub recovery PR #1 passed CI and is merged. The original source archive is retained; see [recovery](recovery/README.md). PostgreSQL is selected with DATABASE_URL, after `pnpm db:migrate`. `pnpm db:import-sqlite` can copy a preserved local database into an empty migrated target. See the [database decision](obsidian/TraceLab-Vault/11-Architecture-Decisions/ADR-0005-Async-Persistence.md).

Hosted Neon/R2 verification, live handwriting OCR, full curriculum, mastery, real-time replay and deployment remain incomplete. Local PostgreSQL verification does not demonstrate hosted performance. [Current evidence](artifacts/r2-verification.log), [browser report](artifacts/browser-results.json), [oracle report](artifacts/sympy-results.json).

Private R2 storage is available when all provider credentials are configured; existing local images remain usable. Migration and orphan reconciliation default to dry-run. See the [storage decision](obsidian/TraceLab-Vault/11-Architecture-Decisions/ADR-0006-Private-Object-Storage.md).
