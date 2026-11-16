# Impress — Sticker upload: blank white strip / outer document scroll fix

**Starting point:** latest `Shopify.zip` provided on November 15, 2026.

## Replace these 3 theme files

- `sections/impress-sticker-configurator.liquid`
- `assets/impress-sticker-configurator.js`
- `assets/impress-sticker-configurator.css`

Replace the corresponding files in the Shopify code editor. Do **not** upload this partial ZIP as an entire theme.

## What's fixed

The separate "Sube tu arte original" upload area now activates the same native file input through a button click, instead of a native file-label activation. The hidden original file input stays pinned outside the normal page flow and focuses with `preventScroll`. After the file picker returns, a small guard resets only unexpected `window`/`html` scroll; **it does not touch the actual `.page-wrapper` scroll position**.

The original upload remains `properties[Arte original]`, retaining the file for Shopify submission. The canvas preview, DPI indicator, Contour Cut zoom/pan, add-ons and prices are unchanged.

## Validation

1. Open the stickers product on the development theme and scroll down inside the page.
2. Click "Sube tu arte original" → "Seleccionar archivo", upload a PNG.
3. Verify there is no blank white bar under the footer; page stays at the same scroll location.
4. Open a file using the **preview** upload as a second test.
5. Confirm the file name / preview / DPI update and that the original file property remains attached to the cart.
6. Cancel the picker and verify no page shift.

For diagnosis, `window.scrollY` should remain `0` on desktop; `.page-wrapper.scrollTop` can be greater than zero. Other forms in the theme are unaffected by this targeted change.

Note: Shopify live checkout and OS-native file-dialog behavior must be verified in the browser used for the store; local tests cannot guarantee every browser's picker behavior.
