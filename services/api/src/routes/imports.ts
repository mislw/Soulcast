import type { FastifyPluginAsync } from "fastify";

import type {
  NormalizedMessage,
  PersonaAssets,
  SelfProfileInput,
} from "@ta/shared";

import type { ApiDb } from "../lib/db";
import type { DistillerRunner } from "../lib/distiller";

export interface DeleteImportedDataResult {
  deleted: boolean;
  importId: string;
}

export interface ImportPreviewRequestBody {
  personaId?: unknown;
  sourceText?: unknown;
  selfProfile?: unknown;
}

export interface ImportsRouteOptions {
  db: ApiDb;
  distiller: DistillerRunner;
}

export async function deleteImportedData(
  importId: string,
): Promise<DeleteImportedDataResult> {
  return {
    deleted: true,
    importId,
  };
}

export function normalizeSourceText(
  personaId: string,
  sourceText: string,
): NormalizedMessage[] {
  const wechatMessages = parseWechatExport(personaId, sourceText);

  if (wechatMessages.length > 0) {
    return wechatMessages;
  }

  const lines = sourceText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const messages: NormalizedMessage[] = [];

  let primarySpeaker: string | null = null;

  for (const [index, rawLine] of lines.entries()) {
    const match = rawLine.match(/^([^:]+):\s*(.+)$/);
    const speaker = match?.[1]?.trim() || null;
    const text = match?.[2]?.trim() || rawLine;

    if (!primarySpeaker && speaker) {
      primarySpeaker = speaker;
    }

    const senderRole =
      !speaker || speaker === primarySpeaker ? "user" : "assistant";

    messages.push({
      messageId: `msg-${index + 1}`,
      userId: personaId,
      conversationId: `${personaId}-import-preview`,
      senderRole,
      timestamp: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(),
      text,
      replyTo: index > 0 ? `msg-${index}` : null,
      meta: {
        source: "manual",
        hasEmoji: /[\u{1F300}-\u{1FAFF}]/u.test(text),
        speaker: speaker ?? "unknown"
      }
    });
  }

  return messages;
}

