# Impress Shopify — Home + Category Page Polish

This patch is based on the Shopify.zip supplied for this update. It contains ONLY changed theme files. Copy files to the same relative paths in your Shopify **development theme**; do not replace your whole theme.

## Included files
- `assets/imstickers-hero.css` — cleaner, shorter homepage slideshow; mobile image sits alongside text instead of below. Existing four slides, artwork choices, buttons and slideshow navigation are unchanged.
- `sections/impress-catalog-grid.liquid` — responsive homepage catalog now uses 2 columns on phones (four products in a 2×2 grid). "View all" is a separate, full-width bar, just as before.
- `sections/impress-clients-static.liquid` — current logo images are the colored versions. New optional `Logo blanco y negro` upload field per logo; hovering/focusing one logo fades ALL others to the black/white layer, reverting to color on exit. If B&W artwork hasn't been uploaded, the section uses a CSS grayscale rendering of the colored logo. Existing row counts, logo widths, links and entrance animation remain.
- `sections/impress-simple-hero.liquid` — cleaner, shorter shared Stickers/Banners page hero. No duplicate sections created.
- `templates/index.json` — retains all your current homepage section blocks, slide content and order; changes existing homepage hero minimum desktop height from 560 to 500, mobile artwork-height setting from 260 to 200 and static logo opacity from 60% to 100% for full color.
- `templates/page.impress-stickers.json` — removes the `IMPRESS / STICKERS` eyebrow from the hero, updates both sticker info descriptions, removes their CTA links and shows the second info section's image first on mobile.
- `templates/page.im-banners.json` — removes the Banners hero eyebrow for visual consistency; updates both banner info descriptions, removes their CTA links and shows the second info image first on mobile. The second banner info section now uses the banner fallback, not stickers.

## Photo of Impress stickers being held
**An actual photograph of Impress stickers in someone’s hand wasn't present in the uploaded ZIP.** The two info sections already have an editable **Imagen** setting in Theme Editor. Upload the authentic photo to the *first* Stickers page `IM Products Info` section to replace the current generic fallback. No outside brand's product photo has been used or misrepresented as yours. All requested copy/layout changes are installed.

## Notes on keeping existing customizations
This package includes three JSON templates so the changes to already-saved content take effect. Since Shopify regenerates templates, back up any changes made AFTER this Shopify.zip export before replacing those JSONs. The section files alone will apply global layout/CSS behavior, but eyebrow, body-copy, links, mobile media order and saved hero/logo values require the template updates or equivalent changes in Theme Editor.

## Testing
- All three page JSON templates validated against their referenced section schemas; section/preset names and range steps checked.
- Existing section block IDs, content, order, product links and relevant editor settings preserved.
- Chromium local mockups verified homepage hero (330px at 320–430px), 2×2 catalog and single full-width "View all" bar, compact category heroes (328px on 320–390px), no page horizontal overflow, and functional slideshow next navigation.
- Chromium verified logo hover leaves the active logo colored and renders the others black/white.

Product prices, configurators, navigation structure, product templates and add-on services are unchanged.
