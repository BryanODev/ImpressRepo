'use strict';
(() => {
  const I=window.IQ,root=document.getElementById('app');let t;
  const lines=(s)=>I.escapeHTML(s||'').replace(/\n/g,'<br>');
  async function init(){
    try{
      if(!window.TrelloPowerUp) throw Error('Trello Power-Up library failed to load.');
      t=window.TrelloPowerUp.iframe();I.theme(t);
      const [stored,opts,card]=await Promise.all([
        t.get('card','shared','quote',null),t.get('board','shared','settings',null),t.card('name','shortUrl','shortLink','due')
      ]);
      const quote=I.normalizeQuote(stored),settings=I.normalizeSettings(opts),effective={...settings,taxRate:quote.taxRate ?? settings.taxRate},totals=I.totals(quote,effective);
      const ready=quote.items.length>0&&totals.unpriced===0&&quote.items.every(x=>x.name.trim());
      const identifier=I.getJobReference(card);
      root.innerHTML=`<div class="print-toolbar"><span class="grow small muted">Print this page or select “Save as PDF” in your browser.</span><button class="btn primary" id="print" ${ready?'':'disabled'}>Print / Save as PDF</button></div>
      ${ready?'':'<div class="notice print-warning" style="margin-bottom:12px">This order has unpriced or missing items. Save all prices on the card before generating the customer copy.</div>'}
      <article class="paper">
        <div class="paper-top"><div><div class="paper-brand">${I.escapeHTML(settings.business||'Customer Order')}</div><div class="paper-small">${lines(settings.address)}</div><div class="paper-small">${I.escapeHTML(settings.phone)}</div></div><div style="text-align:right"><h1>${I.escapeHTML(settings.documentTitle)}</h1><div class="paper-small">${I.escapeHTML(identifier)}</div><div class="paper-small">${new Intl.DateTimeFormat('en-US',{dateStyle:'medium'}).format(new Date())}</div></div></div>
        <div style="display:flex;justify-content:space-between;gap:30px"><div><div class="paper-small">PREPARED FOR</div><strong>${I.escapeHTML(quote.customer||'Customer')}</strong></div><div style="text-align:right;max-width:50%"><div class="paper-small">JOB</div><strong>${I.escapeHTML(card?.name||'Order')}</strong></div></div>
        <hr><table><thead><tr><th>PRODUCT / SERVICE</th><th class="numeric">QTY</th><th class="numeric">UNIT</th><th class="numeric">AMOUNT</th></tr></thead><tbody>
          ${quote.items.map(item=>`<tr><td>${I.escapeHTML(item.name)}</td><td class="numeric">${I.escapeHTML(item.qty)}</td><td class="numeric">${item.cents===null?'—':I.money(item.cents,settings)}</td><td class="numeric">${item.cents===null?'—':I.money(Math.round(item.cents*item.qty),settings)}</td></tr>`).join('')}
        </tbody></table>
        <div class="totals"><div><span>Subtotal</span><strong>${I.money(totals.subtotal,settings)}</strong></div><div><span>Tax (${I.escapeHTML(effective.taxRate)}%)</span><strong>${I.money(totals.tax,settings)}</strong></div><div class="grand"><span>Total</span><span>${I.money(totals.total,settings)}</span></div><div><span>Amount paid</span><span>${I.money(quote.paidCents,settings)}</span></div><div><strong>Balance due</strong><strong>${I.money(totals.due,settings)}</strong></div>${totals.overpaid?`<div><span>Overpayment</span><span>${I.money(totals.overpaid,settings)}</span></div>`:''}</div>
        ${quote.notes?`<hr><strong>Order notes</strong><p class="notes">${I.escapeHTML(quote.notes)}</p>`:''}
        <div class="footer"><hr>${lines(settings.footer)}<div style="margin-top:6px">Order summary only. Payment entries are recorded manually and are not proof that a transaction was processed.</div></div>
      </article>`;
      root.querySelector('#print').addEventListener('click',()=>window.print());
    }catch(e){root.innerHTML='<div class="notice">Unable to prepare customer copy: '+I.escapeHTML(e.message||String(e))+'</div>';}
  }
  init();
})();
