import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is required to initialize the database.");
  process.exit(1);
}

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(currentDir, "schema.sql");
const schema = await readFile(schemaPath, "utf8");

const sql = postgres(connectionString);

try {
  await sql.unsafe(schema);
  console.log("Database schema applied successfully.");
} finally {
  await sql.end();
}
