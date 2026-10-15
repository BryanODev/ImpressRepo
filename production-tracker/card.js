'use strict';

(async function () {
  const t = window.TrelloPowerUp.iframe();
  const U = window.PT;
  const app = document.getElementById('app');
  const state = { items: [], templates: [], expanded: null, adding: false, editing: null, pending: false };
  const context = t.getContext() || {};
  const expandedKey = `production-tracker-expanded-${context.card || 'card'}`;

  function rememberExpanded(id) {
    state.expanded = id;
    try {
      if (id) sessionStorage.setItem(expandedKey, id);
      else sessionStorage.removeItem(expandedKey);
    } catch (_) { /* Third-party storage may be unavailable. */ }
  }

  function getRememberedExpanded() {
    try { return sessionStorage.getItem(expandedKey); } catch (_) { return null; }
  }

  async function load() {
    const [items, templates] = await Promise.all([
      t.get('card', 'shared', 'productionItems', []),
      t.get('board', 'shared', 'productionTemplates', null),
    ]);
    state.items = Array.isArray(items) ? items : [];
    state.templates = Array.isArray(templates) ? templates : U.clone(window.ProductionDefaults);
    const remembered = getRememberedExpanded();
    state.expanded = state.items.some((i) => i.id === remembered)
      ? remembered
      : (state.items.find((i) => i.steps.some((s) => !s.done)) || state.items[0] || {}).id || null;
    render();
  }

  async function saveItems() {
    if (state.pending) return;
    state.pending = true;
    try {
      await t.set('card', 'shared', 'productionItems', state.items);
      await load();
    } catch (error) {
      await load().catch(() => {});
      U.error(app, `Could not save the item. ${error.message || error}`);
    } finally {
      state.pending = false;
    }
  }

  function countDone(steps) { return steps.filter((step) => step.done).length; }

  function makeProgress(done, total) {
    const track = U.el('div', 'progress');
    const fill = U.el('div', done === total && total > 0 ? 'completed' : '');
    fill.style.width = `${total ? (done / total) * 100 : 0}%`;
    track.append(fill);
    return track;
  }

  function makeSummary() {
    const root = U.el('section', 'progress-summary');
    const allSteps = state.items.flatMap((item) => item.steps);
    const completed = countDone(allSteps);
    const completedItems = state.items.filter((item) => item.steps.length && countDone(item.steps) === item.steps.length).length;
    const percent = allSteps.length ? Math.round(100 * completed / allSteps.length) : 0;
    const top = U.el('div', 'summary-top');
    top.append(U.el('span', 'strong', 'Overall production progress'), U.el('span', 'strong', `${percent}%`));
    const bottom = U.el('div', 'summary-bottom');
    bottom.append(U.el('span', 'muted', `${completedItems} of ${state.items.length} items completed`),
      U.el('span', 'muted', `${completed} / ${allSteps.length} steps`));
    root.append(top, makeProgress(completed, allSteps.length), bottom);
    return root;
  }

  function renderItem(item) {
    const panel = U.el('section', 'item');
    const done = countDone(item.steps);
    const header = U.el('button', 'item-header');
    header.type = 'button';
    header.setAttribute('aria-expanded', String(state.expanded === item.id));
    const caret = U.el('span', 'chevron', state.expanded === item.id ? '▾' : '▸');
    const titleWrap = U.el('div', 'item-title-wrap');
    const titleBlock = U.el('div');
    titleBlock.append(U.el('div', 'item-title', item.name));
    titleBlock.append(U.el('div', 'muted', `${item.templateName}${item.detail ? ` · ${item.detail}` : ''}`));
    titleWrap.append(titleBlock);
    header.append(caret, titleWrap, makeProgress(done, item.steps.length), U.el('span', 'item-count', `${done}/${item.steps.length}`));
    header.addEventListener('click', () => {
      rememberExpanded(state.expanded === item.id ? null : item.id);
      render();
    });
    panel.append(header);
    if (state.expanded !== item.id) return panel;

    const body = U.el('div', 'item-body');
    if (!item.steps.length) body.append(U.el('p', 'muted', 'This item has no checklist steps.'));

    for (const step of item.steps) {
      const label = U.el('label', `step-row ${step.done ? 'checked' : ''}`);
      const check = U.el('input');
      check.type = 'checkbox';
      check.checked = Boolean(step.done);
      check.addEventListener('change', async () => {
        if (state.pending) return;
        step.done = check.checked;
        await saveItems();
      });
      label.append(check, U.el('span', '', step.text));
      body.append(label);
    }

    if (state.editing === item.id) {
      const editBox = U.el('div', 'form-box');
      let newName = item.name;
      let newDetail = item.detail || '';
      editBox.append(U.field('Item name', item.name, (value) => { newName = value; }));
      editBox.append(U.field('Details (optional)', newDetail, (value) => { newDetail = value; }));
      const buttons = U.el('div', 'actions');
      buttons.append(U.button('Save item', async () => {
        if (!newName.trim()) return U.error(app, 'Item name cannot be empty.');
        item.name = newName.trim();
        item.detail = newDetail.trim();
        state.editing = null;
        await saveItems();
      }, 'primary'));
      buttons.append(U.button('Cancel', () => { state.editing = null; render(); }, 'ghost'));
      editBox.append(buttons);
      body.append(editBox);
    } else {
      const footer = U.el('div', 'row-footer');
      footer.append(U.button('Edit item', () => { state.editing = item.id; render(); }, 'ghost'));
      footer.append(U.button('Remove item', async () => {
        if (!window.confirm(`Remove ${item.name} and its checklist from this order?`)) return;
        state.items = state.items.filter((entry) => entry.id !== item.id);
        rememberExpanded(null);
        await saveItems();
      }, 'danger'));
      body.append(footer);
    }
    panel.append(body);
    return panel;
  }

  function renderAddForm() {
    const root = U.el('section', 'form-box');
    root.append(U.el('h3', '', 'Add production item'));
    if (!state.templates.length) {
      root.append(U.el('p', 'muted', 'Create a template in the Power-Up settings first.'));
      root.append(U.button('Cancel', () => { state.adding = false; render(); }, 'ghost'));
      return root;
    }
    let templateId = state.templates[0].id;
    let name = '';
    let details = '';
    const form = U.el('div', 'form-grid');
    const templateWrapper = U.el('label', 'field');
    templateWrapper.append(U.el('span', 'field-label', 'Checklist template'));
    const select = U.el('select', 'select');
    state.templates.forEach((template) => {
      const option = U.el('option', '', template.name);
      option.value = template.id;
      select.append(option);
    });
    select.addEventListener('change', () => { templateId = select.value; });
    templateWrapper.append(select);
    form.append(templateWrapper);
    form.append(U.field('Item name (optional)', '', (value) => { name = value; }, 'e.g. ACM #2'));
    form.append(U.field('Details (optional)', '', (value) => { details = value; }, 'e.g. 3 mm, 4 × 8 ft'));
    root.append(form);
    const actions = U.el('div', 'actions');
    actions.append(U.button('Add item', async () => {
      if (state.pending) return;
      const template = state.templates.find((value) => value.id === templateId);
      if (!template) return;
      const nextNum = 1 + state.items.filter((item) => item.templateId === templateId).length;
      const newItem = {
        id: U.id(), templateId: template.id, templateName: template.name,
        name: name.trim() || `${template.name} #${nextNum}`, detail: details.trim(),
        steps: template.steps.map((text) => ({ id: U.id(), text, done: false })),
      };
      state.items.push(newItem);
      rememberExpanded(newItem.id);
      state.adding = false;
      await saveItems();
    }, 'primary'));
    actions.append(U.button('Cancel', () => { state.adding = false; render(); }, 'ghost'));
    root.append(actions);
    return root;
  }

  function render() {
    app.replaceChildren();
    const top = U.el('div', 'toolbar');
    top.append(U.el('h2', '', 'Production Items'), U.el('span', 'counter', `${state.items.length} items`));
    app.append(top);
    if (state.items.length) {
      app.append(makeSummary());
      state.items.forEach((item) => app.append(renderItem(item)));
    } else {
      app.append(U.el('div', 'empty', 'No production items yet. Add an item from one of your checklist templates.'));
    }
    if (state.adding) app.append(renderAddForm());
    else app.append(U.button('+ Add Production Item', () => { state.adding = true; render(); }, 'outline'));
    U.resize(t);
  }

  t.render(() => load().catch((error) => U.error(app, `Could not load the card: ${error.message || error}`)));
})();
