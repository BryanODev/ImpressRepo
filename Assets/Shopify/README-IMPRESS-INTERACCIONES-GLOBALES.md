# IMPRESS — Global Mobile Tap & Image Interaction Fix

Based on the latest user-uploaded Shopify.zip.

## Replacement files

Upload these four files to the same paths in **Online Store > Themes > Edit code** (or Shopify CLI):

- `layout/theme.liquid` — added references to the new global CSS/JS.
- `layout/password.liquid` — same references for the storefront password page.
- `assets/impress-global-interactions.css` — removes the browser tap flash and native image dragging/long-press callout.
- `assets/impress-global-interactions.js` — prevents native `dragstart` and `contextmenu` on HTML `<img>` elements.

The package contains **only** these files, not a full Shopify theme. Preserve all other theme files.

## What changes

- Removes the browser's blue/gray tap highlight from buttons, links, and other interactive elements on mobile.
- Prevents native dragging of site `<img>` images without disabling ordinary clicks and navigation.
- Suppresses the default right-click image menu on HTML `<img>` elements.
- Keeps keyboard focus indicators, desktop hover animations, image links, touch scrolling, SVG/canvas editing, and Impress artwork editor gestures intact.

## Important limitations

This is **not image copy protection**. Images that load into a browser remain available via browser developer tools, network requests, screenshots, and other means. Some browsers may still show a save-image action or ignore the long-press callout rule. Shopify-hosted customer account/checkout pages are outside ordinary theme layouts, so these changes do not affect those pages.

## Testing

Tested in headless Chromium: touch tap highlight computed as transparent; simulated native `dragstart`/`contextmenu` on images are canceled; context menu on text links and canvas remains available; links and wheel events are unaffected.

Theme-level rendering and a real iOS/Android device should be checked in your development Shopify storefront.

## Rollback

Delete the two new assets, and remove their matching CSS and JS asset tags from the two layout files.
