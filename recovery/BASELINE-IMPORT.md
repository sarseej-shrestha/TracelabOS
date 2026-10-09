# Baseline import runbook — not executed

Use an environment that is explicitly authorized for Git metadata, network, and localhost preview. Do not use these commands to bypass the current sandbox. The existing source and verified backup are the starting point; do not regenerate the application.

## Verify the destination and identity

From the intended source directory, inspect `pwd`, `git status`, and any existing `.git` metadata. Stop if there is unexpected history or uncommitted work. Run:

```sh
gh auth status
gh api user --jq .login
gh api repos/sarseej-shrestha/TracelabOS --jq '{full_name,default_branch,permissions}'
git ls-remote https://github.com/sarseej-shrestha/TracelabOS.git
git config --global user.email
```

The authenticated account must legitimately have push permission to `sarseej-shrestha/TracelabOS`. The configured email observed in this session was `sarseej.shrestha@selu.edu`; verify its association with the authorized account. Where the authentication scope permits it, inspect `gh api user/emails --jq '.[] | select(.verified) | .email'`. Do not invent a replacement or claim that a network-failed authentication check verified the email. If authentication really fails after network access returns, reauthenticate through `gh auth login --hostname github.com` in that authorized environment; never paste tokens into project files.

Proceed with initialization only when `git ls-remote` **succeeds with no refs** and the destination has no Git metadata. If the remote contains commits, fetch/clone it into a separate authorized checkout and reconcile the preserved source before committing; do not overwrite or force-push.

## Verify before creating the honest baseline

Use the existing package-lock.json:

```sh
npm ci
npm run format:check
npm run verify
npm run oracle:vectors
python3 -m venv .venv
.venv/bin/python -m pip install -r research/symbolic-oracle/requirements.txt
.venv/bin/python research/symbolic-oracle/verify.py
python3 scripts/check-vault.py
```

Use a supported Node 22.13+ or 24+ runtime. Do not overwrite the original benchmark evidence; put new results in a distinct recovery directory or document the new run. The archive excludes private database content, so existing developer/student records are not transferred by the source restore.

If all checks pass and the remote is still empty:

```sh
git init -b main
git config --local user.name 'Sarseej Shrestha'
# Only after verifying the existing configured address belongs to the authorized account:
git config --local user.email 'sarseej.shrestha@selu.edu'
git remote add origin https://github.com/sarseej-shrestha/TracelabOS.git
git add .
git diff --cached --stat
git diff --cached --check
git status --short
```

Review the staged files for secrets, local `.data`, dependency/build directories, and recovery archive copies. The repository .gitignore excludes these. Inspect the actual diff; do not infer safety from the summary alone. Make one current-time import:

```sh
git commit -m 'chore: import verified local TraceLab foundation'
git push -u origin main
git rev-parse HEAD
git ls-remote origin refs/heads/main
gh api repos/sarseej-shrestha/TracelabOS/contents/README.md --jq .html_url
gh api repos/sarseej-shrestha/TracelabOS/contents/packages/math-engine/src/index.ts --jq .html_url
```

Only record a successful push after the local and remote hashes match and repository files are readable remotely. If a check/protection rule blocks the push, follow the repository's required workflow; do not bypass it. Record the real baseline hash and results in a subsequent documentation commit on a task branch. The initial commit cannot contain its own final hash.

## Browser gate and subsequent work

Create `test/recovery-browser-verification` from synchronized main. Install Playwright's compatible Chromium and run `npm run test:e2e`; its configuration starts the production server. Verify the additional registration/classroom/publishing/upload flows and keyboard behavior requested by the user, beyond the three current browser tests. Preserve any real defects with regression tests and fixing commits.

From the baseline onward: task branch → focused implementation and tests → Obsidian update → atomic commit → push → checks → approved merge → remote verification. No separate historical commits should be fabricated for the previously uncommitted foundation.
