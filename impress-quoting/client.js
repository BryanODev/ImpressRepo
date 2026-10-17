'use strict';

function url(file) {
  return new URL(file, window.location.href).href;
}

window.TrelloPowerUp.initialize({
  'card-back-section': function (t) {
    return {
      title: '00 - Impress Quoting',
      icon: url('icon.svg'),
      content: {
        type: 'iframe',
        url: t.signUrl(url('card.html')),
        height: 460,
      },
    };
  },
  'show-settings': function (t) {
    return t.modal({
      title: 'Impress Quoting Settings',
      url: t.signUrl(url('settings.html')),
      height: 620,
      fullscreen: false,
    });
  },
});
