'use strict';
(async () => {
  const Q = window.QuickAccess;
  const t = Q.connect();
  Q.theme(t);
  const fields = ['message','connectPanel','connectButton','defaultColor','defaultColorHex','buttonCount','buttonList','addButton','editor','preview','saveButton'];
  const el = Object.fromEntries(fields.map(x=>[x,document.getElementById(x)]));
  let state = Q.defaults();
  let selected = null;
  let connected = false;
  let boardsData = [];
  let boardId = t.getContext().board || '';
  let allLists = [];
  let allMembers = [];
  let allLabels = [];
  let busy = false;
  let metadataError = '';
  const status = (text, error = false) => {
    el.message.hidden = !text;
    el.message.className = 'message ' + (error ? 'error' : 'success');
    el.message.textContent = text;
    el.message.scrollIntoView?.({block: 'nearest', behavior: 'instant'});
  };
  const option = (value, name) => { const node=document.createElement('option');node.value=value;node.textContent=name;return node; };
  function options(select, rows, value, placeholder, label = x=>x.name) {
    select.replaceChildren(option('',placeholder));
    rows.forEach(r=>select.append(option(r.id,label(r))));
    select.value = rows.some(row=>row.id===value) ? value : '';
  }
  function current() { return state.buttons.find(b => b.id === selected); }
  function markModified() {status('Unsaved changes. Click Save changes when ready.');renderList();renderPreview();}
  function change(field, value, refreshEditor = false) {
    const item = current(); if (!item) return;
    item[field] = value;
    if (refreshEditor) renderEditor();
    markModified();
  }
  function add() {
    if (state.buttons.length >= Q.MAX_BUTTONS) {status(`Maximum ${Q.MAX_BUTTONS} buttons.`,true);return;}
    const item = {id:Q.id(),name:'New shortcut',type:'move',color:'',boardId:'',listId:'',memberId:'',labelId:'',comment:'',targetName:''};
    state.buttons.push(item); selected=item.id;
    markModified();renderEditor();
  }
  function duplicate() {
    const item=current();if (!item) return;
    if (state.buttons.length >= Q.MAX_BUTTONS) {status(`Maximum ${Q.MAX_BUTTONS} buttons.`,true);return;}
    const copy = {...item,id:Q.id(),name:(item.name+' copy').slice(0,64)};
    state.buttons.splice(state.buttons.indexOf(item)+1,0,copy);selected=copy.id;
    markModified();renderEditor();
  }
  function remove() {
    const idx=state.buttons.findIndex(b=>b.id===selected);if(idx<0)return;
    state.buttons.splice(idx,1);selected=state.buttons[Math.min(idx,state.buttons.length-1)]?.id || null;
    markModified();renderEditor();
  }
  function move(dir) {
    const idx=state.buttons.findIndex(b=>b.id===selected),target=idx+dir;
    if(idx<0||target<0||target>=state.buttons.length)return;
    [state.buttons[idx],state.buttons[target]]=[state.buttons[target],state.buttons[idx]];
    markModified();renderEditor();
  }
  function renderList() {
    el.buttonList.replaceChildren();
    el.buttonCount.textContent=`${state.buttons.length} / ${Q.MAX_BUTTONS}`;
    el.addButton.disabled=state.buttons.length>=Q.MAX_BUTTONS;
    for (const b of state.buttons) {
      const row=document.createElement('button');row.type='button';row.className='button-list-row'+(selected===b.id?' selected':'');
      const swatch=document.createElement('span');swatch.className='swatch';swatch.style.background=Q.safeColor(b.color,state.defaultColor);
      const text=document.createElement('span');text.className='list-row-copy';
      const name=document.createElement('strong');name.textContent=b.name;
      const sub=document.createElement('small');sub.textContent=Q.TYPES.find(x=>x[0]===b.type)?.[1] || b.type;
      text.append(name,sub);const glyph=document.createElement('span');glyph.className='list-row-arrow';glyph.textContent='›';
      row.append(swatch,text,glyph);row.addEventListener('click',()=>{selected=b.id;renderList();renderEditor();});
      el.buttonList.append(row);
    }
    if (!state.buttons.length) {
      const p=document.createElement('p');p.className='list-empty';p.textContent='Nothing here. Add your first button.';el.buttonList.append(p);
    }
  }
  function renderPreview() {
    el.preview.replaceChildren();
    for (const b of state.buttons) {
      const button=document.createElement('div');button.className='preview-button';
      const bg=Q.safeColor(b.color,state.defaultColor);button.style.background=bg;button.style.color=Q.contrastText(bg);
      const name=document.createElement('strong');name.textContent=b.name;
      const arrow=document.createElement('span');arrow.textContent='↗';
      button.append(name,arrow);el.preview.append(button);
    }
    if (!state.buttons.length) el.preview.textContent='Your buttons will appear here.';
  }
  function setSettingDefaultColor(hex) {
    state.defaultColor=hex.toLowerCase();
    el.defaultColor.value=hex;el.defaultColorHex.value=hex;markModified();
    renderEditor();
  }
  el.defaultColor.addEventListener('input',()=>setSettingDefaultColor(el.defaultColor.value));
  el.defaultColorHex.addEventListener('change',()=>{
    const hex=el.defaultColorHex.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) setSettingDefaultColor(hex);
    else {el.defaultColorHex.value=state.defaultColor;status('Color must be a hex value like #fbbf00.',true);}
  });
  el.addButton.addEventListener('click',add);

  function field(labelText, control, helper) {
    const wrapper=document.createElement('div');wrapper.className='field-group';
    const label=document.createElement('label');label.textContent=labelText; if(control.id)label.htmlFor=control.id;
    wrapper.append(label,control);
    if (helper) {const msg=document.createElement('p');msg.className='helper';msg.textContent=helper;wrapper.append(msg);}
    return wrapper;
  }
  function selectControl(id, records, value, placeholder) {
    const input=document.createElement('select');input.id=id;options(input,records,value,placeholder);
    return input;
  }
  function makeHeader(text, description) {
    const h=document.createElement('div');h.className='editor-subhead';
    const title=document.createElement('h3');title.textContent=text;
    const p=document.createElement('p');p.textContent=description;
    h.append(title,p);return h;
  }
  async function loadListDropdown(select, button, forcedBoard) {
    if (!connected || !forcedBoard) {options(select,[],button.listId,connected?'Choose a board first':'Connect Trello first');return;}
    const id=forcedBoard;
    options(select,[], '', 'Loading lists…');select.disabled=true;
    try {
      const lists=await Q.lists(t,id);
      if (current()?.id !== button.id || current()?.boardId!==id) return;
      options(select,lists,button.listId,'Select destination list');
      select.disabled=false;
    } catch(e) {options(select,[], '', 'Could not load lists');status(Q.errorText(e),true);}
  }
  function renderEditor() {
    el.editor.replaceChildren();
    const item=current();
    if (!item) {const hint=document.createElement('p');hint.className='editor-empty';hint.textContent='Select a button, or add a new one to get started.';el.editor.append(hint);return;}
    el.editor.append(makeHeader('Edit shortcut','Choose what happens when someone clicks this button.'));
    const name=document.createElement('input');name.type='text';name.id='shortcutName';name.maxLength=64;name.value=item.name;name.placeholder='e.g. Move to Diseño';
    name.addEventListener('input',()=>change('name',name.value));
    el.editor.append(field('Button label',name));
    const type=selectControl('shortcutType',Q.TYPES.map(x=>({id:x[0],name:x[1]})),item.type,'Choose action');
    type.addEventListener('change',()=>{item.type=type.value;markModified();renderEditor();});
    el.editor.append(field('On click',type));
    el.editor.append(makeHeader('Action details','Configure the destination or value for this action.'));
    switch(item.type) {
      case 'move': {
        const board=selectControl('targetBoard',boardsData,item.boardId,connected?'Select destination board':'Connect Trello to load boards');
        board.disabled=!connected;
        const list=selectControl('targetList',[],item.listId,'Select board first');list.disabled=!connected;
        board.addEventListener('change',async()=>{item.boardId=board.value;item.listId='';item.targetName='';markModified();await loadListDropdown(list,item,board.value);});
        list.addEventListener('change',()=>{
          item.listId=list.value;
          item.targetName=`${boardsData.find(x=>x.id===board.value)?.name||'Board'} / ${list.selectedOptions[0]?.textContent||'List'}`;
          markModified();
        });
        el.editor.append(field('Board',board),field('List',list));
        loadListDropdown(list,item,item.boardId);
        break;
      }
      case 'member_add':case 'member_remove': {
        const member=selectControl('targetMember',allMembers,item.memberId,connected?'Select member':'Connect Trello first');member.disabled=!connected;
        member.addEventListener('change',()=>change('memberId',member.value));
        el.editor.append(field('Team member',member,'Members from this board.'));
        break;
      }
      case 'label_add':case 'label_remove': {
        const label=selectControl('targetLabel',allLabels,item.labelId,connected?'Select label':'Connect Trello first');label.disabled=!connected;
        label.addEventListener('change',()=>change('labelId',label.value));
        el.editor.append(field('Label',label,'Labels from this board.'));
        break;
      }
      case 'comment': {
        const comment=document.createElement('textarea');comment.id='commentText';comment.maxLength=160;comment.rows=3;comment.placeholder='Text added as a comment…';comment.value=item.comment;
        comment.addEventListener('input',()=>change('comment',comment.value));
        el.editor.append(field('Comment text',comment,'Everyone clicking the button posts this exact comment.'));
        break;
      }
      case 'archive': {
        const note=document.createElement('div');note.className='warning';note.textContent='Archiving is an important action. The Power-Up will ask for confirmation before archiving a card.';el.editor.append(note);break;
      }
      default: {
        const note=document.createElement('div');note.className='info-note';note.textContent='No additional setup required. This action uses the current card.';el.editor.append(note);break;
      }
    }
    el.editor.append(makeHeader('Button color','Leave the custom color off to follow the board default.'));
    const custom=document.createElement('input');custom.type='checkbox';custom.id='customColor';custom.checked=!!item.color;
    const customText=document.createElement('label');customText.className='check-field';customText.htmlFor='customColor';customText.append(custom,document.createTextNode('Use custom color'));
    const chooser=document.createElement('input');chooser.type='color';chooser.id='buttonColor';chooser.value=Q.safeColor(item.color,state.defaultColor);chooser.disabled=!custom.checked;
    const customWrap=document.createElement('div');customWrap.className='color-row';customWrap.append(customText,chooser);
    custom.addEventListener('change',()=>{item.color=custom.checked?chooser.value:'';chooser.disabled=!custom.checked;markModified();});
    chooser.addEventListener('input',()=>change('color',chooser.value));
    el.editor.append(customWrap);
    const actions=document.createElement('div');actions.className='editor-actions';
    const mk=(text,handler,cls)=>{const btn=document.createElement('button');btn.type='button';btn.textContent=text;btn.className=cls||'subtle-btn';btn.addEventListener('click',handler);return btn;};
    const up=mk('↑ Move up',()=>move(-1));const down=mk('↓ Move down',()=>move(1));
    up.disabled=state.buttons.indexOf(item)===0;down.disabled=state.buttons.indexOf(item)===state.buttons.length-1;
    actions.append(up,down,mk('Duplicate',duplicate),mk('Delete',remove,'remove-btn'));
    el.editor.append(actions);
  }

  async function connect() {
    el.connectButton.disabled=true;
    try {
      await Q.authorize(t);
      connected=true;
      await loadMetadata();
      el.connectPanel.hidden=true;
      status('Connected. You can now choose destinations, members, and labels.');
      renderEditor();
    } catch(error) {status(Q.errorText(error),true);}
    finally {el.connectButton.disabled=false;}
  }
  el.connectButton.addEventListener('click',connect);
  async function loadMetadata() {
    if (!connected) return;
    try {
      metadataError='';
      const values=await Promise.all([Q.boards(t),...(boardId ? [Q.members(t,boardId),Q.labels(t,boardId)] : [Promise.resolve([]),Promise.resolve([])])]);
      boardsData=values[0]; allMembers=values[1].sort((a,b)=>a.fullName.localeCompare(b.fullName)).map(m=>({id:m.id,name:`${m.fullName} (@${m.username})`}));
      allLabels=values[2].map(l=>({id:l.id,name:l.name || (l.color ? `${l.color} label` : 'Unnamed label')}));
    } catch(error) {metadataError=Q.errorText(error);status('Could not load Trello choices: '+metadataError,true);}
  }
  el.saveButton.addEventListener('click',async()=>{
    if (busy)return;
    busy=true;el.saveButton.disabled=true;el.saveButton.textContent='Saving…';
    try {
      state=await Q.saveSettings(t,state);
      status('Saved! Open or refresh a Trello card to see the updated shortcuts.');
    } catch (e) {status(Q.errorText(e),true);}
    finally {busy=false;el.saveButton.disabled=false;el.saveButton.innerHTML='Save changes <span aria-hidden="true">→</span>';}
  });
  try {
    state=await Q.getSettings(t);
    selected=state.buttons[0]?.id || null;
    el.defaultColor.value=state.defaultColor;el.defaultColorHex.value=state.defaultColor;
    if (!t.memberCanWriteToModel('board')) {
      el.saveButton.disabled=true;
      status('You need permission to edit this board to save settings.',true);
    }
    connected=await Q.isAuthorized(t).catch(()=>false);
    el.connectPanel.hidden=connected;
    if (!Q.configured()) status('Before connecting, add your NEW Trello Power-Up API key to config.js.',true);
    if (connected) await loadMetadata();
    renderList();renderEditor();renderPreview();
  } catch (error) {
    status('Could not load settings: '+Q.errorText(error),true);
  }
})();
