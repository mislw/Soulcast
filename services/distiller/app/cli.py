from __future__ import annotations

import json
import sys

from app.distill import build_persona_assets
from app.models import NormalizedMessage


def _read_payload() -> dict[str, object]:
    raw = sys.stdin.read()
    if not raw.strip():
        raise ValueError("Expected JSON payload on stdin.")

    payload = json.loads(raw)
    if not isinstance(payload, dict):
        raise ValueError("CLI payload must be a JSON object.")

    return payload


def main() -> int:
    if hasattr(sys.stdin, "reconfigure"):
        sys.stdin.reconfigure(encoding="utf-8")
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    payload = _read_payload()
    persona_id = payload.get("personaId")
    raw_messages = payload.get("messages")
    raw_self_profile = payload.get("selfProfile")

    if not isinstance(persona_id, str):
        raise ValueError("personaId must be a string.")
    if not isinstance(raw_messages, list):
        raise ValueError("messages must be an array.")
    if raw_self_profile is not None and not isinstance(raw_self_profile, dict):
        raise ValueError("selfProfile must be an object.")

    messages = [NormalizedMessage(**message) for message in raw_messages]
    assets = build_persona_assets(persona_id, messages, raw_self_profile)
    json.dump(assets, sys.stdout, ensure_ascii=False)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
