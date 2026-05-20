from collections.abc import Iterable

from app.models import NormalizedMessage


def self_messages(
    persona_id: str, messages: Iterable[NormalizedMessage]
) -> list[NormalizedMessage]:
    return [
        message
        for message in messages
        if (
            message.senderRole == "user"
            and message.userId == persona_id
            and message.text.strip()
        )
    ]
