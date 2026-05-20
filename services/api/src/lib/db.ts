import type { MemoryCard, PersonaAssets, PersonaProfile, PolicyAsset } from "@ta/shared";
import postgres from "postgres";

export interface PersonaRecord {
  id: string;
  userId: string;
  version: number;
  profile: PersonaProfile;
  policy: PolicyAsset;
  createdAt: string;
}

export interface ChatMessageRecord {
  id: string;
  personaId: string;
  userId: string;
  conversationId: string;
  role: "user" | "assistant";
  body: string;
  replyTo: string | null;
  timestamp: string;
  meta: Record<string, unknown>;
}

export interface ApiDb {
  getPersonaProfile(personaId: string, userId: string): Promise<PersonaRecord | null>;
  savePersonaAssets(personaId: string, userId: string, assets: PersonaAssets): Promise<PersonaRecord>;
  listChatMessages(personaId: string, userId: string): Promise<ChatMessageRecord[]>;
  saveChatMessages(messages: ChatMessageRecord[]): Promise<void>;
  close?(): Promise<void>;
}

export interface InMemoryDbSeed {
  personas?: PersonaRecord[];
  chatMessages?: ChatMessageRecord[];
}

interface PostgresPersonaRow {
  id: string;
  user_id: string;
  version: number;
  profile: PersonaProfile;
  policy: PolicyAsset;
  created_at: string | Date;
}

interface PostgresMemoryRow {
  id: string;
}

interface PostgresChatMessageRow {
  id: string;
  persona_id: string;
  user_id: string;
  conversation_id: string;
  role: "user" | "assistant";
  body: string;
  reply_to: string | null;
  timestamp: string | Date;
  meta: Record<string, unknown>;
}

export function createInMemoryDb(seed: InMemoryDbSeed = {}): ApiDb {
  const personas = new Map<string, PersonaRecord>();
  const chatMessages = new Map<string, ChatMessageRecord[]>();

  for (const persona of seed.personas ?? []) {
    personas.set(persona.id, persona);
  }
  for (const message of seed.chatMessages ?? []) {
    const key = `${message.personaId}:${message.userId}`;
    const existing = chatMessages.get(key) ?? [];
    existing.push(message);
    chatMessages.set(key, existing);
  }

  return {
    async getPersonaProfile(personaId, userId) {
      const persona = personas.get(personaId);

      if (!persona || persona.userId !== userId) {
        return null;
      }

      return persona;
    },
    async savePersonaAssets(personaId, userId, assets) {
      const record: PersonaRecord = {
        id: personaId,
        userId,
        version: assets.profile.version,
        profile: {
          ...assets.profile,
          personaId
        },
        policy: {
          boundaries: [...assets.policy.boundaries]
        },
        createdAt: new Date().toISOString()
      };

      personas.set(personaId, record);

      return record;
    },
    async listChatMessages(personaId, userId) {
      return [...(chatMessages.get(`${personaId}:${userId}`) ?? [])];
    },
    async saveChatMessages(messages) {
      for (const message of messages) {
        const key = `${message.personaId}:${message.userId}`;
        const existing = chatMessages.get(key) ?? [];
        existing.push(message);
        chatMessages.set(key, existing);
      }
    },
    async close() {
      // No resources to release for the in-memory test db.
    }
  };
}

export function createPostgresDb(connectionString: string): ApiDb {
  const sql = postgres(connectionString);

  return {
    async getPersonaProfile(personaId, userId) {
      const rows = await sql<PostgresPersonaRow[]>`
        SELECT id, user_id, version, profile, policy, created_at
        FROM personas
        WHERE id = ${personaId} AND user_id = ${userId}
        LIMIT 1
      `;
      const row = rows[0];

      if (!row) {
        return null;
      }

      return {
        id: row.id,
        userId: row.user_id,
        version: row.version,
        profile: row.profile,
        policy: row.policy,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
      };
    },
    async savePersonaAssets(personaId, userId, assets) {
      const insertedRows = await sql<PostgresPersonaRow[]>`
        INSERT INTO personas (id, user_id, version, profile, policy)
        VALUES (
          ${personaId},
          ${userId},
          ${assets.profile.version},
          ${sql.json({
            ...assets.profile,
            personaId
          })},
          ${sql.json({
            boundaries: [...assets.policy.boundaries]
          })}
        )
        ON CONFLICT (id, user_id)
        DO UPDATE SET
          version = EXCLUDED.version,
          profile = EXCLUDED.profile,
          policy = EXCLUDED.policy
        RETURNING id, user_id, version, profile, policy, created_at
      `;
      const inserted = insertedRows[0];

      await sql`
        DELETE FROM memories
        WHERE persona_id = ${personaId}
      `;

      if (assets.memories.length > 0) {
        for (const memory of assets.memories) {
          await insertMemory(sql, personaId, memory);
        }
      }

      return {
        id: inserted.id,
        userId: inserted.user_id,
        version: inserted.version,
        profile: inserted.profile,
        policy: inserted.policy,
        createdAt:
          inserted.created_at instanceof Date
            ? inserted.created_at.toISOString()
            : inserted.created_at
      };
    },
    async listChatMessages(personaId, userId) {
      const rows = await sql<PostgresChatMessageRow[]>`
        SELECT id, persona_id, user_id, conversation_id, role, body, reply_to, timestamp, meta
        FROM chat_messages
        WHERE persona_id = ${personaId} AND user_id = ${userId}
        ORDER BY timestamp ASC, created_at ASC
      `;

      return rows.map((row) => ({
        id: row.id,
        personaId: row.persona_id,
        userId: row.user_id,
        conversationId: row.conversation_id,
        role: row.role,
        body: row.body,
        replyTo: row.reply_to,
        timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : row.timestamp,
        meta: row.meta
      }));
    },
    async saveChatMessages(messages) {
      for (const message of messages) {
        await sql`
          INSERT INTO chat_messages (
            id,
            persona_id,
            user_id,
            conversation_id,
            role,
            body,
            reply_to,
            timestamp,
            meta
          )
          VALUES (
            ${message.id},
            ${message.personaId},
            ${message.userId},
            ${message.conversationId},
            ${message.role},
            ${message.body},
            ${message.replyTo},
            ${message.timestamp},
            ${sql.json(message.meta)}
          )
        `;
      }
    },
    async close() {
      await sql.end();
    }
  };
}

async function insertMemory(
  sql: postgres.Sql,
  personaId: string,
  memory: MemoryCard
): Promise<PostgresMemoryRow[]> {
  return sql<PostgresMemoryRow[]>`
    INSERT INTO memories (
      id,
      persona_id,
      summary,
      kind,
      confidence,
      tags
    )
    VALUES (
      ${memory.memoryId},
      ${personaId},
      ${memory.summary},
      ${memory.type},
      ${memory.confidence},
      ${sql.json(memory.tags)}
    )
  `;
}
