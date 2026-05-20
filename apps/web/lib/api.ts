import {
  asNormalizedScore,
  type PersonaAssets,
  type PersonaProfile,
  type PersonaResponse,
  type SelfProfileInput,
} from "@ta/shared";

const PERSONA_PREVIEW_STORAGE_PREFIX = "persona-preview:";
const PERSONA_TEMPLATE_STORAGE_PREFIX = "persona-template:";

export function createImportDraft() {
  return {
    personaId: "user-1",
    sourceText:
      "我：我其实很在意说话有没有边界感。\n朋友：那你希望数字分身学到什么？\n我：先学会怎么好好接住别人，再学会怎么清楚表达。",
    selfProfile: {
      speakingStyle: "我说话通常偏温和，先接住情绪，再给清晰但不过度铺陈的建议。",
      values: "我很在意真诚、边界感和清楚表达，不喜欢高高在上的说教感。",
      responsePatterns: "别人来问建议时，我会先帮他理清问题，再给出可执行的下一步。",
      boundaries: "不要把我写成攻击型、控制型，也不要伪造我现实中正在做什么。",
      freeformNotes:
        "如果只用一句话理解我：我是那种会认真听你说完，再温和地帮你把事情理顺的人。",
    },
  };
}

function buildFallbackPreview(
  personaId: string,
  selfProfile?: SelfProfileInput | null,
): {
  assets: PersonaAssets;
  response: PersonaResponse;
} {
  const profileBoundaries = [
    "信息不足时不要强行编造。",
    "保持支持感，但不要假装什么都能确定。",
  ];

  if (selfProfile?.boundaries.trim()) {
    profileBoundaries.push(selfProfile.boundaries.trim());
  }

  const conversationHabits = [
    "会先复述问题的重点，再给出下一步建议。",
    "更偏好短而清楚的表达，不喜欢过度绕弯。",
  ];

  if (selfProfile?.responsePatterns.trim()) {
    conversationHabits.push(selfProfile.responsePatterns.trim());
  }

  if (selfProfile?.values.trim()) {
    conversationHabits.push(`重视：${selfProfile.values.trim()}`);
  }

  const speechPatterns = [
    "先总结重点，再给建议。",
    "如果不确定，会把不确定说清楚。",
  ];

  if (selfProfile?.speakingStyle.trim()) {
    speechPatterns.push(selfProfile.speakingStyle.trim());
  }

  const description = selfProfile
    ? [selfProfile.freeformNotes, selfProfile.values]
        .filter((value) => value.trim().length > 0)
        .join(" ")
    : "这是一个偏温和、偏结构化的文字分身草稿，擅长把混乱的问题整理清楚。";

  const memories = selfProfile?.freeformNotes.trim()
    ? [
        {
          memoryId: `${personaId}-manual-memory`,
          type: "value" as const,
          summary: selfProfile.freeformNotes.trim(),
          evidenceRefs: ["manual-profile"],
          confidence: asNormalizedScore(0.9),
          validFrom: "2026-01-01T00:00:00.000Z",
          validTo: null,
          tags: ["self_profile", "manual_context"],
        },
      ]
    : [];

  return {
    assets: {
      profile: {
        personaId,
        version: 1,
        name: "你的温柔整理型分身",
        description,
        tone: {
          warmth: asNormalizedScore(0.76),
          directness: asNormalizedScore(0.62),
          playfulness: asNormalizedScore(0.18),
        },
        speechPatterns,
        signaturePhrases: ["我先帮你理一下", "我们先把重点拎出来"],
        conversationHabits,
        boundaries: profileBoundaries,
        defaultEmotion: "calm",
        defaultPacing: "short",
        systemPrompt: "用温和、清晰、有边界的方式回应，不确定就坦白。",
      },
      memories,
      policy: {
        boundaries: ["不伪造实时近况", "不冒充真人对外发言"].concat(
          selfProfile?.boundaries.trim() ? [selfProfile.boundaries.trim()] : [],
        ),
      },
    },
    response: {
      text: "我会尽量先接住你的情绪，再把问题理顺，最后给你一个能立刻执行的小建议。",
      emotion: "calm",
      pacing: "short",
      styleTags: ["structured", "gentle", "supportive"],
      memoryRefs: memories.map((memory) => memory.memoryId),
      safetyFlags: [],
      confidence: asNormalizedScore(0.84),
    },
  };
}

