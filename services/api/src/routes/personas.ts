import type { FastifyPluginAsync } from "fastify";

import type { ApiDb, PersonaRecord } from "../lib/db";

export interface PersonasRouteOptions {
  db: ApiDb;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function hasValidProfileShape(profile: unknown): profile is PersonaRecord["profile"] {
  if (!profile || typeof profile !== "object") {
    return false;
  }

  const candidate = profile as Record<string, unknown>;
  const tone = candidate.tone;

  return (
    typeof candidate.personaId === "string" &&
    typeof candidate.version === "number" &&
    !!tone &&
    typeof tone === "object" &&
    typeof (tone as Record<string, unknown>).warmth === "number" &&
    typeof (tone as Record<string, unknown>).directness === "number" &&
    typeof (tone as Record<string, unknown>).playfulness === "number" &&
    isStringArray(candidate.speechPatterns) &&
    isStringArray(candidate.signaturePhrases) &&
    isStringArray(candidate.conversationHabits) &&
    isStringArray(candidate.boundaries)
  );
}

function hasValidPolicyShape(policy: unknown): policy is PersonaRecord["policy"] {
  if (!policy || typeof policy !== "object") {
    return false;
  }

  return isStringArray((policy as Record<string, unknown>).boundaries);
}

function getConsistentProfile(persona: PersonaRecord) {
  if (!hasValidProfileShape(persona.profile)) {
    throw new Error("Persona profile shape mismatch.");
  }

  if (!hasValidPolicyShape(persona.policy)) {
    throw new Error("Persona policy shape mismatch.");
  }

  if (persona.id !== persona.profile.personaId) {
    throw new Error("Persona id mismatch.");
  }

  if (persona.version !== persona.profile.version) {
    throw new Error("Persona version mismatch.");
  }

  if (persona.policy.boundaries.join("\u0000") !== persona.profile.boundaries.join("\u0000")) {
    throw new Error("Persona boundaries mismatch.");
  }

  return persona.profile;
}

const personasRoutes: FastifyPluginAsync<PersonasRouteOptions> = async (app, options) => {
  app.get("/:id/profile", async (request, reply) => {
    const { id } = request.params as { id: string };
    const userIdHeader = request.headers["x-user-id"];
    const userId = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader;

    if (!userId) {
      return reply.code(401).send({
        message: "x-user-id header is required."
      });
    }

    const persona = await options.db.getPersonaProfile(id, userId);

    if (!persona) {
      return reply.code(404).send({
        message: `Persona ${id} not found.`
      });
    }

    try {
      return getConsistentProfile(persona);
    } catch {
      return reply.code(500).send({
        message: "Persona record is inconsistent."
      });
    }
  });
};

export default personasRoutes;
