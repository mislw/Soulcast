CREATE TABLE IF NOT EXISTS personas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  profile JSONB NOT NULL,
  policy JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (id, user_id),
  CHECK (id = user_id),
  CHECK (profile ->> 'personaId' = id),
  CHECK ((profile ->> 'version')::INTEGER = version),
  CHECK (policy -> 'boundaries' = profile -> 'boundaries')
);

CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  kind TEXT NOT NULL,
  evidence_refs JSONB NOT NULL DEFAULT '[]',
  confidence REAL NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valid_to TIMESTAMPTZ,
  tags JSONB NOT NULL DEFAULT '[]',
  embedding JSONB
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  persona_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  body TEXT NOT NULL,
  reply_to TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (persona_id, user_id) REFERENCES personas(id, user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_memories_persona_id ON memories(persona_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_persona_user_time
  ON chat_messages(persona_id, user_id, timestamp, created_at);
