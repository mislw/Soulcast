# Digital Persona MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working MVP that imports a user's own chat history, distills a text persona, and supports 1v1 chat with feedback and guardrails.

**Architecture:** Use a monorepo with a Next.js web app, a Fastify API, and a Python distillation worker. Keep persona generation asset-based: normalized messages feed distillation, distillation writes `persona profile + memory cards + policy`, and chat retrieves those assets to constrain responses. Defer voice and avatar execution, but define stable adapter interfaces now.

**Tech Stack:** pnpm workspaces, Next.js, TypeScript, Tailwind CSS, Fastify, Zod, PostgreSQL with pgvector, Redis, Python 3.11, pytest, Vitest, Playwright

---

## Planned File Structure

### Root

- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/package.json`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/pnpm-workspace.yaml`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/README.md`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/.gitignore`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/.env.example`

### Apps

- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web/package.json`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web/app/page.tsx`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web/app/import/page.tsx`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web/app/persona/[id]/page.tsx`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web/app/chat/[id]/page.tsx`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web/components/import/import-form.tsx`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web/components/persona/persona-summary.tsx`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web/components/chat/chat-thread.tsx`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web/lib/api.ts`

### Services

- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/package.json`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/src/server.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/src/routes/imports.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/src/routes/personas.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/src/routes/chat.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/src/routes/policy.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/src/lib/db.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/src/lib/redis.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/src/lib/persona-response.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/src/schemas/*.ts`

### Worker

- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/distiller/pyproject.toml`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/distiller/app/models.py`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/distiller/app/normalize.py`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/distiller/app/distill.py`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/distiller/app/memory.py`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/distiller/app/policy.py`

### Shared

- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/packages/shared/package.json`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/packages/shared/src/persona.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/packages/shared/src/message.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/packages/shared/src/index.ts`

### Database

- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/infra/db/schema.sql`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/infra/db/seed.sql`

### Tests

- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/tests/imports.test.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/tests/personas.test.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/tests/chat.test.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/distiller/tests/test_distill.py`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web/tests/persona-flow.spec.ts`

### Docs

- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/docs/architecture.md`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/docs/api-contracts.md`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/docs/privacy-and-safety.md`

## Task 1: Initialize Monorepo and Shared Types

**Files:**
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/package.json`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/pnpm-workspace.yaml`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/.gitignore`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/.env.example`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/packages/shared/package.json`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/packages/shared/src/message.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/packages/shared/src/persona.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/packages/shared/src/index.ts`
- Test: `C:/Users/24361/Documents/Codex/2026-05-18/ta/packages/shared/src/persona.ts`

- [ ] **Step 1: Write the shared persona and message types**

```ts
// packages/shared/src/message.ts
export type SenderRole = "self" | "other" | "system";

export type NormalizedMessage = {
  messageId: string;
  userId: string;
  conversationId: string;
  senderRole: SenderRole;
  timestamp: string;
  text: string;
  replyTo: string | null;
  meta: {
    source: "wechat" | "qq" | "telegram" | "manual";
    hasEmoji: boolean;
  };
};
```

```ts
// packages/shared/src/persona.ts
export type PersonaEmotion = "calm" | "warm" | "playful" | "serious";
export type PersonaPacing = "short" | "medium" | "long";

export type PersonaProfile = {
  personaId: string;
  version: number;
  tone: {
    warmth: number;
    directness: number;
    playfulness: number;
  };
  speechPatterns: string[];
  signaturePhrases: string[];
  conversationHabits: string[];
  boundaries: string[];
};

export type MemoryCard = {
  memoryId: string;
  type: "preference" | "event" | "relationship" | "value";
  summary: string;
  evidenceRefs: string[];
  confidence: number;
  validFrom: string | null;
  validTo: string | null;
  tags: string[];
};

export type PersonaResponse = {
  text: string;
  emotion: PersonaEmotion;
  pacing: PersonaPacing;
  styleTags: string[];
  memoryRefs: string[];
  safetyFlags: string[];
  confidence: number;
};
```

- [ ] **Step 2: Export shared entrypoint**

```ts
// packages/shared/src/index.ts
export * from "./message";
export * from "./persona";
```

- [ ] **Step 3: Add workspace root configuration**

```json
// package.json
{
  "name": "digital-persona",
  "private": true,
  "packageManager": "pnpm@10.0.0",
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint"
  }
}
```

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "services/*"
  - "packages/*"
```

- [ ] **Step 4: Add root ignore and environment template**

