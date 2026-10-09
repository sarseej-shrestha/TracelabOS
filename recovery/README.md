# Verified source recovery — 2026-10-08 (America/Chicago)

The original implementation was preserved before any migration or dependency installation. The archive contains 150 source/configuration/test/documentation/evidence files, including all 84 vault notes. It excludes installed dependencies, builds, local databases/photos, Git metadata, private environment files, and credential directories. Environment example files and the non-secret project `.npmrc` are retained. A recognizable credential-pattern scan found no matches; no credentials were copied from outside the workspace.

Archive: `tracelab-baseline-20261009T000129Z.tar.gz`

SHA-256:

```text
acd9b02518cc2d38254cba428e03acf00e10f3c399f0b0b895a11fca84da8bdc
```

The adjacent `.manifest.json` records each file's SHA-256 and size. The archive was extracted with Python tarfile's data filter to `/private/tmp/tracelab-restore-re4i2gyz/TracelabOS`; all paths, file sizes, and hashes matched. This temporary directory is a restore rehearsal in the same restricted environment, not a new Git-enabled environment. The durable backup is in this workspace; copy it to your chosen authorized environment before relying on temporary files.

A clean `npm ci --offline --cache /private/tmp/tracelab-npm --no-audit --no-fund` in the extracted tree installed 294 packages without modifying the lockfile. Its typecheck, lint, all 358 tests (including 5,000 property cases), and production build passed. Formatting and all 84 vault links passed. SymPy repeated 2,000 cases/6,000 comparisons with zero disagreements. Evidence is in `verification/summary.json` and `verification/verify.log`. Python 3.13.9/SymPy 1.14.0 was read from an existing environment; use the pinned requirements to recreate it elsewhere. Node 23.10.0 ran these checks and emitted dependency-engine warnings; continue with a supported even LTS version.

## Why Git and preview are still blocked

- Workspace owner is the active user (uid 501); directory mode is 0755, with no immutable flags/ACL obstacle observed. Git 2.49.0 is installed and `.git` does not exist.
- The **active session permission profile** specifically marks the workspace `.git` path read-only and disables `sandbox_approval` requests. Ordinary filesystem permission changes are not the remedy. No repeated `git init`, relocated Git metadata, or permission bypass was attempted.
- Fresh DNS probes failed for github.com, api.github.com, and registry.npmjs.org. `gh auth status` reports it cannot validate the stored account; that result does not establish whether the credential is usable once network access is restored.
- A fresh localhost bind/listen probe returned `EPERM`. Browser assertions were not rerun after that denial; browser/accessibility verification is still outstanding.
- The managed worktree list was empty. The worktree creation tool requires an existing repository/reference; it does not provide a remote computer or repair an uninitialized protected repository.
- The inspected user config had no top-level permission overrides; no `/etc/codex/requirements.toml` was present. The session's supplied effective policy remains authoritative. No settings or credential files were changed.

The permissions control beneath the desktop/IDE composer, or `/permissions` in the CLI, is the supported place to select an authorized profile. Request a narrowly scoped profile allowing approved Git metadata operations, GitHub/npm access, and localhost preview. A separate environment explicitly authorized for those operations is also suitable. I cannot change the active enforcement policy from this task. [Official sandbox documentation](https://learn.chatgpt.com/docs/sandboxing).

The official repository's public page still reported empty during recovery: https://github.com/sarseej-shrestha/TracelabOS . This is not a substitute for an authenticated `git ls-remote` immediately before import. No baseline commit, push, or remote file verification has succeeded.

## Safe continuation

1. Restore authorized Git/network/preview capabilities; recheck the exact remote and legitimate account.
2. Verify the archive checksum before extraction into an empty destination. Do not overwrite another checkout. The manifest enables verification after extraction.
3. Preserve this original archive. Current journal updates are newer than that snapshot; keep this README, the verification evidence, and updated vault alongside it.
4. Create **one honest baseline import commit**, with today's actual timestamp and the authorized identity, containing the existing foundation. Do not fabricate the intended task branches in the older ledger as historical commits.
5. Run the full checks in the authorized destination, inspect the staged diff and exclusions, then push only to the official repository and verify remote hashes/files.
6. Complete actual Playwright/accessibility workflow validation, with real fixing commits as needed. Resume cloud persistence → OCR → curriculum → adaptive learning → real-time intelligence → deployment only after that gate.

See `BASELINE-IMPORT.md` for the exact future sequence. Neither this note nor the extracted copy constitutes a completed Git migration.
