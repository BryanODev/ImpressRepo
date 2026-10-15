'use strict';

window.JobCreator = (() => {
  const API_KEY = 'eb1974fbb9e6a0def3d070da33e9cf05'; // Trello public app key; never store member tokens in source.
  const APP_NAME = 'Impress New Task';
  const SETTINGS_KEY = 'jobCreatorSettingsV2';
  const COUNTER_KEY = 'jobCreatorNextNumberV2';

  function connect() {
    return window.TrelloPowerUp.iframe({appKey: API_KEY, appName: APP_NAME});
  }

  function initTheme(t) {
    const apply = () => {
      const ctx = t.getContext();
      const theme = ctx && (ctx.theme || ctx.initialTheme);
      if (theme === 'dark' || theme === 'light') {
        document.documentElement.setAttribute('data-color-mode', theme);
      }
    };
    apply();
    if (typeof t.subscribeToThemeChanges === 'function') {
      t.subscribeToThemeChanges(apply);
    }
  }

  function fallbackSettings() {
    return {
      defaultBoardId: '',
      defaultListId: '',
      templateBoardId: '',
      templateCardId: '',
      position: 'top'
    };
  }

  async function getSettings(t) {
    return {...fallbackSettings(), ...(await t.get('board', 'shared', SETTINGS_KEY, {}))};
  }

  async function saveSettings(t, settings) {
    if (!t.memberCanWriteToModel('board')) throw new Error('Board write permission is required to save settings.');
    return t.set('board', 'shared', SETTINGS_KEY, settings);
  }

  function counterScope(t) {
    const ctx = t.getContext();
    if (ctx && ctx.organization && t.memberCanWriteToModel('organization')) return 'organization';
    return 'board';
  }

  async function getNextNumber(t) {
    const scope = counterScope(t);
    let next = await t.get(scope, 'shared', COUNTER_KEY, null);
    if (next === null || next === undefined) {
      // Carry over the original Power-Up's counter when first upgrading.
      const old = await t.get('board', 'shared', 'ticketCounter', null);
      next = Number.isSafeInteger(Number(old)) && Number(old) >= 1 ? Number(old) : 1;
    }
    next = Number(next);
    if (!Number.isSafeInteger(next) || next < 1) throw new Error('Invalid next job number. Update it in Settings.');
    return {number: next, scope};
  }

  async function saveNextNumber(t, number, scope) {
    if (!Number.isSafeInteger(number) || number < 1) throw new Error('Next job number must be a positive whole number.');
    if (!t.memberCanWriteToModel(scope)) throw new Error(`Cannot update ${scope} job counter. Check Trello permissions.`);
    return t.set(scope, 'shared', COUNTER_KEY, number);
  }

  function formatNumber(number) {
    return `#${String(number).padStart(4, '0')}`;
  }

  async function token(t) {
    const token = await t.getRestApi().getToken();
    if (!token) throw new Error('Trello authorization required. Reconnect the Power-Up and try again.');
    return token;
  }

  async function api(t, endpoint, {method = 'GET', body, query} = {}) {
    const authToken = await token(t);
    const url = new URL(`https://api.trello.com/1${endpoint}`);
    url.searchParams.set('key', API_KEY);
    url.searchParams.set('token', authToken);
    if (query) Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null) url.searchParams.set(k, String(v)); });
    const res = await fetch(url, {
      method,
      headers: {'Accept': 'application/json', ...(body ? {'Content-Type':'application/json'} : {})},
      ...(body ? {body: JSON.stringify(body)} : {})
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 250);
      throw new Error(`Trello API error (${res.status}): ${detail}`);
    }
    return res.status === 204 ? null : res.json();
  }

  async function getBoards(t) {
    const boards = await api(t, '/members/me/boards', {query: {filter: 'open', fields: 'name,id,closed', limit: 1000}});
    return boards.filter(b => !b.closed).sort((a,b) => a.name.localeCompare(b.name));
  }

  async function getLists(t, boardId) {
    if (!boardId) return [];
    return api(t, `/boards/${encodeURIComponent(boardId)}/lists`, {query: {filter: 'open', fields: 'id,name,pos'}});
  }

  async function getTemplates(t, boardId) {
    if (!boardId) return [];
    // 'all' includes hidden/archived template cards too.
    const cards = await api(t, `/boards/${encodeURIComponent(boardId)}/cards/all`, {query: {fields: 'id,name,isTemplate,cover,cardRole,closed'}});
    return cards.filter(c => c.isTemplate === true || c.cover?.isTemplate === true || c.cardRole === 'template').sort((a,b) => a.name.localeCompare(b.name));
  }

  function selectOptions(select, items, selected, placeholder, label = (x) => x.name) {
    select.replaceChildren();
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = placeholder;
    select.appendChild(empty);
    for (const item of items) {
      const o = document.createElement('option');
      o.value = item.id;
      o.textContent = label(item);
      select.appendChild(o);
    }
    select.value = items.some(i => i.id === selected) ? selected : '';
  }

  function errorText(error) {
    return error instanceof Error ? error.message : String(error);
  }

  function showStatus(node, message, isError = false) {
    node.hidden = !message;
    node.classList.toggle('error', isError);
    node.classList.toggle('success', !isError);
    node.textContent = message;
  }

  return {API_KEY, APP_NAME, connect, initTheme, getSettings, saveSettings,
    getNextNumber, saveNextNumber, counterScope, formatNumber, api, getBoards,
    getLists, getTemplates, selectOptions, errorText, showStatus};
})();
