import Link from "next/link";
import { notFound } from "next/navigation";
import { parseAnalysisJson, type Analysis } from "@/lib/analysis/analyzer";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type Segment = { start?: number; end?: number; text?: string };

const CLAIM_LABELS: Record<string, string> = {
  teacher_statement: "Teacher",
  student_experience: "Student-reported",
  story: "Story",
  editorial_interpretation: "Editorial",
  established_fact: "Established fact",
};

const PLATFORM_LABELS: Record<string, string> = {
  YOUTUBE: "YouTube",
  TIKTOK: "TikTok",
  SUBSTACK: "Substack",
  MEDIUM: "Medium",
};

function parseTags(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((tag): tag is string => typeof tag === "string") : [];
  } catch {
    return [];
  }
}

function parseSegments(raw: string): Segment[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function parseAnalysis(raw: string | null): Analysis | null {
  if (!raw) return null;
  try {
    return parseAnalysisJson(raw);
  } catch {
    return null;
  }
}

function parseFlags(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((flag): flag is string => typeof flag === "string") : [];
  } catch {
    return [];
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function statusTone(status: string): string {
  if (status === "FAILED") return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  if (["ANALYZED", "GENERATED", "TEXT_READY"].includes(status)) {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  }
  if (["TRANSCRIBING", "TRANSCRIBED", "ANALYZING"].includes(status)) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  }
  return "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export default async function SourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const source = await db.source.findUnique({
    where: { id },
    include: {
      transcript: true,
      analysis: true,
      outputs: { orderBy: [{ platform: "asc" }, { sequence: "asc" }] },
    },
  });

  if (!source) notFound();

  const tags = parseTags(source.tags);
  const segments = source.transcript ? parseSegments(source.transcript.segments) : [];
  const analysis = parseAnalysis(source.analysis?.data ?? null);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 font-sans">
      <Link href="/" className="self-start text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
        Back to sources
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold">{source.title}</h1>
            <p className="mt-1 font-mono text-xs text-zinc-500">{source.id}</p>
          </div>
          <span className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${statusTone(source.processingStatus)}`}>
            {source.processingStatus}
          </span>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs dark:border-zinc-700">
                {tag}
              </span>
            ))}
          </div>
        )}
        {source.errorMessage && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
            {source.errorMessage}
          </p>
        )}
      </header>

      <section className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">Original</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {source.sourceUrl && (
            <Field label="Source URL">
              <a href={source.sourceUrl} target="_blank" rel="noreferrer" className="break-all underline">
                {source.sourceUrl}
              </a>
            </Field>
          )}
          {source.originalPath && <Field label="Original file">{source.originalPath}</Field>}
          <Field label="MIME type">{source.mimeType}</Field>
          <Field label="Size">{formatBytes(source.sizeBytes)}</Field>
          {source.originalSha256 && (
            <Field label="SHA-256">
              <span className="break-all font-mono text-xs">{source.originalSha256}</span>
            </Field>
          )}
          <Field label="Created">{source.createdAt.toISOString()}</Field>
          <Field label="Updated">{source.updatedAt.toISOString()}</Field>
        </dl>
      </section>

      {source.transcript ? (
        <section className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-zinc-500">Transcript</h2>
          <p className="mb-4 text-xs text-zinc-500">
            {source.transcript.language} &middot; model {source.transcript.model}
          </p>
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="mb-1 text-xs font-medium text-zinc-500">Original</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{source.transcript.text}</p>
            </div>
            <div>
              <h3 className="mb-1 text-xs font-medium text-zinc-500">English</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{source.transcript.englishText}</p>
            </div>
            {segments.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-medium text-zinc-500">Segments</h3>
                <ul className="flex flex-col gap-1">
                  {segments.map((segment, index) => (
                    <li key={index} className="flex gap-3 text-sm">
                      <span className="shrink-0 font-mono text-xs text-zinc-500">
                        {formatSegmentTime(segment.start)} - {formatSegmentTime(segment.end)}
                      </span>
                      <span>{segment.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      ) : (
        source.sourceText && (
          <section className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Source text</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{source.sourceText}</p>
          </section>
        )
      )}

      <section className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">Analysis</h2>
        {analysis ? (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="mb-1 text-xs font-medium text-zinc-500">Core question</h3>
              <p className="font-medium">{analysis.coreQuestion}</p>
            </div>
            <div>
              <h3 className="mb-1 text-xs font-medium text-zinc-500">Summary</h3>
              <p className="text-sm">{analysis.summary}</p>
            </div>
            <div>
              <h3 className="mb-1 text-xs font-medium text-zinc-500">Audience relevance</h3>
              <p className="text-sm">{analysis.audienceRelevance}</p>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-medium text-zinc-500">Claims</h3>
              <ul className="flex flex-col gap-2">
                {analysis.claims.map((claim, index) => (
                  <li key={index} className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                    <span className="text-xs font-medium text-zinc-500">
                      {CLAIM_LABELS[claim.type] ?? claim.type}
                    </span>
                    <p className="mt-1 text-sm">{claim.text}</p>
                    {claim.framing && <p className="mt-1 text-xs text-zinc-500">{claim.framing}</p>}
                  </li>
                ))}
              </ul>
            </div>
            {analysis.identifyingDetails.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-medium text-red-600 dark:text-red-400">
                  Identifying details (review before publishing)
                </h3>
                <ul className="flex flex-col gap-1">
                  {analysis.identifyingDetails.map((detail, index) => (
                    <li key={index} className="font-mono text-sm">
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No analysis yet.</p>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">Outputs</h2>
        {source.outputs.length === 0 ? (
          <p className="text-sm text-zinc-500">No content generated yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {source.outputs.map((output) => {
              const flags = parseFlags(output.privacyFlags);
              return (
                <li key={output.id} className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-900">
                      {PLATFORM_LABELS[output.platform] ?? output.platform}
                    </span>
                    {output.platform === "TIKTOK" && (
                      <span className="font-mono text-xs text-zinc-500">#{output.sequence}</span>
                    )}
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-900">{output.status}</span>
                    {flags.length > 0 && (
                      <span className="text-xs text-red-600 dark:text-red-400">
                        review required: {flags.join(", ")}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-medium">{output.title}</h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{output.body}</p>
                  <p className="mt-2 text-xs text-zinc-500">
                    model {output.model}
                    {output.approvedAt ? ` &middot; approved ${output.approvedAt.toISOString()}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function formatSegmentTime(seconds?: number): string {
  if (seconds === undefined) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}
