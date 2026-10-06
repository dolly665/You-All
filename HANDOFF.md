# Handoff: Knowledge base frontend + RAG

Read `AGENTS.md` and `README.md` first. Next.js here has breaking changes: check `node_modules/next/dist/docs/` before writing Next code.

## Goal
Add a knowledge base to the Content Factory: upload documents, index them as chunks, search them, and view them in the dashboard.

## UI spec
`design/knowledge-preview.html` is a working static mockup (sample data, vanilla JS). Match its layout and behavior:
- **Sources** view: table + detail pane (pipeline progress, tags, chunks). Today `/` is a flat list.
- **Knowledge** view: Search tab (ranked chunks with score, speaker label, source link) and Map tab (2D scatter by tag).
- **Add files** view: drag-and-drop, YouTube URL, pasted text, tags, processing queue.
Use Tailwind (already in the project). Keep both light and dark themes. Do not add UI libraries unless needed.

## Tasks, in order (stop after each; run checks)
1. **Source detail page** `/sources/[id]`: original info, transcript, analysis, outputs. Reuse existing Prisma models.
2. **Document upload**: add `.pdf .docx .txt .md` to `ALLOWED_UPLOADS` (`src/lib/sources/storage.ts`). Extract text on upload into `sourceText` (keep the original file untouched, keep the SHA-256 check). Skip transcription for these.
3. **Chunk model** in `prisma/schema.prisma`: `sourceId`, `index`, `text`, `textEn`, `embedding` (JSON string or Bytes), `tags`, `speakerLabel`. Add a migration.
4. **Chunking + embeddings**: split into about 300-500 token chunks, embed with Gemini (model name from env config, not hard-coded; see `src/lib/config.ts`). Keep the provider behind a small interface. Embed Chinese and English.
5. **Search API** `GET /api/knowledge/search?q=&tags=`: cosine similarity in Node, return top-N with source IDs. No vector DB.
6. **Knowledge page** `/knowledge` with the Search tab. The Map tab (UMAP or similar) is last and optional.

## Rules (from README)
- Never lose source traceability: every chunk links to its Source.
- Original files are never modified.
- Keep attribution labels (teacher / student-reported / editorial). Do not invent content.
- No secrets or model names hard-coded. Prompts live in `/prompts`.
- Smallest change that works. Do not rewrite working parts.

## Verify after each task
```
npm test
npx tsc --noEmit
npm run lint
```
Add tests for chunking and similarity ranking. Report failures with root causes.

## Do not
- Commit or push.
- Touch `.env` files, `prisma/dev.db`, or `src/lib/transcription/*` unless required.
