/* IMPRESS — SHOPIFY OPTION POSITIONS (zero-based).
 * Edit ONLY these indices when the ORDER of product options changes in Shopify.
 * Option names can be anything; sizes, quantities, shapes, finishes and prices
 * always come from the real Shopify variants. NEVER list variant values here.
 * A Shopify product can have at most three option dimensions. For stickers,
 * size and pack quantity deliberately share one option (e.g. "2 x 2 in | 50").
 */
window.ImpressVariantMapping = Object.freeze({
  businessCards: Object.freeze({ size: 0, sides: 1, quantity: 2 }),
  flyers:       Object.freeze({ size: 0, sides: 1, quantity: 2 }),
  stickers:     Object.freeze({ shape: 0, finish: 1, pack: 2 }),
  // Published Banners (Cruzacalles): Shopify Option 1 = Tamaño, Option 2 = Terminación.
  banners:      Object.freeze({ mounting: 1, size: 0 })
});
/* Validate mappings before a product can be purchased. No name detection. */
window.ImpressResolveOptionMapping = function(productType, expectedFields, optionCount) {
  const mapping = window.ImpressVariantMapping?.[productType];
  if (!mapping || !Array.isArray(expectedFields) || expectedFields.length !== optionCount) return null;
  const indices = expectedFields.map(field => mapping[field]);
  if (indices.some(index => !Number.isInteger(index) || index < 0 || index >= optionCount)) return null;
  if (new Set(indices).size !== expectedFields.length) return null;
  return mapping;
};
