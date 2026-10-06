import { randomUUID } from "node:crypto";
import path from "node:path";
import { getConfig } from "@/lib/config";
import { db } from "@/lib/db";
import { transcribeSource } from "@/lib/sources/process";
import { ALLOWED_UPLOADS, saveOriginal } from "@/lib/sources/storage";

export const runtime = "nodejs";

const YOUTUBE_URL = /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{6,}/;

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function configError(): string | null {
  try {
    getConfig();
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : "Configuration error";
  }
}

// Creates a Source from an uploaded file, a YouTube link, or pasted English article text.
// Video sources are transcribed in the background (202). Article sources are ready at once (201).
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const problem = configError();
    if (problem) return error(problem, 500);

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return error("Choose a video or audio file", 400);

    const ext = path.extname(file.name).toLowerCase();
    const mimeType = ALLOWED_UPLOADS[ext];
    if (!mimeType) return error(`Unsupported file type ${ext || "(none)"}`, 415);

    const title = String(form.get("title") ?? "").trim() || file.name;
    const id = randomUUID();
    const stored = await saveOriginal(id, ext, file);

    const source = await db.source.create({
      data: {
        id,
        title,
        originalPath: stored.filePath,
        originalSha256: stored.sha256,
        mimeType,
        sizeBytes: stored.sizeBytes,
      },
    });
    void transcribeSource(source.id);
    return Response.json({ id: source.id, processingStatus: source.processingStatus }, { status: 202 });
  }

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as
      | { youtubeUrl?: unknown; text?: unknown; title?: unknown }
      | null;
    const title = typeof body?.title === "string" ? body.title.trim() : "";

    // Pasted English article: no transcription needed.
    if (typeof body?.text === "string" && body.text.trim()) {
      const text = body.text.trim();
      const source = await db.source.create({
        data: {
          id: randomUUID(),
          title: title || text.slice(0, 60),
          sourceText: text,
          processingStatus: "TEXT_READY",
          mimeType: "text/plain",
          sizeBytes: Buffer.byteLength(text, "utf8"),
        },
      });
      return Response.json({ id: source.id, processingStatus: source.processingStatus }, { status: 201 });
    }

    const youtubeUrl = typeof body?.youtubeUrl === "string" ? body.youtubeUrl.trim() : "";
    if (!YOUTUBE_URL.test(youtubeUrl)) return error("Paste an English article, or a public YouTube URL", 400);

    const problem = configError();
    if (problem) return error(problem, 500);

    const source = await db.source.create({
      data: {
        id: randomUUID(),
        title: title || youtubeUrl,
        sourceUrl: youtubeUrl,
        mimeType: "video/mp4",
        sizeBytes: 0,
      },
    });
    void transcribeSource(source.id);
    return Response.json({ id: source.id, processingStatus: source.processingStatus }, { status: 202 });
  }

  return error("Send multipart/form-data with a file, or JSON with text or a youtubeUrl", 415);
}
