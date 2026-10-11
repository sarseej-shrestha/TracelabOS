import { execFileSync } from 'node:child_process';
// Browser verification rewrites these reports; none are application inputs.
const generatedEvidence = new Set([
  'artifacts/browser-results.json',
  'artifacts/cloud-browser-results.json',
  'artifacts/cloud-release-smoke.json',
  'artifacts/ocr-confirmation-workspace.png',
  'artifacts/fraction-mobile-workspace.png',
  'artifacts/algebra-workspace.png',
  'artifacts/ratio-workspace.png',
  'artifacts/geometry-mobile-workspace.png',
  'artifacts/student-reasoning.png',
  'artifacts/teacher-studio.png',
  'artifacts/mobile-workspace.png',
  'artifacts/learning-lab-mobile.png',
  'artifacts/learning-lab-desktop.png',
  'artifacts/remediation-workspace.png',
  'artifacts/classroom-replay-mobile.png',
]);
export function validateDeploymentSource(sha, expected, status) {
  if (!/^[a-f0-9]{40}$/.test(expected) || expected !== sha)
    throw Error('Deployment release must match the checked-out commit');
  if (
    status
      .split('\0')
      .some((entry) => entry && !generatedEvidence.has(entry.slice(3)))
  )
    throw Error('Commit all deployment changes before publishing a release');
  return sha;
}
/** Refuse to label uncommitted or mismatched code as a reviewed release. */
export function deploymentRelease() {
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  const expected = process.env.TRACELAB_RELEASE_SHA ?? sha;
  return validateDeploymentSource(
    sha,
    expected,
    execFileSync('git', ['status', '--porcelain=v1', '-z'], {
      encoding: 'utf8',
    }),
  );
}
