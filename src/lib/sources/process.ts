import { db } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { GeminiTranscriber } from "@/lib/transcription/gemini";
import type { MediaInput } from "@/lib/transcription/transcriber";
import { sha256File } from "./storage";

// Runs transcription for one Source and records the outcome on the Source.
// Errors are stored on the Source rather than thrown, so one failure does not stop other work.
export async function transcribeSource(sourceId: string): Promise<void> {
  const source = await db.source.findUniqueOrThrow({ where: { id: sourceId } });
  await db.source.update({ where: { id: sourceId }, data: { processingStatus: "TRANSCRIBING", errorMessage: null } });

  try {
    const config = getConfig();
    const transcriber = new GeminiTranscriber(config.GEMINI_API_KEY, config.GEMINI_MODEL);

    const input: MediaInput = source.sourceUrl
      ? { kind: "youtube", url: source.sourceUrl, mimeType: "video/mp4" }
      : { kind: "file", path: source.originalPath!, mimeType: source.mimeType };

    const result = await transcriber.transcribe(input);

    // The original must not have changed while we processed it.
    if (input.kind === "file" && (await sha256File(input.path)) !== source.originalSha256) {
      throw new Error("Original file changed during processing; transcript discarded");
    }

    await db.$transaction([
      db.transcript.upsert({
        where: { sourceId },
        create: {
          sourceId,
          language: result.language,
          text: result.text,
          englishText: result.englishText,
          segments: JSON.stringify(result.segments),
          model: transcriber.model,
        },
        update: {
          language: result.language,
          text: result.text,
          englishText: result.englishText,
          segments: JSON.stringify(result.segments),
          model: transcriber.model,
        },
      }),
      db.source.update({ where: { id: sourceId }, data: { processingStatus: "TRANSCRIBED" } }),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.source.update({ where: { id: sourceId }, data: { processingStatus: "FAILED", errorMessage: message } });
  }
}
