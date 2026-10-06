import { z } from "zod";

// What the AI returns for one source video. Validated before anything is saved.
export const TranscriptResultSchema = z.object({
  language: z.string().min(1),
  text: z.string().min(1),
  englishText: z.string().min(1),
  segments: z.array(
    z.object({
      start: z.number().nonnegative(),
      end: z.number().nonnegative(),
      text: z.string(),
    }),
  ),
});

export type TranscriptResult = z.infer<typeof TranscriptResultSchema>;

export type MediaInput =
  | { kind: "youtube"; url: string; mimeType: string }
  | { kind: "file"; path: string; mimeType: string };

// The rest of the pipeline depends on this interface, not on a specific provider.
export interface Transcriber {
  readonly model: string;
  transcribe(input: MediaInput): Promise<TranscriptResult>;
}

export function parseTranscriptJson(raw: string): TranscriptResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Transcriber returned text that is not valid JSON");
  }
  const parsed = TranscriptResultSchema.safeParse(data);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Transcriber output failed validation: ${problems}`);
  }
  return parsed.data;
}
