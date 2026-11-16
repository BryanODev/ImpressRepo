# Impress — Blog cards styled like Product Showcase

## Install

Replace `sections/impress-home-blog.liquid` in your development theme with the copy in this ZIP. This is a **replacement file**, not a complete Shopify theme.

If your current theme does not already have `impress-home-blog.liquid`, add it as a new section in **Online Store → Themes → Edit code → sections**, then add **Impress Blog Posts** to your homepage in the Theme Editor.

## Customize in Shopify

Go to **Online Store → Themes → Customize → Home page → Impress Blog Posts**.

- **Blog de Shopify** — choose the blog whose published posts you want to display. If no blog is selected, the section tries the `news` blog as a fallback.
- **Número de artículos** — show the latest **1 to 9** published posts.
- **Tarjetas visibles en computadora** — show **1 to 4** at once. Extra cards remain in one horizontal row with arrows and horizontal scrolling.
- **Texto botón de tarjeta** — edit the yellow button text on each article card.
- **Mostrar botón Ver todos** — toggle the large full-width link to the selected blog archive.
- **Etiqueta**, **Fecha**, **Fondo**, **Color de botones**, image ratio, spacing and section title — all editable.

**To edit an individual card's title, cover image, and excerpt**, edit its real Shopify blog post under **Online Store → Blog posts**. No dummy posts or extra Theme Editor blocks are created. The section shows only published posts.

## Visual design

Matches your `impress-product-showcase.liquid` language: eyebrow, oversized heading, supporting text, image (about 1.53:1 by default), yellow pill tag, white rounded cards, soft shadow, short excerpt, and yellow call-to-action. On desktop it defaults to three visible cards; mobile uses a single horizontally scrollable row.

## Compatibility

Replaces only the existing Blog Posts section. No changes to product editors, add-ons, header, footer, cart, or Shopify blog templates. Existing blog settings (`blog`, `eyebrow`, `heading`, `description`, `button_label`, `limit`, `max_width`, `bg_color`, `accent_color`) retain the same setting IDs.

## Tested

Static HTML/CSS/browser checks performed at desktop, tablet, and mobile sizes, including one-row layout, horizontal navigation, and no horizontal overflow of the page. Live Shopify blog object rendering must be checked in your development theme.
