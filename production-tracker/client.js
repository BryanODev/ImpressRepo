'use strict';

// This is the iframe connector. Trello loads the user interfaces below.
const asset = (filename) => new URL(filename, window.location.href).href;

window.TrelloPowerUp.initialize({
  'card-back-section': function (t) {
    return {
      title: 'Production Items',
      icon: asset('icon.svg'),
      content: {
        type: 'iframe',
        url: t.signUrl(asset('card.html')),
        height: 660,
      },
    };
  },
  'show-settings': function (t) {
    return t.modal({
      title: 'Production Templates',
      url: t.signUrl(asset('settings.html')),
      height: 700,
      fullscreen: false,
    });
  },
});
