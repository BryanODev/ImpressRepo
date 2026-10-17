'use strict';
(function () {
  const config = window.IMPRESS_DESIGN_CONFIG;
  const asset = (file) => new URL(file, window.location.href).href;

  window.TrelloPowerUp.initialize({
    'board-buttons': function (t) {
      return [{
        icon: { dark: asset('icon.svg'), light: asset('icon.svg') },
        text: 'Impress Notifications',
        condition: 'signedIn',
        callback: function (ctx) {
          return ctx.modal({
            title: 'Impress Notifications',
            url: ctx.signUrl(asset('dashboard.html')),
            fullscreen: true,
            height: 730,
            accentColor: '#FBBF00'
          });
        }
      }];
    }
  }, { appKey: config.appKey, appName: config.appName });
}());
