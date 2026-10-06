import { analyzeSource } from "@/lib/sources/analyze";

export const runtime = "nodejs";

// Runs analysis for one Source. Waits for the result, since an article analysis takes seconds to a minute.
export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const analysis = await analyzeSource(id);
    return Response.json({ analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
