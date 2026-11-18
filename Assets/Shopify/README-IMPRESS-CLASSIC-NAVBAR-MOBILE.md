# Impress Classic Navbar — Mobile Navigation Update

## Installation

This ZIP contains **only the modified section**, not a complete Shopify theme.

1. Open your development theme: **Online Store → Themes → Edit code**.
2. Under **Sections**, replace the contents of `impress-classic-navbar.liquid` with the file inside `sections/`.
3. Save and preview the theme on a phone-size viewport.
4. Do not modify `impress-header.liquid` (your original navbar); it is not included.

## Mobile behavior (840 px and narrower)

- Header is a single row: original logo at left, hamburger icon at right.
- Opening the hamburger changes it to **X** and shows a full-height navigation drawer beneath the header.
- Primary navigation groups (such as Stickers, Banners, Others) appear vertically.
- Tap a group to open its dedicated subpanel with the **same collection/manual product cards** as desktop: icon/image, title, and description.
- Tap **← Volver** to return to the main menu; tap the fixed **X** to close from any level.
- Account links and Cart appear in the main drawer. Customer links change based on Shopify login status.
- Scroll is contained in the drawer while open. The header stays in place even when the normal Sticky setting is turned off.
- Esc returns from a subpanel; pressing Esc again closes the menu.

## Desktop behavior

Existing classic navigation, hover product dropdowns, account dropdown, Cart badge and sticky setting remain intact. All existing `nav_group` and `nav_product` blocks and their settings remain supported.

## Local checks

Local Chromium checks passed at 320, 390, and 768 px and at desktop 1440 px. Tested open/close, product panels, back, Esc, responsive mode changes, sticky enabled/disabled, hover, and horizontal overflow. Shopify's live theme environment hasn't been rendered here, so test inside the development store before using it on the published storefront.