function parseWechatExport(
  personaId: string,
  sourceText: string,
): NormalizedMessage[] {
  const lines = sourceText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const messages: NormalizedMessage[] = [];
  let primarySpeaker: string | null = null;
  let currentHeader:
    | {
        speaker: string;
        timestamp: string;
      }
    | null = null;
  let currentBody: string[] = [];

  function parseHeader(
    line: string,
  ): {
    speaker: string;
    timestamp: string;
    inlineText?: string;
  } | null {
    const directHeaderMatch = line.match(
      /^(\d{4}[-/]\d{1,2}[-/]\d{1,2})\s+(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)$/,
    );

    if (directHeaderMatch) {
      const [, datePart, timePart, speakerAndMaybeText] = directHeaderMatch;
      const inlineSplit = speakerAndMaybeText.match(/^([^:：]+)[:：]\s*(.+)$/);

      return {
        speaker: (inlineSplit?.[1] ?? speakerAndMaybeText).trim(),
        timestamp: `${datePart.replace(/\//g, "-")}T${timePart}`,
        inlineText: inlineSplit?.[2]?.trim(),
      };
    }

    const bracketHeaderMatch = line.match(
      /^\[(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)\]\s+(.+)$/,
    );

    if (bracketHeaderMatch) {
      const [, dateTimePart, speakerAndMaybeText] = bracketHeaderMatch;
      const [datePart, timePart] = dateTimePart.replace(/\//g, "-").split(/\s+/, 2);
      const inlineSplit = speakerAndMaybeText.match(/^([^:：]+)[:：]\s*(.+)$/);

      return {
        speaker: (inlineSplit?.[1] ?? speakerAndMaybeText).trim(),
        timestamp: `${datePart}T${timePart}`,
        inlineText: inlineSplit?.[2]?.trim(),
      };
    }

    return null;
  }

  function flushCurrent() {
    if (!currentHeader || currentBody.length === 0) {
      return;
    }

    if (!primarySpeaker) {
      primarySpeaker = currentHeader.speaker;
    }

    const messageIndex = messages.length + 1;
    const senderRole =
      currentHeader.speaker === primarySpeaker ? "user" : "assistant";
    const text = currentBody.join("\n");

    messages.push({
      messageId: `msg-${messageIndex}`,
      userId: personaId,
      conversationId: `${personaId}-wechat-import`,
      senderRole,
      timestamp: currentHeader.timestamp,
      text,
      replyTo: messageIndex > 1 ? `msg-${messageIndex - 1}` : null,
      meta: {
        source: "wechat",
        hasEmoji: /[\u{1F300}-\u{1FAFF}]/u.test(text),
        speaker: currentHeader.speaker
      }
    });
  }

  for (const line of lines) {
    const header = parseHeader(line);

    if (header) {
      flushCurrent();
      currentHeader = {
        speaker: header.speaker,
        timestamp: header.timestamp
      };
      currentBody = header.inlineText ? [header.inlineText] : [];
      continue;
    }

    if (currentHeader) {
      currentBody.push(line);
    }
  }

  flushCurrent();

  return messages;
}

export async function buildImportPreview(
  db: ApiDb,
  distiller: DistillerRunner,
  personaId: string,
  userId: string,
  sourceText: string,
  selfProfile?: SelfProfileInput,
): Promise<PersonaAssets> {
  const messages = normalizeSourceText(personaId, sourceText);
  const assets = await distiller({
    personaId,
    messages,
    selfProfile,
  });

  await db.savePersonaAssets(personaId, userId, assets);

  return assets;
}

const importsRoutes: FastifyPluginAsync<ImportsRouteOptions> = async (app, options) => {
  app.post("/preview", async (request, reply) => {
    const rawBody = request.body;
    const body = (
      rawBody && typeof rawBody === "object" && !Array.isArray(rawBody)
        ? rawBody
        : {}
    ) as ImportPreviewRequestBody;
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

    if (body.personaId !== userId) {
      return reply.code(403).send({
        message: "personaId must match x-user-id for self-owned imports."
      });
    }

    if (typeof body.sourceText !== "string" || body.sourceText.trim().length === 0) {
      return reply.code(400).send({
        message: "sourceText must be a non-empty string."
      });
    }

    let selfProfile: SelfProfileInput | undefined;

    if (body.selfProfile !== undefined) {
      const candidate = body.selfProfile;

      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
        return reply.code(400).send({
          message: "selfProfile must be an object."
        });
      }

      const fields = candidate as Record<string, unknown>;
      const speakingStyle = fields.speakingStyle;
      const values = fields.values;
      const responsePatterns = fields.responsePatterns;
      const boundaries = fields.boundaries;
      const freeformNotes = fields.freeformNotes;

      if (
        typeof speakingStyle !== "string" ||
        typeof values !== "string" ||
        typeof responsePatterns !== "string" ||
        typeof boundaries !== "string" ||
        typeof freeformNotes !== "string"
      ) {
        return reply.code(400).send({
          message: "selfProfile fields must all be strings."
        });
      }

      selfProfile = {
        speakingStyle,
        values,
        responsePatterns,
        boundaries,
        freeformNotes
      };
    }

    try {
      const assets = await buildImportPreview(
        options.db,
        options.distiller,
        body.personaId,
        userId,
        body.sourceText,
        selfProfile
      );

      return {
        assets
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        message: "Failed to build import preview."
      });
    }
  });

  app.delete("/:id", async (request, reply) => {
    const params = request.params as { id?: string };

    if (typeof params.id !== "string" || params.id.length === 0) {
      return reply.code(400).send({
        message: "import id is required.",
      });
    }

    return deleteImportedData(params.id);
  });
};

export default importsRoutes;
