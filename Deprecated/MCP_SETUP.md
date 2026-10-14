# Impress Jobs — authenticated MCP add-on for Netlify

This adds an MCP adapter to the **already working** `create-job.mjs`. It does not edit `jobs-table` or `ticket-counter` and does not replace `card-items.mjs`.

## Before deploying

**IMPORTANT:** ChatGPT's Add custom MCP server interface accepts OAuth or No authentication; your existing static `ACTION_SECRET` is *not* a supported sign-in method in that interface. This add-on uses OAuth with Auth0 (or another compatible issuer with RS256 JWTs and standard discovery). Do not select No authentication for a Trello write endpoint. An Auth0 tenant that does not support ChatGPT OAuth client registration or the required audience/resource behavior won't connect; verify the OAuth client setup before deploying.

1. Copy the `netlify/` folder in this package to the **root** of `ImpressRepo/`. Keep your current `netlify/functions/create-job.mjs` and `netlify/functions/card-items.mjs`. Do **not** replace them. The new files are `mcp.mjs` and `mcp-oauth-resource.mjs`.
2. From `ImpressRepo/`, run: `npm install @modelcontextprotocol/sdk zod jose` (keep `@netlify/blobs` installed).
3. Configure an OAuth authorization server (Auth0 recommended) **before** enabling any write access in ChatGPT:
   - Set up an Auth0 tenant and a custom API with identifier `https://idyllic-axolotl-60cda8.netlify.app/mcp` and permission `jobs:create`.
   - Configure the Auth0 tenant's default audience as that API identifier, and ensure it issues RS256 JWTs for the API with the `jobs:create` scope.
   - Create or invite the boss's user identity in Auth0 and locate its unique `user_id` / JWT `sub`. This is separate from the Trello token already stored in Netlify.
   - Configure Auth0's MCP-compatible OAuth client registration (CIMD, DCR, or a pre-registered OAuth app with the redirect URI ChatGPT shows). Follow https://developers.openai.com/plugins/build/auth and Auth0's MCP guide. This is not automatic from Trello authentication.
4. Netlify > Project configuration > Environment variables (Production, Functions) — keep existing `ACTION_SECRET`, `TRELLO_API_KEY`, `TRELLO_API_TOKEN`, `TRELLO_POWERUP_ID`. Add:
   - `MCP_AUTH_ISSUER` = `https://YOUR-TENANT.us.auth0.com` (issuer origin, without trailing slash; use your actual domain)
   - `MCP_AUTH_AUDIENCE` = `https://idyllic-axolotl-60cda8.netlify.app/mcp`
   - `MCP_ALLOWED_SUBJECTS` = the boss's Auth0 user ID (`auth0|...`), or a comma-separated list of authorized Auth0 `sub` identifiers. Do not put emails or passwords here.
   - Restrict who can receive the `jobs:create` scope in your identity provider. API scopes by themselves are not a per-user ACL; `MCP_ALLOWED_SUBJECTS` is an additional server-side guard.
5. `git add netlify/functions/mcp.mjs netlify/functions/mcp-oauth-resource.mjs package.json package-lock.json` then commit and push; Netlify deploys.

## Verify without creating any Trello card

- `https://idyllic-axolotl-60cda8.netlify.app/.well-known/oauth-protected-resource` should respond with JSON containing `resource`, `authorization_servers`, and `scopes_supported`.
- `https://idyllic-axolotl-60cda8.netlify.app/mcp` with no Authorization header should respond **401** with a `WWW-Authenticate` challenge. Never expect the MCP endpoint to work by simply opening it in a browser.
- MCP initialization and `tools/list` require a valid OAuth bearer token. Use an MCP Inspector with authorized OAuth credentials to test. Netlify deploy success alone doesn't establish that ChatGPT OAuth works.

## Connect in ChatGPT

1. Open https://chatgpt.com/plugins, select **+ > Add custom MCP server**.
2. Name: `Impress Jobs`. Server URL: `https://idyllic-axolotl-60cda8.netlify.app/mcp`.
3. Choose **OAuth**. Use the registered Auth0 application client details if your builder prompts for static credentials; otherwise configure Auth0 to support ChatGPT's selected CIMD/DCR flow. Whitelist the callback URI displayed in ChatGPT's UI.
4. After authorization, install the generated plugin; open a new chat, mention `@Impress Jobs`, and ask for a test Trello card. Review the write-action confirmation.

Test input: `Create a card called "Test Job" on board "Ventas y Cotizaciones", list "Inbox Solicitudes Nuevas", with no products.`

## Notes

- ChatGPT gets OAuth tokens; it **never receives** `ACTION_SECRET` or your boss's Trello token.
- The Trello write identity remains the Trello account authenticated by the existing backend. The Auth0 allowlist controls who may command that backend.
- Keep Netlify Blobs backups and test job creation before relying on it for real production orders.
- This add-on has been syntax-checked locally, but the actual Netlify deployment and OAuth handshake cannot be tested without your Auth0 and ChatGPT account configuration.
