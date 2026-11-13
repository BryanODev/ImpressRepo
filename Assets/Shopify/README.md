# Impress Footer v1.0

A footer for **the whole Shopify storefront**, not only the homepage. The existing `sections/impress-footer.liquid` was empty and the footer group had no sections.

## Install to a DUPLICATE theme
1. In Shopify > Online Store > Themes > ... > Edit code, replace `sections/impress-footer.liquid` with this file.
2. Replace `sections/footer-group.json` with this package's version **ONLY if your footer group is still empty**. If you have already created a footer in the theme editor since your last ZIP, instead add **Impress Footer** to the existing footer group from Shopify Theme Editor (Footer section), rather than overwriting your saved layout.
3. In Theme Editor > Footer > Impress Footer, upload the official Impress logo if desired, and select links/menus for Products and Help.
4. Assign the **Banners** product link. It is intentionally not guessed; until configured, Banners is visible but non-clickable. Sticker link defaults to the existing `vinyl-sticker` product handle. Verify it still points to the correct product.
5. Verify the existing phone / email / WhatsApp number, and add Instagram or Facebook URLs if desired.
6. Configure Shopify's Policies under Settings > Policies. Only policies that exist in Shopify will be shown in the bottom footer.

## Files in this ZIP
- `sections/impress-footer.liquid` (replaces your existing empty section)
- `sections/footer-group.json` (activates the section across all pages)

## Design and functionality
- Consistent dark theme, yellow accent, large headline and secondary product CTA.
- Brand area, 2 navigation columns, contact, working tel/mailto/WhatsApp links, current year, dynamic Shopify policy links.
- Mobile and desktop layouts, no external fonts or JavaScript.
- No quote form and no Rotulación hero.
- Contact information comes from your existing `impress-quote.liquid` settings; double-check before publishing.

## Note
No changes to stickers, banners, pricing, checkout, homepage sections or product templates.
All Shopify section schema settings and footer-group references were validated locally, but the sitewide Shopify render should be previewed in your duplicate theme before publishing.
