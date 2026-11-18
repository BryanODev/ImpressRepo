# Impress — “Así de fácil” (icons + numbered headings)

## Install

This ZIP is a **replacement-files package**, not an entire Shopify theme. In Shopify Admin → Online Store → Themes → Edit code:

1. Replace `sections/impress-order-instructions.liquid` with the included section file.
2. Add all four new PNG files in `assets/` (keep the exact filenames):
   - `impress-step-choose.png` — Elige tu producto
   - `impress-step-upload.png` — Sube tu arte
   - `impress-step-review.png` — Revisa tu pedido
   - `impress-step-receive.png` — Recibe tu orden
3. Open Customize → Home → **Impress Steps Process** and preview.

No other theme files, editor code, products, metafields, or prices change.

## How it behaves

- Each icon appears **above** the heading; the circular step number appears **beside the heading**, even if an icon is selected.
- Existing text, colors, order, and step blocks are preserved.
- Existing custom icons on a step continue to take precedence over the bundled icon.
- If no custom icon is provided, step 1–4 use the bundled icons by default.
- In a step block, **Preset icon** allows manual selection or disabling if you rearrange steps.
- Section settings: **Show icons above headings**, **Icon size** (40–120 px), and **Show numbered badges beside headings**.
- If you add a fifth step, pick a preset icon or upload a custom icon for it. The number still shows automatically.

## Verification

Check desktop and mobile, plus a step with a manually uploaded custom icon. This update is limited to the process section and does not alter storefront/cart behavior.
