/* IMPRESS nested service cart reconciler.
 * Native product forms carry uploaded originals into the parent cart line.
 * After Shopify creates that line, we attach its selected service variants by parent_line_key.
 * Nested children are removed automatically by Shopify with their parent.
 * This is THEME-LEVEL reconciliation, not tamper-proof checkout validation.
 */
(() => {
  'use strict';
  if (window.ImpressAddonCart) return;
  const root = (window.Shopify?.routes?.root || '/').replace(/\/?$/, '/');
  const url = path => root + path;
  const key = '_Impress Addons';
  const childMark = '_Impress Addon';
  const qtyKey = '_Impress Addon Quantities';
  const modeKey = '_Impress Addon Modes';
  const checkoutSelector = 'button[name="checkout"],button[data-impress-guard]';
  let running=null;
  let lastError='';
  let lastSnapshot='';
  const hasCartUi = () => Boolean(document.querySelector('cart-items-component, .cart__checkout-button'));
  const protectedButtons = () => [...document.querySelectorAll(checkoutSelector)].filter(b => b instanceof HTMLButtonElement);
  function noteError(message) {
    lastError=message||'';
    document.querySelectorAll('[data-impress-cart-notice]').forEach(el=>{
      el.hidden=!lastError;
      el.textContent=lastError;
    });
    let notice=document.querySelector('[data-impress-cart-notice]');
    if(!notice && lastError){
      const anchor=document.querySelector('.cart__ctas,.cart__checkout-button,.cart-items__wrapper');
      if(anchor){notice=document.createElement('div');notice.className='impress-cart-warning';notice.dataset.impressCartNotice='';notice.setAttribute('role','alert');notice.textContent=lastError;anchor.parentElement?.insertBefore(notice,anchor);}
    }
  }
  const desired=item=>{
    const quantities=new Map();
    String(item?.properties?.[qtyKey]||'').split(',').forEach(part=>{
      const pair=/^(\d+):(\d+)$/.exec(part.trim());
      if(pair && Number.isSafeInteger(Number(pair[2])) && Number(pair[2])>0)quantities.set(pair[1],Number(pair[2]));
    });
    const perUnits=new Set(String(item?.properties?.[modeKey]||'').split(',')
      .map(x=>/^(\d+):per_unit$/.exec(x.trim())?.[1]).filter(Boolean));
    return String(item?.properties?.[key]||'').split(',').map(x=>x.trim())
      .filter(x=>/^\d+$/.test(x)).filter((x,i,a)=>a.indexOf(x)===i)
      .map(id=>({id,quantity:perUnits.has(id)?Math.max(1,Number(item.quantity)||1):(quantities.get(id)||1)}));
  };
  const getJob=item=>String(item?.properties?.['_Impress Job']||'');
  const nestedParent=item=>item?.parent_relationship?.parent_key || item?.parent_relationship?.parent?.key || null;
  const matchingChild=(cart,parent,variant)=>cart.items.find(child=>
    String(child.variant_id)===String(variant) && nestedParent(child)===parent.key &&
    child.properties?.[childMark]==='1' && getJob(child)===getJob(parent));
  const hasChildren=(cart,parent,addon)=>{
    const child=matchingChild(cart,parent,addon.id);
    return Boolean(child && child.quantity===addon.quantity);
  };
  async function request(path,init={}) {
    const res=await fetch(url(path),{credentials:'same-origin',...init});
    let data=null;
    try { data=await res.json(); } catch { /* empty or unexpected response */ }
    if(!res.ok)throw new Error(data?.description||data?.message||`Shopify respondió ${res.status}`);
    return data;
  }
  const jsonPost=(path,data)=>request(path,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)});
  function guard(locked){
    protectedButtons().forEach(button=>{
      if(button.dataset.impressGuard==='true')button.disabled=locked;
    });
  }
  async function reconcile() {
    if(running)return running;
    running=(async()=>{
      let cart=await request('cart.js');
      const parents=cart.items.filter(item=>desired(item).length);
      const protectedCart=parents.length>0;
      // The server rendered the checkout button as disabled whenever protected lines exist.
      if(protectedCart)guard(true);
      let changed=false;
      for(const initialParent of parents){
        const addons=desired(initialParent);
        for(const addon of addons){
          // A parent line key can change; locate by its stable private job property.
          const parent=cart.items.find(item=>getJob(item) && getJob(item)===getJob(initialParent) && desired(item).length);
          if(!parent)throw new Error('No encontramos el pedido principal al añadir sus servicios.');
          if(hasChildren(cart,parent,addon))continue;
          const existing=matchingChild(cart,parent,addon.id);
          if(existing){
            // A banner quantity change must also update the attached per-banner fee.
            await jsonPost('cart/change.js',{id:existing.key,quantity:addon.quantity});
          }else{
            const reply=await jsonPost('cart/add.js',{items:[{
              id:Number(addon.id), quantity:addon.quantity, parent_line_key:parent.key,
              properties:{[childMark]:'1','_Impress Job':getJob(parent)}
            }]});
            if(!reply?.items?.length && !Array.isArray(reply))throw new Error('Shopify no confirmó el servicio adicional.');
          }
          cart=await request('cart.js');
          const updated=cart.items.find(item=>getJob(item)===getJob(initialParent) && desired(item).length);
          if(!updated || !hasChildren(cart,updated,addon))throw new Error('Shopify no enlazó el servicio con el pedido principal.');
          changed=true;
        }
      }
      // Re-query after all changes before releasing checkout.
      cart=await request('cart.js');
      // Keep a custom Impress header count aligned with the parent order lines.
      const orderCount=cart.items.filter(item=>!(item.properties?.[childMark]==='1' && nestedParent(item))).length;
      document.querySelectorAll('[data-impress-cart-count]').forEach(badge=>{badge.textContent=String(orderCount);badge.hidden=orderCount===0;});
      document.querySelectorAll('.cart-title .cart-bubble__text-count').forEach(badge=>{badge.textContent=String(orderCount);badge.hidden=orderCount===0;});
      document.querySelectorAll('.cart-title .impress-cart-job-label').forEach(label=>{label.textContent=orderCount===1?'pedido':'pedidos';});
      const missing=cart.items.filter(item=>desired(item).length).some(parent=>desired(parent).some(id=>!hasChildren(cart,parent,id)));
      if(missing)throw new Error('El carrito tiene servicios pendientes que deben adjuntarse antes de pagar.');
      lastSnapshot=JSON.stringify(cart.items.map(item=>[item.key,item.quantity,desired(item).map(a=>a.id+':'+a.quantity).join(',')]));
      noteError('');
      if(protectedCart)guard(false);
      if(changed && (window.location.pathname.replace(/\/$/,'')===(root+'cart').replace(/\/$/,'') || document.querySelector('theme-drawer[open],dialog[open] cart-items-component'))){
        window.location.reload();
      }
      return true;
    })().catch(err=>{
      const detail=err?.message||'Error desconocido';
      noteError(`No pudimos confirmar los servicios de tu pedido: ${detail} Prueba a recargar la página o contáctanos.`);
      if(document.querySelector('[data-impress-cart-notice]'))guard(true);
      return false;
    }).finally(()=>{running=null;});
    return running;
  }
  // Read-only click preflight. Never pretend this is secure against direct checkout links.
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('button[name="checkout"]');
    if(!button || button.disabled)return;
    if(lastError){event.preventDefault();event.stopImmediatePropagation();reconcile();}
  },true);
  const schedule=(()=>{let t;return ()=>{clearTimeout(t);t=setTimeout(()=>{if(hasCartUi())reconcile();},160);};})();
  function init(){
    if(hasCartUi())schedule();
    // The Horizon drawer and cart sections can be re-rendered after quantity changes.
    const observer=new MutationObserver(records=>{
      if(records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1 &&
        (node.matches?.('cart-items-component,.cart__checkout-button,.cart-items__wrapper') || node.querySelector?.('cart-items-component,.cart__checkout-button')))))schedule();
    });
    observer.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('cart:refresh',schedule);
    // Horizon updates the cart through its CartLinesUpdateEvent promise. Listen
    // without importing theme modules into this classic script.
    document.addEventListener('cart:lines:update',event=>{
      if(event.promise?.then)event.promise.then(schedule).catch(()=>{});
      else schedule();
    });
    document.addEventListener('shopify:section:load',schedule);
  }
  window.ImpressAddonCart=Object.freeze({reconcile});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
