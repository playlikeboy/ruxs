const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escapes text for HTML text nodes and quoted attributes. Treat every DB value as untrusted. */
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ENTITIES[c]!);
}

/** Returns the URL only when it is a well-formed http(s) link, else null. */
export function safeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}
