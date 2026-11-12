/* IMPRESS: EDIT THIS FILE for the Sticker catalog. Public storefront settings only.
 * Do NOT put confidential costs, API keys, passwords or customer data here.
 * Adding an option here only displays it: Shopify must also have its priced variant.
 */
window.ImpressProductConfigs = window.ImpressProductConfigs || {};
window.ImpressProductConfigs.stickers = Object.freeze({
  // Remove an entry to hide it from THIS editor (not from Shopify's other channels).
  shapes: ['Contour Cut', 'Square', 'Circular', 'Rectangle'],
  finishes: ['Gloss', 'Mate'],
  // These are ALLOWED sizes; Shopify also needs matching variants to sell them.
  // You can add a new size to more than one form, or use a different list per form.
  sizesByShape: {
    'Contour Cut': ['2 x 2 in', '3 x 3 in', '4 x 4 in'],
    'Square':      ['2 x 2 in', '3 x 3 in', '4 x 4 in'],
    'Circular':    ['2 x 2 in', '3 x 3 in', '4 x 4 in'],
    'Rectangle':   ['3 x 2 in', '4 x 3 in', '6 x 4 in']
  },
  // Add 500 here AND as a priced Size | Quantity combination in Shopify.
  quantities: [50, 100, 250],
  safeZoneInches: 0.0625,
  cutGuideDefaultOn: true,
  safeGuideDefaultOn: true,
  editor: {
    allowScaling: true,
    allowRotation: true,
    allowStroke: true,
    allowBackgroundRemoval: true
  },
  maxArtworkMB: 20 // Prototype UI limit; native Shopify upload limits still apply.
});
