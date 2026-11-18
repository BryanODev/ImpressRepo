# Impress Catalog — Image controls

Replace only `sections/impress-catalog-grid.liquid` in your Shopify theme. Other files and existing catalog blocks are unchanged.

Open **Online Store → Themes → Customize → Impress Catalog Grid → Catalog card images**:

- **Extend image to card edges**: Off (original style) or On (media stretches to the card’s right/top/bottom edges on desktop; across the top of the card on mobile).
- **Image size**: 80–180%, default 100%.
- **Image area width (desktop)**: 30–60%, default 40%.
- **Image inner spacing**: 0–50px; set 0 for no added media inset in full-bleed mode.
- **Image fit**: Show entire image (contain) or Fill area (cover, which may crop).

Recommended for transparent product PNGs: **Extend image to card edges = On, Image inner spacing = 0, Image fit = Show entire image, Image size = 120–140%**. For photography, use **Fill area** if you want no empty media space.

Notes: The image may still contain invisible margins **inside the uploaded file**. Use Image size to enlarge it or crop/re-export the asset. These settings change only the catalog card presentation; product editors, Shopify variants, pricing, and cart remain untouched.
