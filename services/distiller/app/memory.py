from collections.abc import Sequence

from app.models import (
    MemoryCard,
    NormalizedMessage,
    SelfProfileInput,
    ensure_normalized_score,
)


def build_memory_cards(
    persona_id: str,
    messages: Sequence[NormalizedMessage],
    self_profile: SelfProfileInput | None = None,
) -> list[MemoryCard]:
    if not messages:
        return []

    first = messages[0]
    evidence_refs = [message.messageId for message in messages[:2]]
    memories: list[MemoryCard] = [
        {
            "memoryId": f"{persona_id}-mem-1",
            "type": "value",
            "summary": "\u503e\u5411\u5148\u5b89\u629a\u60c5\u7eea\uff0c\u518d\u4e00\u6b65\u6b65\u5206\u6790\u95ee\u9898\u3002",
            "evidenceRefs": evidence_refs,
            "confidence": ensure_normalized_score(0.72),
            "validFrom": first.timestamp,
            "validTo": None,
            "tags": ["support_style", "calm"],
        }
    ]

    if self_profile:
        freeform_notes = self_profile.get("freeformNotes", "").strip()
        values = self_profile.get("values", "").strip()

        if freeform_notes or values:
            memories.append(
                {
                    "memoryId": f"{persona_id}-mem-self-profile",
                    "type": "value",
                    "summary": freeform_notes or values,
                    "evidenceRefs": evidence_refs,
                    "confidence": ensure_normalized_score(0.9),
                    "validFrom": first.timestamp,
                    "validTo": None,
                    "tags": ["self_profile", "manual_context"],
                }
            )

    return memories
