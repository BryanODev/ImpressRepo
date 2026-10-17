'use strict';
(function () {
  const config = window.IMPRESS_DESIGN_CONFIG;
  const t = window.TrelloPowerUp.iframe({ appKey: config.appKey, appName: config.appName });
  const $ = (id) => document.getElementById(id);
  const state = { cards: [], filter: 'all', search: '', board: null, member: null, notificationsAvailable: false, truncated: false, loading: false };
  const apiBase = 'https://api.trello.com/1';
  const colorMap = {
    green: ['#d4f4df','#155c36'], yellow: ['#fff0b3','#6c4d00'], orange: ['#ffe3c4','#753e00'],
    red: ['#ffdbdc','#852e37'], purple: ['#eddaff','#6434a7'], blue: ['#d8e8ff','#205a9b'],
    sky: ['#d6f7fb','#216476'], lime: ['#e1f5c7','#425d17'], pink: ['#ffdce9','#85385a'], black: ['#d1d8e2','#283241']
  };

  function theme() {
    const context = t.getContext() || {};
    document.documentElement.setAttribute('data-theme', context.theme || context.initialTheme || 'light');
  }
  theme();
  if (typeof t.subscribeToThemeChanges === 'function') {
    t.subscribeToThemeChanges(theme);
  }

  function visible(id, enabled) { $(id).classList.toggle('hidden', !enabled); }
  function text(id, value) { $(id).textContent = value; }
  function element(tag, cls, label) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (label !== undefined) node.textContent = label;
    return node;
  }
  function showError(message) { text('error', message); visible('error', !!message); }
  function loading(isLoading) {
    state.loading = isLoading;
    $('refresh').disabled = isLoading;
    visible('loading', isLoading);
  }
  function dateStatus(card, now = Date.now()) {
    if (!card.due) return null;
    const target = Date.parse(card.due);
    if (!Number.isFinite(target)) return null;
    const days = (target - now) / 86400000;
    const formatted = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(target);
    if (card.dueComplete) return { label: `✓ Due ${formatted}`, kind: 'done', soon: false };
    if (target < now) return { label: `Overdue · ${formatted}`, kind: 'overdue', soon: true };
    if (days <= 7) return { label: `Due ${formatted}`, kind: 'due-soon', soon: true };
    return { label: `Due ${formatted}`, kind: '', soon: false };
  }
  function notifyCardId(notification) {
    return notification?.data?.card?.id || notification?.card?.id || notification?.data?.idCard || null;
  }
  function badges(card) {
    const b = card.badges || {};
    const result = [];
    if (b.comments > 0) result.push(['◉', `${b.comments} comment${b.comments === 1 ? '' : 's'}`]);
    if (b.attachments > 0) result.push(['▤', `${b.attachments} attachment${b.attachments === 1 ? '' : 's'}`]);
    if (b.checkItems > 0) result.push(['☑', `${b.checkItemsChecked || 0}/${b.checkItems}`]);
    if (b.votes > 0) result.push(['♡', `${b.votes} vote${b.votes === 1 ? '' : 's'}`]);
    if (b.subscribed) result.push(['◉', 'Watching']);
    return result;
  }

  async function api(path, token, params = {}) {
    const url = new URL(`${apiBase}/${path.replace(/^\//, '')}`);
    const search = new URLSearchParams({ ...params, key: config.appKey, token });
    url.search = search.toString();
    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) {
      let message = `Trello request failed (${response.status}).`;
      if (response.status === 401) message = 'Trello authorization expired. Please reconnect.';
      if (response.status === 429) message = 'Trello API rate limit reached. Please retry in a moment.';
      throw new Error(message);
    }
    return response.json();
  }

  async function fetchUnread(token) {
    const rows = [];
    const pageSize = 100;
    // Cap at 10 pages to avoid unbounded API usage. Make a partial result explicit.
    for (let page = 0; page < 10; page++) {
      const pageRows = await api('members/me/notifications', token, {
        read_filter: 'unread', filter: 'all', fields: 'id,type,date,unread,data',
        limit: String(pageSize), page: String(page)
      });
      if (!Array.isArray(pageRows)) throw new Error('Unexpected Trello notifications response.');
      rows.push(...pageRows.filter(row => row.unread === true));
      if (pageRows.length < pageSize) return { items: rows, truncated: false };
    }
    return { items: rows, truncated: true };
  }

  async function connect() {
    const button = $('connectBtn');
    button.disabled = true;
    try {
      const client = t.getRestApi();
      await client.authorize({ scope: 'read', expiration: 'never' });
      visible('connectPanel', false);
      await load();
    } catch (error) {
      showError(`Unable to connect Trello: ${error.message || String(error)}. Check the API key and Allowed Origins.`);
    } finally {
      button.disabled = false;
    }
  }

  async function load() {
    if (state.loading) return;
    showError('');
    visible('connectPanel', false);
    visible('cards', false);
    visible('empty', false);
    const configured = Boolean(config?.appKey && !config.appKey.includes('PASTE_'));
    if (!configured) {
      loading(false);
      showError('Configure your public Trello API key in config.js first.');
      return;
    }
    loading(true);
    try {
      const token = await t.getRestApi().getToken();
      if (!token) {
        visible('summary', false);
        visible('controls', false);
        visible('connectPanel', true);
        return;
      }
      const board = await t.board('id', 'name');
      if (!board || !board.id) throw new Error('The current board could not be identified.');
      state.board = board;
      text('subtitle', `Assigned to you · ${board.name}`);
      const [member, cards, lists, notificationsResult] = await Promise.all([
        api('members/me', token, { fields: 'id,fullName' }),
        api(`boards/${board.id}/cards`, token, { fields: 'id,name,idList,idMembers,labels,badges,due,dueComplete,shortUrl,dateLastActivity,closed' }),
        api(`boards/${board.id}/lists`, token, { fields: 'id,name,pos,closed', filter: 'all' }),
        fetchUnread(token).then(value => ({ value })).catch(error => ({ error }))
      ]);
      state.member = member;
      if (!member?.id) throw new Error('Could not identify the logged-in Trello user.');
      if (!Array.isArray(cards) || !Array.isArray(lists)) throw new Error('Invalid board data received from Trello.');
      const byList = new Map(lists.map(list => [list.id, list.name]));
      const counts = new Map();
      state.notificationsAvailable = !notificationsResult.error;
      state.truncated = Boolean(notificationsResult.value?.truncated);
      if (state.notificationsAvailable) {
        for (const notification of notificationsResult.value.items) {
          const cardId = notifyCardId(notification);
          if (cardId) counts.set(cardId, (counts.get(cardId) || 0) + 1);
        }
      }
      state.cards = cards
        .filter(card => !card.closed && Array.isArray(card.idMembers) && card.idMembers.includes(member.id))
        .map(card => ({ ...card, listName: byList.get(card.idList) || 'Unknown list', unread: counts.get(card.id) || 0 }));
      render();
      text('updated', `Updated ${new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date())}`);
      if (notificationsResult.error) {
        showError('Cards loaded, but unread notifications could not be retrieved. Unread status is unavailable; retry Refresh.');
      } else if (state.truncated) {
        showError('There are more than 1,000 unread notifications. Unread counts may be incomplete.');
      }
    } catch (error) {
      visible('summary', false);
      visible('controls', false);
      showError(error.message || String(error));
    } finally {
      loading(false);
    }
  }

  function chip(label, kind = '') { return element('span', `chip ${kind}`, label); }
  function buildCard(card) {
    const job = element('article', `job ${card.unread ? 'is-unread' : ''}`);
    job.tabIndex = 0;
    job.setAttribute('role', 'button');
    job.setAttribute('aria-label', `Open ${card.name}`);
    const head = element('div', 'job-head');
    head.appendChild(element('div', 'job-title', card.name));
    if (card.unread > 0) {
      const indicator = element('span', 'unread-pill');
      indicator.appendChild(element('span', 'unread-dot'));
      indicator.appendChild(document.createTextNode(`${card.unread} unread`));
      head.appendChild(indicator);
    }
    job.appendChild(head);

    const location = element('div', 'job-location');
    location.appendChild(element('span', '', 'LIST'));
    location.appendChild(element('span', 'where', card.listName));
    job.appendChild(location);

    const labels = element('div', 'job-labels');
    for (const label of card.labels || []) {
      const swatch = colorMap[label.color] || ['#dfe4eb', '#344258'];
      const tag = element('span', `tag ${label.name ? '' : 'unnamed'}`, label.name || '');
      tag.style.background = swatch[0];
      tag.style.color = swatch[1];
      tag.style.borderColor = swatch[0];
      tag.title = label.name || `${label.color || 'Uncolored'} label`;
      labels.appendChild(tag);
    }
    if (!labels.childElementCount) labels.appendChild(element('span', 'no-labels', 'No labels'));
    job.appendChild(labels);

    const bottom = element('div', 'job-bottom');
    const due = dateStatus(card);
    if (due) bottom.appendChild(chip(due.label, due.kind));
    for (const [symbol, label] of badges(card)) bottom.appendChild(chip(`${symbol} ${label}`));
    if (!bottom.childElementCount) bottom.appendChild(chip('No Trello badges'));
    job.appendChild(bottom);

    job.addEventListener('click', () => openCard(card));
    job.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openCard(card); }
    });
    return job;
  }
  async function openCard(card) {
    // Open in Trello's own card interface, keeping all interactions in Trello.
    try {
      await t.showCard(card.id);
      await t.closeModal();
    } catch (error) {
      // Fallback: opening the official card link on a different tab.
      if (card.shortUrl && /^https:\/\/trello\.com\/c\//.test(card.shortUrl)) {
        window.open(card.shortUrl, '_blank', 'noopener,noreferrer');
      } else {
        showError(`Could not open the card: ${error.message || String(error)}`);
      }
    }
  }

  function render() {
    const all = state.cards;
    const unreadCards = all.filter(card => card.unread > 0);
    const dueSoonCards = all.filter(card => dateStatus(card)?.soon);
    text('assignedCount', String(all.length));
    text('unreadCount', state.notificationsAvailable ? String(unreadCards.length) : '—');
    text('dueCount', String(dueSoonCards.length));
    text('allFilterCount', String(all.length));
    text('unreadFilterCount', state.notificationsAvailable ? String(unreadCards.length) : '—');
    text('dueFilterCount', String(dueSoonCards.length));
    $('controls').querySelector('[data-filter="unread"]').disabled = !state.notificationsAvailable;
    visible('summary', true);
    visible('controls', true);
    document.querySelectorAll('[data-filter]').forEach(node => node.classList.toggle('active', node.dataset.filter === state.filter));

    const query = state.search.trim().toLocaleLowerCase();
    const filtered = all.filter(card => {
      if (state.filter === 'unread' && (!state.notificationsAvailable || card.unread <= 0)) return false;
      if (state.filter === 'due' && !dateStatus(card)?.soon) return false;
      if (query && ![card.name, card.listName, ...(card.labels || []).map(label => label.name || '')].join(' ').toLocaleLowerCase().includes(query)) return false;
      return true;
    });
    filtered.sort((a, b) => {
      if ((b.unread > 0) !== (a.unread > 0)) return Number(b.unread > 0) - Number(a.unread > 0);
      const aDue = a.due && !a.dueComplete ? Date.parse(a.due) : Number.POSITIVE_INFINITY;
      const bDue = b.due && !b.dueComplete ? Date.parse(b.due) : Number.POSITIVE_INFINITY;
      return aDue - bDue || a.name.localeCompare(b.name);
    });
    const cards = $('cards');
    cards.replaceChildren(...filtered.map(buildCard));
    visible('cards', filtered.length > 0);
    visible('empty', filtered.length === 0);
    text('emptyText', all.length === 0 ? 'You have no active cards assigned to you on this board.' : 'No cards match your current filter or search.');
  }

  $('connectBtn').addEventListener('click', connect);
  $('refresh').addEventListener('click', load);
  $('search').addEventListener('input', event => { state.search = event.target.value; if (!state.loading) render(); });
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    if (button.disabled) return;
    state.filter = button.dataset.filter;
    render();
  }));
  load();
}());
