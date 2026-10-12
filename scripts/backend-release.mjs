import { validateDeploymentSource } from './deployment-release.mjs';
export function backendBuildIdentity(release, status, entrySha256) {
  if (!/^[a-f0-9]{40}$/.test(release) || !/^[a-f0-9]{64}$/.test(entrySha256))
    throw Error('Invalid backend build identity');
  let sourceClean = true;
  try {
    validateDeploymentSource(release, release, status);
  } catch {
    sourceClean = false;
  }
  return { release, sourceClean, entrySha256 };
}
export function validateBackendArtifact(manifest, release, entrySha256) {
  if (
    !manifest ||
    manifest.sourceClean !== true ||
    !/^[a-f0-9]{40}$/.test(release) ||
    manifest.release !== release ||
    !/^[a-f0-9]{64}$/.test(entrySha256) ||
    manifest.entrySha256 !== entrySha256
  )
    throw Error(
      'Rebuild the backend from the clean selected release before publishing',
    );
  return release;
}
