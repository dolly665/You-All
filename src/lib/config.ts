import { z } from "zod";

const ConfigSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_MODEL: z.string().min(1, "GEMINI_MODEL is required"),
  SOURCE_STORAGE_DIR: z.string().min(1, "SOURCE_STORAGE_DIR is required"),
});

export type Config = z.infer<typeof ConfigSchema>;

const OpenAIConfigSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENAI_MODEL: z.string().min(1, "OPENAI_MODEL is required"),
  OPENAI_ANALYSIS_FALLBACK_MODEL: z.string().min(1).optional(),
});

export function getOpenAIConfig() {
  const parsed = OpenAIConfigSchema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => i.message).join("; ");
    throw new Error(`Invalid configuration: ${problems}. See .env.example.`);
  }
  return parsed.data;
}

// Read lazily so that `next build` does not require secrets to be present.
export function getConfig(): Config {
  const parsed = ConfigSchema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => i.message).join("; ");
    throw new Error(`Invalid configuration: ${problems}. See .env.example.`);
  }
  return parsed.data;
}
