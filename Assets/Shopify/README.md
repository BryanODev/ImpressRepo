# Impress Shopify Sticker Config Hotfix v0.3.1

## Why Rectangle disappeared
The previous configurator drew buttons from **priced, fully matched variants** rather than from `impress-sticker-config.js`. If your Shopify Rectangle variants were missing, renamed, or used sizes not listed under `sizesByShape.Rectangle`, the Rectangle button vanished.

## Fix
- Shape buttons come from the `shapes` list in `assets/impress-sticker-config.js`, regardless of pricing matches.
- Pricing is still read exclusively from matching Shopify variants. Checkout stays disabled for missing/unavailable matches.
- When there is no matching variant for a shape, its configured sizes, quantities, and finishes can still be previewed, and an explicit message explains the missing price combination.

## Install
For an existing v0.3 installation, replace these two files:
- `assets/impress-sticker-configurator.js` (fix)
- `sections/impress-sticker-configurator.liquid` (version label only)

No need to replace SVGs, stickers/banners editors, sections, or config files. Test on a duplicated theme.

## Shopify values
Current default Rectangle sizes are `3 x 2 in`, `4 x 3 in`, and `6 x 4 in`. If your Shopify variants use other sizes, either update `sizesByShape.Rectangle` to match them or change Shopify's product variant values. The third Shopify option must still be formatted e.g. `3 x 2 in | 50`.
