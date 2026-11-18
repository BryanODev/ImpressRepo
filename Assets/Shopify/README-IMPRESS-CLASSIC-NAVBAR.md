# Impress Classic Navbar — installation

This update **adds one new Shopify section** and **does not replace or edit** your existing `sections/impress-header.liquid` or any product editors, cart code, settings, or page templates.

## Install

1. In Shopify Admin, open **Online Store → Themes → Edit code** on a development/duplicate theme.
2. Under **Sections**, add `impress-classic-navbar.liquid` from the `sections/` folder in this ZIP (new file).
3. Open **Customize**, then the **Header group**. Choose **Add section → Impress Classic Navbar**.
4. Hide the existing **Impress Header** section (or remove it from the Header group only after confirming the classic version works). The original code remains available.
5. In **Impress Classic Navbar → Brand**, choose the same logo image you used in the original header. Adjust height/colors as needed.
6. Under its blocks you'll find **Stickers**, **Banners**, **Others**. Choose each **Top link destination**, and optionally select a Shopify collection for automatic dropdown contents. Add **Dropdown Product Card** blocks directly after a group if you want manually curated products with images/icons, headings, and short descriptions.
7. In **Layout and sticky**, toggle **Keep navbar visible while scrolling** on/off.
8. Save and check desktop hover, mobile chevron, account login, and cart count.

## Behavior

- The **text link** for Stickers/Banners/Others navigates to the group URL; **hovering** the group reveals its dropdown on desktop, and tapping the **chevron** opens/closes it on touch/mobile. Clicking outside or pressing Escape dismisses open menus.
- Each group supports **manual product cards** (arranged after that group) or **automatic products from a Shopify collection**. Product images, headings, and descriptions are resolved from the product unless overridden.
- Account and cart use Shopify routes. The existing `impress-cart-order-count` snippet remains the source for the visible cart count.
- Sticky ON keeps **only the navbar** fixed at the top after you scroll past the announcement bar; the announcement itself scrolls normally. The code supports the theme's `.page-wrapper` desktop scrolling and normal window scrolling on mobile. Sticky OFF disables that behavior.
- The Navbar is not installed or activated automatically by copying the file; **you must add the section in the Header group**. This is deliberate so your original header remains untouched.

## Test notes

A local Chromium layout test covered 1440px desktop and 390px mobile layouts, menu toggles, account dropdown, sticky ON and OFF, announcement scrolling away, and horizontal overflow. Live Shopify section and account flows have not been tested; verify in the development theme.
