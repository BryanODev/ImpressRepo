'use strict';
window.QuickAccess = (() => {
  const CONFIG = window.QuickAccessConfig;
  const STORAGE_KEY = 'impressQuickAccessSettingsV1';
  const DEFAULT_COLOR = '#fbbf00';
  const TYPES = [
    ['move', 'Move to list / board'],
    ['member_add', 'Add member'],
    ['member_remove', 'Remove member'],
    ['label_add', 'Add label'],
    ['label_remove', 'Remove label'],
    ['start_today', 'Set start date to today'],
    ['due_today', 'Set due date to today'],
    ['due_tomorrow', 'Set due date to tomorrow'],
    ['due_clear', 'Clear due date'],
    ['due_complete', 'Mark due date complete'],
    ['comment', 'Add predefined comment'],
    ['archive', 'Archive card']
  ];
  const MAX_BUTTONS = 12;
  const isHex = (value) => /^#[0-9a-fA-F]{6}$/.test(value || '');
  const id = () => 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const exampleButtons = () => ['Diseño', 'Bryan', 'Steven', 'Elimar'].map((name) => ({
    id: id(), name: `Move to ${name}`, type: 'move', boardId: '', listId: '', targetName: '', color: '', memberId: '', labelId: '', comment: ''
  }));
  const defaults = () => ({defaultColor: DEFAULT_COLOR, buttons: exampleButtons()});
  const safeColor = (value, fallback = DEFAULT_COLOR) => isHex(value) ? value : fallback;
  const types = new Set(TYPES.map(x => x[0]));
  const validId = (value) => /^[a-f0-9]{24}$/i.test(value || '');

  function cleanSettings(raw) {
    if (!raw || !Array.isArray(raw.buttons)) return defaults();
    return {
      defaultColor: safeColor(raw.defaultColor),
      buttons: raw.buttons.slice(0, MAX_BUTTONS).map((b) => ({
        id: String(b.id || id()).slice(0, 40),
        name: String(b.name || 'Unnamed button').slice(0, 64),
        type: types.has(b.type) ? b.type : 'move',
        color: isHex(b.color) ? b.color : '',
        boardId: validId(b.boardId) ? b.boardId : '',
        listId: validId(b.listId) ? b.listId : '',
        targetName: String(b.targetName || '').slice(0, 90),
        memberId: validId(b.memberId) ? b.memberId : '',
        labelId: validId(b.labelId) ? b.labelId : '',
        comment: String(b.comment || '').slice(0, 160)
      }))
    };
  }
  const connect = () => window.TrelloPowerUp.iframe({appKey: CONFIG.appKey, appName: CONFIG.appName});
  const configured = () => /^[a-f0-9]{32}$/i.test(CONFIG.appKey);
  function theme(t) {
    const apply = () => {
      const ctx = t.getContext();
      document.documentElement.dataset.theme = (ctx.theme || ctx.initialTheme) === 'dark' ? 'dark' : 'light';
    };
    apply();
    t.subscribeToThemeChanges?.(apply);
  }
  async function getSettings(t) {
    return cleanSettings(await t.get('board', 'shared', STORAGE_KEY, null));
  }
  async function saveSettings(t, settings) {
    if (!t.memberCanWriteToModel('board')) throw new Error('You need board edit permission to change settings.');
    const clean = cleanSettings(settings);
    const bytes = JSON.stringify({[STORAGE_KEY]: clean}).length;
    if (bytes > 3700) throw new Error('The button configuration is too large for Trello storage. Remove buttons or shorten text.');
    await t.set('board', 'shared', STORAGE_KEY, clean);
    return clean;
  }
  async function isAuthorized(t) {
    if (!configured()) return false;
    return t.getRestApi().isAuthorized();
  }
  async function authorize(t) {
    if (!configured()) throw new Error('Set the new Power-Up API key in config.js first.');
    return t.getRestApi().authorize({scope: 'read,write'});
  }
  async function api(t, path, {method = 'GET', query = {}, body} = {}) {
    if (!configured()) throw new Error('Missing Power-Up API key. Update config.js.');
    const token = await t.getRestApi().getToken();
    if (!token) throw new Error('Connect your Trello account to use these buttons.');
    const url = new URL('https://api.trello.com/1' + path);
    url.searchParams.set('key', CONFIG.appKey);
    // Keep token out of the URL, which might be logged by proxies, as much as Trello supports.
    // Trello REST supports key+token via query parameters for Power-Up auth.
    url.searchParams.set('token', token);
    Object.entries(query).forEach(([key, val]) => { if (val !== undefined && val !== null) url.searchParams.set(key, String(val)); });
    const response = await fetch(url.href, {method, headers: {Accept: 'application/json', ...(body !== undefined ? {'Content-Type': 'application/json'} : {})}, ...(body !== undefined ? {body: JSON.stringify(body)} : {})});
    if (!response.ok) {
      let detail = (await response.text()).slice(0, 180).replace(/<[^>]*>/g, '');
      throw new Error(`Trello error ${response.status}${detail ? ': ' + detail : ''}`);
    }
    const responseType = response.headers.get('content-type') || '';
    return response.status === 204 ? null : responseType.includes('json') ? response.json() : response.text();
  }
  const boards = async (t) => (await api(t, '/members/me/boards', {query: {filter:'open',fields:'name,id,closed',limit:1000}})).filter(x => !x.closed).sort((a,b) => a.name.localeCompare(b.name));
  const lists = (t, boardId) => api(t, `/boards/${encodeURIComponent(boardId)}/lists`, {query: {filter: 'open',fields:'name,id,pos'}});
  const members = (t, boardId) => api(t, `/boards/${encodeURIComponent(boardId)}/members`, {query: {fields:'fullName,username,id'}});
  const labels = (t, boardId) => api(t, `/boards/${encodeURIComponent(boardId)}/labels`, {query: {limit:1000,fields:'name,color'}});
  const errorText = (e) => e instanceof Error ? e.message : String(e);
  function actionReady(button) {
    switch (button.type) {
      case 'move': return !!button.boardId && !!button.listId;
      case 'member_add': case 'member_remove': return !!button.memberId;
      case 'label_add': case 'label_remove': return !!button.labelId;
      case 'comment': return !!button.comment.trim();
      default: return true;
    }
  }
  function actionDetails(button) {
    switch (button.type) {
      case 'move': return button.targetName || 'Choose a destination';
      case 'member_add': return 'Assign a team member';
      case 'member_remove': return 'Unassign a team member';
      case 'label_add': return 'Apply a label';
      case 'label_remove': return 'Remove a label';
      case 'start_today': return 'Set the start date';
      case 'due_today': return 'Due today';
      case 'due_tomorrow': return 'Due tomorrow';
      case 'due_clear': return 'Remove due date';
      case 'due_complete': return 'Complete due date';
      case 'comment': return 'Post a saved comment';
      case 'archive': return 'Archive this card';
      default: return 'Quick action';
    }
  }
  function contrastText(hex) {
    const raw = hex.slice(1); const [r,g,b] = [0,2,4].map(i => parseInt(raw.slice(i,i+2), 16) / 255);
    const lum = [r,g,b].map(c => c <= .04045 ? c / 12.92 : Math.pow((c + .055)/1.055,2.4));
    return lum[0]*.2126 + lum[1]*.7152 + lum[2]*.0722 > .179 ? '#17202e' : '#ffffff';
  }
  return {CONFIG, DEFAULT_COLOR, MAX_BUTTONS, TYPES, id, defaults, cleanSettings, safeColor, contrastText,
    connect, configured, theme, getSettings, saveSettings, isAuthorized, authorize, api, boards, lists,
    members, labels, errorText, actionReady, actionDetails};
})();
