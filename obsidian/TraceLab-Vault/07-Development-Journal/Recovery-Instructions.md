# Recovery Instructions

Read [[00-START-HERE]], [[Current-State]], [[Master-Roadmap]], and [[Change-Ledger]]. The current implementation has not been recreated or overwritten.

## Verified preservation

Archive: recovery/tracelab-baseline-20261009T000129Z.tar.gz. SHA-256: `acd9b02518cc2d38254cba428e03acf00e10f3c399f0b0b895a11fca84da8bdc`. Its adjacent manifest records every file. Extraction verified all 150 file hashes/sizes and all 84 vault notes. Source, lockfiles, tests, existing fixtures/evidence, and documentation are included; private data, credentials, dependencies, and builds are excluded. The archive predates this recovery journal update; retain recovery/ and the updated vault alongside it.

Fresh extracted copy: /private/tmp/tracelab-restore-re4i2gyz/TracelabOS. This temporary extraction was used to verify the original archive; the active Git working tree is the official repository checkout. A clean lockfile install, 358 tests/5,000 seeded property cases, typecheck, lint, formatting, production build, and repeated 6,000 SymPy comparisons passed there. Evidence: recovery/verification/summary.json.

## Historical restriction before recovery

The original restricted session protected .git as read-only and disables sandbox escalation requests. Ordinary workspace permissions are not the cause. Fresh probes also confirm blocked GitHub/npm DNS and localhost binding. No connected authorized migration destination was found. Use the host's supported permissions control to permit approved Git writes, required network, and localhost preview, or provide an explicitly authorized environment. These restrictions were not bypassed. See recovery/README.md and [official sandbox documentation](https://learn.chatgpt.com/docs/sandboxing).

## Historical baseline import procedure

After permissions/network are restored, recheck authenticated repository permissions and git ls-remote on https://github.com/sarseej-shrestha/TracelabOS.git. If still empty, initialize main and create ONE baseline import commit representing the actual existing foundation. Do not recreate the earlier intended task branches as fictitious history or backdate anything. Configure author Sarseej Shrestha with the user's verified configured email. At that earlier checkpoint, no commit, push, or credential verification had succeeded. Recovery has since completed as recorded below.

If remote history now exists, preserve it and reconcile the source into a separate authorized checkout. Never overwrite or force-push. The executable-by-human sequence is documented in recovery/BASELINE-IMPORT.md; the actual completed import is recorded below.

Reverify the recovered source and browser in the authorized destination. From the baseline onward, use real task branches, atomic commits, checks, push/merge, and remote hash verification. Browser completion and a verified baseline push must precede new roadmap features. Continue cloud persistence, OCR, curriculum, adaptive learning, real-time classroom work, then production deployment.

Related: [[00-START-HERE]] · [[Current-State]] · [[Git-Workflow]]

## Permissions restored — 2026-10-08

Git, GitHub authentication/network, localhost and Chromium execution now succeed. Baseline 839d63439e9c2d5e3f800592cb68003bf1cec3c9 is verified on official main. Do not reinitialize or import another baseline. See [[Current-State]] for the current task and verified checks. Original archive is retained unchanged; subsequent changes are tracked in Git.

Current recovery checkpoint: PRs #1–#21 are merged after checks, preserving mastery cbe7ba9/b0529de and remediation 48581d1. Historical rebuild 5dc88b6 and reproducible strategy comparison b67f545/b07169e are merged after checks. No reinitialization is needed. Apply PostgreSQL through migration 0005; SQLite upgrades automatically. `pnpm mastery:rebuild` previews historical projection and `--apply` explicitly applies it; use one explicit existing database and retain private backups. The preserved fictional demo was backed up and one historical review backfilled without changing original records; a repeat is a no-op. See [[Local-Development]] and artifacts/mastery-rebuild-smoke.json. Local application/model/worker were restarted and Chromium preview/provider health passed on 2026-10-10. Processes are session-local. Interactive experiment 4d28d18 is merged through PR #20. Replay 06b7026 is merged through PR #21 (main 25fae5e). Next work is secure live synchronization with snapshot recovery, as recorded in [[Current-State]].

Latest preview evidence: artifacts/replay-preview-smoke.json, checked 2026-10-10T21:22:37Z. The production build used replay feature 06b7026; the page, guided-demo entry, API health and experimental OCR provider health passed. No new OCR accuracy or hosted performance is inferred. Current verification: 1,510 Vitest tests/9,500 seeded property cases, eighteen browser workflows, type/lint/format/build and all three CI jobs. The original archive remains unchanged; 86 current vault notes have zero broken wiki links.