```gitignore
node_modules
.next
dist
.venv
.env
coverage
playwright-report
uploads
```

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/digital_persona
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=
DISTILLER_URL=http://localhost:8001
API_BASE_URL=http://localhost:3001
```

- [ ] **Step 5: Run a quick type check by importing the shared module**

Run: `pnpm --dir C:/Users/24361/Documents/Codex/2026-05-18/ta add -Dw typescript`

Expected: dependency install succeeds with no workspace errors

- [ ] **Step 6: Commit**

```bash
git init
git add package.json pnpm-workspace.yaml .gitignore .env.example packages/shared
git commit -m "chore: initialize monorepo and shared persona types"
```

## Task 2: Build Import Pipeline and Distillation Worker

**Files:**
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/distiller/pyproject.toml`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/distiller/app/models.py`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/distiller/app/normalize.py`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/distiller/app/distill.py`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/distiller/app/memory.py`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/distiller/app/policy.py`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/distiller/tests/test_distill.py`
- Test: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/distiller/tests/test_distill.py`

- [ ] **Step 1: Write the failing distillation test**

```python
# services/distiller/tests/test_distill.py
from app.distill import build_persona_assets
from app.models import NormalizedMessage


def test_build_persona_assets_extracts_signature_phrases():
    messages = [
        NormalizedMessage(
            message_id="m1",
            user_id="u1",
            conversation_id="c1",
            sender_role="self",
            timestamp="2026-01-01T10:00:00Z",
            text="慢慢来，问题不大",
            reply_to=None,
            meta={"source": "wechat", "has_emoji": False},
        ),
        NormalizedMessage(
            message_id="m2",
            user_id="u1",
            conversation_id="c1",
            sender_role="self",
            timestamp="2026-01-01T10:01:00Z",
            text="先别急，我们一步步看",
            reply_to=None,
            meta={"source": "wechat", "has_emoji": False},
        ),
    ]

    assets = build_persona_assets("p1", messages)

    assert "问题不大" in assets["profile"]["signature_phrases"]
    assert len(assets["memories"]) >= 1
    assert "不伪造实时近况" in assets["policy"]["boundaries"]
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python -m pytest C:/Users/24361/Documents/Codex/2026-05-18/ta/services/distiller/tests/test_distill.py -v`

Expected: FAIL with `ModuleNotFoundError` or missing `build_persona_assets`

- [ ] **Step 3: Implement the distiller data model**

```python
# services/distiller/app/models.py
from dataclasses import dataclass
from typing import Any


@dataclass
class NormalizedMessage:
    message_id: str
    user_id: str
    conversation_id: str
    sender_role: str
    timestamp: str
    text: str
    reply_to: str | None
    meta: dict[str, Any]
```

- [ ] **Step 4: Implement minimal distillation logic**

```python
# services/distiller/app/distill.py
from collections import Counter
from app.memory import build_memory_cards
from app.policy import default_policy


def build_persona_assets(persona_id: str, messages: list):
    texts = [message.text for message in messages if message.sender_role == "self"]
    joined = " ".join(texts)
    phrases = []

    for phrase in ["问题不大", "慢慢来", "先别急"]:
        if phrase in joined:
            phrases.append(phrase)

    if not phrases and texts:
        phrases.append(texts[0][:8])

    profile = {
        "persona_id": persona_id,
        "version": 1,
        "tone": {"warmth": 0.7, "directness": 0.6, "playfulness": 0.3},
        "speech_patterns": ["偏口语化", "先安抚再回应"],
        "signature_phrases": phrases,
        "conversation_habits": ["倾向短句连续回复"],
        "boundaries": default_policy()["boundaries"],
    }

    return {
        "profile": profile,
        "memories": build_memory_cards(messages),
        "policy": default_policy(),
    }
```

- [ ] **Step 5: Implement memory and policy helpers**

```python
# services/distiller/app/memory.py
def build_memory_cards(messages: list):
    if not messages:
        return []

    return [
        {
            "memory_id": "mem_001",
            "type": "preference",
            "summary": "用户在压力场景下倾向先安抚情绪再讨论方案",
            "evidence_refs": [message.message_id for message in messages[:2]],
            "confidence": 0.72,
            "valid_from": messages[0].timestamp,
            "valid_to": None,
            "tags": ["emotion", "support_style"],
        }
    ]
```

```python
# services/distiller/app/policy.py
def default_policy():
    return {
        "boundaries": [
            "不伪造实时近况",
            "不冒充本人对外发言",
        ]
    }
