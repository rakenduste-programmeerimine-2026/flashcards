# API input validation

Every endpoint that writes decks or cards validates the body with the schemas in
`lib/validation/schemas.ts` through `parseBody(request, schema)`:

```ts
const parsed = await parseBody(request, createDeckSchema);
if (!parsed.ok) return parsed.response;
// parsed.data is trimmed and within the limits
```

## Error shape

`400` with the same `error` code as the auth endpoints, plus the failing fields. Translate the
codes, do not show them as they are.

```json
{
  "error": "invalid_input",
  "fields": { "name": "too_long", "cards.3.term": "required" }
}
```

Keys are field paths (`cards.3.term` is the term of the fourth card). A body that is not JSON or
not an object is `{ "body": "invalid_value" }`.

| Code            | Meaning                                |
| --------------- | -------------------------------------- |
| `required`      | Missing, empty or only whitespace      |
| `too_long`      | Longer than the limit                  |
| `too_many`      | More cards than one import may contain |
| `invalid_value` | Wrong type or not an allowed value     |

## Limits

Defined in `lib/validation/limits.ts`. These numbers are a team assumption.

| Field            | Limit        |
| ---------------- | ------------ |
| Deck name        | 1–100 chars  |
| Term             | 1–200 chars  |
| Meaning          | 1–1000 chars |
| Cards per import | 1–200        |
| Language         | `et` or `en` |

Strings are trimmed before they are checked.

# Decks

Data access goes through the repository interface in `lib/repositories/types.ts`. The Supabase
adapter (`lib/repositories/supabase.ts`) is a stub until the tables from #7 exist: the endpoints
answer `503 storage_unavailable` until then. Handlers live in `lib/api/handlers/` and are tested
against the in-memory repository in `lib/repositories/memory.ts`.

## `POST /api/decks`

Needs a session. The owner is the signed-in user; the body has no owner field.

```json
{
  "name": "History",
  "language": "en",
  "cards": [{ "term": "Hastings", "meaning": "Battle of 1066" }]
}
```

`201` with `{ "id": "uuid" }`. The deck and all its cards are written together or not at all, and
the cards keep their order as positions `0, 1, 2, ...`.

| Status | Code                  | When                                           |
| ------ | --------------------- | ---------------------------------------------- |
| 400    | `invalid_input`       | The body breaks the rules above, nothing saved |
| 401    | `unauthorized`        | No session, nothing saved                      |
| 500    | `server_error`        | The write failed, nothing saved                |
| 503    | `storage_unavailable` | The database is not connected                  |
