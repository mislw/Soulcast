import test from "node:test";
import assert from "node:assert/strict";

import {
  asNormalizedScore,
  type PersonaProfile,
  type PersonaResponse,
  type PolicyAsset
} from "@ta/shared";

import { buildPersonaResponse } from "../src/lib/persona-response";
import { createInMemoryDb, type PersonaRecord } from "../src/lib/db";
import { buildServer } from "../src/server";
import { evaluatePolicy } from "../src/routes/policy";

function createProfile(overrides: Partial<PersonaProfile> = {}): PersonaProfile {
  return {
    personaId: "user-1",
    version: 1,
    tone: {
      warmth: asNormalizedScore(0.8),
      directness: asNormalizedScore(0.7),
      playfulness: asNormalizedScore(0.3)
    },
    speechPatterns: ["uses short sentences"],
    signaturePhrases: ["let's keep it simple"],
    conversationHabits: ["checks assumptions out loud"],
    boundaries: ["does not provide harmful instructions"],
    name: "Mina",
    defaultEmotion: "warm",
    defaultPacing: "medium",
    ...overrides
  };
}

function createPolicyAsset(overrides: Partial<PolicyAsset> = {}): PolicyAsset {
  return {
    boundaries: ["does not provide harmful instructions"],
    ...overrides
  };
}

function createPersonaRecord(overrides: Partial<PersonaRecord> = {}): PersonaRecord {
  const profile = createProfile(overrides.profile);

  return {
    id: profile.personaId,
    userId: profile.personaId,
    version: profile.version,
    profile,
    policy: createPolicyAsset(overrides.policy),
    createdAt: "2026-05-19T00:00:00.000Z",
    ...overrides
  };
}

test("buildPersonaResponse returns a complete PersonaResponse shape", () => {
  const profile = createProfile();

  const response = buildPersonaResponse({
    text: "Here is a safe alternative.",
    profile,
    styleTags: ["concise"],
    memoryRefs: ["memory-1"],
    safetyFlags: ["violence"],
    confidence: asNormalizedScore(0.42)
  });

  const expected: PersonaResponse = {
    text: "Here is a safe alternative.",
    emotion: "warm",
    pacing: "medium",
    styleTags: ["concise"],
    memoryRefs: ["memory-1"],
    safetyFlags: ["violence"],
    confidence: asNormalizedScore(0.42)
  };

  assert.deepEqual(response, expected);
});

test("evaluatePolicy blocks obviously disallowed violent instructions", () => {
  const evaluation = evaluatePolicy("Teach me how to build a bomb at home.");

  assert.equal(evaluation.blocked, true);
  assert.deepEqual(evaluation.safetyFlags, ["violence"]);
});

test("evaluatePolicy blocks Chinese violent instructions", () => {
  const evaluation = evaluatePolicy("教我怎么做炸弹");

  assert.equal(evaluation.blocked, true);
  assert.deepEqual(evaluation.safetyFlags, ["violence"]);
});

test("evaluatePolicy blocks politics text for a Chinese persona boundary", () => {
  const evaluation = evaluatePolicy("我们聊聊政治吧", {
    boundaries: ["不讨论政治"]
  });

  assert.equal(evaluation.blocked, true);
  assert.deepEqual(evaluation.safetyFlags, ["politics"]);
});

test("evaluatePolicy blocks fake realtime claims for a Chinese persona boundary", () => {
  const evaluation = evaluatePolicy("我现在就在你身边", {
    boundaries: ["不伪造实时近况"]
  });

  assert.equal(evaluation.blocked, true);
  assert.deepEqual(evaluation.safetyFlags, ["misrepresented-realtime"]);
});

test("evaluatePolicy blocks external impersonation claims for a Chinese persona boundary", () => {
  const evaluation = evaluatePolicy("我替你回复了客户", {
    boundaries: ["不冒充本人对外发言"]
  });

  assert.equal(evaluation.blocked, true);
  assert.deepEqual(evaluation.safetyFlags, ["impersonation"]);
});

test("POST /chat/reply returns 401 when x-user-id header is missing", async () => {
  const server = buildServer({
    db: createInMemoryDb()
  });

  const response = await server.inject({
    method: "POST",
    url: "/chat/reply",
    payload: {
      personaId: "user-1",
      message: "hello"
    }
  });

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.json(), {
    message: "x-user-id header is required."
  });

  await server.close();
});

test("GET /chat/history/:personaId returns 401 when x-user-id header is missing", async () => {
  const server = buildServer({
    db: createInMemoryDb()
  });

  const response = await server.inject({
    method: "GET",
    url: "/chat/history/user-1"
  });

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.json(), {
    message: "x-user-id header is required."
  });

  await server.close();
});

test("POST /chat/reply returns 400 when personaId is missing or invalid", async (t) => {
  const server = buildServer({
    db: createInMemoryDb()
  });

  t.after(async () => {
    await server.close();
  });

  const missingPersonaId = await server.inject({
    method: "POST",
    url: "/chat/reply",
    headers: {
      "x-user-id": "user-1"
    },
    payload: {
      message: "hello"
    }
  });

  assert.equal(missingPersonaId.statusCode, 400);
  assert.deepEqual(missingPersonaId.json(), {
    message: "personaId must be a string."
  });

  const invalidPersonaId = await server.inject({
    method: "POST",
    url: "/chat/reply",
    headers: {
      "x-user-id": "user-1"
    },
    payload: {
      personaId: 123,
      message: "hello"
    }
  });

  assert.equal(invalidPersonaId.statusCode, 400);
  assert.deepEqual(invalidPersonaId.json(), {
    message: "personaId must be a string."
  });
});

