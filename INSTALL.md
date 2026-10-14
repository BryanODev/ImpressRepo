# Impress Repo — Power-Up / ChatGPT Integration

This patch contains the complete `jobs-table/` folder and the Netlify functions it needs. The existing `ticket-counter/` folder should not be changed.

## What to do

1. **Back up or commit your existing ImpressRepo first.** Unzip this archive into the ROOT of `ImpressRepo/`, and merge/replace `jobs-table/` and `netlify/functions/create-job.mjs`. It also adds `netlify/functions/card-items.mjs` and `netlify/functions/lib/trello-auth.mjs`. Do not delete `ticket-counter/` or other existing files.
2. In Netlify → **Environment variables**, keep `TRELLO_API_KEY`, `TRELLO_API_TOKEN`, and `ACTION_SECRET`. Add **`TRELLO_POWERUP_ID`** (the actual ID of your `jobs-table` Power-Up from the Trello Power-Up administration page). Set the scope for Functions/Production. Keep your secrets on Netlify, never in this repository.
3. At the repo root, make sure you already installed `@netlify/blobs`: `npm install @netlify/blobs`. Commit `package.json` and `package-lock.json`, not `node_modules/`. Run `git add .`, `git commit -m "Connect jobs-table to Netlify"`, `git push`.
4. Wait for successful Netlify deployment; no local computer/server needs to stay running.
5. On a test card with `jobs-table` enabled, open the Items table. Old Trello data is migrated to Netlify automatically the first time a signed-in, **board-member** opens that card's updated Power-Up. The old Trello `itemsTable` property is left intact as a backup. Verify that table, preview and print show the same items, including after refreshing Trello.
6. In your **Custom GPT**, add an Action. Set authentication to API Key / Bearer and enter your Netlify `ACTION_SECRET`. Paste `GPT_ACTION.yaml` into the Action schema field. Until you configure the action, ChatGPT itself cannot call the API; the backend and Power-Up are separate from that registration.

### Example action input

```json
{
  "business": "ABC Company",
  "board": "Ventas y Cotizaciones",
  "list": "Inbox Solicitudes Nuevas",
  "description": "Dos banners de 4 x 8 pies",
  "items": [
    {
      "productId": "banner_lona",
      "quantity": 2,
      "options": { "tamano": "4 ft x 8 ft", "terminacion": "Argollas", "cantidad_argollas": "4" },
      "cost": 0,
      "fileName": ""
    }
  ]
}
```

The server imports `jobs-table/products.json` at build time, so IDs and option names come from your real catalog. A nonexistent product causes a clear 400 error instead of a broken table item.

### Implementation/security notes

- Front-end URLs for the Items table are in `jobs-table/cloud-items.js` (pre-filled with your Netlify site URL from this conversation). Update it if you change the Netlify domain.
- `ACTION_SECRET` is used **only** by your server-to-server ChatGPT Action (`create-job`); it is not in web JavaScript.
- The Power-Up uses `t.jwt()` and Trello's signing keys to authenticate requests to `card-items`. It checks `TRELLO_POWERUP_ID`, the card's board and the calling board member. Trello documents this as the recommended way to authenticate Power-Up/backend communication.
- The function uses Netlify Blobs and optimistic version checks to prevent overwriting changes made in other sessions. If two people edit simultaneously, the table reports a conflict; reopen it to get the latest data.
- The Items table migrates existing `t.get('card', 'shared', 'itemsTable')` data lazily when each card is opened. The old data isn't deleted.
- There is no automatic background migration for unopened cards. The existing Power-Up's separate `folderName` field continues using Trello storage.
- Netlify Blobs isn't a relational multi-user database. This simple integration is suitable for a small team but should be load-tested and backed up for production use.
- Changes are not deployed automatically by extracting the zip; you must merge into your repo, push, and configure the additional Netlify environment variable.