function getApiBaseUrl(): string | null {
  const rawValue =
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    null;

  if (!rawValue) {
    return null;
  }

  return rawValue.endsWith("/") ? rawValue.slice(0, -1) : rawValue;
}

async function safeJsonFetch<T>(input: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function profileToAssets(profile: PersonaProfile): PersonaAssets {
  return {
    profile,
    memories: [],
    policy: {
      boundaries: [...profile.boundaries],
    },
  };
}

export async function getPersonaPreview(
  personaId: string,
  sourceText?: string | null,
  selfProfile?: SelfProfileInput | null,
): Promise<{
  assets: PersonaAssets;
  response: PersonaResponse;
}> {
  const apiBaseUrl = getApiBaseUrl();

  if (apiBaseUrl && sourceText) {
    const imported = await safeJsonFetch<{ assets: PersonaAssets }>(
      `${apiBaseUrl}/imports/preview`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": personaId,
        },
        body: JSON.stringify({
          personaId,
          sourceText,
          selfProfile,
        }),
        cache: "no-store",
      },
    );

    if (imported) {
      return {
        assets: imported.assets,
        response: {
          text: "这份预览来自真实蒸馏链路。你可以继续进入聊天，验证这个分身在多轮对话里像不像你。",
          emotion: imported.assets.profile.defaultEmotion ?? "calm",
          pacing: imported.assets.profile.defaultPacing ?? "short",
          styleTags: ["live-import", "distilled"],
          memoryRefs: imported.assets.memories.map((memory) => memory.memoryId),
          safetyFlags: [],
          confidence: asNormalizedScore(0.88),
        },
      };
    }
  }

  if (apiBaseUrl) {
    const storedProfile = await safeJsonFetch<PersonaProfile>(
      `${apiBaseUrl}/personas/${personaId}/profile`,
      {
        headers: {
          "x-user-id": personaId,
        },
        cache: "no-store",
      },
    );

    if (storedProfile) {
      return {
        assets: profileToAssets(storedProfile),
        response: {
          text: "已经读取到最新保存的人格档案，你可以直接进入聊天页继续验证回复效果。",
          emotion: storedProfile.defaultEmotion ?? "calm",
          pacing: storedProfile.defaultPacing ?? "short",
          styleTags: ["stored-profile"],
          memoryRefs: [],
          safetyFlags: [],
          confidence: asNormalizedScore(0.78),
        },
      };
    }
  }

  return buildFallbackPreview(personaId, selfProfile);
}

export async function getChatPreview(personaId: string): Promise<{
  personaId: string;
  draftMessage: string;
  previewResponse: PersonaResponse;
  policyBoundaries: string[];
  history: {
    role: "user" | "assistant";
    body: string;
  }[];
}> {
  const draftMessage = "我最近总在自我怀疑，怎么才能慢慢稳住一点？";
  const apiBaseUrl = getApiBaseUrl();

  if (apiBaseUrl) {
    const [storedProfile, liveReply] = await Promise.all([
      safeJsonFetch<PersonaProfile>(`${apiBaseUrl}/personas/${personaId}/profile`, {
        headers: {
          "x-user-id": personaId,
        },
        cache: "no-store",
      }),
      safeJsonFetch<PersonaResponse>(`${apiBaseUrl}/chat/reply`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": personaId,
        },
        body: JSON.stringify({
          personaId,
          message: draftMessage,
        }),
        cache: "no-store",
      }),
    ]);

    if (storedProfile && liveReply) {
      const historyPayload = await safeJsonFetch<{
        messages: {
          role: "user" | "assistant";
          body: string;
        }[];
      }>(`${apiBaseUrl}/chat/history/${personaId}`, {
        headers: {
          "x-user-id": personaId,
        },
        cache: "no-store",
      });

      return {
        personaId,
        draftMessage,
        previewResponse: liveReply,
        policyBoundaries: [...storedProfile.boundaries],
        history: historyPayload?.messages ?? [],
      };
    }
  }

  const fallback = buildFallbackPreview(personaId);

  return {
    personaId,
    draftMessage,
    previewResponse: fallback.response,
    policyBoundaries: fallback.assets.policy.boundaries,
    history: [],
  };
}

export function getPersonaPreviewStorageKey(personaId: string): string {
  return `${PERSONA_PREVIEW_STORAGE_PREFIX}${personaId}`;
}

export function getPersonaTemplateStorageKey(personaId: string): string {
  return `${PERSONA_TEMPLATE_STORAGE_PREFIX}${personaId}`;
}
