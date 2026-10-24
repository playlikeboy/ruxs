/**
 * Pure media utilities: video links, YouTube embedding, thumbnail extraction.
 * Pure: zero db, next, or react imports.
 */

/**
 * Extracts a YouTube video ID from various standard YouTube URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function getYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    // Check if it's already a raw 11-char video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }

    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return id && id.length === 11 ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id && id.length === 11 ? id : null;
      }
      if (parsed.pathname.startsWith("/embed/")) {
        const id = parsed.pathname.split("/")[2]?.split("?")[0];
        return id && id.length === 11 ? id : null;
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        const id = parsed.pathname.split("/")[2]?.split("?")[0];
        return id && id.length === 11 ? id : null;
      }
      if (parsed.pathname.startsWith("/v/")) {
        const id = parsed.pathname.split("/")[2]?.split("?")[0];
        return id && id.length === 11 ? id : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Returns privacy-enhanced embed URL for a YouTube video.
 */
export function getYouTubeEmbedUrl(url: string | null | undefined, autoPlay: boolean = false): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  if (autoPlay) params.set("autoplay", "1");
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Returns highest-resolution YouTube thumbnail available for a video URL.
 */
export function getYouTubeThumbnailUrl(url: string | null | undefined, quality: "hq" | "maxres" = "hq"): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  const file = quality === "maxres" ? "maxresdefault.jpg" : "hqdefault.jpg";
  return `https://img.youtube.com/vi/${videoId}/${file}`;
}

/**
 * Validates whether a string is a valid YouTube video URL.
 */
export function isValidYouTubeUrl(url: string | null | undefined): boolean {
  return getYouTubeVideoId(url) !== null;
}

/** Largest image a merchant or admin may upload. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const SIGNATURES: Record<string, (b: Uint8Array) => boolean> = {
  "image/png": (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/webp": (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
};

/** Checks declared type, size and the file's magic bytes (first 12 bytes are enough). */
export function validateImageUpload(file: { type: string; size: number; head: Uint8Array }): { ok: true } | { ok: false; error: string } {
  const matches = SIGNATURES[file.type];
  if (!matches) return { ok: false, error: "Upload a PNG, JPG or WEBP image." };
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) return { ok: false, error: "Image must be under 5 MB." };
  if (!matches(file.head)) return { ok: false, error: "This file is not a valid image." };
  return { ok: true };
}
