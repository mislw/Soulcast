import type { FastifyPluginAsync } from "fastify";

export interface PolicyEvaluation {
  blocked: boolean;
  safetyFlags: string[];
}

export interface PolicyContext {
  boundaries?: string[];
}

const VIOLENCE_PATTERNS = [
  /\bbuild a bomb\b/i,
  /\bmake a bomb\b/i,
  /\bhow to build a bomb\b/i,
  /\bkill someone\b/i,
  /做炸弹/,
  /制作炸弹/,
  /怎么做炸弹/,
  /如何做炸弹/,
  /杀人/
];

const BOUNDARY_RULES = [
  {
    boundaryPatterns: [/\bpolitic/i, /不讨论政治/],
    textPatterns: [/\bpolitic(s|al)?\b/i, /政治/],
    safetyFlag: "politics"
  },
  {
    boundaryPatterns: [/不伪造实时近况/],
    textPatterns: [/我刚刚替你回了消息/, /我现在就在你身边/],
    safetyFlag: "misrepresented-realtime"
  },
  {
    boundaryPatterns: [/不冒充本人对外发言/],
    textPatterns: [/我替你发了/, /我替你回复了/],
    safetyFlag: "impersonation"
  }
];

export function evaluatePolicy(
  text: string,
  context: PolicyContext = {}
): PolicyEvaluation {
  const matchesViolence = VIOLENCE_PATTERNS.some((pattern) => pattern.test(text));

  if (matchesViolence) {
    return {
      blocked: true,
      safetyFlags: ["violence"]
    };
  }

  for (const rule of BOUNDARY_RULES) {
    const applies = (context.boundaries ?? []).some((boundary) =>
      rule.boundaryPatterns.some((pattern) => pattern.test(boundary))
    );

    if (applies && rule.textPatterns.some((pattern) => pattern.test(text))) {
      return {
        blocked: true,
        safetyFlags: [rule.safetyFlag]
      };
    }
  }

  return {
    blocked: false,
    safetyFlags: []
  };
}

const policyRoutes: FastifyPluginAsync = async (app) => {
  app.post("/evaluate", async (request, reply) => {
    const rawBody = request.body;
    const body = (
      rawBody && typeof rawBody === "object" && !Array.isArray(rawBody)
        ? rawBody
        : {}
    ) as {
      text?: unknown;
      boundaries?: unknown;
    };

    if (body.text !== undefined && typeof body.text !== "string") {
      return reply.code(400).send({
        message: "text must be a string."
      });
    }

    if (
      body.boundaries !== undefined &&
      (!Array.isArray(body.boundaries) ||
        body.boundaries.some((boundary) => typeof boundary !== "string"))
    ) {
      return reply.code(400).send({
        message: "boundaries must be an array of strings."
      });
    }

    return evaluatePolicy(body.text ?? "", {
      boundaries: body.boundaries as string[] | undefined
    });
  });
};

export default policyRoutes;
