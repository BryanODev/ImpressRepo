'use strict';

const API_KEY = 'eb1974fbb9e6a0def3d070da33e9cf05';
const APP_NAME = 'Impress New Task';
const ICON_URL = 'https://bryano.dev/ImpressRepo/Assets/ImpressIcon.png';

function signed(t, path) {
  return t.signUrl(new URL(path, window.location.href).href);
}

function authorizeUser(t) {
  return t.popup({
    title: 'Connect Trello',
    url: signed(t, './autorize.html'),
    height: 180
  });
}

function openJobForm(t) {
  return t.popup({
    title: 'Create Job',
    url: signed(t, './form.html'),
    height: 485
  });
}

// For the first badge test, read the Job ID from the existing Job Creator
// title format: "#1042 - Job Name". Display only; do not change cards.
function jobIdFromTitle(title) {
  const match = String(title || '').match(/^\s*#(\d{1,12})\s*[-–—]\s*/);
  return match ? `#${match[1]}` : null;
}

function jobBadge(t, detail = false) {
  return t.card('name', 'shortLink').then((card) => {
    // Keep the existing numeric Job ID when Job Creator put it in the title.
    // All other cards show their globally unique Trello short link as a badge.
    // NOTE: shortLink is not a sequential numeric Job ID.
    const id = jobIdFromTitle(card.name) ||
      (card.shortLink ? `#${card.shortLink}` : null);
    if (!id) return [];
    return [detail
      ? {title: 'Card ID', text: id, color: 'yellow'}
      : {text: id, color: 'yellow'}
    ];
  }).catch((error) => {
    console.warn('Card badge could not read card information:', error);
    return [];
  });
}

window.TrelloPowerUp.initialize({
  'card-badges': function (t) {
    return jobBadge(t);
  },
  'card-detail-badges': function (t) {
    return jobBadge(t, true);
  },
  'board-buttons': function () {
    return [{
      icon: { dark: ICON_URL, light: ICON_URL },
      text: 'Create Job',
      condition: 'edit',
      callback: async function (t) {
        try {
          const rest = t.getRestApi();
          return (await rest.isAuthorized()) ? openJobForm(t) : authorizeUser(t);
        } catch (error) {
          console.error('Create Job button:', error);
          return t.alert({message: 'Could not open Job Creator.', duration: 6});
        }
      }
    }];
  },
  'show-settings': function (t) {
    return t.modal({
      title: 'Job Creator Settings',
      url: signed(t, './settings.html'),
      height: 685,
      fullscreen: false
    });
  },
  'authorization-status': async function (t) {
    try {
      return {authorized: await t.getRestApi().isAuthorized()};
    } catch (_) {
      return {authorized: false};
    }
  },
  'show-authorization': authorizeUser
}, {appKey: API_KEY, appName: APP_NAME});
