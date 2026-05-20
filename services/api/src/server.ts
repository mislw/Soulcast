import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";

import { createPostgresDb, type ApiDb } from "./lib/db";
import {
  createPythonDistillerRunner,
  type DistillerRunner,
} from "./lib/distiller";
import chatRoutes from "./routes/chat";
import importsRoutes from "./routes/imports";
import personasRoutes from "./routes/personas";
import policyRoutes from "./routes/policy";

export interface BuildServerOptions {
  db?: ApiDb;
  distiller?: DistillerRunner;
}

export function buildServer(options: BuildServerOptions = {}): FastifyInstance {
  const db = options.db ?? (
    process.env.DATABASE_URL
      ? createPostgresDb(process.env.DATABASE_URL)
      : undefined
  );

  if (!db) {
    throw new Error("buildServer requires an explicit db instance.");
  }

  const distiller = options.distiller ?? createPythonDistillerRunner();

  const app = Fastify();

  const rawCorsOrigins = process.env.CORS_ORIGIN ?? process.env.WEB_ORIGIN ?? "";
  const allowedOrigins = rawCorsOrigins
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  app.register(cors, {
    origin: allowedOrigins.length === 0 ? true : allowedOrigins,
    allowedHeaders: ["content-type", "x-user-id"],
    methods: ["GET", "POST", "DELETE", "OPTIONS"]
  });

  app.addHook("onClose", async () => {
    await db.close?.();
  });

  app.register(importsRoutes, { prefix: "/imports", db, distiller });
  app.register(personasRoutes, { prefix: "/personas", db });
  app.register(chatRoutes, { prefix: "/chat", db });
  app.register(policyRoutes, { prefix: "/policy" });

  return app;
}
