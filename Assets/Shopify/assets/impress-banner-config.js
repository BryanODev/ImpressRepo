/* IMPRESS BANNERS — preview and artwork settings ONLY.
 * Shopify variants supply mounting options, sizes, prices and availability.
 * To change the Shopify option ORDER, edit impress-variant-mapping.js.
 * Quantity is the normal Shopify cart quantity (not an option dimension).
 */
window.ImpressProductConfigs = window.ImpressProductConfigs || {};
window.ImpressProductConfigs.banners = Object.freeze({
  quantity: { min: 1, max: 100, step: 1 },
  // Illustrative hardware preview, NOT production placement specifications.
  grommets: {
    diameterInches: 0.5,
    cornerCenterInches: 0.75,
    maxSpacingInches: 24
  },
  orientation: { enabled: true, options: ['Horizontal', 'Vertical'], default: 'Horizontal' },
  editor: { allowScaling: true, allowRotation: true },
  cutGuideDefaultOn: true,
  mountGuideDefaultOn: true,
  maxArtworkMB: 20
});
