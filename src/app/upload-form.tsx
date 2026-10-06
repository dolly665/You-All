"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UploadForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    const form = event.currentTarget;
    const data = new FormData(form);
    const text = String(data.get("text") ?? "").trim();
    const youtubeUrl = String(data.get("youtubeUrl") ?? "").trim();
    const title = String(data.get("title") ?? "").trim();

    let response: Response;
    if (text || youtubeUrl) {
      response = await fetch("/api/sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, youtubeUrl, title }),
      });
    } else {
      response = await fetch("/api/sources", { method: "POST", body: data });
    }

    setBusy(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Upload failed");
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <input name="title" placeholder="Title (optional)" className="rounded border px-3 py-2 text-sm" />
      <textarea
        name="text"
        rows={6}
        placeholder="Paste the English article"
        className="rounded border px-3 py-2 text-sm"
      />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-zinc-500">or</span>
        <input name="youtubeUrl" placeholder="public YouTube URL" className="grow rounded border px-3 py-2" />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-zinc-500">or upload a video/audio file</span>
        <input name="file" type="file" accept=".mp4,.mov,.webm,.mp3,.wav" className="text-sm" />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="self-start rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {busy ? "Adding…" : "Add source"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
