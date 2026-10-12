export interface BackendBuildIdentity {
  release: string;
  sourceClean: boolean;
  entrySha256: string;
}
export function backendBuildIdentity(
  release: string,
  status: string,
  entrySha256: string,
): BackendBuildIdentity;
export function validateBackendArtifact(
  manifest: unknown,
  release: string,
  entrySha256: string,
): string;
