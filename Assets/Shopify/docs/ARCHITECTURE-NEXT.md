# Impress Shared Editor — proposed refactor (not yet implemented)

## Current state
Stickers and Banners have separate modules for canvas transforms, file uploads, history, preview, export and Shopify integration. This was practical for quick product prototypes, but it duplicates code and increases the risk of product-to-product bugs.

## Proposed boundary
- `assets/impress-editor-core.js`: shared image load, canvas lifecycle, drag / scale / rotate / zoom, handles, undo / redo, output serialization, final-view tilt.
- `assets/impress-shopify-core.js`: shared safe variant lookup, real Shopify prices, native file submission and validation.
- `assets/impress-product-stickers.js`: shape contour, cut edge, safe-zone path, coatings, outline tool.
- `assets/impress-product-banners.js`: dimensions, hardware placement, optional mounting visualization.
- `assets/impress-product-business-cards.js`: two-sided print canvas, safe area and print bleed.
- `assets/impress-product-postcards.js`: two-sided artwork and margin rules.
- Product templates and sections remain separate for Shopify theme editor compatibility.

## Important implementation rule
Make this migration incrementally without silently changing order upload behavior, pricing, or artwork outputs. Preserve original uploaded artwork; do not treat preview PNGs as production-ready files. Add regression checks for each supported product before replacing its editor.
