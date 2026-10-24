import { describe, expect, it } from "bun:test";
import {
  getYouTubeVideoId,
  MAX_IMAGE_BYTES,
  validateImageUpload,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  isValidYouTubeUrl,
} from "./media";

describe("YouTube video helper rules", () => {
  it("extracts video ID from standard watch URLs", () => {
    expect(getYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(getYouTubeVideoId("http://youtube.com/watch?v=dQw4w9WgXcQ&t=10s")).toBe("dQw4w9WgXcQ");
  });

  it("extracts video ID from short URLs", () => {
    expect(getYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(getYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ?t=20")).toBe("dQw4w9WgXcQ");
  });

  it("extracts video ID from shorts and embed URLs", () => {
    expect(getYouTubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(getYouTubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("produces correct embed URL with privacy enhancements", () => {
    const embed = getYouTubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ");
    expect(embed).toContain("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(embed).toContain("rel=0");
  });

  it("generates thumbnail URL", () => {
    const thumb = getYouTubeThumbnailUrl("https://youtu.be/dQw4w9WgXcQ");
    expect(thumb).toBe("https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
  });

  it("validates valid and invalid URLs", () => {
    expect(isValidYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true);
    expect(isValidYouTubeUrl("https://instagram.com/p/12345")).toBe(false);
    expect(isValidYouTubeUrl("not-a-url")).toBe(false);
    expect(isValidYouTubeUrl(null)).toBe(false);
  });
});

describe("validateImageUpload", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
  const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
  const html = new TextEncoder().encode("<html><script>");

  it("accepts real png, jpeg and webp under the size cap", () => {
    expect(validateImageUpload({ type: "image/png", size: 1000, head: png })).toEqual({ ok: true });
    expect(validateImageUpload({ type: "image/jpeg", size: 1000, head: jpg })).toEqual({ ok: true });
    expect(validateImageUpload({ type: "image/webp", size: 1000, head: webp })).toEqual({ ok: true });
  });

  it("rejects oversized, wrong type and spoofed files", () => {
    expect(validateImageUpload({ type: "image/png", size: MAX_IMAGE_BYTES + 1, head: png }).ok).toBe(false);
    expect(validateImageUpload({ type: "image/svg+xml", size: 100, head: html }).ok).toBe(false);
    expect(validateImageUpload({ type: "image/png", size: 100, head: html }).ok).toBe(false);
    expect(validateImageUpload({ type: "image/png", size: 0, head: png }).ok).toBe(false);
  });
});
