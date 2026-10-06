import { db } from "@/lib/db";
import Link from "next/link";
import { AnalyzeButton } from "./analyze-button";
import { UploadForm } from "./upload-form";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sources = await db.source.findMany({ orderBy: { createdAt: "desc" }, take: 50 });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 font-sans">
      <header>
        <h1 className="text-2xl font-semibold">Sources</h1>
        <p className="text-sm text-zinc-500">Upload a teacher video, or paste a public YouTube link.</p>
      </header>

      <UploadForm />

      <section className="flex flex-col gap-3">
        {sources.length === 0 && <p className="text-sm text-zinc-500">No sources yet.</p>}
        {sources.map((source) => (
          <article key={source.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-4">
              <Link href={`/sources/${source.id}`} className="font-medium hover:underline">
                {source.title}
              </Link>
              <span className="shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-900">
                {source.processingStatus}
              </span>
            </div>
            {source.errorMessage && <p className="mt-2 text-sm text-red-600">{source.errorMessage}</p>}
            {(source.sourceText || source.processingStatus === "TRANSCRIBED") &&
              source.processingStatus !== "ANALYZED" && <AnalyzeButton sourceId={source.id} />}
          </article>
        ))}
      </section>
    </main>
  );
}
