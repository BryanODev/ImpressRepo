'use strict';
(async () => {
  const Q = window.QuickAccess;
  const t = Q.connect();
  Q.theme(t);
  const ui = Object.fromEntries(['app','buttons','empty','message','editButton','actionCount','authNotice','connectButton','confirmBox','confirmTitle','confirmText','cancelConfirm','acceptConfirm'].map(s=>[s,document.getElementById(s)]));
  let settings;
  let running = false;
  let pending = null;
  let hasAuth = false;
  const alert = (text, isError = false) => {
    ui.message.hidden = false;
    ui.message.textContent = text;
    ui.message.className = 'message ' + (isError ? 'error' : 'success');
    resize();
  };
  function resize() { requestAnimationFrame(() => t.sizeTo('#app').catch(() => {})); }
  function configureButton() {
    const url = t.signUrl(new URL('./settings.html', location.href).href);
    return t.modal({title:'Quick Access Settings',url,height:790,fullscreen:false});
  }
  ui.editButton.addEventListener('click', configureButton);
  ui.connectButton.addEventListener('click', async () => {
    ui.connectButton.disabled = true;
    try { await Q.authorize(t); hasAuth = true; ui.authNotice.hidden = true; alert('Connected! Click a shortcut to run it.'); }
    catch (error) { alert(Q.errorText(error),true); }
    finally { ui.connectButton.disabled = false; resize(); }
  });
  function confirmation(btn) {
    return new Promise(resolve => {
      pending = resolve;
      ui.confirmTitle.textContent = btn.type === 'archive' ? 'Archive this card?' : 'Run this action?';
      ui.confirmText.textContent = btn.type === 'archive' ? 'This card will be archived from its board.' : `Run “${btn.name}”?`;
      ui.confirmBox.hidden = false;
      resize();
    });
  }
  function settleConfirm(result) {
    ui.confirmBox.hidden = true;
    if (pending) {const callback=pending; pending=null; callback(result);}
    resize();
  }
  ui.cancelConfirm.addEventListener('click',()=>settleConfirm(false));
  ui.acceptConfirm.addEventListener('click',()=>settleConfirm(true));

  async function perform(btn) {
    const ctx = t.getContext();
    const cardId = ctx.card;
    if (!cardId) throw new Error('No Trello card is open.');
    const card = await Q.api(t, `/cards/${encodeURIComponent(cardId)}`, {query:{fields:'idBoard,idList,idMembers,idLabels,due,dueComplete,closed'}});
    if (card.closed) throw new Error('This card is archived.');
    const url = `/cards/${encodeURIComponent(cardId)}`;
    const method = 'PUT';
    switch(btn.type) {
      case 'move':
        if (card.idBoard === btn.boardId && card.idList === btn.listId) return 'Already in the selected list.';
        await Q.api(t,url,{method, body:{idBoard:btn.boardId,idList:btn.listId}});
        return 'Card moved successfully.';
      case 'member_add':
        if (card.idMembers.includes(btn.memberId)) return 'That member is already on the card.';
        await Q.api(t,`${url}/idMembers`,{method:'POST',query:{value:btn.memberId}});
        return 'Member added.';
      case 'member_remove':
        if (!card.idMembers.includes(btn.memberId)) return 'That member is not assigned.';
        await Q.api(t,`${url}/idMembers/${encodeURIComponent(btn.memberId)}`,{method:'DELETE'});
        return 'Member removed.';
      case 'label_add':
        if (card.idLabels.includes(btn.labelId)) return 'That label is already on the card.';
        await Q.api(t,`${url}/idLabels`,{method:'POST',query:{value:btn.labelId}});
        return 'Label added.';
      case 'label_remove':
        if (!card.idLabels.includes(btn.labelId)) return 'That label is not on the card.';
        await Q.api(t,`${url}/idLabels/${encodeURIComponent(btn.labelId)}`,{method:'DELETE'});
        return 'Label removed.';
      case 'start_today':
        await Q.api(t,url,{method,body:{start:new Date().toISOString()}});
        return 'Start date updated.';
      case 'due_today': case 'due_tomorrow': {
        const date = new Date();
        if (btn.type==='due_tomorrow') date.setDate(date.getDate()+1);
        await Q.api(t,url,{method,body:{due:date.toISOString(),dueComplete:false}});
        return 'Due date updated.';
      }
      case 'due_clear':
        await Q.api(t,url,{method,body:{due:null,dueComplete:false}});
        return 'Due date cleared.';
      case 'due_complete':
        if (!card.due) throw new Error('This card has no due date.');
        await Q.api(t,url,{method,body:{dueComplete:true}});
        return 'Due date marked complete.';
      case 'comment':
        await Q.api(t,`${url}/actions/comments`,{method:'POST',query:{text:btn.comment}});
        return 'Comment posted.';
      case 'archive':
        await Q.api(t,url,{method,body:{closed:true}});
        return 'Card archived.';
      default: throw new Error('Unsupported action.');
    }
  }
  async function run(btn, buttonElement) {
    if (running) return;
    if (!Q.actionReady(btn)) {alert('This shortcut needs a destination. Configure it in Settings.',true);return;}
    if (!t.memberCanWriteToModel('card')) {alert('You do not have permission to edit this card.',true);return;}
    if (!hasAuth) {ui.authNotice.hidden=false;alert('Connect Trello once, then click the shortcut again.',true);return;}
    if (btn.type === 'archive' && !(await confirmation(btn))) return;
    running = true;
    buttonElement.disabled = true;
    buttonElement.classList.add('working');
    ui.message.hidden = true;
    try { alert(await perform(btn)); }
    catch (error) { alert(Q.errorText(error),true); }
    finally {running=false;buttonElement.disabled=false;buttonElement.classList.remove('working');resize();}
  }
  function render() {
    ui.buttons.replaceChildren();
    ui.empty.hidden = settings.buttons.length !== 0;
    ui.actionCount.textContent = `${settings.buttons.length} ${settings.buttons.length===1?'button':'buttons'}`;
    for (const btn of settings.buttons) {
      const el = document.createElement('button');
      const ready = Q.actionReady(btn);
      const bg = Q.safeColor(btn.color,settings.defaultColor);
      el.className = 'quick-btn' + (ready ? '' : ' unconfigured');
      el.type = 'button';
      el.style.setProperty('--button-color', bg);
      el.style.setProperty('--button-text', Q.contrastText(bg));
      // Keep the card buttons visually identical to the Settings live preview.
      // Missing setup is explained on hover/focus and when the button is clicked.
      el.title = ready ? Q.actionDetails(btn) : 'Setup required: configure this shortcut in Settings.';
      el.setAttribute('aria-label', ready ? btn.name : `${btn.name} (setup required)`);
      const title = document.createElement('span');
      title.className = 'button-title';
      title.textContent = btn.name;
      const glyph = document.createElement('span');
      glyph.className = 'button-arrow';
      glyph.textContent = '↗';
      glyph.setAttribute('aria-hidden', 'true');
      el.append(title, glyph);
      el.addEventListener('click',()=>run(btn,el));
      ui.buttons.appendChild(el);
    }
    resize();
  }
  async function load() {
    try {
      settings = await Q.getSettings(t);
      render();
      hasAuth = await Q.isAuthorized(t).catch(()=>false);
      ui.authNotice.hidden = hasAuth;
      if (!Q.configured()) alert('Enter your NEW Power-Up API key in config.js before running actions.',true);
      resize();
    } catch (error) {
      ui.buttons.replaceChildren();
      alert(`Could not load shortcuts: ${Q.errorText(error)}`,true);
    }
  }
  await load();
  // Trello can re-render/reload the iframe on plugin data changes; no polling required.
})();
