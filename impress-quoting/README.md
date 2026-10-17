# Impress Quoting — Trello Power-Up

A standalone GitHub Pages Power-Up for itemized customer orders on Trello cards.

## Features
- Card-back section titled **Impress Quoting**.
- Add up to 15 products/services per card, independently of existing checklists.
- Leave unit prices blank while the job is in production; fill them when quoting/charging.
- Quantity, item amount, subtotal, configurable sales-tax percentage, total, manually entered amount paid, balance due.
- Customer name and print notes. Shared, per-card persistence using Trello Power-Up plugin data.
- Printable customer copy; in the browser print dialog select **Save as PDF** if desired.
- Board-level settings: business name, address, contact, default tax percentage, document title, footer. Each card saves its own tax rate so changing the board default won't recalculate saved orders.
- Light/dark theme changes follow Trello.

## Deployment — GitHub Pages
1. Upload this **impress-quoting** folder into your GitHub Pages repository and commit.
2. In https://trello.com/power-ups/admin, create a new custom Power-Up. Set its **display name** to `Impress Quoting` (internal folder stays `impress-quoting`).
3. Set **Iframe Connector URL** to the absolute URL of **index.html**, for example `https://USERNAME.github.io/REPOSITORY/impress-quoting/index.html`.
4. In **Capabilities**, enable **card-back-section** and **show-settings**. Save.
5. Enable the Power-Up on a Trello board. Open a card to see the section. Open the board Power-Ups menu and choose **Edit Power-Up Settings** to configure the customer copy.

No Trello API key, server, Cloudflare, Netlify, custom fields, or additional authorization is necessary for this version.

## How the workflow works
1. Open any card on a board with Impress Quoting enabled.
2. Add products/services and quantities. **Leave prices blank** until someone is ready to quote or collect payment.
3. Enter unit prices and (if already received) the amount paid, then click **Save order**.
4. Click **Customer copy**, then **Print / Save as PDF**. Print on paper or save a PDF to share with your customer.

## Important limitations
- This is an **order record** and **not a credit-card processor, QuickBooks integration, or official tax invoice**. Payments are entered manually.
- The Trello Power-Up card `shared` scope has a 4,096-character limit. This starter edition caps items at 15 and prevents oversize saves. For large orders or sensitive private pricing, we'd need a different storage model and permission design.
- **Anyone with access to the board/card and this Power-Up's shared data can view the amounts**; do not enable on publicly accessible boards or boards whose viewers should not see customer prices.
- Trello controls the ordering of Power-Up sections. A name prefix does not guarantee a specific position. Trello controls the order of sections; the Power-Up cannot force itself above others.
- Pricing details are stored on the Trello card in Impress Quoting's plugin data, not in a native Trello custom field or the existing Production Tracker data. It is not automatically synced with QuickBooks.
- The printable customer copy is generated from saved card data. Save edits before printing.

## Fix in this update
- Removed an unsupported `shortUrl` property request from the card view (the cause of `(Command: card)` errors).
- Uses supported card properties on the printable customer copy.
- Changed card back title to **Impress Quoting**.
- In Trello Power-Up Administration, rename the Power-Up there separately if it still says `00 - Impress Quoting`.
- Existing `t.get`/`t.set` quote data and settings remain unchanged.
