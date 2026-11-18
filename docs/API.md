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
