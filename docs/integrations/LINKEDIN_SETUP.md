# LinkedIn integration (Week 2 scaffold)

## What is implemented

- OAuth 2.0 authorization URL builder and callback handler (`/integrations/linkedin/*`).
- Tables: `linkedin_oauth_states`, `linkedin_connections` (see migration `0004_linkedin_integration.sql`).
- **Scopes default:** `openid profile email` (Sign in with LinkedIn / OpenID).  
  Posting and member post history require **additional products/scopes** from LinkedIn (e.g. Community Management API) — add when your app is approved.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `LINKEDIN_CLIENT_ID` | App client ID from LinkedIn Developer Portal |
| `LINKEDIN_CLIENT_SECRET` | App client secret |
| `LINKEDIN_REDIRECT_URI` | Must exactly match a redirect URL in your LinkedIn app (default: `http://127.0.0.1:3001/integrations/linkedin/callback`) |
| `LINKEDIN_SCOPES` | Optional. Space-separated scopes (default: `openid profile email`) |
| `LINKEDIN_OAUTH_SUCCESS_URL` | Optional. If set, callback redirects here with HTTP 302 on success |

## LinkedIn Developer Portal checklist

1. Create an app at [LinkedIn Developers](https://www.linkedin.com/developers/).
2. Add **Authorized redirect URLs** matching `LINKEDIN_REDIRECT_URI`.
3. Enable **Sign In with LinkedIn using OpenID Connect** (or equivalent) for `openid profile email`.
4. For future **post history sync**, request access to the relevant **Marketing / Community Management** APIs per LinkedIn’s current policy.

## API routes

- `GET /integrations/linkedin/start` (JWT) — returns `{ authorizationUrl, state }`.
- `GET /integrations/linkedin/callback` (public) — LinkedIn redirects here with `?code=&state=`.
- `GET /integrations/linkedin/connection` (JWT) — returns connection metadata (no access token in response).

## Security note

Access tokens are stored in Postgres for MVP. **Encrypt at rest / vault (Later-B)** before any production launch.
