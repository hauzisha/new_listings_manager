const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export type UploadResult = {
  id: string;
  url: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
};

/**
 * Compress an image file on the client before uploading.
 * Reduces file size while maintaining visual quality.
 */
export async function compressImage(
  file: File,
  maxWidthPx = 1920,
  quality = 0.85
): Promise<File> {
  // Only compress JPEG/PNG/WebP
  if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > maxWidthPx) {
        height = Math.round((height * maxWidthPx) / width);
        width = maxWidthPx;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const outputType = file.type === "image/png" ? "image/png" : "image/webp";
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          // Only use compressed version if it's actually smaller
          if (blob.size >= file.size) {
            resolve(file);
            return;
          }
          const ext = outputType === "image/png" ? "png" : "webp";
          const name = file.name.replace(/\.[^.]+$/, `.${ext}`);
          resolve(new File([blob], name, { type: outputType }));
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for compression"));
    };

    img.src = url;
  });
}

/**
 * Upload a file to the backend storage service.
 * Images are compressed before uploading.
 */
export async function uploadFile(file: File): Promise<UploadResult> {
  let fileToUpload = file;

  if (file.type.startsWith("image/")) {
    try {
      fileToUpload = await compressImage(file);
    } catch {
      // Fall back to original if compression fails
      fileToUpload = file;
    }
  }

  const formData = new FormData();
  formData.append("file", fileToUpload);

  const response = await fetch(`${BACKEND_URL}/api/upload`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Upload failed");
  }
  return data.data as UploadResult;
}

/**
 * Delete a file from storage by its ID.
 */
export async function deleteFile(fileId: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/upload/${fileId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || "Delete failed");
  }
}

/**
 * Extract the storage file ID from a CDN URL.
 * CDN URLs look like: https://cdn.staticfiles.net/{projectId}/{fileId}/filename.jpg
 */
export function extractFileId(url: string): string | null {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    // The file ID is typically the second-to-last segment before the filename
    if (parts.length >= 2) return parts[parts.length - 2];
    return null;
  } catch {
    return null;
  }
}
