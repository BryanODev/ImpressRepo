'use strict';

(async () => {
  const J = window.JobCreator;
  const t = J.connect();
  J.initTheme(t);

  const form = document.getElementById('jobForm');
  const name = document.getElementById('jobName');
  const board = document.getElementById('boardSelect');
  const list = document.getElementById('listSelect');
  const preview = document.getElementById('preview');
  const numberLabel = document.getElementById('jobNumber');
  const button = document.getElementById('createButton');
  const message = document.getElementById('message');
  const automaticNote = document.getElementById('automaticNote');
  let currentBoardId = '';
  let boardData = [];
  let config = null;
  let busy = false;
  let available = false;

  function updatePreview(nextNumber) {
    const suffix = name.value.trim() || 'Your job name';
    preview.textContent = `${J.formatNumber(nextNumber)} - ${suffix}`;
  }

  function showError(err) { J.showStatus(message, J.errorText(err), true); }

  async function loadLists(boardId, preselect = '') {
    list.disabled = true;
    J.selectOptions(list, [], '', boardId ? 'Loading lists…' : 'Select a board first');
    if (!boardId) return;
    const lists = await J.getLists(t, boardId);
    // Guard against quick board switching while requests are in flight.
    if (board.value !== boardId) return;
    J.selectOptions(list, lists, preselect, 'Select a list');
    if (!list.value && lists.length) list.value = lists[0].id;
    list.disabled = !lists.length;
    if (!lists.length) J.showStatus(message, 'This board has no open lists.', true);
  }

  board.addEventListener('change', async () => {
    try {
      J.showStatus(message, '');
      await loadLists(board.value, '');
    } catch (err) { showError(err); }
  });
  name.addEventListener('input', () => updatePreview(Number(numberLabel.dataset.value || 1)));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || !available) return;
    const jobName = name.value.trim();
    if (!jobName || !board.value || !list.value) {
      J.showStatus(message, 'Enter a job name and choose a board and list.', true);
      return;
    }
    const targetBoard = board.value;
    const targetList = list.value;
    const validBoard = boardData.some(b => b.id === targetBoard);
    if (!validBoard) { J.showStatus(message, 'You do not have access to this board.', true); return; }

    busy = true;
    button.disabled = true;
    button.textContent = 'Creating job…';
    J.showStatus(message, '');

    try {
      const member = await t.member('id');
      if (!member || !member.id) throw new Error('Could not identify your Trello member.');

      // Read the number again just before creation in case someone else made a job.
      const next = await J.getNextNumber(t);
      const title = `${J.formatNumber(next.number)} - ${jobName}`;

      const dueDays = Number(config.dueInDays);
      if (!Number.isSafeInteger(dueDays) || dueDays < 0 || dueDays > 3650) {
        throw new Error('Invalid due date setting. Please update it in Power-Up Settings.');
      }
      const startDate = new Date();
      const dueDate = new Date(startDate);
      // Advance calendar days, preserving the creation time across DST changes.
      dueDate.setDate(dueDate.getDate() + dueDays);

      // Reserve the number first. Failed card creates may leave gaps, but won't
      // reuse an already reserved number in ordinary sequential usage.
      await J.saveNextNumber(t, next.number + 1, next.scope);

      const body = {
        name: title,
        idList: targetList,
        pos: config.position === 'bottom' ? 'bottom' : 'top',
        start: startDate.toISOString(),
        due: dueDate.toISOString(),
        idMembers: [member.id]
      };
      if (config.templateCardId) {
        body.idCardSource = config.templateCardId;
        // Deliberately exclude source members and dates. The new job gets
        // only its creator as a member and fresh start/due dates.
        body.keepFromSource = 'attachments,checklists,labels,customFields';
      }
      const card = await J.api(t, '/cards', {method: 'POST', body});
      J.showStatus(message, `${title} created. Opening the card…`, false);
      try {
        // This also supports a destination on a different board.
        await t.navigate({url: card.url || card.shortUrl || `https://trello.com/c/${card.shortLink}`});
      } catch (navError) {
        J.showStatus(message, `Job created: ${title}. Trello couldn't open it automatically.`, false);
        const link = document.createElement('a');
        link.href = card.url || card.shortUrl || `https://trello.com/c/${card.shortLink}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Open created job';
        message.append(' ', link);
      }
    } catch (err) {
      console.error('Job creation failed:', err);
      showError(err);
      button.disabled = false;
      button.textContent = 'Create Job →';
      // Reload counter in case an ID was already reserved. Never auto-retry POST.
      try {
        const next = await J.getNextNumber(t);
        numberLabel.textContent = J.formatNumber(next.number);
        numberLabel.dataset.value = String(next.number);
        updatePreview(next.number);
      } catch (_) { /* original error is displayed above */ }
    } finally {
      busy = false;
    }
  });

  try {
    const current = await t.board('id');
    currentBoardId = current.id;
    const [settings, boards, next] = await Promise.all([J.getSettings(t), J.getBoards(t), J.getNextNumber(t)]);
    config = settings;
    const dueDays = Number(settings.dueInDays);
    automaticNote.textContent = `You're assigned automatically. Start date: today. Due date: ${dueDays === 0 ? 'today' : `in ${dueDays} calendar day${dueDays === 1 ? '' : 's'}`}.`;
    boardData = boards;
    numberLabel.textContent = J.formatNumber(next.number);
    numberLabel.dataset.value = String(next.number);
    updatePreview(next.number);
    J.selectOptions(board, boards, settings.defaultBoardId || currentBoardId, 'Select a board');
    if (!board.value && boards.length) board.value = boards[0].id;
    board.disabled = !boards.length;
    await loadLists(board.value, settings.defaultListId);
    name.disabled = false;
    button.disabled = false;
    available = true;
    name.focus();
  } catch (err) {
    console.error('Job form initialization failed:', err);
    showError(err);
  }
})();
