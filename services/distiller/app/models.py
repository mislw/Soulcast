from dataclasses import dataclass
import math
from typing import Literal, TypedDict


SenderRole = Literal["system", "user", "assistant", "tool"]
JsonLikeValue = (
    str | int | float | bool | None | list["JsonLikeValue"] | dict[str, "JsonLikeValue"]
)


NormalizedMessageMeta = dict[str, JsonLikeValue]


@dataclass(slots=True)
class NormalizedMessage:
    messageId: str
    userId: str
    conversationId: str
    senderRole: SenderRole
    timestamp: str
    text: str
    replyTo: str | None
    meta: NormalizedMessageMeta

    def __post_init__(self) -> None:
        source = self.meta.get("source")
        has_emoji = self.meta.get("hasEmoji")

        if not isinstance(source, str):
            raise ValueError("Normalized message meta requires a string source.")
        if not isinstance(has_emoji, bool):
            raise ValueError("Normalized message meta requires a boolean hasEmoji.")


class PersonaTone(TypedDict):
    warmth: float
    directness: float
    playfulness: float


class SelfProfileInput(TypedDict):
    speakingStyle: str
    values: str
    responsePatterns: str
    boundaries: str
    freeformNotes: str


class PersonaProfile(TypedDict):
    personaId: str
    version: int
    tone: PersonaTone
    speechPatterns: list[str]
    signaturePhrases: list[str]
    conversationHabits: list[str]
    boundaries: list[str]
    name: str | None
    description: str | None


class MemoryCard(TypedDict):
    memoryId: str
    type: Literal["preference", "event", "relationship", "value"]
    summary: str
    evidenceRefs: list[str]
    confidence: float
    validFrom: str
    validTo: str | None
    tags: list[str]


class PolicyAsset(TypedDict):
    boundaries: list[str]


class PersonaAssets(TypedDict):
    profile: PersonaProfile
    memories: list[MemoryCard]
    policy: PolicyAsset


def ensure_normalized_score(value: float) -> float:
    if not math.isfinite(value) or value < 0 or value > 1:
        raise ValueError("Normalized score must be a finite number between 0 and 1.")

    return value
