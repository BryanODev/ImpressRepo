# Job Creator — Trello Power-Up

A lightweight static HTML/CSS/JS Power-Up that extends the original **Impress New Task** Power-Up.

## Features

- A board button that opens a small **Create Job** form.
- Names formatted as `#0001 - Job name`, with a configurable next number.
- Automatically attaches the person creating the job, sets a fresh start date, and sets a due date 3 calendar days later by default (configurable in Settings).
- Lets members select a target board and list.
- Lets admins configure default board, list, Trello card template, and due-date offset (0–3650 calendar days).
- Can copy template details, checklists, labels, attachments, and custom-field values, **but not** source members/dates.
- Automatically navigates to the newly created card (including other boards).
- Light/dark theme support using Trello's theme context.
- Optional position at top/bottom of list.

## Setup (GitHub Pages)

1. Put the `job-creator` folder in your existing GitHub Pages site.
2. Keep the existing Trello Power-Up ID: the original API key is preserved.
3. Keep the existing connector URL pointing to `.../job-creator/index.html` (adjust for your path).
4. In [Trello Power-Up Admin](https://trello.com/power-ups/admin), enable **Board Buttons**, **Show Settings**, **Authorization Status**, and **Show Authorization**. The app must use the same app key and authorize origins as before.
5. Refresh Trello, enable/show the board button, then go to **Power-Ups → Job Creator → Settings**. Configure the next job number **before** creating live jobs.
6. If authorization isn't already active, click **Create Job** and approve Trello access once.

## Data layout

- `jobCreatorSettingsV2`: board-shared settings; each board where the Power-Up is enabled can have different defaults.
- `jobCreatorNextNumberV2`: Workspace-shared counter **when the user can write shared Workspace data**; falls back to board-shared counter otherwise.
- If no new counter exists, initializes from the previous `ticketCounter` on the current board, or 1.

**Important:** Power-Up `t.get` / `t.set` is not a transactional counter. Two people creating jobs at the exact same time could be assigned the same number. For guaranteed uniqueness, move number reservation to a server/database with an atomic increment. Multi-Workspace boards and non-Workspace collaborators can also have independent counters. Do not rely on these numbers for accounting or other uniqueness-critical records until that is done. The app reserves the number before calling Trello's card API; failed requests can therefore skip a number.

## Notes

- Only Trello cards marked **Template** show up in the template selector. The selector can use a different board from the destination if the current user has access to it.
- Template copying uses `keepFromSource: attachments,checklists,labels,customFields` and excludes source members and dates. This is intentional: new start/due dates override the template.
- Due dates retain the local time of day when the job was created, offset by the configured number of calendar days. The setting is stored with the board settings; it does not modify existing cards.
- Existing Trello tokens are not included in source files; each member must authorize individually.
- The Trello API key used here is a public client key from the user's original Power-Up, not a secret.
