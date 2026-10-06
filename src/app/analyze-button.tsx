"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AnalyzeButton({ sourceId }: { sourceId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/sources/${sourceId}/analyze`, { method: "POST" });
    setBusy(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Analysis failed");
    }
    router.refresh();
  }

  return (
    <div className="mt-2 flex flex-col gap-1">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="self-start rounded border border-zinc-300 px-3 py-1 text-xs disabled:opacity-50 dark:border-zinc-700"
      >
        {busy ? "Analyzing…" : "Analyze"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
