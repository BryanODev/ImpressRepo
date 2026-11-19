/* Impress: responsive editor controls, intentionally independent of print logic. */
(() => {
  const types=['ie','ib','ip'];
  function init(root) {
    if (root.dataset.impressUxReady==='true') return;
    root.dataset.impressUxReady='true';
    const toggle=root.querySelector('[data-impress-advanced-toggle]');
    const panel=root.querySelector('[data-impress-advanced-panel]');
    if(toggle && panel){
      toggle.addEventListener('click',()=>{
        const expanded=toggle.getAttribute('aria-expanded')!=='true';
        toggle.setAttribute('aria-expanded',String(expanded));
        panel.classList.toggle('is-open',expanded);
        root.classList.toggle('impress-config-expanded',expanded);
      });
    }
    for (const number of root.querySelectorAll('[data-impress-number-for]')) {
      const key=number.getAttribute('data-impress-number-for');
      if(!/^(ie|ib|ip)-(scale|rotate|stroke)$/.test(key)) continue;
      const slider=root.querySelector(`[data-${key}]`);
      if(!slider)continue;
      const prefix=key.slice(0,2), control=key.slice(3);
      const outputKey=control==='scale'?(prefix==='ip'?'scale-output':'scale-value'):
        control==='rotate'?(prefix==='ip'?'rotate-output':'rotate-value'):'stroke-value';
      const output=root.querySelector(`[data-${prefix}-${outputKey}]`);
      const sync=()=>{
        const proposed=Number(slider.value);
        if (document.activeElement!==number && Number.isFinite(proposed)) number.value=String(Math.round(proposed));
        number.disabled=slider.disabled;
      };
      // The editors update their output after canvas drags, undo/redo and side changes.
      // Observe that existing output rather than patching any product/editor calculation.
      const observer=output?new MutationObserver(sync):null;
      observer?.observe(output,{childList:true,subtree:true,characterData:true});
      const attrObserver=new MutationObserver(sync);
      attrObserver.observe(slider,{attributes:true,attributeFilter:['disabled']});
      slider.addEventListener('input',sync);
      slider.addEventListener('change',sync);
      const commit=()=>{
        if(slider.disabled)return sync();
        const value=Number(number.value);
        if(number.value.trim()===''||!Number.isFinite(value)){number.value=slider.value;return;}
        const min=Number(slider.min),max=Number(slider.max),step=Number(slider.step)||1;
        const clamped=Math.max(min,Math.min(max,min+Math.round((value-min)/step)*step));
        slider.value=String(clamped);
        // Run the EXACT existing editor input/change handlers (history, preview, DPI).
        slider.dispatchEvent(new Event('input',{bubbles:true}));
        slider.dispatchEvent(new Event('change',{bubbles:true}));
        number.value=slider.value;
      };
      number.addEventListener('change',commit);
      number.addEventListener('keydown',event=>{
        if(event.key==='Enter'){event.preventDefault();number.blur();}
        if(event.key==='Escape'){number.value=slider.value;number.blur();}
      });
      sync();
    }
  }
  function scan(scope=document){
    for(const root of scope.querySelectorAll('.impress-sticker, .impress-banner, .impress-paper'))init(root);
    if(scope.matches?.('.impress-sticker, .impress-banner, .impress-paper'))init(scope);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>scan());else scan();
  document.addEventListener('shopify:section:load',event=>scan(event.target));
})();
