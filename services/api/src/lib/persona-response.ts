import {
  asNormalizedScore,
  type PersonaProfile,
  type PersonaResponse
} from "@ta/shared";

export interface BuildPersonaResponseInput {
  text: string;
  profile?: PersonaProfile;
  styleTags?: string[];
  memoryRefs?: string[];
  safetyFlags?: string[];
  confidence?: PersonaResponse["confidence"];
}

export function buildPersonaResponse(
  input: BuildPersonaResponseInput
): PersonaResponse {
  return {
    text: input.text,
    emotion: input.profile?.defaultEmotion ?? "calm",
    pacing: input.profile?.defaultPacing ?? "medium",
    styleTags: input.styleTags ?? [],
    memoryRefs: input.memoryRefs ?? [],
    safetyFlags: input.safetyFlags ?? [],
    confidence: input.confidence ?? asNormalizedScore(0.7)
  };
}
