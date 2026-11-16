# Impress Shopify — Contour Cut Size / Editor Update

Based on the Shopify.zip uploaded November 15, 2026. **Replacement files only**; this is not a complete Shopify theme ZIP.

## Install

In the Shopify theme code editor, replace these files with the matching paths from this ZIP:

- `assets/impress-sticker-configurator.js`
- `assets/impress-sticker-editor.js`
- `assets/impress-sticker-configurator.css`
- `sections/impress-sticker-configurator.liquid`

Test in a duplicate development theme and hard refresh the product page afterward.

## What changes

When **Contour Cut** is selected:

- The size field is labeled **Altura del diseño**, and the original Shopify option `2 x 2 in` appears as **2 in de alto** (similarly for `3 x 3 in`, etc.).
- The HTML option `value`, selected Shopify variant ID, price and add-on matching still use the **original** Shopify size `2 x 2 in`. No extra Shopify variants or metafields are required.
- The cart/order size property includes both the customer-facing height and its Shopify price category, e.g. `2 in de alto (tarifa Shopify: 2 x 2 in)`.
- Scale and rotation sliders and canvas transform handles are hidden/disabled. Uploaded art can still be moved, with border, contour guides and background tools unchanged.
- Switching from another shape to Contour Cut resets any previous scale/rotation to 100%/0°. This is also enforced on undo/redo. Circular and Square retain the existing editing controls.
- A short note explains that the *nominal* height is mapped to a Shopify pricing category; actual width/cut dimensions still require production review.

## Important production limitation

This is a **customer-facing display change**, not a physical size measurement engine. It does not detect artwork width in inches or guarantee the design fits the chosen `2 x 2 in` price bracket. Review aspect ratio and maximum printable dimensions before production and consider a production-rule validator in a future update.

## Validation performed

Automated Chromium tests exercised initial Contour Cut labels, size switches, Shopify variant ID/price preservation, original form property, scale/rotation locking, uploaded PNG preview, restoring Square controls, and returning to Contour Cut. Live Shopify checkout was not exercised.
