import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/server/config/env";
import { badRequest } from "@/server/utils/errors";
import { randomToken } from "@/server/utils/ids";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const TYPES: Record<string, { ext: string; mime: string }> = {
  jpeg: { ext: "jpg", mime: "image/jpeg" },
  png: { ext: "png", mime: "image/png" },
  webp: { ext: "webp", mime: "image/webp" },
};

/** Identifies the image type from its magic bytes — the client-supplied MIME type is not trusted. */
function sniff(bytes: Uint8Array): keyof typeof TYPES | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

export type UploadFolder = "references" | "products" | "reviews";

const isCloudinaryConfigured = () =>
  Boolean(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret);

async function uploadToCloudinary(bytes: Uint8Array, mime: string, folder: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const cloudFolder = `uma/${folder}`;
  const signature = createHash("sha1")
    .update(`folder=${cloudFolder}&timestamp=${timestamp}${env.cloudinaryApiSecret}`)
    .digest("hex");
  const form = new FormData();
  form.set("file", new Blob([bytes as BlobPart], { type: mime }));
  form.set("api_key", env.cloudinaryApiKey!);
  form.set("timestamp", timestamp);
  form.set("folder", cloudFolder);
  form.set("signature", signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    console.error("[storage] cloudinary upload failed", res.status, await res.text());
    throw new Error("Cloud upload failed");
  }
  const json = (await res.json()) as { secure_url: string };
  return json.secure_url;
}

const SAFE_SEGMENT = /^[a-z0-9_-]+(\.[a-z0-9]+)?$/i;

/**
 * Validates and stores an uploaded image, returning its public URL.
 * Uses Cloudinary when configured, otherwise the local UPLOAD_DIR
 * (served through /api/files/…).
 */
export async function saveImage(file: File, folder: UploadFolder): Promise<string> {
  if (file.size === 0) throw badRequest("The uploaded file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) throw badRequest("Please upload an image under 5 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind) throw badRequest("Only JPG, PNG or WebP images are accepted.");
  const { ext, mime } = TYPES[kind];

  if (isCloudinaryConfigured()) return uploadToCloudinary(bytes, mime, folder);

  const name = `${randomToken(12)}.${ext}`;
  const dir = path.resolve(env.uploadDir, folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
  return `/api/files/${folder}/${name}`;
}

/** Reads a locally stored upload. Path segments are strictly validated to prevent traversal. */
export async function readLocalFile(segments: string[]): Promise<{ bytes: Buffer; mime: string } | null> {
  if (segments.length !== 2 || !segments.every((s) => SAFE_SEGMENT.test(s))) return null;
  const ext = segments[1].split(".").pop()?.toLowerCase();
  const type = Object.values(TYPES).find((t) => t.ext === ext);
  if (!type) return null;
  const root = path.resolve(env.uploadDir);
  const full = path.resolve(root, segments[0], segments[1]);
  if (!full.startsWith(root + path.sep)) return null;
  try {
    return { bytes: await readFile(full), mime: type.mime };
  } catch {
    return null;
  }
}
