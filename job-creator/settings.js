'use strict';

(async () => {
  const J = JobCreator;
  const t = J.connect();
  J.initTheme(t);

  const form = document.getElementById('settingsForm');
  const nextNumber = document.getElementById('nextNumber');
  const counterHint = document.getElementById('counterHint');
  const defaultBoard = document.getElementById('defaultBoard');
  const defaultList = document.getElementById('defaultList');
  const templateBoard = document.getElementById('templateBoard');
  const templateCard = document.getElementById('templateCard');
  const message = document.getElementById('message');
  const saveButton = document.getElementById('saveButton');
  let boards = [];
  let scope = 'board';
  let loading = false;
  let initialized = false;

  function report(error) { J.showStatus(message, J.errorText(error), true); }

  async function updateLists(boardId, preferred = '') {
    defaultList.disabled = true;
    J.selectOptions(defaultList, [], '', boardId ? 'Loading lists…' : 'Select a default board');
    if (!boardId) return;
    const lists = await J.getLists(t, boardId);
    if (defaultBoard.value !== boardId) return;
    J.selectOptions(defaultList, lists, preferred, 'Select a default list');
    if (!defaultList.value && lists.length) defaultList.value = lists[0].id;
    defaultList.disabled = !lists.length;
  }

  async function updateTemplates(boardId, preferred = '') {
    templateCard.disabled = true;
    J.selectOptions(templateCard, [], '', boardId ? 'Loading templates…' : 'No template (blank card)');
    if (!boardId) { templateCard.disabled = false; return; }
    const templates = await J.getTemplates(t, boardId);
    if (templateBoard.value !== boardId) return;
    J.selectOptions(templateCard, templates, preferred, templates.length ? 'No template (blank card)' : 'No templates found (blank card)');
    templateCard.disabled = false;
  }

  defaultBoard.addEventListener('change', async () => {
    try { await updateLists(defaultBoard.value); }
    catch (err) { report(err); }
  });
  templateBoard.addEventListener('change', async () => {
    try { await updateTemplates(templateBoard.value); }
    catch (err) { report(err); }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (loading || !initialized) return;
    const number = Number(nextNumber.value);
    if (!Number.isSafeInteger(number) || number < 1) {
      J.showStatus(message, 'Enter a positive whole number.', true);
      return;
    }
    if (!defaultBoard.value || !defaultList.value) {
      J.showStatus(message, 'Choose a default board and list.', true);
      return;
    }
    if (!boards.some(b => b.id === defaultBoard.value)) {
      J.showStatus(message, 'Selected destination board is not available.', true);
      return;
    }
    loading = true;
    saveButton.disabled = true;
    saveButton.textContent = 'Saving…';
    J.showStatus(message, '');
    try {
      const settings = {
        defaultBoardId: defaultBoard.value,
        defaultListId: defaultList.value,
        templateBoardId: templateBoard.value,
        templateCardId: templateCard.value,
        position: form.querySelector('input[name="position"]:checked').value
      };
      // Save settings before the counter so a counter permission failure does
      // not silently leave the UI claiming that everything was saved.
      await J.saveSettings(t, settings);
      await J.saveNextNumber(t, number, scope);
      J.showStatus(message, 'Settings saved successfully.', false);
    } catch (err) {
      console.error('Job Creator save settings:', err);
      report(err);
    } finally {
      loading = false;
      saveButton.disabled = false;
      saveButton.textContent = 'Save Settings →';
    }
  });

  try {
    const thisBoard = await t.board('id');
    const [settings, boardOptions, next] = await Promise.all([
      J.getSettings(t), J.getBoards(t), J.getNextNumber(t)
    ]);
    boards = boardOptions;
    scope = next.scope;
    nextNumber.value = String(next.number);
    counterHint.textContent = scope === 'organization'
      ? 'Shared across boards in this Trello Workspace. Avoid creating jobs at the exact same time until a server-backed counter is added.'
      : 'Stored on this board only. Numbers on different boards are not synchronized.';

    J.selectOptions(defaultBoard, boards, settings.defaultBoardId || thisBoard.id, 'Select a board');
    if (!defaultBoard.value && boards.length) defaultBoard.value = boards[0].id;
    defaultBoard.disabled = !boards.length;

    const templateBoardId = settings.templateBoardId || defaultBoard.value;
    J.selectOptions(templateBoard, boards, templateBoardId, 'No template board');
    templateBoard.disabled = !boards.length;
    form.querySelector(`input[name="position"][value="${settings.position === 'bottom' ? 'bottom' : 'top'}"]`).checked = true;

    await Promise.all([
      updateLists(defaultBoard.value, settings.defaultListId),
      updateTemplates(templateBoard.value, settings.templateCardId)
    ]);
    nextNumber.disabled = false;
    saveButton.disabled = false;
    initialized = true;
  } catch (err) {
    console.error('Job Creator settings initialization:', err);
    report(err);
  }
})();
