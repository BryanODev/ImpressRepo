'use strict';
(() => {
  const I = window.IQ;
  const root = document.getElementById('app');
  let t; let quote, settings; let dirty = false; let busy = false;
  function fail(msg) { root.innerHTML = `<div class="panel"><b>Unable to load Impress Quoting</b><p class="muted">${I.escapeHTML(msg)}</p></div>`; }
  function message(text,kind='') {
    const el = root.querySelector('#feedback');
    if (el) {el.textContent=text;el.className='status '+kind;}
  }
  function size() {if(t) requestAnimationFrame(()=>t.sizeTo('#app').catch(()=>{}));}
  function currentSettings(){return {...settings,taxRate:quote.taxRate ?? settings.taxRate};}
  function isPriced() {return quote.items.length>0 && quote.items.every(x => x.cents!==null && x.name.trim());}
  function snapshot() {
    quote.customer=(root.querySelector('#customer')?.value||'').trim().slice(0,160);
    quote.notes=(root.querySelector('#notes')?.value||'').trim().slice(0,700);
    const paid=I.centsFromText(root.querySelector('#paid')?.value||'');
    quote.paidCents=paid ?? 0;
    const tax=Number(root.querySelector('#taxRate')?.value ?? settings.taxRate);
    quote.taxRate=Number.isFinite(tax) ? Math.min(100,Math.max(0,tax)) : 0;
    root.querySelectorAll('[data-item-id]').forEach(el=>{
      const id=el.getAttribute('data-item-id');const item=quote.items.find(x=>x.id===id);
      if(!item)return;
      item.name=(el.querySelector('[data-name]')?.value||'').trim().slice(0,160);
      const qty=Number(el.querySelector('[data-qty]')?.value);
      if (qty>0 && Number.isFinite(qty)) item.qty=Math.round(qty*100)/100;
      item.cents=I.centsFromText(el.querySelector('[data-price]')?.value || '');
    });
  }
  function totalsMarkup() {
    const s=I.totals(quote,currentSettings());
    return `<div class="summary">
      <div class="summary-row"><span class="muted">Subtotal</span><strong class="money">${I.money(s.subtotal,settings)}</strong></div>
      <div class="summary-row"><span class="muted">Tax (${I.escapeHTML(quote.taxRate ?? settings.taxRate)}%)</span><strong class="money">${I.money(s.tax,settings)}</strong></div>
      <div class="summary-row main"><span>Total</span><span class="money">${I.money(s.total,settings)}</span></div>
      <div class="summary-row"><span class="muted">Amount paid (entered manually)</span><span class="money">${I.money(quote.paidCents,settings)}</span></div>
      <div class="summary-row"><strong>Balance remaining</strong><strong class="money">${I.money(s.due,settings)}</strong></div>
      ${s.overpaid>0?`<div class="hint">Overpayment recorded: ${I.money(s.overpaid,settings)}</div>`:''}
      ${s.unpriced?`<div class="notice">${s.unpriced} item${s.unpriced>1?'s':''} still need${s.unpriced===1?'s':''} a price. Totals are incomplete.</div>`:''}
    </div>`;
  }
  function row(item,index) {
    return `<div class="item" data-item-id="${I.escapeHTML(item.id)}">
      <div class="item-head"><span class="num">ITEM ${index+1}</span><span class="${item.cents===null?'unpriced':'line-total'}" data-line-total>${item.cents===null?'Needs pricing':I.money(Math.round(item.qty*item.cents),settings)}</span></div>
      <div class="item-fields">
        <div class="field-box"><label class="label">Product / service</label><input class="field" data-name maxlength="160" placeholder="e.g. 500 Flyers" value="${I.escapeHTML(item.name)}"></div>
        <div class="field-box"><label class="label">Qty</label><input class="field" data-qty type="number" min="0.01" step="0.01" value="${I.escapeHTML(item.qty)}"></div>
        <div class="field-box"><label class="label">Unit price ($)</label><input class="field" data-price type="number" min="0" step="0.01" placeholder="Not set" value="${item.cents===null?'':I.dollars(item.cents)}"></div>
        <button class="btn tiny ghost danger" type="button" data-remove="${I.escapeHTML(item.id)}" title="Remove item" aria-label="Remove item">×</button>
      </div>
    </div>`;
  }
  function render() {
    const s=I.totals(quote,currentSettings());
    root.innerHTML = `<div class="stack">
      <div class="card-header"><div><div class="eyebrow">CUSTOMER ORDER</div><div class="heading">Items & Pricing</div></div><span class="pill ${s.unpriced?'warn':quote.items.length?'good':''}">${quote.items.length?`${s.priced}/${quote.items.length} priced`:'No items yet'}</span></div>
      <div><label class="label" for="customer">Customer name</label><input class="field" id="customer" maxlength="160" placeholder="Customer or business name" value="${I.escapeHTML(quote.customer)}"></div>
      <div><div class="section-head"><strong>Order items</strong><span class="small muted">Enter prices when charging</span></div><div class="items">${quote.items.map(row).join('') || '<div class="panel small muted">No items added yet. Add the first product or service.</div>'}</div></div>
      <button class="btn ghost full" id="add-item" type="button">+ Add item</button>
      <div class="panel stack" style="gap:10px"><div class="section-head" style="margin:0"><strong>Payment details</strong><span class="small muted">USD</span></div><div class="grid-2"><div><label class="label" for="taxRate">Tax rate (%)</label><input class="field" id="taxRate" type="number" min="0" max="100" step="0.01" value="${I.escapeHTML(quote.taxRate ?? settings.taxRate)}"></div><div><label class="label" for="paid">Amount paid ($)</label><input class="field" id="paid" type="number" min="0" step="0.01" value="${I.dollars(quote.paidCents)}"></div></div><div id="summary">${totalsMarkup()}</div></div>
      <div><label class="label" for="notes">Customer-facing notes (optional)</label><textarea class="field" id="notes" maxlength="700" placeholder="Size, colors, pickup instructions, etc.">${I.escapeHTML(quote.notes)}</textarea></div>
      <div class="toolbar"><button type="button" class="btn primary" id="save">Save order</button><button type="button" class="btn" id="print" ${!isPriced() || dirty?'disabled':''}>Customer copy ↗</button></div>
      <div class="status" id="feedback" role="status"></div><p class="hint" style="margin:0">Prices are shared with board members who can view the card. This records payments manually; it does not charge a card or issue a tax invoice.</p>
    </div>`;
    const add=root.querySelector('#add-item');
    add.addEventListener('click',()=>{snapshot();if(quote.items.length>=15){message('Maximum 15 items per card in this starter version.','error');return;}quote.items.push({id:I.uid(),name:'',qty:1,cents:null});dirty=true;render();message('New item added. Save when finished.');size();});
    root.querySelectorAll('[data-remove]').forEach(btn=>btn.addEventListener('click',()=>{snapshot();quote.items=quote.items.filter(x=>x.id!==btn.dataset.remove);dirty=true;render();size();}));
    root.querySelectorAll('input,textarea').forEach(el=>el.addEventListener('input',()=>{dirty=true;updateLive();}));
    root.querySelector('#save').addEventListener('click',save);
    root.querySelector('#print').addEventListener('click',()=>{
      if(dirty){message('Save your latest changes before printing.','error');return;}
      if(!isPriced()){message('Add an item and fill all prices before printing.','error');return;}
      t.modal({title:'Customer copy',url:t.signUrl(new URL('receipt.html',window.location.href).href),height:650,fullscreen:false});
    });
    size();
  }
  function updateLive() {
    snapshot();
    root.querySelectorAll('[data-item-id]').forEach(el=>{
      const item=quote.items.find(x=>x.id===el.dataset.itemId);
      const tag=el.querySelector('[data-line-total]');
      if(item&&tag){tag.textContent=item.cents===null?'Needs pricing':I.money(Math.round(item.cents*item.qty),settings);tag.className=item.cents===null?'unpriced':'line-total';}
    });
    const s=I.totals(quote,currentSettings());
    root.querySelector('#summary').innerHTML=totalsMarkup();
    root.querySelector('#print').disabled=true;
    const badge=root.querySelector('.pill');badge.textContent=quote.items.length?`${s.priced}/${quote.items.length} priced`:'No items yet';badge.className='pill '+(s.unpriced?'warn':quote.items.length?'good':'');
    message('Unsaved changes');size();
  }
  async function save() {
    if(busy)return;
    snapshot();
    if(quote.items.some(x=>!x.name.trim())){message('Give every item a name before saving.','error');return;}
    if(quote.items.some(x=>!(x.qty>0 && Number.isFinite(x.qty)))){message('Every quantity must be greater than zero.','error');return;}
    const record={...quote,updatedAt:new Date().toISOString()};
    if(JSON.stringify({quote:record}).length>3850){message('Order is too large for Trello Power-Up storage. Shorten item names or notes.','error');return;}
    busy=true;root.querySelector('#save').disabled=true;message('Saving…');
    try {await t.set('card','shared','quote',record);quote=record;dirty=false;render();message('Order saved.','ok');}
    catch(err){message('Save failed: '+(err?.message||String(err)),'error');root.querySelector('#save').disabled=false;}
    finally{busy=false;}
  }
  async function init(){
    try {
      if(!window.TrelloPowerUp) throw new Error('Trello Power-Up library failed to load.');
      t=window.TrelloPowerUp.iframe();I.theme(t);
      const [stored,options]=await Promise.all([
        t.get('card','shared','quote',null),
        t.get('board','shared','settings',null)
      ]);
      quote=I.normalizeQuote(stored);settings=I.normalizeSettings(options);
      render();
    } catch(err){fail(err?.message||String(err));}
  }
  init();
})();
