# You-All
# Content Factory

## Project

This is a personal content-processing and distribution system.

The system takes existing Chinese teaching materials — videos, audio, documents, life cases, divination/case stories, teacher knowledge, and student experiences — and turns them into English content for:

* YouTube
* TikTok
* Substack
* Medium

The goal is **content repurposing and international distribution**, not personal-brand content creation.

The user should spend as little time as possible on production.

Core pipeline:

```text
Source
→ Understand
→ Extract
→ Generate
→ Review
→ Approve
→ Export / Publish
→ Analyze
```

One source should be reusable across multiple platforms.

---

## Product Philosophy

Build this as a **simple internal content factory**, not an enterprise CMS.

Priorities:

1. Fast
2. Simple
3. Easy to inspect
4. Easy to modify
5. Reliable
6. Human approval before publishing

Do not over-engineer.

Prefer boring, maintainable technology over unnecessary infrastructure.

---

## User Workflow

The ideal workflow is:

```text
Upload teacher material
        ↓
AI processes it
        ↓
Open dashboard
        ↓
See transcript + analysis
        ↓
See all generated content
        ↓
Edit if necessary
        ↓
Approve
        ↓
Export / publish
```

The user should be able to understand the entire lifecycle of a piece of content from one web interface.

---

## Architecture

Prefer a single-repository full-stack application.

Recommended defaults:

* Next.js
* TypeScript
* SQLite
* Prisma or Drizzle
* Tailwind
* shadcn/ui

Use other technologies only when there is a clear reason.

Keep AI providers abstracted so models can be changed later.

Keep platform publishing integrations modular.

Do not introduce microservices unless genuinely necessary.

---

## Content Model

Every original material is a `Source`.

Every Source has a unique ID.

A Source can produce multiple `ContentOutputs`.

Example:

```text
Source S-001
├── YouTube
├── TikTok 01
├── TikTok 02
├── TikTok 03
├── Substack
└── Medium
```

Always preserve the relationship between generated content and its original Source.

Never lose source traceability.

---

## Source Types

Support flexible tagging, including:

* life cases
* relationships
* human nature
* knowledge
* spirituality
* stories
* student experiences
* career
* money
* family

Do not make the taxonomy unnecessarily rigid.

---

## AI Content Rules

The AI must understand the original material before generating derivative content.

Do NOT perform naive sentence-by-sentence translation.

The process should be:

```text
Chinese source
→ understand meaning
→ identify core question
→ identify audience relevance
→ reconstruct naturally in English
```

English content should read naturally to an English-speaking audience.

The core intellectual meaning of the original material must be preserved.

Do not invent claims, stories, quotes, experiences, or conclusions that are not supported by the source.

---

## Attribution / Epistemic Rules

Always distinguish between:

* teacher's statements
* student-reported experiences
* stories
* editorial interpretation
* established factual information

Claims involving reincarnation, divination, karma, supernatural experiences, spiritual realms, etc. must not automatically be presented as scientifically established facts.

When appropriate, use framing such as:

* "According to the teacher's framework..."
* "In this case, the student reported..."
* "The teacher interpreted this as..."
* "Within this spiritual framework..."

Do not fabricate evidence.

---

## Privacy

Student cases may contain sensitive personal information.

Before publication, detect and flag:

* names
* phone numbers
* email addresses
* addresses
* workplaces
* social accounts
* identifiable personal details

Do not publish content containing potentially identifying information without human review.

Original source material must remain unchanged.

Redaction should apply to publication copies.

---

## Publishing Safety

Publishing is always a human-approved action.

Required state:

```text
DRAFT
→ REVIEW
→ APPROVED
→ PUBLISHED
```

Never automatically publish unapproved content.

Never assume that a platform API exists or is available.

Build publishing adapters so they can be added later.

---

## Content Generation

Default output from one useful source:

* 1 YouTube long-form video
* 5–8 TikTok shorts
* 1 Substack article
* 1 Medium article

This should be configurable.

TikTok content must work independently.

Do not simply cut random sections from YouTube.

Every short should have a clear hook and understandable context.

---

## Content Style

The content should generally be:

* question-driven
* practical
* clear
* thoughtful
* human
* story-oriented
* low-AI-feel

Prefer concrete human questions over abstract terminology.

Example:

Prefer:

> Why do I get jealous when my friend succeeds?

over:

> Understanding the nature of jealousy.

The question is the entry point; deeper explanations can follow.

---

## UI Principles

The dashboard should make the content pipeline visually obvious.

Important views:

* Dashboard
* Sources
* Content
* Review
* Publishing
* Analytics
* Settings

For a Source, the user should be able to see:

```text
Original file
Transcript
Analysis
Generated content
Review status
Publishing status
```

Editing should be easy.

Regeneration should be easy.

Avoid unnecessary UI complexity.

---

## Batch Processing

The system should eventually support:

```text
Upload 20 sources
→ process them in batch
→ show progress
→ generate content packages
→ place everything into Review
```

Batch jobs must be resumable.

A failed source should not stop the entire batch.

Log failures clearly.

---

## Prompts

Store AI prompts outside application logic.

Use:

```text
/prompts
```

Keep prompts versionable.

Prefer structured JSON outputs for intermediate AI steps.

Validate AI outputs before saving them.

---

## Code Quality

Before adding a dependency, check whether the existing stack already solves the problem.

Prefer small modules and clear interfaces.

Do not duplicate logic across platforms.

Do not hard-code:

* API keys
* model names
* publishing credentials
* filesystem paths
* platform-specific assumptions

Use environment variables/configuration.

Never commit secrets.

---

## Development Behavior

Before changing code:

1. Inspect the existing implementation.
2. Understand the current architecture.
3. Reuse existing components where possible.
4. Make the smallest change that solves the problem.

Do not rewrite working parts unnecessarily.

After meaningful changes:

* run tests
* run type checking
* run linting
* verify the affected workflow

If something fails, investigate the root cause instead of hiding the error.

---

## MVP Priority

Always prioritize:

### P0

Source upload
Transcript
AI analysis
Content generation
Dashboard
Editing
Human review
Export

### P1

Batch processing
Scheduling
Publishing integrations

### P2

Analytics
Automatic optimization
Advanced automation

Do not build P1/P2 features before the P0 workflow works end-to-end.

---

## Current Success Criterion

The MVP is successful when the user can:

```text
Upload ONE teacher video
        ↓
Generate transcript
        ↓
Generate content analysis
        ↓
Generate YouTube content
        ↓
Generate TikTok content
        ↓
Generate Substack article
        ↓
Generate Medium article
        ↓
See everything in the browser
        ↓
Edit
        ↓
Approve
        ↓
Export
```

Once this works reliably, optimize for batch production.

---

## Working Style for Claude Code

Act as an experienced engineer.

Do not ask for confirmation for every small implementation decision.

Make reasonable technical decisions yourself.

Ask only when a decision materially affects product behavior, data safety, cost, or irreversible actions.

When beginning a task:

1. Inspect the repository.
2. Inspect relevant files.
3. Explain the implementation plan briefly.
4. Implement.
5. Test.
6. Summarize what changed and what remains.

Keep explanations concise.

Do not create unnecessary documentation.

Do not over-engineer.
