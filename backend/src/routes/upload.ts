import { Hono } from "hono";
import type { auth } from "../auth";

let vibecode: any = null;
let StorageError: any = null;

try {
  const sdk = await import("@vibecodeapp/backend-sdk");
  vibecode = sdk.createVibecodeSDK();
  StorageError = sdk.StorageError;
} catch {
  // @vibecodeapp/backend-sdk not available (e.g. on Vercel)
}

export const uploadRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// POST /api/upload — upload a single image or video file
uploadRouter.post("/upload", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  if (!vibecode) {
    return c.json({ error: { message: "File upload not available in this environment", code: "UPLOAD_UNAVAILABLE" } }, 503);
  }

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return c.json({ error: { message: "Invalid form data", code: "INVALID_FORM" } }, 400);
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return c.json({ error: { message: "No file provided", code: "NO_FILE" } }, 400);
  }

  // Validate file type
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
  ];

  if (!allowedTypes.includes(file.type)) {
    return c.json(
      {
        error: {
          message: `Unsupported file type: ${file.type}. Allowed: images (JPEG, PNG, WebP, GIF) and videos (MP4, WebM, MOV, AVI)`,
          code: "INVALID_TYPE",
        },
      },
      400
    );
  }

  // 500MB max (Vibecode storage limit)
  const MAX_SIZE = 500 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return c.json(
      { error: { message: "File too large. Maximum size is 500 MB.", code: "TOO_LARGE" } },
      400
    );
  }

  try {
    const result = await vibecode.storage.upload(file);
    return c.json({ data: result });
  } catch (error) {
    if (StorageError && error instanceof StorageError) {
      return c.json({ error: { message: error.message, code: "STORAGE_ERROR" } }, error.statusCode as 400 | 500);
    }
    console.error("Upload error:", error);
    return c.json({ error: { message: "Upload failed", code: "UPLOAD_FAILED" } }, 500);
  }
});

// DELETE /api/upload/:id — delete a stored file
uploadRouter.delete("/upload/:id", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  if (!vibecode) {
    return c.json({ error: { message: "File deletion not available in this environment", code: "UPLOAD_UNAVAILABLE" } }, 503);
  }

  const { id } = c.req.param();

  try {
    await vibecode.storage.delete(id);
    return c.json({ data: { success: true } });
  } catch (error) {
    if (StorageError && error instanceof StorageError) {
      return c.json({ error: { message: error.message, code: "STORAGE_ERROR" } }, error.statusCode as 400 | 404 | 500);
    }
    console.error("Delete error:", error);
    return c.json({ error: { message: "Delete failed", code: "DELETE_FAILED" } }, 500);
  }
});
