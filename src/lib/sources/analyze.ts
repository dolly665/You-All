import { getOpenAIConfig } from "@/lib/config";
import { db } from "@/lib/db";
import { AnalysisOutputError, OpenAIAnalyzer, ANALYSIS_PROMPT } from "@/lib/analysis/analyzer";

// Runs the primary model first and only escalates to the fallback model when the
// response fails parsing or validation, so a weak output never reaches the database.
async function runAnalysis(englishText: string, config: ReturnType<typeof getOpenAIConfig>) {
  const primary = new OpenAIAnalyzer(config.OPENAI_API_KEY, config.OPENAI_MODEL);
  try {
    return { result: await primary.analyze(englishText), model: primary.model };
  } catch (error) {
    const fallbackModel = config.OPENAI_ANALYSIS_FALLBACK_MODEL;
    if (!(error instanceof AnalysisOutputError) || !fallbackModel || fallbackModel === primary.model) {
      throw error;
    }
    const fallback = new OpenAIAnalyzer(config.OPENAI_API_KEY, fallbackModel);
    return { result: await fallback.analyze(englishText), model: fallback.model };
  }
}

// Analyzes one Source's English text and saves the result. Throws on failure after
// recording it on the Source, so the caller can report it.
export async function analyzeSource(sourceId: string) {
  const source = await db.source.findUniqueOrThrow({
    where: { id: sourceId },
    include: { transcript: true },
  });

  // Articles are supplied in English directly. Videos use the transcript's English translation.
  const englishText = source.sourceText ?? source.transcript?.englishText;
  if (!englishText) throw new Error("This source has no English text yet");

  await db.source.update({ where: { id: sourceId }, data: { processingStatus: "ANALYZING", errorMessage: null } });

  try {
    const config = getOpenAIConfig();
    const { result, model } = await runAnalysis(englishText, config);

    await db.$transaction([
      db.analysis.upsert({
        where: { sourceId },
        create: {
          sourceId,
          data: JSON.stringify(result),
          promptVersion: ANALYSIS_PROMPT,
          model,
        },
        update: {
          data: JSON.stringify(result),
          promptVersion: ANALYSIS_PROMPT,
          model,
        },
      }),
      db.source.update({ where: { id: sourceId }, data: { processingStatus: "ANALYZED" } }),
    ]);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.source.update({ where: { id: sourceId }, data: { processingStatus: "FAILED", errorMessage: message } });
    throw error;
  }
}
