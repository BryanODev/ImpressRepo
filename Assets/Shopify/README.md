# Impress Related Products — square full-bleed images

IMPORTANT: The screenshot is of **Impress Related Products**, NOT Impress All Products.
This ZIP fixes the correct section.

## Installation
Replace only `sections/impress-related-products.liquid` in your development Shopify theme.
The package intentionally does NOT contain `impress-all-products.liquid`.

## What changed
- The image area is exactly **1:1**, based on card width, at every viewport.
- It uses the identical image handling from the already-fixed All Products section:
  absolute image positioning, zero padding, `object-fit:cover !important`, centered cropping, and global-CSS overrides.
- The hardcoded 180px desktop and 120px mobile image heights were removed.
- Card titles, prices, links, the optional collection, and tag-exclusion settings are unchanged.
- The entire card isn't square; the image area above the details is.

Note: cover crops photo edges if source and square aspect ratios differ. A source file with its own built-in background/margins cannot be cropped away independently, but the displayed photo fills the media area.
