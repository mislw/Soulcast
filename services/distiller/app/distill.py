from collections.abc import Sequence
from datetime import datetime, timezone

from app.memory import build_memory_cards
from app.models import (
    NormalizedMessage,
    PersonaAssets,
    PersonaProfile,
    PersonaTone,
    SelfProfileInput,
    ensure_normalized_score,
)
from app.normalize import self_messages
from app.policy import default_policy


KNOWN_SIGNATURE_PHRASES = (
    "\u95ee\u9898\u4e0d\u5927",
    "\u6162\u6162\u6765",
    "\u5148\u522b\u6025",
    "\u4e00\u6b65\u6b65\u770b",
)


def _parse_sortable_timestamp(timestamp: str) -> datetime:
    parsed = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed


def build_persona_assets(
    persona_id: str,
    messages: Sequence[NormalizedMessage],
    self_profile: SelfProfileInput | None = None,
) -> PersonaAssets:
    own_messages = self_messages(persona_id, messages)
    sorted_messages = sorted(
        own_messages,
        key=lambda message: (
            _parse_sortable_timestamp(message.timestamp),
            message.messageId,
        ),
    )
    joined_text = "\n".join(message.text for message in sorted_messages)

    signature_phrases = [
        phrase for phrase in KNOWN_SIGNATURE_PHRASES if phrase in joined_text
    ]
    if not signature_phrases and sorted_messages:
        signature_phrases.append(sorted_messages[0].text[:8])

    policy = default_policy()
    tone: PersonaTone = {
        "warmth": ensure_normalized_score(0.75),
        "directness": ensure_normalized_score(0.55),
        "playfulness": ensure_normalized_score(0.2),
    }
    profile: PersonaProfile = {
        "personaId": persona_id,
        "version": 1,
        "tone": tone,
        "speechPatterns": [
            "\u53e3\u8bed\u5316",
            "\u5148\u5b89\u629a\u518d\u5206\u6790",
        ],
        "signaturePhrases": signature_phrases,
        "conversationHabits": [
            "\u504f\u597d\u77ed\u53e5\u56de\u5e94",
            "\u503e\u5411\u5206\u6b65\u9aa4\u8bf4\u660e",
        ],
        "boundaries": list(policy["boundaries"]),
        "name": None,
        "description": None,
    }

    if self_profile:
        _merge_self_profile(profile, policy, self_profile)

    return {
        "profile": profile,
        "memories": build_memory_cards(persona_id, sorted_messages, self_profile),
        "policy": policy,
    }


def _merge_self_profile(
    profile: PersonaProfile,
    policy: dict[str, list[str]],
    self_profile: SelfProfileInput,
) -> None:
    speaking_style = self_profile.get("speakingStyle", "").strip()
    values = self_profile.get("values", "").strip()
    response_patterns = self_profile.get("responsePatterns", "").strip()
    manual_boundaries = self_profile.get("boundaries", "").strip()
    freeform_notes = self_profile.get("freeformNotes", "").strip()

    if speaking_style:
        profile["speechPatterns"].append(speaking_style)

    if response_patterns:
        profile["conversationHabits"].append(response_patterns)

    if values:
        profile["conversationHabits"].append(f"\u5728\u610f\uff1a{values}")

    if manual_boundaries:
        profile["boundaries"].append(manual_boundaries)
        policy["boundaries"].append(manual_boundaries)

    description_parts = [part for part in [freeform_notes, values] if part]
    if description_parts:
        profile["description"] = " ".join(description_parts)
