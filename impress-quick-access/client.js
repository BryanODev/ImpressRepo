'use strict';
const config = window.QuickAccessConfig;
const asset = (file) => new URL(file, window.location.href).href;
const signed = (t, file) => t.signUrl(asset(file));
window.TrelloPowerUp.initialize({
  'card-back-section': (t) => ({
    title: 'Quick Access',
    icon: asset('icon.svg'),
    content: {type: 'iframe', url: signed(t, 'card.html'), height: 260}
  }),
  'show-settings': (t) => t.modal({
    title: 'Quick Access Settings',
    url: signed(t, 'settings.html'),
    height: 790,
    fullscreen: false
  }),
  'authorization-status': async (t) => {
    try { return {authorized: await t.getRestApi().isAuthorized()}; }
    catch (_) { return {authorized: false}; }
  },
  'show-authorization': (t) => t.popup({
    title: 'Connect Trello',
    url: signed(t, 'authorize.html'),
    height: 235
  })
}, {appKey: config.appKey, appName: config.appName});
