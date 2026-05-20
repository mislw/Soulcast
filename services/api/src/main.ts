import { buildServer } from "./server";

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3001);

async function main() {
  const server = buildServer();

  try {
    await server.listen({ host, port });
    server.log.info(`API listening on http://${host}:${port}`);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

void main();