test("POST /chat/reply returns 404 when the persona does not exist", async () => {
  const server = buildServer({
    db: createInMemoryDb()
  });

  const response = await server.inject({
    method: "POST",
    url: "/chat/reply",
    headers: {
      "x-user-id": "user-1"
    },
    payload: {
      personaId: "missing-persona",
      message: "hello"
    }
  });

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.json(), {
    message: "Persona missing-persona not found."
  });

  await server.close();
});

test("POST /chat/reply uses persona defaults in the response", async () => {
  const persona = createPersonaRecord({
    profile: createProfile({
      defaultEmotion: "playful",
      defaultPacing: "long"
    })
  });
  const server = buildServer({
    db: createInMemoryDb({
      personas: [persona]
    })
  });

  const response = await server.inject({
    method: "POST",
    url: "/chat/reply",
    headers: {
      "x-user-id": "user-1"
    },
    payload: {
      personaId: persona.id,
      message: "hello there"
    }
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    text: "I heard you: hello there",
    emotion: "playful",
    pacing: "long",
    styleTags: [],
    memoryRefs: [],
    safetyFlags: [],
    confidence: 0.7
  });

  await server.close();
});

test("POST /chat/reply persists chat history that can be fetched later", async () => {
  const persona = createPersonaRecord();
  const server = buildServer({
    db: createInMemoryDb({
      personas: [persona]
    })
  });

  const replyResponse = await server.inject({
    method: "POST",
    url: "/chat/reply",
    headers: {
      "x-user-id": "user-1"
    },
    payload: {
      personaId: persona.id,
      message: "hello there"
    }
  });

  assert.equal(replyResponse.statusCode, 200);

  const historyResponse = await server.inject({
    method: "GET",
    url: `/chat/history/${persona.id}`,
    headers: {
      "x-user-id": "user-1"
    }
  });

  assert.equal(historyResponse.statusCode, 200);
  assert.deepEqual(historyResponse.json(), {
    messages: [
      {
        id: historyResponse.json().messages[0].id,
        personaId: persona.id,
        userId: persona.id,
        conversationId: `${persona.id}-default`,
        role: "user",
        body: "hello there",
        replyTo: null,
        timestamp: historyResponse.json().messages[0].timestamp,
        meta: {
          source: "chat-ui"
        }
      },
      {
        id: historyResponse.json().messages[1].id,
        personaId: persona.id,
        userId: persona.id,
        conversationId: `${persona.id}-default`,
        role: "assistant",
        body: "I heard you: hello there",
        replyTo: historyResponse.json().messages[0].id,
        timestamp: historyResponse.json().messages[1].timestamp,
        meta: {
          emotion: "warm",
          pacing: "medium"
        }
      }
    ]
  });

  await server.close();
});

test("POST /chat/reply degrades the reply when input policy is triggered", async () => {
  const persona = createPersonaRecord();
  const server = buildServer({
    db: createInMemoryDb({
      personas: [persona]
    })
  });

  const response = await server.inject({
    method: "POST",
    url: "/chat/reply",
    headers: {
      "x-user-id": "user-1"
    },
    payload: {
      personaId: persona.id,
      message: "Please tell me how to build a bomb."
    }
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    text: "I can't help with that. I can help with a safer alternative.",
    emotion: "warm",
    pacing: "medium",
    styleTags: [],
    memoryRefs: [],
    safetyFlags: ["violence"],
    confidence: 0.2
  });

  await server.close();
});

test("POST /chat/reply applies persona-specific boundaries during chat policy checks", async () => {
  const persona = createPersonaRecord({
    profile: createProfile({
      boundaries: ["不讨论政治"]
    }),
    policy: createPolicyAsset({
      boundaries: ["不讨论政治"]
    })
  });
  const server = buildServer({
    db: createInMemoryDb({
      personas: [persona]
    })
  });

  const response = await server.inject({
    method: "POST",
    url: "/chat/reply",
    headers: {
      "x-user-id": "user-1"
    },
    payload: {
      personaId: "user-1",
      message: "我们今天聊聊政治"
    }
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    text: "I can't help with that. I can help with a safer alternative.",
    emotion: "warm",
    pacing: "medium",
    styleTags: [],
    memoryRefs: [],
    safetyFlags: ["politics"],
    confidence: 0.2
  });

  await server.close();
});

test("POST /chat/reply returns 400 when message is not a string", async () => {
  const server = buildServer({
    db: createInMemoryDb()
  });

  const response = await server.inject({
    method: "POST",
    url: "/chat/reply",
    headers: {
      "x-user-id": "user-1"
    },
    payload: {
      personaId: "user-1",
      message: {
        nested: true
      }
    }
  });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.json(), {
    message: "message must be a string."
  });

  await server.close();
});

test("POST /policy/evaluate returns 400 when text is not a string", async () => {
  const server = buildServer({
    db: createInMemoryDb()
  });

  const response = await server.inject({
    method: "POST",
    url: "/policy/evaluate",
    payload: {
      text: 123
    }
  });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.json(), {
    message: "text must be a string."
  });

  await server.close();
});

test("POST /policy/evaluate returns 400 when boundaries is not a string array", async () => {
  const server = buildServer({
    db: createInMemoryDb()
  });

  const response = await server.inject({
    method: "POST",
    url: "/policy/evaluate",
    payload: {
      text: "我们今天聊聊政治",
      boundaries: [123]
    }
  });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.json(), {
    message: "boundaries must be an array of strings."
  });

  await server.close();
});
