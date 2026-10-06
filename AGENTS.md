<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Model and cost policy

Follow `MODEL_ROUTING.md` for every AI call in this repo. Route by each module's quality bar, use the cheapest model that clears it, keep providers behind interfaces, and never hardcode model names or secrets.

## Project

Content Factory: turns Chinese teaching material into English content for YouTube, TikTok, Substack, and Medium. `README.md` holds the binding rules and the P0 MVP success criterion. `HANDOFF.md` describes the current in-flight feature (knowledge base + RAG) and its ordered task list.

Stack: Next.js 16 (App Router), TypeScript, React 19, Prisma + SQLite, Tailwind v4, zod, vitest.

## Commands

- `npm test` - vitest unit tests
- `npm run lint` - eslint
- `npx tsc --noEmit` - type check
- `npm run build` - next build
- `npm run dev` - dev server

## Agent team

The same 8 roles are defined twice, for two different tools:

- `.codex/agents/*.toml` - Codex project-scoped custom agents (format: `name`, `description`, `developer_instructions`).
- `.claude/agents/*.md` - Claude Code subagents.

Roles: `pm` (routes work, does not code), `architect` (plans, does not code), `ingest-pipeline`, `analysis-engineer`, `content-writer`, `dashboard-ui`, `privacy-reviewer` (read-only), `qa-verifier` (read-only). Keep the two definitions in sync when a role changes.

## Invariants

- Source traceability: every derived output keeps its Source ID.
- Original files are immutable; redaction and edits apply to derived copies only.
- Nothing reaches PUBLISHED without explicit human approval.
- No hardcoded secrets or model names; read them from env config (see `.env.example`).
- Prompts live in `/prompts` and are versioned.
