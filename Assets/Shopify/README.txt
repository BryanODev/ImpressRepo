IMPRESS — Unified Category Landing Sections

New reusable sections:
  sections/impress-simple-hero.liquid
  sections/impress-product-main-selection.liquid

Updated templates:
  templates/page.impress-stickers.json
  templates/page.im-banners.json

Banner artwork assets:
  assets/im-banners-hero.svg
  assets/im-banner-rollup.svg
  assets/im-banner-xstand.svg

Both page templates now have TWO independent sections at the top:
  1. Impress Simple Hero
  2. Impress Product Main Selection

Both sections work for any category; the templates set different copy,
images, and product cards. Other info, FAQ, and review sections are reused.

The first Sticker card uses product handle vinyl-sticker.
The first Banner card uses product handle banners.
The other cards remain Próximamente until a product/link is assigned.

IMPORTANT: Replacing page JSON templates overwrites edits you made to
those templates in Shopify after your uploaded Shopify.zip. Back up your
current templates first. If you need to preserve edits, update only the
two combined-section entries and the template order.

After installing, delete the old sections:
  sections/impress-stickers-home.liquid
  sections/im-banners-home.liquid

No header/nav files are included or changed.