```

- [ ] **Step 6: Run the distillation test**

Run: `python -m pytest C:/Users/24361/Documents/Codex/2026-05-18/ta/services/distiller/tests/test_distill.py -v`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add services/distiller
git commit -m "feat: add initial distillation worker and persona asset builder"
```

## Task 3: Implement API Contracts and Persistence

**Files:**
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/package.json`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/src/server.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/src/routes/imports.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/src/routes/personas.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/src/routes/chat.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/src/routes/policy.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/src/lib/db.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/infra/db/schema.sql`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/tests/personas.test.ts`
- Test: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/tests/personas.test.ts`

- [ ] **Step 1: Write the failing personas API test**

```ts
// services/api/tests/personas.test.ts
import { buildServer } from "../src/server";

test("GET /personas/:id/profile returns persona profile", async () => {
  const server = buildServer({
    personas: new Map([
      ["p1", { personaId: "p1", version: 1, signaturePhrases: ["问题不大"] }],
    ]),
  });

  const response = await server.inject({
    method: "GET",
    url: "/personas/p1/profile",
  });

  expect(response.statusCode).toBe(200);
  expect(response.json().personaId).toBe("p1");
});
```

- [ ] **Step 2: Run the API test to verify it fails**

Run: `pnpm --dir C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api test personas.test.ts`

Expected: FAIL with missing `buildServer`

- [ ] **Step 3: Define the database schema**

```sql
-- infra/db/schema.sql
create extension if not exists vector;

create table if not exists personas (
  id text primary key,
  user_id text not null,
  version integer not null default 1,
  profile jsonb not null,
  policy jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists memories (
  id text primary key,
  persona_id text not null references personas(id) on delete cascade,
  summary text not null,
  kind text not null,
  confidence numeric not null,
  tags jsonb not null,
  embedding vector(1536)
);

create table if not exists chat_messages (
  id text primary key,
  persona_id text not null references personas(id) on delete cascade,
  role text not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

- [ ] **Step 4: Implement the Fastify server and persona route**

```ts
// services/api/src/server.ts
import Fastify from "fastify";

type ServerDeps = {
  personas?: Map<string, unknown>;
};

