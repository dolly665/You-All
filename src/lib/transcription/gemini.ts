import { FileState, GoogleGenAI, createPartFromUri, createUserContent } from "@google/genai";
import { loadPrompt } from "@/lib/prompts";
import { parseTranscriptJson, type MediaInput, type Transcriber, type TranscriptResult } from "./transcriber";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 15 * 60 * 1000;

const PROMPT_NAME = "transcription/v1";

export class GeminiTranscriber implements Transcriber {
  readonly model: string;
  private readonly ai: GoogleGenAI;

  constructor(apiKey: string, model: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async transcribe(input: MediaInput): Promise<TranscriptResult> {
    const prompt = await loadPrompt(PROMPT_NAME);
    const mediaPart = input.kind === "youtube"
      ? createPartFromUri(input.url, input.mimeType)
      : await this.uploadFile(input.path, input.mimeType);

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: createUserContent([mediaPart, prompt]),
      config: { responseMimeType: "application/json" },
    });

    const text = response.text;
    if (!text) throw new Error("Transcriber returned an empty response");
    return parseTranscriptJson(text);
  }

  // Uploads a local file through the Gemini Files API and waits until it is ready to use.
  private async uploadFile(filePath: string, mimeType: string) {
    let file = await this.ai.files.upload({ file: filePath, config: { mimeType } });
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    while (file.state === FileState.PROCESSING) {
      if (Date.now() > deadline) throw new Error("Gemini file processing timed out");
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      file = await this.ai.files.get({ name: file.name! });
    }

    if (file.state !== FileState.ACTIVE || !file.uri || !file.mimeType) {
      throw new Error(`Gemini could not process the uploaded file (state: ${file.state ?? "unknown"})`);
    }
    return createPartFromUri(file.uri, file.mimeType);
  }
}
