import test from "node:test";
import assert from "node:assert/strict";

import { asNormalizedScore, type PersonaAssets } from "@ta/shared";

import { createInMemoryDb } from "../src/lib/db";
import { deleteImportedData, normalizeSourceText } from "../src/routes/imports";
import { buildServer } from "../src/server";

test("deleteImportedData returns a hard-delete result", async () => {
  const result = await deleteImportedData("import_001");

  assert.deepEqual(result, {
    deleted: true,
    importId: "import_001",
  });
});

test("POST /imports/preview distills source text and persists the persona", async () => {
  const db = createInMemoryDb();
  const assets: PersonaAssets = {
    profile: {
      personaId: "user-1",
      version: 1,
      tone: {
        warmth: asNormalizedScore(0.8),
        directness: asNormalizedScore(0.5),
        playfulness: asNormalizedScore(0.1),
      },
      speechPatterns: ["口语化"],
      signaturePhrases: ["慢慢来"],
      conversationHabits: ["先安抚再分析"],
      boundaries: ["不伪造实时近况"],
    },
    memories: [
      {
        memoryId: "memory-1",
        type: "preference",
        summary: "Prefers calm reassurance before advice.",
        evidenceRefs: ["msg-1"],
        confidence: asNormalizedScore(0.7),
        validFrom: "2026-01-01T00:00:00.000Z",
        validTo: null,
        tags: ["support-style"],
      },
    ],
    policy: {
      boundaries: ["不伪造实时近况"],
    },
  };
  const server = buildServer({
    db,
    distiller: async ({ personaId, messages }) => {
      assert.equal(personaId, "user-1");
      assert.equal(messages.length, 2);
      assert.equal(messages[0]?.senderRole, "user");
      assert.equal(messages[1]?.senderRole, "assistant");
      return assets;
    },
  });

  const previewResponse = await server.inject({
    method: "POST",
    url: "/imports/preview",
    headers: {
      "x-user-id": "user-1",
    },
    payload: {
      personaId: "user-1",
      sourceText: "Me: 慢慢来\nFriend: 好，那我们一步步看",
      selfProfile: {
        speakingStyle: "温和但直接",
        values: "真诚和清晰",
        responsePatterns: "先安抚再建议",
        boundaries: "不要伪造实时状态",
        freeformNotes: "我是那种会认真听人说完再回应的人",
      },
    },
  });

  assert.equal(previewResponse.statusCode, 200);
  assert.deepEqual(previewResponse.json(), {
    assets,
  });

  const storedProfileResponse = await server.inject({
    method: "GET",
    url: "/personas/user-1/profile",
    headers: {
      "x-user-id": "user-1",
    },
  });

  assert.equal(storedProfileResponse.statusCode, 200);
  assert.deepEqual(storedProfileResponse.json(), assets.profile);

  await server.close();
});

test("POST /imports/preview forwards selfProfile to the distiller", async () => {
  const server = buildServer({
    db: createInMemoryDb(),
    distiller: async ({ selfProfile }) => {
      assert.deepEqual(selfProfile, {
        speakingStyle: "温和但直接",
        values: "真诚和清晰",
        responsePatterns: "先安抚再建议",
        boundaries: "不要伪造实时状态",
        freeformNotes: "我是那种会认真听人说完再回应的人",
      });

      return {
        profile: {
          personaId: "user-1",
          version: 1,
          tone: {
            warmth: asNormalizedScore(0.7),
            directness: asNormalizedScore(0.6),
            playfulness: asNormalizedScore(0.2),
          },
          speechPatterns: ["温和但直接"],
          signaturePhrases: ["慢慢来"],
          conversationHabits: ["先安抚再建议"],
          boundaries: ["不要伪造实时状态"],
        },
        memories: [],
        policy: {
          boundaries: ["不要伪造实时状态"],
        },
      };
    },
  });

  const response = await server.inject({
    method: "POST",
    url: "/imports/preview",
    headers: {
      "x-user-id": "user-1",
    },
    payload: {
      personaId: "user-1",
      sourceText: "Me: hi",
      selfProfile: {
        speakingStyle: "温和但直接",
        values: "真诚和清晰",
        responsePatterns: "先安抚再建议",
        boundaries: "不要伪造实时状态",
        freeformNotes: "我是那种会认真听人说完再回应的人",
      },
    },
  });

  assert.equal(response.statusCode, 200);

  await server.close();
});

test("POST /imports/preview rejects imports for a different user", async () => {
  const server = buildServer({
    db: createInMemoryDb(),
    distiller: async () => {
      throw new Error("distiller should not run");
    },
  });

  const response = await server.inject({
    method: "POST",
    url: "/imports/preview",
    headers: {
      "x-user-id": "user-1",
    },
    payload: {
      personaId: "user-2",
      sourceText: "Me: hi",
    },
  });

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.json(), {
    message: "personaId must match x-user-id for self-owned imports.",
  });

  await server.close();
});

test("normalizeSourceText parses multiline WeChat exports with date, time, and speaker headers", () => {
  const messages = normalizeSourceText(
    "user-1",
    [
      "2024-05-01 09:30 Alex",
      "今天有点累，晚点回你。",
      "2024-05-01 09:32 Sam",
      "好，你先忙。",
    ].join("\n"),
  );

  assert.equal(messages.length, 2);
  assert.equal(messages[0]?.senderRole, "user");
  assert.equal(messages[0]?.text, "今天有点累，晚点回你。");
  assert.equal(messages[0]?.meta.source, "wechat");
  assert.equal(messages[1]?.senderRole, "assistant");
  assert.equal(messages[1]?.text, "好，你先忙。");
});

test("normalizeSourceText parses WeChat exports with slashes and seconds", () => {
  const messages = normalizeSourceText(
    "user-1",
    [
      "2024/05/01 09:30:15 Alex",
      "慢慢来，我们一步步看。",
      "2024/05/01 09:31:02 Sam",
      "嗯，好。",
    ].join("\n"),
  );

  assert.equal(messages.length, 2);
  assert.equal(messages[0]?.timestamp, "2024-05-01T09:30:15");
  assert.equal(messages[1]?.timestamp, "2024-05-01T09:31:02");
});

test("normalizeSourceText falls back to simple speaker-colon lines", () => {
  const messages = normalizeSourceText(
    "user-1",
    "Alex: hello\nSam: hi there",
  );

  assert.equal(messages.length, 2);
  assert.equal(messages[0]?.meta.source, "manual");
  assert.equal(messages[0]?.text, "hello");
  assert.equal(messages[1]?.text, "hi there");
});

test("DELETE /imports/:id returns a deletion payload", async () => {
  const server = buildServer({
    db: createInMemoryDb(),
    distiller: async () => {
      throw new Error("distiller should not run");
    },
  });

  const response = await server.inject({
    method: "DELETE",
    url: "/imports/import_002",
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    deleted: true,
    importId: "import_002",
  });

  await server.close();
});
