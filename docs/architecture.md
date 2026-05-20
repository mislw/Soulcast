# Architecture

## Overview

This MVP is split into four layers:

- `apps/web`: onboarding, persona review, and chat preview screens
- `services/api`: HTTP contracts, policy enforcement, and persona access
- `services/distiller`: Python worker that converts normalized chat messages into persona assets
- `packages/shared`: stable message and persona contracts shared across web, API, and worker outputs

## Data Flow

1. A user provides their own exported chat history.
2. The distiller normalizes messages and produces:
   - `profile`
   - `memories`
   - `policy`
3. The API persists and serves persona records scoped to the owning user.
4. The chat route retrieves persona assets and applies policy checks before returning a `PersonaResponse`.
5. The web app renders import, review, and chat states against the shared contracts.

## Extension Points

- `PersonaResponse` already carries `emotion`, `pacing`, and `styleTags` for later voice and avatar adapters.
- Persona assets stay storage-oriented so a future TTS or avatar service can consume the same core persona state without changing upstream distillation logic.
