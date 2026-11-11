# Product Configuration Cheatsheet

## I want to remove Rectangle from Stickers

Edit `assets/impress-sticker-config.js` and remove `'Rectangle'` from `shapes`. Existing Rectangle variants in Shopify may remain for other storefront channels; hide or delete them there separately if you no longer sell them.

## I want a new size of sticker

Add the exact string, e.g., `'5 x 5 in'`, under each desired shape in `sizesByShape`.
Then add the real Shopify variants with prices for each permitted combination, e.g., `Contour Cut / Gloss / 5 x 5 in | 50`.

## I want 500 stickers

Add `500` to `quantities`, and create corresponding `Size | 500` Shopify variants with real prices. If no matching priced variant exists, 500 will not appear as a checkout option.

## I want to turn off Background Removal

In StickerConfig, set `editor.allowBackgroundRemoval` to `false`. Available switches: `allowScaling`, `allowRotation`, `allowStroke`, `allowBackgroundRemoval`.

## I want less Safe Zone

Change `safeZoneInches: 0.0625` in the sticker config. Customer preview only: check with real production tolerances before using as a manufacturing specification.

## I want fewer banner mounting options

Change `mounts: ['Argollas']` in the banner config, or `['Palos']`. Matching Shopify variants must still exist for checkout.

## I want more banner sizes

Add a size such as `'5 x 10 ft'` to `sizes` and create the corresponding Shopify variants with prices.

## I want to move Argollas closer to the corners

Change `grommets.cornerCenterInches` (center-to-edge distance). For example, use `0.5` instead of `0.75`. `diameterInches` and `maxSpacingInches` also live there. Preview only until shop production confirms.

## I want to change the common preview background

Edit `assets/impress-editor-core.js` (shared behavior/defaults) and `assets/impress-preview-shared.css` (shared panel appearance). Avoid editing both product editors individually.

## Important limitations

These are public theme assets, not secure storage. Do not store API keys, sensitive cost data or private production recipes here. Shopify variants/prices are still authoritative and cannot be bypassed. Large catalogs above the prototype 250-variant cap need new loading logic.
