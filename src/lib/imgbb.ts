/**
 * ImgBB Image Upload Service
 * Uses the API key provided for RUXs vendor and kids image & certificate uploads.
 */

export const IMGBB_API_KEY = "f17ca0bb7aec377dd84d30b752c8d6ba";

export interface ImgbbUploadResponse {
  success: boolean;
  url?: string;
  displayUrl?: string;
  thumbUrl?: string;
  deleteUrl?: string;
  error?: string;
}

/**
 * Uploads an image (File, Blob, or base64 string) to ImgBB.
 * Can be called from server actions or client-side form submitters.
 */
export async function uploadToImgbb(
  image: File | Blob | string,
  name?: string
): Promise<ImgbbUploadResponse> {
  try {
    const formData = new FormData();

    if (typeof image === "string") {
      // If it's data URI (e.g. data:image/png;base64,....), strip prefix for ImgBB if needed, or pass directly
      const cleanString = image.replace(/^data:image\/[a-z]+;base64,/, "");
      formData.append("image", cleanString);
    } else {
      formData.append("image", image);
    }

    if (name) {
      formData.append("name", name.slice(0, 50));
    }

    const endpoint = `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`;
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return {
        success: false,
        error: `ImgBB upload failed (${response.status}): ${errText || response.statusText}`,
      };
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
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error uploading image to ImgBB",
    };
  }
}
