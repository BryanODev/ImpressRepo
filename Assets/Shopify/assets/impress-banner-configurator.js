/* Impress Banner Configurator v0.3 config — no extra backend or dependencies.
 * Variant option positions come only from impress-variant-mapping.js.
 * Quantity is native Shopify cart quantity, not another variant dimension.
 * In preview mode, no guessed variant ID or price is sent to checkout.
 */
(() => {
  'use strict';
  const config=()=>window.ImpressProductConfigs?.banners||null;
  const uniq=arr=>[...new Set(arr)];
  // Shopify option labels remain authoritative. These patterns ONLY group known
  // finishing values into three customer-friendly choices. Unknown legacy options
  // (Palos, Argollas, etc.) remain visible without being reinterpreted.
  const normalize=str=>String(str||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function classifyFinish(label){
    const value=normalize(label);
    if(/reforzad|reinforc|reinforced/.test(value)){
      // Never guess which reinforced grommet spacing the customer purchased.
      const a=/(?:cada|every|espaciad[oa]?|separad[oa]?)\s*(?:de\s*)?(1|2)\s*(?:pie|pies|ft|feet|foot)\b/.exec(value);
      const b=/(?:cada|every|espaciad[oa]?|separad[oa]?)\s*(?:de\s*)?(12|24)\s*(?:in|pulg|inch)/.exec(value);
      const c=/\b(1|2)\s*(?:pie|pies|ft|feet|foot)\b/.exec(value);
      const d=/\b(12|24)\s*(?:in|pulg|inch)/.exec(value);
      const spacing=a?Number(a[1])*12:b?Number(b[1]):c?Number(c[1])*12:d?Number(d[1]):null;
      return {key:'reinforced',label:'Banner reforzado',description:'Dobladillo en los cuatro lados · argollas según separación',spacing,hardware:'Argollas'};
    }
    if(/sencill|simple|basic/.test(value)){
      const corners=/argoll|ojal|grommet|eyelet/.test(value) && !/(?:sin|without|no)\s+(?:\w+\s+){0,2}(?:argoll|ojal|grommet|eyelet)/.test(value);
      return corners
        ? {key:'corners',label:'Sencilla con argollas',description:'Laterales doblados · 4 argollas, una en cada esquina',spacing:null,hardware:'Argollas4'}
        : {key:'simple',label:'Terminación sencilla',description:'Laterales doblados · sin argollas',spacing:null,hardware:'Sin guía'};
    }
    return {key:'legacy:'+label,label,description:'Opción actual de Shopify',spacing:null,
      hardware:/argoll|ojal|grommet|eyelet/.test(value)?'Argollas':/palos?|pole|rod|bolsill/.test(value)?'Palos':'Sin guía'};
  }
  const $=(root,s)=>root.querySelector(s);
  const ICONS={
    Argollas:`<svg class="impress-banner__mount-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="4" y="8" width="40" height="32" rx="3" fill="#fbbf00" stroke="#20333e" stroke-width="2.5"/><g fill="#fff" stroke="#20333e" stroke-width="2"><circle cx="10" cy="14" r="2.8"/><circle cx="38" cy="14" r="2.8"/><circle cx="10" cy="34" r="2.8"/><circle cx="38" cy="34" r="2.8"/><circle cx="24" cy="14" r="2.8"/><circle cx="24" cy="34" r="2.8"/></g></svg>`,
    Argollas4:`<svg class="impress-banner__mount-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="4" y="8" width="40" height="32" rx="3" fill="#fbbf00" stroke="#20333e" stroke-width="2.5"/><g fill="#fff" stroke="#20333e" stroke-width="2"><circle cx="10" cy="14" r="3"/><circle cx="38" cy="14" r="3"/><circle cx="10" cy="34" r="3"/><circle cx="38" cy="34" r="3"/></g></svg>`,
    Palos:`<svg class="impress-banner__mount-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="5" y="10" width="38" height="28" rx="2" fill="#fbbf00" stroke="#20333e" stroke-width="2.5"/><path d="M9 14H39 M9 34H39" stroke="#2b9fb6" stroke-width="1.5" stroke-dasharray="3 3" stroke-linecap="round"/></svg>`,
    'Sin guía':`<svg class="impress-banner__mount-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="4" y="8" width="40" height="32" rx="3" fill="#fbbf00" stroke="#20333e" stroke-width="2.5"/><path d="M9 11V37M39 11V37" stroke="#2b9fb6" stroke-width="2" stroke-dasharray="3 2"/></svg>`
  };
  function mount(root){
    if(root.dataset.ibInitialized==='true')return;
    const form=$(root,'form.impress-banner__form');if(!form)return;
    const cfg=config();
    if(!cfg){const m=$(root,'[data-ib-message]');if(m)m.textContent='Falta impress-banner-config.js. Compras deshabilitadas.';return;}
    const qtyMin=Math.max(1,Math.floor(Number(cfg.quantity?.min)||1));
    const qtyMax=Math.max(qtyMin,Math.floor(Number(cfg.quantity?.max)||100));
    const qtyStep=Math.max(1,Math.floor(Number(cfg.quantity?.step)||1));
    const maxBytes=Math.max(1,Number(cfg.maxArtworkMB)||20)*1024*1024;
    root.dataset.ibInitialized='true';form.enctype='multipart/form-data';
    const f=key=>$(root,`[data-ib-${key}]`);
    const ui={mounts:f('mounts'),spacingRow:f('spacing-row'),spacingOptions:f('spacing-options'),propertySpacing:f('property-spacing'),size:f('sizes'),qty:f('quantity'),minus:f('qty-down'),plus:f('qty-up'),variant:f('variant-id'),propertyMount:f('property-mount'),propertySize:f('property-size'),summary:f('mount-summary'),total:f('total'),priceNote:f('price-note'),message:f('message'),submit:f('submit'),art:f('art-input'),fileLabel:f('file-label'),fileHint:f('file-hint'),mountCaption:f('mount-caption')};
    if(Object.values(ui).some(v=>!v)){console.error('Impress Banners: incomplete section markup.');return;}
    const editor=window.ImpressBannerEditor?.mount(root);
    if(!editor)console.error('Impress Banner Editor unavailable; verify impress-banner-editor.js exists.');
    let variants=[];
    let dataError='';
    try{
      variants=JSON.parse(f('variants')?.textContent||'[]');
      if(!Array.isArray(variants))throw new Error('Error de variantes');
    }catch(err){dataError=err.message;}
    const mapping=window.ImpressResolveOptionMapping?.('banners',['mounting','size'],2);
    const count=Number(root.dataset.variantCount);
    const catalogComplete=!root.dataset.variantCount||count===variants.length;
    const supported=variants.map(v=>{
      if(!mapping||!Array.isArray(v.options)||v.options.length!==2)return null;
      const mounting=String(v.options[mapping.mounting]??'').trim();
      const size=String(v.options[mapping.size]??'').trim();
      const price=Number(v.price);
      if(!mounting||!editor?.parseSize(size)||!Number.isFinite(price)||price<0)return null;
      return{id:String(v.id),mounting,size,finish:classifyFinish(mounting),price,available:!!v.available};
    }).filter(Boolean);
    const tuples=supported.map(v=>[v.mounting,v.size].join('\u0000'));
    const finishTuples=supported.map(v=>[v.finish.key,v.finish.spacing??'',v.size].join('\u0000'));
    const malformedReinforced=supported.some(v=>v.finish.key==='reinforced'&&!([12,24].includes(v.finish.spacing)));
    const valid=!dataError&&Boolean(mapping)&&catalogComplete&&variants.length>0&&supported.length===variants.length&&
      new Set(tuples).size===tuples.length && new Set(finishTuples).size===finishTuples.length && !malformedReinforced && supported.every(r=>r.id&&r.id!=='undefined');
    let state={mounting:'',choice:'',spacing:24,size:'',quantity:qtyMin,orientation:cfg.orientation?.default||'Horizontal'};
    ui.qty.min=String(qtyMin);ui.qty.max=String(qtyMax);ui.qty.step=String(qtyStep);ui.qty.value=String(qtyMin);
    const money=(()=>{try{return new Intl.NumberFormat(document.documentElement.lang||'es-PR',{style:'currency',currency:root.dataset.currency||'USD'});}catch{return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});}})();
    let selectedVariant=null;
    const groups=uniq(supported.map(v=>v.finish.key)).map(key=>({key,finish:supported.find(v=>v.finish.key===key).finish}));
    function matchingVariant(){
      return supported.find(v=>v.finish.key===state.choice && v.size===state.size &&
        (state.choice!=='reinforced'||v.finish.spacing===state.spacing))||null;
    }
    function drawMounts(){
      ui.mounts.replaceChildren();
      groups.forEach(({key,finish})=>{
        const label=document.createElement('label');label.className='impress-banner__mount-card';
        const radio=document.createElement('input');radio.type='radio';radio.name=`impress-banner-mount-${root.id}`;
        radio.value=key;radio.checked=key===state.choice;
        const surface=document.createElement('span');surface.className='impress-banner__mount-surface';
        surface.insertAdjacentHTML('beforeend',ICONS[finish.hardware]||ICONS['Sin guía']);
        const copy=document.createElement('span');copy.className='impress-banner__mount-copy';
        const txt=document.createElement('span');txt.className='impress-banner__mount-label';txt.textContent=finish.label;
        const desc=document.createElement('small');desc.textContent=finish.description;
        copy.append(txt,desc);surface.append(copy);label.append(radio,surface);ui.mounts.append(label);
        radio.addEventListener('change',()=>{
          if(!radio.checked)return;
          state.choice=key;
          if(key==='reinforced'){
            const possible=uniq(supported.filter(v=>v.finish.key===key).map(v=>v.finish.spacing));
            if(!possible.includes(state.spacing))state.spacing=possible.includes(24)?24:possible[0];
          }
          syncSelection();
        });
      });
    }
    function drawSpacing(){
      const reinforced=state.choice==='reinforced';ui.spacingRow.hidden=!reinforced;
      ui.spacingOptions.replaceChildren();
      if(!reinforced){ui.propertySpacing.value='';return;}
      const possible=uniq(supported.filter(v=>v.finish.key==='reinforced').map(v=>v.finish.spacing)).sort((a,b)=>b-a);
      if(!possible.includes(state.spacing))state.spacing=possible.includes(24)?24:possible[0];
      possible.forEach(inches=>{
        const label=document.createElement('label');label.className='impress-banner__spacing-choice';
        const input=document.createElement('input');input.type='radio';input.name=`ib-spacing-${root.id}`;
        input.value=String(inches);input.checked=inches===state.spacing;
        const text=document.createElement('span');text.textContent=`Cada ${inches/12} ${inches===12?'pie':'pies'}`;
        label.append(input,text);ui.spacingOptions.append(label);
        input.addEventListener('change',()=>{if(!input.checked)return;state.spacing=inches;syncSummary();syncPrice();});
      });
      ui.propertySpacing.value=`Cada ${state.spacing/12} ${state.spacing===12?'pie':'pies'}`;
    }
    function drawSizes(){
      const sizes=uniq(supported.map(v=>v.size));
      if(!sizes.includes(state.size))state.size=sizes[0]||'';
      ui.size.replaceChildren();
      sizes.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;ui.size.append(o);});
      ui.size.value=state.size;ui.size.disabled=!sizes.length;
    }
    function syncSummary(){
      const match=matchingVariant();
      const finish=match?.finish||groups.find(g=>g.key===state.choice)?.finish;
      const kind=finish?.hardware||'Sin guía';
      const count=editor?.mountCount(state.size,state.orientation,kind,state.spacing);
      const g=cfg.grommets||{};
      ui.summary.textContent=state.choice==='simple'
        ? 'Terminación sencilla: se doblan únicamente los laterales izquierdo y derecho. Sin argollas.'
        : state.choice==='corners'
          ? 'Terminación sencilla con argollas: laterales izquierdo y derecho doblados; 4 argollas, una en cada esquina.'
          : state.choice==='reinforced'
            ? `Banner reforzado: dobladillo en los cuatro lados. Argollas cada ${state.spacing/12} ${state.spacing===12?'pie':'pies'} (${count??'varias'} posiciones ilustrativas). Verificar en producción.`
            : kind==='Argollas'
              ? `Argollas (opción anterior): ${count??'varias'} posiciones ilustrativas · diámetro ${g.diameterInches??0.5}″. Confirmar en producción.`
              : kind==='Palos'
                ? 'Palos (opción anterior): montaje detrás del banner. La vista final no muestra herrajes frontales.'
                : 'Terminación seleccionada en Shopify. Consulta las especificaciones de producción.';
      const label=finish?.label||state.mounting;
      ui.mountCaption.textContent=String(label||'TERMINACIÓN').toUpperCase();
      state.mounting=match?.mounting||'';
      ui.propertyMount.value=state.mounting;ui.propertySize.value=state.size;
      ui.propertySpacing.value=state.choice==='reinforced'?`Cada ${state.spacing/12} ${state.spacing===12?'pie':'pies'}`:'';
      f('property-orientation').value=state.orientation;
      editor?.setOptions({mounting:kind,size:state.size,orientation:state.orientation,
        spacingInches:state.choice==='reinforced'?state.spacing:null,
        folding:state.choice==='reinforced'?'all':state.choice==='simple'||state.choice==='corners'?'sides':null});
    }
    function syncPrice(){
      window.ImpressAddons?.setContext(form,{size:state.size,units:state.quantity});
      if(valid){
        selectedVariant=matchingVariant();
        ui.variant.value=selectedVariant?.id||'';
        if(selectedVariant){
          ui.total.textContent=money.format(selectedVariant.price*state.quantity/100);
          window.ImpressAddons?.setBase(form,selectedVariant.price*state.quantity);
          ui.priceNote.textContent=`${money.format(selectedVariant.price/100)} cada banner × ${state.quantity}`;
        }else{ui.total.textContent='—';ui.priceNote.textContent='No existe un precio para esta combinación.';window.ImpressAddons?.setBase(form,null);}
        ui.submit.disabled=!selectedVariant?.available;
        ui.message.textContent=selectedVariant&&!selectedVariant.available?'Esta combinación no está disponible.':'';
      }else{
        ui.variant.value='';ui.total.textContent='—';ui.priceNote.textContent='Sin variantes Shopify válidas.';window.ImpressAddons?.setBase(form,null);
        ui.submit.disabled=true;
      }
    }
    function syncSelection(){
      if(valid){drawMounts();drawSizes();drawSpacing();}
      else{ui.mounts.replaceChildren();ui.spacingOptions.replaceChildren();ui.spacingRow.hidden=true;drawSizes();}
      syncSummary();syncPrice();
    }
    if(valid){
      const init=supported.find(v=>v.id===root.dataset.selectedVariant)||supported.find(v=>v.available)||supported[0];
      state.mounting=init.mounting;state.choice=init.finish.key;state.spacing=init.finish.spacing||24;state.size=init.size;root.dataset.ibMode='shopify';
    }else{
      root.dataset.ibMode='preview';
    }
    // Orientation is preview/order metadata only; do not touch the priced variant.
    root.querySelectorAll('[data-ib-orientation]').forEach(radio=>{
      radio.checked=radio.value===state.orientation;
      radio.addEventListener('change',()=>{if(!radio.checked)return;state.orientation=radio.value;syncSummary();});
    });
    window.ImpressEditorCore?.bindEmptyUpload(f('empty'),()=>ui.art);
    window.ImpressEditorCore?.bindEmptyUpload(f('stage'),()=>ui.art);
    ui.size.addEventListener('change',()=>{state.size=ui.size.value;syncSummary();syncPrice();});
    ui.qty.addEventListener('input',()=>{
      state.quantity=Math.max(qtyMin,Math.min(qtyMax,Math.round(Number(ui.qty.value)||qtyMin)));
      syncPrice();
    });
    ui.qty.addEventListener('change',()=>{ui.qty.value=String(state.quantity);});
    ui.minus.addEventListener('click',()=>{state.quantity=Math.max(qtyMin,state.quantity-qtyStep);ui.qty.value=String(state.quantity);syncPrice();});
    ui.plus.addEventListener('click',()=>{state.quantity=Math.min(qtyMax,state.quantity+qtyStep);ui.qty.value=String(state.quantity);syncPrice();});
    let prepared=false,preparing=false;
    const bannerSource = window.ImpressArtworkSource.mount({
      original:ui.art,
      maxBytes,
      onChange:()=>{prepared=false;},
      onFile:(file)=>{
        ui.fileLabel.textContent=file?file.name:'Seleccionar archivo';
        ui.fileHint.textContent=file?'Original seleccionado. Se preparará una vista editable; conservamos el original.':'SVG, PNG, JPG, JPEG, TIF o PDF · máximo 20 MB.';
        editor?.loadFile(file||null);
      }
    });
    window.ImpressAddons?.connectArtwork(form,[bannerSource]);
    form.addEventListener('submit',async e=>{
      if(!valid||!selectedVariant?.available||!ui.variant.value||ui.submit.disabled){e.preventDefault();return;}
      if((window.ImpressAddons && !window.ImpressAddons.ready(form))){e.preventDefault();return;}
      if(!bannerSource.validate()){e.preventDefault();return;}
      const qty=Number(ui.qty.value);
      if(!Number.isInteger(qty)||qty<qtyMin||qty>qtyMax){e.preventDefault();ui.qty.focus();return;}
      if(prepared)return;
      e.preventDefault();if(preparing)return;
      preparing=true;ui.submit.disabled=true;
      try{
        if(editor && ui.art.files?.length)await editor.prepareOrderFiles();
        prepared=true;ui.submit.disabled=false;
        form.requestSubmit(ui.submit);
      }catch(err){
        ui.message.textContent='No se pudo preparar la vista: '+(err?.message||'error desconocido');
      }finally{preparing=false;if(!prepared)ui.submit.disabled=false;}
    });
    syncSelection();
    if(!valid){
      ui.message.textContent=!mapping
        ? 'Compras deshabilitadas: revisa los índices mounting y size en impress-variant-mapping.js.'
        : !catalogComplete?'Compras deshabilitadas: catálogo de variantes incompleto.'
        : 'Compras deshabilitadas: revisa las terminaciones (reforzado requiere 1 pie o 2 pies), los tamaños y los precios de Shopify.';
    }
  }
  const initAll=(context=document)=>context.querySelectorAll('[data-impress-banner]').forEach(mount);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>initAll(),{once:true});
  else initAll();
  document.addEventListener('shopify:section:load',event=>initAll(event.target));
})();
