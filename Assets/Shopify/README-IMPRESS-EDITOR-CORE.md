# IMPRESS Shopify — Unified Editor Core (Nov 15, 2026)

## Installation

This is a **replacement-files patch**, NOT a complete Shopify theme. It is based on the latest provided `Shopify.zip` and incorporates the immediately preceding Zoom & Pan for All Products update so that those improvements are not lost.

In a **duplicate development theme**, use Online Store → Themes → Edit code. Replace the corresponding files:

- `assets/impress-editor-core.js` (the common editor foundation)
- `assets/impress-sticker-editor.js`
- `assets/impress-banner-editor.js`
- `assets/impress-paper-editor.js` (shared by Flyers and Business Cards)
- `assets/impress-preview-shared.css` (the shared zoom/pan toolbar stylesheet from the preceding release; included for completeness)

Nothing under `sections/`, `snippets/`, `layout/`, or `config/` changes. There is no need to update product variants, metafields, products, or JS product mappings.

## What was consolidated

`ImpressEditorCore.createWorkspace(...)` now gives all four product editors the same core modules:

- Preview canvas and final-view (tilt) setup
- Wheel zoom / middle-mouse view-only pan (100–400%)
- Camera coordinates that keep artwork dragging separate from panning
- An optional shared image-quality/DPI analyzer, connected to the original uploaded artwork
- Shared existing transformation geometry and pointer math (`startDrag`, `updateDrag`, `hitTest`, `handles`, etc.)

Existing **product-specific UI** is maintained. Stickers continue to use their own styled zoom toolbar, while Banner/Flyer/Business Card use the standard shared toolbar.

## Product-specific behavior that remains separate by design

- **Stickers:** fixed Contour Cut artwork with *working* view-only zoom/pan; Square/Circular drag, scale, rotate, contour tracing, background removal, outline, cut/safe guides; height-oriented Contour Cut labels and lamination prices.
- **Banners:** illustrated grommets and folds, hardware spacing and existing mounting selections.
- **Flyers and Business Cards:** front/back art and history, paper dimensions, safe/cut guides.
- Every product still owns its actual export composition and production-specific rules. The shared camera **never** becomes part of exported PNGs.

Existing shared `impress-artwork-preview.js` continues to decode uploaded artwork. Product-specific Undo/Redo stacks and native Shopify file property submission remain unchanged in this low-risk phase; they can be consolidated separately if needed, after checkout testing.

## Checks completed (local Chromium)

- All four editors load with the unified core, with no JavaScript errors.
- Zoom/pan works across Square, Circular/Contour Cut logic, Banners, Flyers and Business Cards.
- 100–400% zoom limits; reset; middle-mouse pan; mouse-wheel page scroll suppressed over editor.
- Left-drag moves Square artwork; Contour Cut left-drag does not move it. Contour Cut still permits zoom and pan.
- PNG exports before/after zoom/pan are byte-identical in the browser fixtures.
- DPI: square sticker 300 DPI at 2 inches, 150 DPI at 4 inches; banner low/good rating; front/back paper rating.
- Paper editor front/back switching and selected side rendering.
- Configurators, Shopify variant mapping, add-on pricing, cart code, and artwork-decoder files were unchanged.

**Not tested:** real Shopify file-property post, checkout, payment, PDF/TIFF decoding in production, actual hardware and color accuracy. Before publishing, test an original file upload and an order for each product, and compare prices/add-ons/attachment in your development store.

## Rollback

If anything unexpected appears in your store, restore the five asset files above from your theme backup. No Shopify Admin data has been changed by this patch.

## For the next product

Create a new product-specific adapter module that calls `ImpressEditorCore.createWorkspace(...)` with its canvas elements, `render` callback and its own `drawEdit`/`drawFinal` functions. This automatically supplies shared preview, DPI mounting (when `qualityRoot` and `qualityType` are given), and zoom/pan. The new product must still implement its own Shopify configuration, printing rules and export, and link the correct script/markup into its page.
