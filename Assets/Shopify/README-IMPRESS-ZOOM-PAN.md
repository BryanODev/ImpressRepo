# Impress Shopify — Zoom and Pan for All Editors

Base: latest `Shopify.zip` supplied November 15, 2026.

## Installation

This ZIP contains ONLY four modified theme files, not an installable full Shopify theme. In your Shopify development theme, open **Online Store → Themes → Edit code** and replace the four files in `assets/` with their corresponding files from this ZIP:

- `assets/impress-editor-core.js`
- `assets/impress-banner-editor.js`
- `assets/impress-paper-editor.js`
- `assets/impress-preview-shared.css`

No Shopify product/variant/metafield configuration needed. Sticker editor files are unchanged.

## Features

The new view controls are shared by **banners**, **flyers**, and **business cards**. Stickers retain their existing zoom/pan controls.

- While an image is loaded and **Editar diseño** is active, scroll the mouse wheel over the canvas to zoom between **100% and 400%** (wheel prevents scrolling the page).
- Middle-mouse button + drag pans the *view only*, not the actual artwork.
- Left-mouse drag continues to move/scale/rotate artwork using the existing editor controls/handles.
- `+` and `−` zoom buttons and `↺` reset the camera to 100%.
- The toolbar hides when no image is loaded or **Vista final** is active, preserving existing final view behavior.
- Flyer/business-card front/back preview navigation resets to 100% when switching sides to prevent confusion.
- Image replacement also resets the view.

## Guarantee of separation

The camera is applied ONLY to the on-screen Edit canvas rendering, not to `state`, `project`, the Shopify form, DPI, or export functions. The browser tests compared exported PNG bytes before and after zoom/pan and they matched exactly.

## Browser QA (local Chromium)

Passed for banners, flyers, business cards: wheel zoom, middle-click pan, 100%–400% limits, existing left-click artwork edits, hidden toolbar on Final view, unchanged saved paper editor state and exported PNG. **Real Shopify checkout has not been retested**; verify on your development store after installation.
