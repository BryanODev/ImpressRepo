/* Impress Banner Configurator v0.3 config — no extra backend or dependencies.
 * Variant options: Montaje (Palos / Argollas) + Tamaño (e.g., 2 x 4 ft).
 * Quantity is native Shopify cart quantity, not another variant dimension.
 * In preview mode, no guessed variant ID or price is sent to checkout.
 */
(() => {
  'use strict';
  const config=()=>window.ImpressProductConfigs?.banners||null;
  const uniq=arr=>[...new Set(arr)];
  const toMount=mount=>/argoll/i.test(mount)?'Argollas':/palos?/i.test(mount)?'Palos':null;
  const $=(root,s)=>root.querySelector(s);
  const ICONS={
    Argollas:`<svg class="impress-banner__mount-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="4" y="8" width="40" height="32" rx="3" fill="#fbbf00" stroke="#20333e" stroke-width="2.5"/><g fill="#fff" stroke="#20333e" stroke-width="2.5"><circle cx="10" cy="14" r="3"/><circle cx="38" cy="14" r="3"/><circle cx="10" cy="34" r="3"/><circle cx="38" cy="34" r="3"/></g></svg>`,
    Palos:`<svg class="impress-banner__mount-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="5" y="10" width="38" height="28" rx="2" fill="#fbbf00" stroke="#20333e" stroke-width="2.5"/><path d="M9 14H39 M9 34H39" stroke="#2b9fb6" stroke-width="1.5" stroke-dasharray="3 3" stroke-linecap="round"/></svg>`
  };
  function mount(root){
    if(root.dataset.ibInitialized==='true')return;
    const form=$(root,'form.impress-banner__form');if(!form)return;
    const cfg=config();
    if(!cfg){const m=$(root,'[data-ib-message]');if(m)m.textContent='Falta impress-banner-config.js. Compras deshabilitadas.';return;}
    const mounts=Array.isArray(cfg.mounts)?cfg.mounts:[];
    const sizes=Array.isArray(cfg.sizes)?cfg.sizes:[];
    const qtyMin=Math.max(1,Math.floor(Number(cfg.quantity?.min)||1));
    const qtyMax=Math.max(qtyMin,Math.floor(Number(cfg.quantity?.max)||100));
    const qtyStep=Math.max(1,Math.floor(Number(cfg.quantity?.step)||1));
    const maxBytes=Math.max(1,Number(cfg.maxArtworkMB)||20)*1024*1024;
    root.dataset.ibInitialized='true';form.enctype='multipart/form-data';
    const f=key=>$(root,`[data-ib-${key}]`);
    const ui={mounts:f('mounts'),size:f('sizes'),qty:f('quantity'),minus:f('qty-down'),plus:f('qty-up'),variant:f('variant-id'),propertyMount:f('property-mount'),propertySize:f('property-size'),summary:f('mount-summary'),total:f('total'),priceNote:f('price-note'),message:f('message'),submit:f('submit'),art:f('art-input'),fileLabel:f('file-label'),fileHint:f('file-hint'),mountCaption:f('mount-caption')};
    if(Object.values(ui).some(v=>!v)){console.error('Impress Banners: incomplete section markup.');return;}
    const editor=window.ImpressBannerEditor?.mount(root);
    if(!editor)console.error('Impress Banner Editor unavailable; verify impress-banner-editor.js exists.');
    let variants=[];
    let dataError='';
    try{
      variants=JSON.parse(f('variants')?.textContent||'[]');
      if(!Array.isArray(variants))throw new Error('Error de variantes');
    }catch(err){dataError=err.message;}
    const records=variants.map(v=>{
      if(!Array.isArray(v.options)||v.options.length!==2)return null;
      const mounting=toMount(String(v.options[0]||'')),size=String(v.options[1]||'').trim();
      const price=Number(v.price);
      if(!mounting||!editor?.parseSize(size)||!Number.isFinite(price)||price<0)return null;
      return{id:String(v.id),mounting,size,price,available:!!v.available};
    }).filter(Boolean);
    const supported=records.filter(r=>mounts.includes(r.mounting)&&sizes.includes(r.size));
    const valid=!dataError&&variants.length>0&&supported.length>0&&
      supported.every(r=>r.id&&r.id!=='undefined');
    let state={mounting:mounts[0]||'Argollas',size:sizes[0]||'',quantity:qtyMin};
    ui.qty.min=String(qtyMin);ui.qty.max=String(qtyMax);ui.qty.step=String(qtyStep);ui.qty.value=String(qtyMin);
    const money=(()=>{try{return new Intl.NumberFormat(document.documentElement.lang||'es-PR',{style:'currency',currency:root.dataset.currency||'USD'});}catch{return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});}})();
    let selectedVariant=null;
    function drawMounts(mounts){
      ui.mounts.replaceChildren();
      mounts.forEach(m=>{
        const label=document.createElement('label');label.className='impress-banner__mount-card';
        const radio=document.createElement('input');radio.type='radio';radio.name=`impress-banner-mount-${root.id}`;radio.value=m;radio.checked=m===state.mounting;
        const surface=document.createElement('span');surface.className='impress-banner__mount-surface';
        surface.innerHTML=`${ICONS[m]}<span class="impress-banner__mount-label">${m}</span>`;
        label.append(radio,surface);ui.mounts.append(label);
        radio.addEventListener('change',()=>{state.mounting=m;syncSelection();});
      });
    }
    function drawSizes(sizes){
      const old=state.size;
      if(!sizes.includes(state.size))state.size=sizes[0]||'';
      ui.size.replaceChildren();
      sizes.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;ui.size.append(o);});
      ui.size.value=state.size;ui.size.disabled=!sizes.length;
    }
    function syncSummary(){
      const count=editor?.mountCount(state.size);
      const g=cfg.grommets||{};
      ui.summary.textContent=state.mounting==='Argollas'
        ? `Argollas: ${count??'varias'} posiciones ilustrativas · diámetro ${g.diameterInches ?? 0.5}″ · centros a ${g.cornerCenterInches ?? 0.75}″ · separación máx. ${g.maxSpacingInches ?? 24}″. Confirmar en producción.`
        : 'Palos: montados detrás del banner, invisibles en la vista frontal. Las líneas azules indican solo áreas aproximadas de instalación.';
      ui.mountCaption.textContent=state.mounting.toUpperCase();
      ui.propertyMount.value=state.mounting;ui.propertySize.value=state.size;
      editor?.setOptions({mounting:state.mounting,size:state.size});
    }
    function syncPrice(){
      if(valid){
        selectedVariant=supported.find(r=>r.mounting===state.mounting&&r.size===state.size)||null;
        ui.variant.value=selectedVariant?.id||'';
        if(selectedVariant){
          ui.total.textContent=money.format(selectedVariant.price*state.quantity/100);
          ui.priceNote.textContent=`${money.format(selectedVariant.price/100)} cada banner × ${state.quantity}`;
        }else{ui.total.textContent='—';ui.priceNote.textContent='No existe un precio para esta combinación.';}
        ui.submit.disabled=!selectedVariant?.available;
        ui.message.textContent=selectedVariant&&!selectedVariant.available?'Esta combinación no está disponible.':'';
      }else{
        ui.variant.value='';ui.total.textContent='—';ui.priceNote.textContent='Vista de prueba · Configura las variantes para activar el precio.';
        ui.submit.disabled=true;
      }
    }
    function syncSelection(){
      const shownSizes=valid?uniq(supported.filter(r=>r.mounting===state.mounting).map(r=>r.size)):sizes;
      drawMounts(valid?uniq(supported.map(r=>r.mounting)):mounts);
      drawSizes(shownSizes);
      syncSummary();syncPrice();
    }
    if(valid){
      const init=supported.find(v=>v.id===root.dataset.selectedVariant)||supported.find(v=>v.available)||supported[0];
      state.mounting=init.mounting;state.size=init.size;root.dataset.ibMode='shopify';
    }else{
      root.dataset.ibMode='preview';
    }
    ui.size.addEventListener('change',()=>{state.size=ui.size.value;syncSummary();syncPrice();});
    ui.qty.addEventListener('input',()=>{
      state.quantity=Math.max(qtyMin,Math.min(qtyMax,Math.round(Number(ui.qty.value)||qtyMin)));
      syncPrice();
    });
    ui.qty.addEventListener('change',()=>{ui.qty.value=String(state.quantity);});
    ui.minus.addEventListener('click',()=>{state.quantity=Math.max(qtyMin,state.quantity-qtyStep);ui.qty.value=String(state.quantity);syncPrice();});
    ui.plus.addEventListener('click',()=>{state.quantity=Math.min(qtyMax,state.quantity+qtyStep);ui.qty.value=String(state.quantity);syncPrice();});
    ui.art.addEventListener('change',()=>{
      const file=ui.art.files?.[0];ui.fileLabel.textContent=file?file.name:'Seleccionar archivo';
      if(!file){ui.art.setCustomValidity('');editor?.loadFile(null);return;}
      if(!/\.(png|jpe?g|webp|pdf)$/i.test(file.name)){
        ui.art.setCustomValidity('Usa PNG, JPG, WEBP o PDF.');ui.art.reportValidity();return;
      }
      if(file.size>maxBytes){ui.art.setCustomValidity('Archivo mayor de '+cfg.maxArtworkMB+' MB; supera el límite de esta prueba.');ui.art.reportValidity();return;}
      ui.art.setCustomValidity('');
      ui.fileHint.textContent=/\.pdf$/i.test(file.name)
        ? 'PDF adjunto, no editable en esta versión. Se conserva el archivo original.'
        : 'Arte original conservado. Se intentará adjuntar una vista PNG de referencia al pedido.';
      editor?.loadFile(file);
    });
    let prepared=false,preparing=false;
    form.addEventListener('submit',async e=>{
      if(!valid||!selectedVariant?.available||!ui.variant.value||ui.submit.disabled){e.preventDefault();return;}
      if(!ui.art.files?.length||!ui.art.checkValidity()){e.preventDefault();ui.art.reportValidity();return;}
      const qty=Number(ui.qty.value);
      if(!Number.isInteger(qty)||qty<qtyMin||qty>qtyMax){e.preventDefault();ui.qty.focus();return;}
      if(prepared)return;
      e.preventDefault();if(preparing)return;
      preparing=true;ui.submit.disabled=true;
      try{
        if(editor)await editor.prepareOrderFiles();
        prepared=true;ui.submit.disabled=false;
        form.requestSubmit(ui.submit);
      }catch(err){
        ui.message.textContent='No se pudo preparar la vista: '+(err?.message||'error desconocido');
      }finally{preparing=false;if(!prepared)ui.submit.disabled=false;}
    });
    syncSelection();
    if(!valid){
      ui.message.textContent='MODO VISTA PREVIA — Para habilitar compras configura exactamente dos opciones de Shopify: Montaje y Tamaño definidos en impress-banner-config.js. No se inventan precios.';
    }
  }
  const initAll=(context=document)=>context.querySelectorAll('[data-impress-banner]').forEach(mount);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>initAll(),{once:true});
  else initAll();
  document.addEventListener('shopify:section:load',event=>initAll(event.target));
})();
