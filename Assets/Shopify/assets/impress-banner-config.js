/* IMPRESS: EDIT THIS FILE for the Banner catalog and mounting previews.
 * Public storefront settings only; never store confidential costs or credentials.
 * Shopify product variants, not this file, are authoritative for purchase prices.
 */
window.ImpressProductConfigs = window.ImpressProductConfigs || {};
window.ImpressProductConfigs.banners = Object.freeze({
  mounts: ['Argollas', 'Palos'],
  sizes: ['2 x 4 ft', '3 x 6 ft', '4 x 8 ft'],
  quantity: { min: 1, max: 100, step: 1 },
  // PREVIEW ONLY: confirm hardware positions with production before printing.
  grommets: {
    diameterInches: 0.5,
    cornerCenterInches: 0.75,
    maxSpacingInches: 24
  },
  editor: { allowScaling: true, allowRotation: true },
  cutGuideDefaultOn: true,
  mountGuideDefaultOn: true,
  maxArtworkMB: 20
});
