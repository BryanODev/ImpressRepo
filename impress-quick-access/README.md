# Impress Quick Access — Trello Power-Up

A completely separate, static GitHub Pages Trello Power-Up. Shows **configurable colored action buttons** in a card's Quick Access section, plus a **Power-Up Settings** editor.

## Setup — new Power-Up, NOT the existing Job Creator

1. Create **a new Trello Power-Up** named **Impress Quick Access** at https://trello.com/power-ups/admin and select the appropriate Workspace.
2. From its **Trello Auth** tab, generate a **new API key**. Copy the **API key only** (not an API token) into `config.js` as `appKey`.
3. In its Auth settings, add the exact GitHub Pages origin as an authorized origin if Trello requires it. For example, `https://USERNAME.github.io` — not the full subfolder path.
4. Commit the complete `impress-quick-access` directory in your GitHub repository with GitHub Pages enabled.
5. Configure the Iframe Connector URL to `https://USERNAME.github.io/REPOSITORY/impress-quick-access/index.html` (adjust for your own repository, capitalization and custom domain).
6. Enable the capabilities **Card Back Section**, **Show Settings**, **Authorization Status**, **Show Authorization** in the Trello Power-Up administrator.
7. Add the new Power-Up to a test board; open Power-Ups → Impress Quick Access → Edit Power-Up Settings. Connect Trello, choose actions and their destinations, then **Save changes**.
8. Open or reload a test card. Click a shortcut. If not connected, the card panel offers a Connect Trello button. Approve access once per person.

**Note:** Buttons are initially labeled "Move to Diseño", "Move to Bryan", "Move to Steven", and "Move to Elimar", but **do not run until a real destination board and list are selected in Settings**. These are starter labels, not guessed Trello IDs.

## Features

- Board-shared button definitions (up to 12; storage uses Trello board shared plugin data; no server required).
- Add, rename, reorder, duplicate and delete shortcuts.
- Default color `#fbbf00`; optional per-button hex color and automatic contrasting text.
- Move a card to a specified list (on current or another accessible board).
- Add/remove selected board member; add/remove label on current board.
- Set start date to now; set due date today/tomorrow; clear due date; mark due complete.
- Post a fixed comment; archive with confirmation.
- Adapts to Trello's light and dark themes.
- Each person's Trello authorization token is stored by Trello in that person's **private plugin data**, never in GitHub. Never paste or commit API tokens.

## Behavior and constraints

- Settings are **per board** where this Power-Up is enabled. Configure each board independently (not automatically copied across boards).
- API actions execute with the **clicking member's permissions**. Access to other boards, lists, labels, or members must already be granted in Trello.
- Buttons are **one-step actions**, not chained multi-step macros, and are run on demand; not automation triggers.
- The static site makes REST calls directly from the browser, which means every user needs to authorize this new Power-Up once. Any permission or API failures will appear in the card UI.
- **New** Power-Up API key is required. Do not reuse the Job Creator API key.
- A safe size buffer keeps button settings below ~3,700 characters to fit conservative Trello plugin data limits.
- `t.sizeTo()` resizes the card section with its content. Trello imposes a 1,500px maximum section height.
- Archived cards and mirror cards may have permission/behavior restrictions determined by Trello.

## Files

- `index.html` / `client.js`: Power-Up connector and capabilities.
- `config.js`: New Power-Up API key, one line to edit.
- `card.html` / `card.js`: Buttons inside each Trello card.
- `settings.html` / `settings.js`: Button management and action editor.
- `common.js`: Storage, REST client, shared logic.
- `authorize.html`: Authorization flow.
- `style.css`: Light and dark theme design.
- `icon.svg`: Monochrome section icon.

## Testing checklist

1. Configure "Move to Diseño" to target a real list. Save.
2. Open a card and click it. Verify the card moved to the correct list.
3. Configure a member action and verify member assignment.
4. Toggle Trello dark/light mode, open the section and settings, and check contrast.
5. Ask a second board member to open the card and authorize their own account.

No Power-Up or Trello API action was run against your live boards while preparing these files.
