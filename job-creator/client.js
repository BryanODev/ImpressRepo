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

window.TrelloPowerUp.initialize({
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
