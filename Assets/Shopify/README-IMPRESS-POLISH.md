# Impress theme polish — six changes

This patch is based on the uploaded Shopify.zip. Copy the listed relative paths to the matching folders of the DEVELOPMENT theme. Do not replace the entire theme.

## 1. Small labels
`assets/impress-site-polish.css` standardizes eyebrow/metadata text to #888888, #111111, #ffffff or #fbbf00, while preserving functional colors (DPI warnings/cut guides). `layout/theme.liquid` loads this asset.

## 2–3. Product configurators
`assets/impress-configurator-ux.js` + `.css` add numerical entry (scale and rotation for all; sticker border width too) and a responsive “Ajustes avanzados” panel, collapsed at 767px and below, visible without a click on desktop. Enter or blur commits the value via the existing range change handlers, so history, DPI, preview, export and restrictions remain the original editor's logic. Numbers clamp to the original ranges. Redo and guide toggles are hidden on small screens until Advanced is expanded; primary product options, uploads and add-to-cart remain visible.

## 4. Section widths
Default and currently saved content max widths have been aligned to 1240px across homepage sections, header/footer, logo sections and product editors; previously hardcoded 1200/1250/1280/1440 values are corrected. The intentional full-bleed hero is unaffected. Crucially, responsive tablet widths and individual Shopify Theme Editor width sliders remain functional.

## 5. Catalog landing page / CTA
The home CTA has one button, “Explorar catálogo”, and the homepage JSON config now points it to `/pages/catalogo`. The homepage Catalog's “See all” row also leads there. Added `sections/impress-catalog-intro.liquid` and `templates/page.impress-catalog.json`, which uses a cloned copy of your actual homepage catalog cards, followed by ordering instructions and FAQs (editable independently).

**REQUIRED SHOPIFY STEP**: Theme files cannot create a Shopify Page automatically. In Shopify Admin > Online Store > Pages > Add page, title e.g. “Catálogo”, set URL handle `catalogo`, choose theme template `impress-catalog`, save. Until you create and assign that Page, `/pages/catalogo` will be a 404.

The new landing page copies the card settings at the time this patch was generated; future home-card edits do not auto-sync to the landing page. For dynamically up-to-date actual product collections, `/collections/all` remains available.

## 6. Navbar logo
Classic Navbar logo/wordmark lifts 5px and tilts 7 degrees left on desktop pointer hover, with reduced-motion support. No mobile tap animation.

## Verify after install
Preview on a PHONE using the DEVELOPMENT theme preview link; don’t confuse it with the live store. Check Sticker Square/Circular and Contour Cut: the latter intentionally forbids scaling/rotation. Check both banner orientations, front/back paper editor, PNG export, image upload, variant selection and cart.

No pricing/add-on/product-rule files were edited. Previous global mobile tap-highlights/image protections remain installed.
