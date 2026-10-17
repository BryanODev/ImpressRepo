'use strict';
(() => {
  const I=window.IQ,root=document.getElementById('app');let t,settings,busy=false;
  function showStatus(msg,kind=''){const el=root.querySelector('#feedback');if(el){el.textContent=msg;el.className='status '+kind;}}
  function render(){
    root.innerHTML=`<div class="stack">
      <div><div class="eyebrow">POWER-UP SETTINGS</div><div class="heading">Impress Quoting</div><p class="muted small">These settings apply to this Trello board.</p></div>
      <div><label class="label" for="business">Business name (printed on customer copy)</label><input class="field" id="business" maxlength="100" value="${I.escapeHTML(settings.business)}" placeholder="Your printshop name"></div>
      <div class="grid-2"><div><label class="label" for="phone">Business phone / contact</label><input class="field" id="phone" maxlength="100" value="${I.escapeHTML(settings.phone)}"></div><div><label class="label" for="tax">Tax rate (%)</label><input class="field" id="tax" type="number" min="0" max="100" step="0.01" value="${I.escapeHTML(settings.taxRate)}"></div></div>
      <div><label class="label" for="address">Business address (optional)</label><textarea class="field" id="address" maxlength="200">${I.escapeHTML(settings.address)}</textarea></div>
      <div><label class="label" for="title">Document title</label><input class="field" id="title" maxlength="70" value="${I.escapeHTML(settings.documentTitle)}"></div>
      <div><label class="label" for="footer">Customer copy footer</label><textarea class="field" id="footer" maxlength="250">${I.escapeHTML(settings.footer)}</textarea></div>
      <div class="notice">Tax defaults to 0%. Set the appropriate rate only after checking your workplace's tax treatment. This Power-Up does not submit taxes or process payments.</div>
      <button class="btn primary full" id="save">Save settings</button><div class="status" id="feedback" role="status"></div>
    </div>`;
    root.querySelector('#save').addEventListener('click',save);
    requestAnimationFrame(()=>t.sizeTo('#app').catch(()=>{}));
  }
  async function save(){if(busy)return;
    const rate=Number(root.querySelector('#tax').value);
    if(!Number.isFinite(rate)||rate<0||rate>100){showStatus('Tax rate must be between 0 and 100%.','error');return;}
    const data={business:root.querySelector('#business').value.trim().slice(0,100),phone:root.querySelector('#phone').value.trim().slice(0,100),address:root.querySelector('#address').value.trim().slice(0,200),taxRate:rate,documentTitle:root.querySelector('#title').value.trim().slice(0,70)||'Customer Order',footer:root.querySelector('#footer').value.trim().slice(0,250),currency:'USD'};
    busy=true;root.querySelector('#save').disabled=true;showStatus('Saving…');
    try{await t.set('board','shared','settings',data);settings=data;showStatus('Settings saved.','ok');}
    catch(e){showStatus('Failed to save: '+(e.message||String(e)),'error');}
    finally{busy=false;root.querySelector('#save').disabled=false;}
  }
  async function init(){try{if(!window.TrelloPowerUp)throw Error('Trello Power-Up library failed to load.');t=window.TrelloPowerUp.iframe();I.theme(t);settings=I.normalizeSettings(await t.get('board','shared','settings',null));render();}catch(e){root.innerHTML='<div class="panel">Could not load Settings: '+I.escapeHTML(e.message||String(e))+'</div>';}}
  init();
})();
