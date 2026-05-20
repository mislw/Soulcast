import test from "node:test";
import assert from "node:assert/strict";

import { asNormalizedScore, type PersonaProfile } from "@ta/shared";
import { buildServer } from "../src/server";

function createProfile(overrides: Partial<PersonaProfile> = {}): PersonaProfile {
  return {
    personaId: "user-1",
    version: 3,
    tone: {
      warmth: asNormalizedScore(0.8),
      directness: asNormalizedScore(0.6),
      playfulness: asNormalizedScore(0.2)
    },
    speechPatterns: ["uses short sentences"],
    signaturePhrases: ["let's keep it simple"],
    conversationHabits: ["checks assumptions out loud"],
    boundaries: ["does not pretend to know missing facts"],
    name: "Mina",
    description: "A practical and thoughtful assistant.",
    defaultEmotion: "warm",
    defaultPacing: "medium",
    systemPrompt: "Be concise and transparent.",
    ...overrides
  };
}

test("GET /personas/:id/profile returns the persona profile", async () => {
  const expectedProfile = createProfile();
  let seenUserId: string | null = null;

  const server = buildServer({
    db: {
      async getPersonaProfile(personaId, userId) {
        seenUserId = userId;

        if (personaId !== expectedProfile.personaId || userId !== "user-1") {
          return null;
        }

        return {
          id: expectedProfile.personaId,
          userId: expectedProfile.personaId,
          version: expectedProfile.version,
          profile: expectedProfile,
          policy: {
            boundaries: expectedProfile.boundaries
          },
          createdAt: "2026-05-19T00:00:00Z"
        };
      }
    }
  });

  const response = await server.inject({
    method: "GET",
    url: `/personas/${expectedProfile.personaId}/profile`,
    headers: {
      "x-user-id": expectedProfile.personaId
    }
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), expectedProfile);
  assert.equal(seenUserId, expectedProfile.personaId);

  await server.close();
});

test("buildServer throws when db is not provided", () => {
  assert.throws(
    () => buildServer(),
    /buildServer requires an explicit db instance\./
  );
});

test("GET /personas/:id/profile returns an error when stored persona id drifts from profile.personaId", async () => {
  const profile = createProfile({
    personaId: "different-user"
  });

  const server = buildServer({
    db: {
      async getPersonaProfile() {
        return {
          id: "record-user",
          userId: "record-user",
          version: profile.version,
          profile,
          policy: {
            boundaries: profile.boundaries
          },
          createdAt: "2026-05-19T00:00:00Z"
        };
      }
    }
  });

  const response = await server.inject({
    method: "GET",
    url: "/personas/record-user/profile",
    headers: {
      "x-user-id": "record-user"
    }
  });

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.json(), {
    message: "Persona record is inconsistent."
  });

  await server.close();
});

test("GET /personas/:id/profile rejects requests without x-user-id", async () => {
  const server = buildServer({
    db: {
      async getPersonaProfile() {
        throw new Error("db should not be queried without user identity");
      }
    }
  });

  const response = await server.inject({
    method: "GET",
    url: "/personas/user-1/profile"
  });

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.json(), {
    message: "x-user-id header is required."
  });

  await server.close();
});

test("GET /personas/:id/profile does not return a profile for a different user", async () => {
  const profile = createProfile({
    personaId: "owner-user"
  });

  const server = buildServer({
    db: {
      async getPersonaProfile(personaId, userId) {
        if (personaId === profile.personaId && userId === profile.personaId) {
          return {
            id: profile.personaId,
            userId: profile.personaId,
            version: profile.version,
            profile,
            policy: {
              boundaries: profile.boundaries
            },
            createdAt: "2026-05-19T00:00:00Z"
          };
        }

        return null;
      }
    }
  });

  const response = await server.inject({
    method: "GET",
    url: `/personas/${profile.personaId}/profile`,
    headers: {
      "x-user-id": "other-user"
    }
  });

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.json(), {
    message: `Persona ${profile.personaId} not found.`
  });

  await server.close();
});

test("buildServer closes the db when the server shuts down", async () => {
  let closeCalls = 0;

  const server = buildServer({
    db: {
      async getPersonaProfile() {
        return null;
      },
      async close() {
        closeCalls += 1;
      }
    }
  });

  await server.close();

  assert.equal(closeCalls, 1);
});
