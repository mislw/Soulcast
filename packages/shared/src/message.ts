export type SenderRole = "system" | "user" | "assistant" | "tool";

export type IsoDateTimeString = string;

export type JsonLikeValue =
  | string
  | number
  | boolean
  | null
  | JsonLikeValue[]
  | { [key: string]: JsonLikeValue };

export interface NormalizedMessageMeta {
  source: string;
  hasEmoji: boolean;
  [key: string]: JsonLikeValue;
}

export interface NormalizedMessage {
  messageId: string;
  userId: string;
  conversationId: string;
  senderRole: SenderRole;
  // ISO 8601 datetime string.
  timestamp: IsoDateTimeString;
  text: string;
  replyTo: string | null;
  meta: NormalizedMessageMeta;
}
