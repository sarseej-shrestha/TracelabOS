/** Runtime configuration must agree with the revision compiled into the uploaded code. */
export function backendRelease(
  build: string | undefined,
  configured: string | undefined,
) {
  return /^[a-f0-9]{40}$/.test(build ?? '') && build === configured
    ? build
    : undefined;
}
