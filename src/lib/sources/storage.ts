import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { getConfig } from "@/lib/config";

// Accepted upload types. Extend only when Gemini supports the format.
export const ALLOWED_UPLOADS: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/mov",
  ".webm": "video/webm",
  ".mp3": "audio/mp3",
  ".wav": "audio/wav",
};

export async function sha256File(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

// Streams the upload to disk, so large videos never sit fully in memory.
export async function saveOriginal(sourceId: string, ext: string, file: File) {
  const dir = path.resolve(getConfig().SOURCE_STORAGE_DIR, sourceId);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `original${ext}`);
  await pipeline(Readable.fromWeb(file.stream() as never), createWriteStream(filePath, { flags: "wx" }));
  return { filePath, sha256: await sha256File(filePath), sizeBytes: file.size };
}
