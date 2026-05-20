import type { PersonaAssets, SelfProfileInput } from "@ta/shared";

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NormalizedMessage } from "@ta/shared";

export interface DistillerInput {
  personaId: string;
  messages: NormalizedMessage[];
  selfProfile?: SelfProfileInput;
}

export type DistillerRunner = (input: DistillerInput) => Promise<PersonaAssets>;

const currentFilePath = fileURLToPath(import.meta.url);
const apiRoot = path.resolve(path.dirname(currentFilePath), "..", "..");
const defaultDistillerWorkdir = path.resolve(apiRoot, "..", "distiller");

export function createPythonDistillerRunner(): DistillerRunner {
  return async (input) => {
    const payload = JSON.stringify(input);
    const pythonCommand = process.env.PYTHON_BIN || "python";
    const workdir = process.env.DISTILLER_WORKDIR || defaultDistillerWorkdir;

    return new Promise<PersonaAssets>((resolve, reject) => {
      const child = spawn(
        pythonCommand,
        ["-m", "app.cli"],
        {
          cwd: workdir,
          env: {
            ...process.env,
            PYTHONIOENCODING: "utf-8",
            PYTHONUTF8: "1"
          },
          stdio: ["pipe", "pipe", "pipe"]
        }
      );

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk: Buffer | string) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk: Buffer | string) => {
        stderr += chunk.toString();
      });
      child.on("error", (error) => {
        reject(error);
      });
      child.on("close", (code) => {
        if (code !== 0) {
          reject(
            new Error(
              `Distiller process failed with code ${code ?? "unknown"}: ${stderr.trim()}`
            )
          );
          return;
        }

        try {
          resolve(JSON.parse(stdout) as PersonaAssets);
        } catch (error) {
          reject(
            new Error(
              `Distiller returned invalid JSON: ${
                error instanceof Error ? error.message : String(error)
              }`
            )
          );
        }
      });

      child.stdin.write(payload);
      child.stdin.end();
    });
  };
}
