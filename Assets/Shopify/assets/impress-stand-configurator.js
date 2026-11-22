/* Impress Stand Configurator — one variant-safe controller for Roll-Up and X-Stand.
 * Print size is FIXED by stand type; price, availability and base selection
 * must resolve to actual Shopify variants. No fabricated price/variant IDs.
 */
(() => {
  'use strict';
  const $=(root,sel)=>root.querySelector(sel);
  const normalize=str=>String(str??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
  function baseFromValue(raw){
    const v=normalize(raw);
    if(/\b(sin base|without base|no base|sin soporte|without stand|solo impresion|print only)\b/.test(v))return 'without';
    if(/\b(con base|with base|incluye base|base incluida|with stand|con soporte)\b/.test(v))return 'with';
    return null;
  }
  function fixedSizeMatches(raw,kind){
    const v=normalize(raw).replace(/[×✕*]/g,'x').replace(/[“”″]/g,'"');
    const desired=kind==='xstand'?[23.5,60]:[33,72];
    // Do not silently interpret centimeter/millimeter size options as inches.
    if(/\b(cm|mm|centimetros|centimeters|metros|meters)\b/.test(v))return false;
    const pieces=v.match(/\d+(?:[.,]\d+)?/g)?.map(x=>Number(x.replace(',','.'))) || [];
    if(pieces.length!==2)return false;
    // Respect explicit physical units and allow 6ft / 5ft dimensions.
    const feet=/\b(ft|feet|foot|pies|pie)\b|'/.test(v);
    const dims=feet ? pieces.map(n=>n*12) : pieces;
    return [0,1].every(i=>Math.abs(dims[i]-desired[i])<.025) ||
      [0,1].every(i=>Math.abs(dims[i]-desired[1-i])<.025);
  }
  function classifyVariant(v,kind){
    if(!v||!Array.isArray(v.options)||v.options.length<1||v.options.length>2)return null;
    const candidates=v.options.map((x,i)=>({base:baseFromValue(x),index:i})).filter(x=>x.base);
    if(candidates.length!==1)return null;
    const base=candidates[0].base;
    if(v.options.length===2 && !fixedSizeMatches(v.options[1-candidates[0].index],kind))return null;
    const price=Number(v.price);
    if(!String(v.id||'').match(/^\d+$/)||!Number.isFinite(price)||price<0)return null;
    return {base,id:String(v.id),price,available:v.available===true};
  }
  function mount(root){
    if(root.dataset.standInitialized==='true')return;
    const form=$(root,'form.impress-banner__form');if(!form)return;
    root.dataset.standInitialized='true';
    form.enctype='multipart/form-data';
    const type=root.dataset.standType==='xstand'?'xstand':'rollup';
    const size=type==='xstand'?'23.5 in ancho × 60 in alto':'33 in ancho × 72 in alto';
    const el=key=>$(root,`[data-ib-${key}]`);
    const ui={qty:el('quantity'),down:el('qty-down'),up:el('qty-up'),variant:el('variant-id'),baseProperty:el('property-mount'),
      total:el('total'),note:el('price-note'),submit:el('submit'),message:el('message'),art:el('art-input'),label:el('file-label'),fileHint:el('file-hint'),summary:el('mount-summary'),caption:el('mount-caption')};
    if(Object.values(ui).some(x=>!x))return;
    const editor=window.ImpressStandEditor?.mount(root);
    if(!editor){ui.message.textContent='No se cargó el editor del soporte. Revisa impress-stand-editor.js.';return;}
    const radioOptions=[...root.querySelectorAll('[data-stand-base]')];
    let variants=[];
    try{variants=JSON.parse(el('variants')?.textContent||'[]');}catch{variants=[];}
    const supported=variants.map(v=>classifyVariant(v,type));
    const good=variants.length===2 && supported.every(Boolean) && new Set(supported.map(x=>x.base)).size===2 &&
      (!root.dataset.variantCount || Number(root.dataset.variantCount)===variants.length);
    // Avoid relying on option order. A 2-option product may place Size first or Base first.
    const byBase=Object.fromEntries((good?supported:[]).map(v=>[v.base,v]));
    const choice=good?(supported.find(v=>v.id===root.dataset.selectedVariant)||supported.find(v=>v.available)||supported[0]).base:'with';
    let state={base:choice,quantity:1};
    const money=(()=>{try{return new Intl.NumberFormat(document.documentElement.lang||'es-PR',{style:'currency',currency:root.dataset.currency||'USD'});}catch{return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});}})();
    let selected=null,prepared=false,preparing=false;
    function update(){
      const isWith=state.base==='with';
      ui.baseProperty.value=isWith?'Con base':'Sin base';
      ui.caption.textContent=isWith?'CON BASE':'SIN BASE';
      ui.summary.textContent=isWith
        ? (type==='rollup'?'Roll-Up con cassette inferior y riel superior. Guía de sujeción ilustrativa de 0.25″ arriba y abajo.':'X-Stand con patas y soporte de tensión trasero. Las esquinas de sujeción son ilustrativas.')
        : 'Solo el material impreso, sin estructura ni base. Confirma con producción las terminaciones del material.';
      editor.setOptions({base:state.base});
      window.ImpressAddons?.setContext(form,{size,units:state.quantity});
      selected=good?byBase[state.base]:null;
      ui.variant.value=selected?.id||'';
      if(selected){
        ui.total.textContent=money.format(selected.price*state.quantity/100);
        ui.note.textContent=`${money.format(selected.price/100)} cada unidad × ${state.quantity} · ${size}`;
        window.ImpressAddons?.setBase(form,selected.price*state.quantity);
      }else{
        ui.total.textContent='—';ui.note.textContent='Configura las dos variantes de base en Shopify para activar precios.';
        window.ImpressAddons?.setBase(form,null);
      }
      ui.submit.disabled=!selected?.available;
      ui.message.textContent=!good
        ? 'Configura exactamente dos variantes Shopify: Con base y Sin base. Opcionalmente añade el mismo tamaño fijo a ambas.'
        : selected&&!selected.available?'Esta opción no está disponible.':'';
    }
    radioOptions.forEach(r=>{
      r.checked=r.value===state.base;
      r.addEventListener('change',()=>{
        if(!r.checked)return;state.base=r.value;
        prepared=false;update();
      });
    });
    function changeQuantity(value){
      const n=Math.round(Number(value));state.quantity=Number.isFinite(n)?Math.max(1,Math.min(100,n)):1;
      ui.qty.value=String(state.quantity);prepared=false;update();
    }
    ui.down.addEventListener('click',()=>changeQuantity(state.quantity-1));
    ui.up.addEventListener('click',()=>changeQuantity(state.quantity+1));
    ui.qty.addEventListener('change',()=>changeQuantity(ui.qty.value));
    ui.qty.addEventListener('input',()=>{state.quantity=Math.max(1,Math.min(100,Math.round(Number(ui.qty.value)||1)));prepared=false;update();});
    window.ImpressEditorCore?.bindEmptyUpload(el('empty'),()=>ui.art);
    const artworkSource=window.ImpressArtworkSource.mount({
      original:ui.art,maxBytes:20*1024*1024,
      onChange:()=>{prepared=false;},
      onFile:file=>{
        ui.label.textContent=file?.name||'Seleccionar archivo';
        ui.fileHint.textContent=file?'Archivo original seleccionado. La vista se prepara por separado.':'SVG, PNG, JPG, JPEG, TIF o PDF · máx. 20 MB.';
        editor.loadFile(file||null);
      }
    });
    window.ImpressAddons?.connectArtwork(form,[artworkSource]);
    form.addEventListener('submit',async e=>{
      if(!good||!selected?.available||!ui.variant.value||ui.submit.disabled){e.preventDefault();return;}
      if(window.ImpressAddons&&!window.ImpressAddons.ready(form)){e.preventDefault();return;}
      // A selected Artwork Design service can make the original file optional.
      // Skip validation only when it is genuinely optional and no file exists;
      // the shared artwork-source validator assumes an actual file in that case.
      if((ui.art.required || ui.art.files?.length) && !artworkSource.validate()){
        e.preventDefault();return;
      }
      const n=Number(ui.qty.value);if(!Number.isInteger(n)||n<1||n>100){e.preventDefault();ui.qty.focus();return;}
      if(prepared)return;
      e.preventDefault();if(preparing)return;
      preparing=true;ui.submit.disabled=true;
      try{
        // Exactly the same original-artwork submission + editable PNG preview
        // pipeline as the existing Impress Banner configurator.
        if(ui.art.files?.length)await editor.prepareOrderFiles();
        prepared=true;ui.submit.disabled=false;form.requestSubmit(ui.submit);
      }catch(err){
        ui.message.textContent='No se pudo preparar la vista: '+(err?.message||'error desconocido');
      }finally{preparing=false;if(!prepared)ui.submit.disabled=!selected?.available;}
    });
    update();
  }
  function init(scope){scope.querySelectorAll('[data-impress-stand]').forEach(mount);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init(document),{once:true});else init(document);
  document.addEventListener('shopify:section:load',e=>init(e.target));
  // Expose pure variant parsing for local regression tests.
  window.ImpressStandOptions=Object.freeze({baseFromValue,fixedSizeMatches,classifyVariant});
})();
