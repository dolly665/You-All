import OpenAI from "openai";
import { z } from "zod";
import { loadPrompt } from "@/lib/prompts";

export const CLAIM_TYPES = [
  "teacher_statement",
  "student_experience",
  "story",
  "editorial_interpretation",
  "established_fact",
] as const;

// Output of the analysis step. Validated before it is saved.
export const AnalysisSchema = z.object({
  coreQuestion: z.string().min(1),
  summary: z.string().min(1),
  audienceRelevance: z.string().min(1),
  claims: z.array(
    z.object({
      text: z.string().min(1),
      type: z.enum(CLAIM_TYPES),
      framing: z.string(),
    }),
  ),
  identifyingDetails: z.array(z.string()),
});

export type Analysis = z.infer<typeof AnalysisSchema>;

export const ANALYSIS_PROMPT = "analysis/v1";

// Thrown when the model's response cannot be parsed or validated. Callers can retry
// with a stronger model on this error, but should not on transport or auth errors.
export class AnalysisOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalysisOutputError";
  }
}

export function parseAnalysisJson(raw: string): Analysis {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new AnalysisOutputError("Analyzer returned text that is not valid JSON");
  }
  const parsed = AnalysisSchema.safeParse(data);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new AnalysisOutputError(`Analyzer output failed validation: ${problems}`);
  }
  return parsed.data;
}

export class OpenAIAnalyzer {
  readonly model: string;
  private readonly client: OpenAI;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async analyze(articleText: string): Promise<Analysis> {
    const prompt = await loadPrompt(ANALYSIS_PROMPT);
    const completion = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: articleText },
      ],
    });
    const content = completion.choices[0]?.message.content;
    if (!content) throw new AnalysisOutputError("Analyzer returned an empty response");
    return parseAnalysisJson(content);
  }
}
