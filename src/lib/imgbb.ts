import "server-only";
import { getServerEnv } from "@/lib/env";

/**
 * ImgBB Image Upload Service (server only).
 * The key lives in the IMGBB_API_KEY secret; it must never reach the browser bundle.
 */

export interface ImgbbUploadResponse {
  success: boolean;
  url?: string;
  displayUrl?: string;
  thumbUrl?: string;
  deleteUrl?: string;
  error?: string;
}

/** Uploads an already-validated image to ImgBB. Call only from an authorized server action. */
export async function uploadToImgbb(image: Blob, name?: string): Promise<ImgbbUploadResponse> {
  const key = getServerEnv().IMGBB_API_KEY;
  if (!key) return { success: false, error: "Image uploads are not configured." };
  try {
    const formData = new FormData();
    formData.append("image", image);

    if (name) {
      formData.append("name", name.slice(0, 50));
    }

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(key)}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      console.error("ImgBB upload failed", response.status);
      return { success: false, error: "Upload failed. Please try again." };
    }

    const json = (await response.json()) as {
      success?: boolean;
      status?: number;
      data?: {
        url?: string;
        display_url?: string;
        thumb?: { url?: string };
        delete_url?: string;
      };
      error?: { message?: string };
    };

    if (!json.success || !json.data?.url) {
      return {
        success: false,
        error: json.error?.message || "ImgBB did not return a valid image URL",
      };
    }

    return {
      success: true,
      url: json.data.url,
      displayUrl: json.data.display_url || json.data.url,
      thumbUrl: json.data.thumb?.url,
      deleteUrl: json.data.delete_url,
    };
  } catch (err) {
    console.error("ImgBB upload error", err instanceof Error ? err.message : err);
    return { success: false, error: "Upload failed. Please try again." };
  }
}
