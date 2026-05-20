import type { IsoDateTimeString } from "./message";

export type PersonaEmotion =
  | "calm"
  | "warm"
  | "playful"
  | "serious";

export type PersonaPacing = "short" | "medium" | "long";

// Score from 0 to 1 inclusive.
export type NormalizedScore = number & {
  readonly __brand: "NormalizedScore";
};

export function asNormalizedScore(value: number): NormalizedScore {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError("NormalizedScore must be a finite number between 0 and 1.");
  }

  return value as NormalizedScore;
}

export interface PersonaTone {
  warmth: NormalizedScore;
  directness: NormalizedScore;
  playfulness: NormalizedScore;
}

export interface SelfProfileInput {
  speakingStyle: string;
  values: string;
  responsePatterns: string;
  boundaries: string;
  freeformNotes: string;
}

export interface PersonaProfile {
  personaId: string;
  version: number;
  tone: PersonaTone;
  speechPatterns: string[];
  signaturePhrases: string[];
  conversationHabits: string[];
  boundaries: string[];
  name?: string;
  description?: string;
  defaultEmotion?: PersonaEmotion;
  defaultPacing?: PersonaPacing;
  systemPrompt?: string;
}

export interface MemoryCard {
  memoryId: string;
  type: "preference" | "event" | "relationship" | "value";
  summary: string;
  evidenceRefs: string[];
  confidence: NormalizedScore;
  // ISO 8601 datetime string.
  validFrom: IsoDateTimeString;
  // ISO 8601 datetime string.
  validTo: IsoDateTimeString | null;
  tags: string[];
}

export interface PolicyAsset {
  boundaries: string[];
}

export interface PersonaAssets {
  profile: PersonaProfile;
  memories: MemoryCard[];
  policy: PolicyAsset;
}

export interface PersonaResponse {
  text: string;
  emotion: PersonaEmotion;
  pacing: PersonaPacing;
  styleTags: string[];
  memoryRefs: string[];
  safetyFlags: string[];
  confidence: NormalizedScore;
}
