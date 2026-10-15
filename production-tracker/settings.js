'use strict';

(function () {
  const t = window.TrelloPowerUp.iframe();
  const U = window.PT;
  const app = document.getElementById('app');
  const state = { templates: [], selectedId: null, dirty: false, saving: false };

  const selected = () => state.templates.find((template) => template.id === state.selectedId);
  const markDirty = () => { state.dirty = true; };

  async function save() {
    if (state.saving) return;
    const names = state.templates.map((value) => value.name.trim());
    if (names.some((value) => !value)) return U.error(app, 'All templates must have a name.');
    if (state.templates.some((value) => value.steps.some((text) => !text.trim()))) {
      return U.error(app, 'Checklist steps cannot be empty.');
    }
    state.saving = true;
    try {
      await t.set('board', 'shared', 'productionTemplates', state.templates);
      state.dirty = false;
      render();
      const notice = U.el('div', 'notice success', 'Templates saved. New production items will use these updated templates.');
      app.prepend(notice);
    } catch (error) {
      U.error(app, `Could not save templates. ${error.message || error}`);
    } finally {
      state.saving = false;
    }
  }

  function create() {
    const id = U.id();
    state.templates.push({ id, name: 'New Template', area: 'Unassigned', steps: [] });
    state.selectedId = id;
    markDirty();
    render();
  }

  function duplicate() {
    const template = selected();
    if (!template) return;
    const copy = U.clone(template);
    copy.id = U.id();
    copy.name += ' (Copy)';
    state.templates.push(copy);
    state.selectedId = copy.id;
    markDirty();
    render();
  }

  function remove() {
    const template = selected();
    if (!template || !window.confirm(`Delete template "${template.name}"? Existing production items will not be changed.`)) return;
    state.templates = state.templates.filter((value) => value.id !== template.id);
    state.selectedId = state.templates[0]?.id || null;
    markDirty();
    render();
  }

  function renderSidebar() {
    const side = U.el('aside', 'panel');
    side.append(U.el('h3', '', 'Templates'), U.el('p', 'muted', 'Select one to edit its checklist.'));
    side.append(U.el('div', 'separator'));
    for (const template of state.templates) {
      const button = U.button('', () => { state.selectedId = template.id; render(); });
      button.className = `btn template-option ${state.selectedId === template.id ? 'selected' : ''}`;
      button.replaceChildren(U.el('span', 'strong', template.name),
        U.el('span', 'muted', `${template.area} · ${template.steps.length} steps`));
      side.append(button);
    }
    const add = U.button('+ New Template', create, 'outline');
    add.classList.add('btn-full');
    side.append(add);
    return side;
  }

  function renderEditor() {
    const editor = U.el('section', 'panel');
    const template = selected();
    if (!template) {
      editor.append(U.el('p', 'muted', 'Choose or create a template to start editing.'));
      return editor;
    }
    const head = U.el('div', 'editor-head');
    head.append(U.el('h3', '', `Editing: ${template.name}`));
    head.append(U.button('Duplicate', duplicate, 'outline'));
    editor.append(head);
    const fields = U.el('div', 'form-grid');
    fields.append(U.field('Template name', template.name, (value) => {
      template.name = value;
      markDirty();
    }));
    fields.append(U.field('Production area', template.area, (value) => {
      template.area = value;
      markDirty();
    }));
    editor.append(fields, U.el('div', 'separator'), U.el('h3', '', 'Checklist steps'));
    editor.append(U.el('p', 'muted', 'Edit, reorder, remove, or add steps.'));

    template.steps.forEach((text, index) => {
      const line = U.el('div', 'step-edit');
      const input = U.el('input', 'input');
      input.value = text;
      input.setAttribute('aria-label', `Step ${index + 1}`);
      input.addEventListener('input', () => { template.steps[index] = input.value; markDirty(); });
      const up = U.button('↑', () => {
        if (!index) return;
        [template.steps[index - 1], template.steps[index]] = [template.steps[index], template.steps[index - 1]];
        markDirty(); render();
      }, 'ghost');
      up.title = 'Move step up';
      up.disabled = index === 0;
      const down = U.button('↓', () => {
        if (index === template.steps.length - 1) return;
        [template.steps[index + 1], template.steps[index]] = [template.steps[index], template.steps[index + 1]];
        markDirty(); render();
      }, 'ghost');
      down.title = 'Move step down';
      down.disabled = index === template.steps.length - 1;
      const del = U.button('×', () => { template.steps.splice(index, 1); markDirty(); render(); }, 'danger');
      del.title = 'Remove step';
      line.append(U.el('span', 'step-index', String(index + 1)), input, up, down, del);
      editor.append(line);
    });

    const newStep = U.el('div', 'step-edit');
    const input = U.el('input', 'input');
    input.placeholder = 'Enter a new checklist step';
    const add = () => {
      const value = input.value.trim();
      if (!value) return;
      template.steps.push(value);
      markDirty(); render();
    };
    input.addEventListener('keydown', (event) => { if (event.key === 'Enter') add(); });
    newStep.append(input, U.button('+ Add Step', add, 'outline'));
    editor.append(newStep);
    const footer = U.el('div', 'actions');
    footer.append(U.button('Delete template', remove, 'danger'));
    editor.append(footer);
    return editor;
  }

  function render() {
    app.replaceChildren();
    const header = U.el('div', 'settings-header');
    const title = U.el('div');
    title.append(U.el('h2', '', 'Production Templates'),
      U.el('p', 'muted', 'Templates are shared on this Trello board. Existing items keep their own checklists.'));
    header.append(title, U.button(state.dirty ? 'Save Changes *' : 'Save Changes', save, 'primary'));
    const layout = U.el('div', 'settings-layout');
    layout.append(renderSidebar(), renderEditor());
    app.append(header, layout);
  }

  t.render(async () => {
    try {
      const saved = await t.get('board', 'shared', 'productionTemplates', null);
      state.templates = Array.isArray(saved) ? saved : U.clone(window.ProductionDefaults);
      state.selectedId = state.templates[0]?.id || null;
      state.dirty = false;
      render();
    } catch (error) {
      U.error(app, `Could not load templates. ${error.message || error}`);
    }
  });
})();
