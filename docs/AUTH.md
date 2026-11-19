# Auth API

Email and password sign-in with Supabase. The session lives in cookies that the server sets, so
the frontend only calls these endpoints from the same origin and never handles a token.

There is no sign-up endpoint yet. Create test users as described under
[Testing without a UI](#testing-without-a-ui).

## Endpoints

### `POST /api/auth/sign-in`

```json
{ "email": "student@example.com", "password": "...", "next": "/decks/123" }
```

`next` is optional. `200` sets the session cookies:

```json
{
  "user": { "id": "uuid", "email": "student@example.com" },
  "next": "/decks/123"
}
```

Navigate to the returned `next`, not the one you sent. Anything other than a same-site relative
path comes back as `"/"`.

### `POST /api/auth/sign-out`

`204` with no body. Calling it without a session is not an error.

### `GET /api/auth/me`

`200`:

```json
{ "user": { "id": "uuid", "email": "student@example.com" } }
```

## Errors

Every error has the same shape. The codes are stable, so translate them by code and do not show
them to the user as they are.

```json
{ "error": "invalid_credentials" }
```

| Status | Code                  | When                                                 |
| ------ | --------------------- | ---------------------------------------------------- |
| 400    | `invalid_input`       | The body is not JSON, or a field is missing or empty |
| 401    | `invalid_credentials` | Sign-in failed                                       |
| 401    | `unauthorized`        | The endpoint needs a session and there is none       |
| 429    | `rate_limited`        | Supabase is limiting requests                        |
| 503    | `auth_unavailable`    | Supabase cannot be reached or is not configured      |

## Protected pages

`/decks` and everything under it need a session. All other pages are public, including the prompt
page. A signed-out visitor is redirected, with the path they wanted in `next`:

```
GET /decks/123?tab=cards
307 Location: /sign-in?next=%2Fdecks%2F123%3Ftab%3Dcards
```

The `/sign-in` page reads `next` and passes it on to `POST /api/auth/sign-in`.

API routes are never redirected. They answer with JSON.

## Protecting a route handler

Every write endpoint starts with `requireUser()`:

```ts
import { requireUser } from "@/lib/auth/require-user";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  // auth.user, and auth.supabase for queries as this user
}
```

## Configuration

`.env.local` needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Without them the
app still runs: public pages open, `/decks` redirects to `/sign-in` and `/api/auth/*` answers `503`.

For the local stack, `npx supabase status -o env` prints the API URL and the keys. Use the anon key,
or the publishable key if that is what the CLI shows. Never use the service role or secret key here,
because `NEXT_PUBLIC_` values reach the browser.

## Testing without a UI

With the local stack running (`npx supabase start`) and `npm run dev` started. The commands are for
Git Bash, because PowerShell 5.1 strips the quotes from JSON passed to `curl.exe`.

Create a user in Studio (http://localhost:54323, Authentication, Add user) or through Supabase's
auth API. `$URL` and `$ANON` are the values from `.env.local`:

```bash
curl -X POST "$URL/auth/v1/signup" -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test-password-123"}'
```

Then:

```bash
# signed out
curl -i localhost:3000/api/auth/me                    # 401 unauthorized
curl -i localhost:3000/decks/123                      # 307 /sign-in?next=%2Fdecks%2F123

# wrong password
curl -i -X POST localhost:3000/api/auth/sign-in -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'                                 # 401

# sign in
curl -i -c /tmp/jar.txt -X POST localhost:3000/api/auth/sign-in -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test-password-123","next":"/decks/123"}' # 200

# signed in
curl -i -b /tmp/jar.txt localhost:3000/api/auth/me         # 200
curl -i -b /tmp/jar.txt localhost:3000/decks/123           # 404 until the page exists, no redirect

# sign out
curl -i -b /tmp/jar.txt -c /tmp/jar.txt -X POST localhost:3000/api/auth/sign-out                 # 204
curl -i -b /tmp/jar.txt localhost:3000/api/auth/me         # 401
```
