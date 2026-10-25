/**
 * After a deploy, a tab opened on the old build calls server actions and chunks
 * that no longer exist. Reload once to pick up the new build instead of showing
 * an error page; the session flag stops a reload loop if the error is real.
 */
export function reloadIfStaleDeploy(error: Error): boolean {
  const stale =
    error.name === "UnrecognizedActionError" ||
    error.name === "ChunkLoadError" ||
    /Server Action .* was not found|Failed to find Server Action|Loading chunk .* failed/i.test(error.message);
  if (!stale || typeof window === "undefined") return false;
  try {
    const key = "ruxs-stale-reload";
    if (sessionStorage.getItem(key) === location.pathname) return false;
    sessionStorage.setItem(key, location.pathname);
  } catch {
    // storage blocked: still reload once; worst case the user sees the error page next time
  }
  location.reload();
  return true;
}
