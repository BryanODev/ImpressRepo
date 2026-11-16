/* IMPRESS STICKERS — artwork/preview settings ONLY.
 * Shopify variants supply every shape, finish, size, quantity and price.
 * To change the Shopify option ORDER, edit impress-variant-mapping.js.
 */
window.ImpressProductConfigs = window.ImpressProductConfigs || {};
window.ImpressProductConfigs.stickers = Object.freeze({
  safeZoneInches: 0.0625,
  cutGuideDefaultOn: true,
  safeGuideDefaultOn: true,
  editor: {
    allowScaling: true,
    allowRotation: true,
    allowStroke: true,
    allowBackgroundRemoval: true
  },
  maxArtworkMB: 20
});
