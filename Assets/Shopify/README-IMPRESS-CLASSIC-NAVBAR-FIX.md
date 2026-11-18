# Impress Classic Navbar — scrollbar and fonts fix

## Install

1. In Shopify Admin open **Online Store → Themes → Edit code** in your development theme.
2. Replace **Sections → `impress-classic-navbar.liquid`** with `sections/impress-classic-navbar.liquid` in this ZIP.
3. Save and refresh the preview. You don't need to recreate or re-order your nav blocks; all existing block types and settings IDs remain.
4. In **Customize → Header → Impress Classic Navbar → Font sizes**, adjust the sizes as needed.

## Changes

- When sticky is on, the navbar now keeps exactly the width and left edge of its original section rather than expanding across the full browser viewport. This leaves the desktop `.page-wrapper` scrollbar visible and unobstructed.
- It also follows width changes when Shopify shifts/resizes the content area (for example, when a drawer opens).
- The original **Keep navbar visible while scrolling** toggle remains.
- Added font size settings for desktop navigation links, mobile navigation links, dropdown category headings, dropdown product names, dropdown descriptions, account dropdown text, and the built-in text logo (used only if no logo image was uploaded).
- No changes to the logo image, product link settings, dropdown grouping logic, customer account links, or cart count.

## Test notes

Checked in local Chromium at 1440px, 1920px, 390px and 320px viewport widths. Tested sticky on/off, opening/closing dropdowns, font settings, and retaining the navbar width with simulated scrollbar/right reserved space and changing drawer width. Check the actual rendered theme and any unusual third-party drawer plugins in Shopify preview.
