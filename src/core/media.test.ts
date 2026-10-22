import { describe, expect, it } from "bun:test";
import {
  getYouTubeVideoId,
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
