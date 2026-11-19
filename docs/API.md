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

## `GET /api/decks`

The signed-in user's decks, newest first, each with its card count.

```json
{
  "decks": [
    {
      "id": "uuid",
      "name": "History",
      "language": "en",
      "cardCount": 40,
      "createdAt": "2026-11-18T10:00:00.000Z",
      "updatedAt": "2026-11-18T10:00:00.000Z"
    }
  ]
}
```

## `GET /api/decks/:id`

`200` with `{ "deck": <summary>, "cards": [{ "id", "term", "meaning", "position" }] }`, cards
ordered by position. The editor and the practice screen load a deck with this. It is not in the
issue list, but the frontend already calls it.

## `PATCH /api/decks/:id`

Body `{ "name": "New name" }`, validated like the name on create. `200` with the updated deck
summary.

## `DELETE /api/decks/:id`

Deletes the deck and its cards. `204` with no body.

## Ownership

All three `:id` routes check the owner. A deck that does not exist and a deck that belongs to
someone else both answer `404 not_found`, so an id is never confirmed. Nothing is changed or
deleted in that case. Without a session every route answers `401 unauthorized`.

## Cards

Ownership is checked through the parent deck. A card in a deck the caller does not own answers
`404 not_found` exactly like a card that does not exist, and nothing changes. Without a session
every route answers `401 unauthorized`. Bodies are validated with the same schemas as the import
(`createCardSchema`, `updateCardSchema`), so the limits are the ones in the table above.

Positions count from 0 and stay unique and gapless inside a deck after every write: adding or
moving a card shifts the ones after it, deleting one closes the gap. A position past the end
means last.

### `POST /api/decks/:id/cards`

```json
{ "term": "Hastings", "meaning": "Battle of 1066", "position": 2 }
```

`position` is optional and defaults to the end. `201` with the card `{ id, term, meaning,
position }`.

### `PATCH /api/cards/:id`

Any of `term`, `meaning` and `position`, at least one. `200` with the updated card.

### `DELETE /api/cards/:id`

`204` with no body.

# Practice results

## `POST /api/practice/ratings`

Records how a practice session went. The frontend does not call it yet; the shape below is the
agreed contract. Send ratings in batches, for example when a round ends or every few cards, not
one request per card.

```json
{
  "ratings": [
    { "cardId": "uuid", "knew": true },
    { "cardId": "uuid", "knew": false }
  ]
}
```

`200` with `{ "recorded": 2 }`. Each rating adds 1 to "times seen", adds 1 to "times known" when
`knew` is true and sets "last practised". The same card may appear more than once. At most 500
ratings per request.

Every card is checked through its parent deck's owner. If any card does not exist or belongs to
someone else the whole batch answers `404 not_found` and nothing is recorded. `400 invalid_input`
names the failing rating, for example `ratings.1.knew`. Without a session: `401 unauthorized`.

A failed request should not interrupt practice: keep the ratings and send them with the next
batch, or drop them. The storage for the counters is #28; until it exists the route answers
`503 storage_unavailable`.

# Limits and rate limiting

The numbers are in the [README](../README.md#limits) and in `lib/validation/limits.ts`.

| Status | Code                 | When                                                                    |
| ------ | -------------------- | ----------------------------------------------------------------------- |
| 413    | `too_large`          | The body is over the limit. It is not parsed and nothing is written     |
| 409    | `deck_limit_reached` | `POST /api/decks` when the user already has the maximum number of decks |
| 409    | `card_limit_reached` | `POST /api/decks/:id/cards` when the deck already has the maximum cards |
| 429    | `rate_limited`       | Too many writes by this user in the last minute                         |

`413` is decided from `Content-Length` and from the bytes actually received, so a client that
lies about the length or leaves it out is stopped as well.

`429` carries a `Retry-After` header with the number of seconds to wait. Rejected requests are
not counted, so waiting that long always works. All write routes (`POST`, `PATCH` and `DELETE`)
share one allowance per user; a request without a session is `401` and does not use it up.
Reads are not limited.

The limit checks for decks and cards belong inside the repository write (see `LimitReachedError`
in `lib/repositories/types.ts`), so two requests at once cannot both slip under a limit. The
Supabase adapter has to do the count and the insert in the same transaction.

The frontend already translates `too_large` and `rate_limited`. `deck_limit_reached` and
`card_limit_reached` have no message in `messages/*.json` yet, so the interface falls back to
its general error until they are added.
