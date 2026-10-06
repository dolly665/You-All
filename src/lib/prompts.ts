import { readFile } from "node:fs/promises";
import path from "node:path";

// Prompts live in /prompts, outside application logic, and are versioned by file name
// (e.g. "transcription/v1"). Load by name so a prompt can be changed without touching code.
export async function loadPrompt(name: string): Promise<string> {
  const file = path.join(process.cwd(), "prompts", `${name}.md`);
  return readFile(file, "utf8");
}
