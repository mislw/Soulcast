# API Contracts

## `GET /personas/:id/profile`

Returns the stored `PersonaProfile` for the authenticated owner.

Requirements:

- header `x-user-id` is required
- `:id` must belong to the same user

Responses:

- `200`: `PersonaProfile`
- `401`: missing `x-user-id`
- `404`: persona not found for that user
- `500`: inconsistent stored persona record

## `POST /chat/reply`

Request body:

```json
{
  "personaId": "user-1",
  "message": "Can you summarize how I usually talk?"
}
```

Response body:

```json
{
  "text": "I heard you: Can you summarize how I usually talk?",
  "emotion": "warm",
  "pacing": "medium",
  "styleTags": [],
  "memoryRefs": [],
  "safetyFlags": [],
  "confidence": 0.7
}
```

Guardrails:

- blocks violent instructions
- supports persona-specific boundaries such as no politics, no fake realtime claims, and no external impersonation

## `POST /policy/evaluate`

Request body:

```json
{
  "text": "I am with you right now.",
  "boundaries": ["不伪造实时近况"]
}
```

Returns whether the text is blocked plus matching `safetyFlags`.

## `DELETE /imports/:id`

Returns a minimal deletion confirmation payload for imported source data.

```json
{
  "deleted": true,
  "importId": "import_001"
}
```