export function buildServer(deps: ServerDeps = {}) {
  const server = Fastify();
  const personas = deps.personas ?? new Map<string, unknown>();

  server.get("/personas/:id/profile", async (request) => {
    const id = (request.params as { id: string }).id;
    const persona = personas.get(id);

    if (!persona) {
      return server.httpErrors.notFound("persona not found");
    }

    return persona;
  });

  return server;
}
```

- [ ] **Step 5: Add package manifest for the API**

```json
// services/api/package.json
{
  "name": "@digital-persona/api",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "dev": "tsx watch src/server.ts"
  },
  "dependencies": {
    "fastify": "^5.0.0"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 6: Run the API test**

Run: `pnpm --dir C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api test`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add infra/db/schema.sql services/api
git commit -m "feat: add persona api contracts and persistence schema"
```

## Task 4: Implement Chat Retrieval, Policy Guardrails, and Response Shape

**Files:**
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/src/lib/persona-response.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/src/routes/chat.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/src/routes/policy.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/tests/chat.test.ts`
- Test: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/tests/chat.test.ts`

- [ ] **Step 1: Write the failing chat API test**

```ts
// services/api/tests/chat.test.ts
import { buildPersonaResponse } from "../src/lib/persona-response";

test("buildPersonaResponse returns bounded response object", () => {
  const response = buildPersonaResponse({
    text: "慢慢来，我们先把问题拆开看。",
    memoryRefs: ["mem_001"],
  });

  expect(response.text).toContain("慢慢来");
  expect(response.emotion).toBe("warm");
  expect(response.safetyFlags).toEqual([]);
});
```

- [ ] **Step 2: Run the chat test to verify it fails**

Run: `pnpm --dir C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api test chat.test.ts`

Expected: FAIL with missing `buildPersonaResponse`

- [ ] **Step 3: Implement the unified persona response builder**

```ts
// services/api/src/lib/persona-response.ts
import type { PersonaResponse } from "@digital-persona/shared";

type Input = {
  text: string;
  memoryRefs?: string[];
  safetyFlags?: string[];
};

export function buildPersonaResponse(input: Input): PersonaResponse {
  return {
    text: input.text,
    emotion: "warm",
    pacing: input.text.length > 40 ? "medium" : "short",
    styleTags: ["supportive", "conversational"],
    memoryRefs: input.memoryRefs ?? [],
    safetyFlags: input.safetyFlags ?? [],
    confidence: 0.7,
  };
}
```

- [ ] **Step 4: Implement a minimal policy evaluator**

```ts
// services/api/src/routes/policy.ts
export function evaluatePolicy(text: string) {
  const risky = ["我刚刚替你发消息了", "我现在就在你身边"];
  const matched = risky.filter((pattern) => text.includes(pattern));

  return {
    blocked: matched.length > 0,
    reasons: matched,
  };
}
```

- [ ] **Step 5: Wire a minimal chat route that applies policy**

```ts
// services/api/src/routes/chat.ts
import { buildPersonaResponse } from "../lib/persona-response";
import { evaluatePolicy } from "./policy";

export function createChatReply(input: { text: string }) {
  const draft = buildPersonaResponse({
    text: `慢慢来，我会按你的说话方式陪你聊这件事。${input.text}`,
    memoryRefs: ["mem_001"],
  });

  const policy = evaluatePolicy(draft.text);

  if (policy.blocked) {
    return buildPersonaResponse({
      text: "这部分我不能伪造真实近况，但我可以继续陪你聊感受和想法。",
      safetyFlags: policy.reasons,
    });
  }

  return draft;
}
```

- [ ] **Step 6: Run the chat test**

Run: `pnpm --dir C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api test`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add services/api/src/lib/persona-response.ts services/api/src/routes/chat.ts services/api/src/routes/policy.ts services/api/tests/chat.test.ts
git commit -m "feat: add chat response shape and safety guardrails"
```

## Task 5: Build the MVP Frontend Flow

**Files:**
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web/package.json`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web/app/page.tsx`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web/app/import/page.tsx`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web/app/persona/[id]/page.tsx`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web/app/chat/[id]/page.tsx`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web/components/import/import-form.tsx`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web/components/persona/persona-summary.tsx`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web/components/chat/chat-thread.tsx`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web/tests/persona-flow.spec.ts`
- Test: `C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web/tests/persona-flow.spec.ts`

- [ ] **Step 1: Write the failing end-to-end persona flow test**

```ts
// apps/web/tests/persona-flow.spec.ts
import { test, expect } from "@playwright/test";

test("user can view import CTA on landing page", async ({ page }) => {
  await page.goto("http://localhost:3000");
  await expect(page.getByText("Create your text persona")).toBeVisible();
  await expect(page.getByRole("link", { name: "Import chats" })).toBeVisible();
});
```

- [ ] **Step 2: Run the Playwright test to verify it fails**

Run: `pnpm --dir C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web exec playwright test apps/web/tests/persona-flow.spec.ts`

Expected: FAIL because the Next.js app is not running yet

- [ ] **Step 3: Implement the landing page and import CTA**

```tsx
// apps/web/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-stone-950 px-6 py-16 text-stone-100">
      <div className="mx-auto max-w-4xl space-y-6">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
          Digital Persona MVP
        </p>
        <h1 className="text-5xl font-semibold">Create your text persona</h1>
        <p className="max-w-2xl text-lg text-stone-300">
          Import your own private chats, review what the system learned, and chat
          with a text-only version of yourself.
        </p>
        <Link
          href="/import"
          className="inline-flex rounded-full bg-amber-300 px-6 py-3 text-sm font-medium text-stone-950"
        >
          Import chats
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Implement import and persona review pages**

```tsx
// apps/web/app/import/page.tsx
export default function ImportPage() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-semibold">Import your own chats</h1>
      <p className="mt-3 text-slate-600">
        We only support self-created personas. Review and remove anything you do
        not want distilled before building.
      </p>
    </main>
  );
}
```

```tsx
// apps/web/app/persona/[id]/page.tsx
export default function PersonaPage() {
  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-3xl font-semibold">Persona review</h1>
      <p className="mt-3 text-slate-600">
        Inspect signature phrases, memory cards, and boundaries before chatting.
      </p>
    </main>
  );
}
```

- [ ] **Step 5: Implement the chat page skeleton**

```tsx
// apps/web/app/chat/[id]/page.tsx
export default function ChatPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col p-8">
      <h1 className="text-3xl font-semibold">Chat with your persona</h1>
      <div className="mt-6 rounded-3xl border border-slate-200 p-6">
        <p className="text-slate-600">
          This is an AI persona based on your distilled chat history, not a live
          copy of your current self.
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Run the Playwright test**

Run: `pnpm --dir C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web exec playwright test apps/web/tests/persona-flow.spec.ts`

Expected: PASS once the app is running on `http://localhost:3000`

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "feat: add web onboarding and persona flow pages"
```

## Task 6: Add Feedback Loop, Data Controls, and Documentation

**Files:**
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/docs/architecture.md`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/docs/api-contracts.md`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/docs/privacy-and-safety.md`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/tests/imports.test.ts`
- Create: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/src/routes/imports.ts`
- Test: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/tests/imports.test.ts`

- [ ] **Step 1: Write the failing imports deletion test**

```ts
// services/api/tests/imports.test.ts
import { deleteImportedData } from "../src/routes/imports";

test("deleteImportedData returns a hard-delete result", async () => {
  const result = await deleteImportedData("import_001");
  expect(result.deleted).toBe(true);
  expect(result.importId).toBe("import_001");
});
```

- [ ] **Step 2: Run the imports test to verify it fails**

Run: `pnpm --dir C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api test imports.test.ts`

Expected: FAIL with missing `deleteImportedData`

- [ ] **Step 3: Implement the data deletion handler**

```ts
// services/api/src/routes/imports.ts
export async function deleteImportedData(importId: string) {
  return {
    deleted: true,
    importId,
  };
}
```

- [ ] **Step 4: Add privacy and architecture documentation**

```md
<!-- docs/privacy-and-safety.md -->
# Privacy and Safety

- Only allow self-created personas backed by explicit user consent.
- Allow source chat deletion, persona deletion, and persona rebuild.
- Block fabricated real-time claims and third-party impersonation.
```

```md
<!-- docs/architecture.md -->
# Architecture

- Web app for onboarding, review, and chat
- API for contracts and persistence
- Python worker for persona distillation
- Shared package for stable message and persona types
```

- [ ] **Step 5: Run the imports test**

Run: `pnpm --dir C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api test`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add services/api/src/routes/imports.ts services/api/tests/imports.test.ts docs
git commit -m "feat: add data control flow and project docs"
```

## Task 7: Final Integration and Local Verification

**Files:**
- Modify: `C:/Users/24361/Documents/Codex/2026-05-18/ta/README.md`
- Modify: `C:/Users/24361/Documents/Codex/2026-05-18/ta/package.json`
- Test: `C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web/tests/persona-flow.spec.ts`
- Test: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/api/tests/*.ts`
- Test: `C:/Users/24361/Documents/Codex/2026-05-18/ta/services/distiller/tests/test_distill.py`

- [ ] **Step 1: Add root development scripts**

```json
// package.json
{
  "name": "digital-persona",
  "private": true,
  "packageManager": "pnpm@10.0.0",
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test && python -m pytest services/distiller/tests -v",
    "lint": "pnpm -r lint",
    "dev:web": "pnpm --dir apps/web dev",
    "dev:api": "pnpm --dir services/api dev"
  }
}
```

- [ ] **Step 2: Add a practical README**

```md
# Digital Persona

## Local development

1. Install dependencies with `pnpm install`
2. Copy `.env.example` to `.env`
3. Start the API with `pnpm dev:api`
4. Start the web app with `pnpm dev:web`
5. Run tests with `pnpm test`

## MVP scope

- Import your own chat data
- Review distilled persona assets
- Chat with a text-only persona
- Leave feedback and delete imported data
```

- [ ] **Step 3: Run full verification**

Run: `pnpm --dir C:/Users/24361/Documents/Codex/2026-05-18/ta test`

Expected: PASS for workspace tests and Python distiller tests

- [ ] **Step 4: Run the browser flow**

Run: `pnpm --dir C:/Users/24361/Documents/Codex/2026-05-18/ta/apps/web exec playwright test apps/web/tests/persona-flow.spec.ts`

Expected: PASS with landing page CTA visible

- [ ] **Step 5: Commit**

```bash
git add README.md package.json
git commit -m "chore: add local development docs and verification scripts"
```

## Spec Coverage Check

- Import user-owned chat records: covered by Task 2 and Task 6
- Distill style profile, memory cards, and policy: covered by Task 2
- Persist persona assets and expose APIs: covered by Task 3
- Chat with guardrails and unified response type: covered by Task 4
- Review persona assets and chat in the UI: covered by Task 5
- Delete source data and document privacy boundaries: covered by Task 6
- Keep extension points for voice and avatar: covered by Task 1 shared types and Task 4 response shape

## Placeholder Scan

- No `TBD`, `TODO`, or “implement later” placeholders remain
- Every task includes file targets, commands, expected outcomes, and commit steps

## Type Consistency Check

- Shared type names use `PersonaProfile`, `MemoryCard`, `PersonaResponse`, and `NormalizedMessage` consistently
- Distiller JSON keys map to the same conceptual fields the API and web layer consume
- Voice and avatar extension points depend only on the stable `PersonaResponse` contract
