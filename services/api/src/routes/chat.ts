import { asNormalizedScore } from "@ta/shared";
import type { FastifyPluginAsync } from "fastify";
import { randomUUID } from "node:crypto";

import type { ApiDb, ChatMessageRecord } from "../lib/db";
import { buildPersonaResponse } from "../lib/persona-response";
import { evaluatePolicy } from "./policy";

export interface ChatReplyRequestBody {
  message?: unknown;
  personaId?: unknown;
}

export interface ChatRoutesOptions {
  db: ApiDb;
}

const chatRoutes: FastifyPluginAsync<ChatRoutesOptions> = async (app, options) => {
  app.get("/history/:personaId", async (request, reply) => {
    const { personaId } = request.params as { personaId: string };
    const userIdHeader = request.headers["x-user-id"];
    const userId = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader;

    if (!userId) {
      return reply.code(401).send({
        message: "x-user-id header is required."
      });
    }

    const messages = await options.db.listChatMessages(personaId, userId);

    return {
      messages
    };
  });

  app.post("/reply", async (request, reply) => {
    const rawBody = request.body;
    const body = (
      rawBody && typeof rawBody === "object" && !Array.isArray(rawBody)
        ? rawBody
      : {}
    ) as ChatReplyRequestBody;
    const userIdHeader = request.headers["x-user-id"];
    const userId = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader;

    if (!userId) {
      return reply.code(401).send({
        message: "x-user-id header is required."
      });
    }

    if (typeof body.personaId !== "string") {
      return reply.code(400).send({
        message: "personaId must be a string."
      });
    }

    if (typeof body.message !== "string") {
      return reply.code(400).send({
        message: "message must be a string."
      });
    }

    const persona = await options.db.getPersonaProfile(body.personaId, userId);

    if (!persona) {
      return reply.code(404).send({
        message: `Persona ${body.personaId} not found.`
      });
    }

    const message = body.message;
    const policyContext = {
      boundaries: persona.policy.boundaries
    };
    const evaluation = evaluatePolicy(message, policyContext);

    if (evaluation.blocked) {
      return buildPersonaResponse({
        text: "I can't help with that. I can help with a safer alternative.",
        profile: persona.profile,
        safetyFlags: evaluation.safetyFlags,
        confidence: asNormalizedScore(0.2)
      });
    }

    const draftText = message ? `I heard you: ${message}` : "How can I help?";
    const responseText = draftText;
    const outputEvaluation = evaluatePolicy(responseText, policyContext);

    if (outputEvaluation.blocked) {
      return buildPersonaResponse({
        text: "I can't help with that. I can help with a safer alternative.",
        profile: persona.profile,
        safetyFlags: outputEvaluation.safetyFlags,
        confidence: asNormalizedScore(0.2)
      });
    }

    const personaResponse = buildPersonaResponse({
      text: responseText,
      profile: persona.profile,
      confidence: asNormalizedScore(0.7)
    });

    const conversationId = `${body.personaId}-default`;
    const userMessageId = randomUUID();
    const assistantMessageId = randomUUID();
    const timestamp = new Date().toISOString();
    const messagesToSave: ChatMessageRecord[] = [
      {
        id: userMessageId,
        personaId: body.personaId,
        userId,
        conversationId,
        role: "user",
        body: message,
        replyTo: null,
        timestamp,
        meta: {
          source: "chat-ui"
        }
      },
      {
        id: assistantMessageId,
        personaId: body.personaId,
        userId,
        conversationId,
        role: "assistant",
        body: personaResponse.text,
        replyTo: userMessageId,
        timestamp,
        meta: {
          emotion: personaResponse.emotion,
          pacing: personaResponse.pacing
        }
      }
    ];

    await options.db.saveChatMessages(messagesToSave);

    return personaResponse;
  });
};

export default chatRoutes;
