/* IMPRESS PAPER CONFIGURATOR: one variant-safe controller for Flyers and Business Cards.
 * Shopify drives sizes, sides, quantities, prices and availability. No guessed prices.
 * Physical margin presets and artwork controls remain separate from variant mapping.
 */
(() => {
  'use strict';
  const $$=(root,s)=>root.querySelector(s);
  const norm=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  function sideCount(s){const v=norm(s);if(/^2\b|dos|doble|double|both|two|frente.{0,10}(dorso|reverso)|front.{0,10}back/.test(v))return 2;if(/^1\b|una?\b|single|simple|sencill/.test(v))return 1;return null;}
  function numericQuantity(s){const m=/\d[\d,.]*/.exec(String(s));return m?Number(m[0].replace(/[,.]/g,'')):NaN;}
  function loadAll(context=document){context.querySelectorAll('[data-impress-paper]').forEach(mount);}
  function mount(root){
    if(root.dataset.ipInitialized==='yes')return;
    const cfg=window.ImpressProductConfigs?.[root.dataset.productType];
    const form=$$(root,'.impress-paper__form');if(!form)return;
    if(!cfg){const m=$$(root,'[data-ip-message]');if(m)m.textContent='Falta el archivo de configuración del producto.';return;}
    if(!window.ImpressPaperEditor){console.error('ImpressPaperEditor missing');return;}
    root.dataset.ipInitialized='yes';form.enctype='multipart/form-data';
    const el=name=>$$(root,`[data-ip-${name}]`);
    const input={size:el('sizes'),orientation:el('orientation'),orientationRow:el('orientation-row'),sides:el('sides'),pack:el('package'),variant:el('variant-id'),
      sideProps:el('property-sides'),sizeProps:el('property-size'),orientationProps:el('property-orientation'),packProps:el('property-package'),
      front:el('file-front'),back:el('file-back'),frontLabel:el('front-label'),backLabel:el('back-label'),backField:el('back-field'),
      price:el('price'),priceNote:el('price-note'),message:el('message'),submit:el('submit')};
    const maxBytes=Math.max(1,Number(cfg.maxArtworkMB)||20)*1024*1024;
    let source={names:[],variants:[]};
    try{source=JSON.parse(el('variants')?.textContent||'{}');}catch{input.message.textContent='No se pudieron leer las variantes de Shopify.';}
    const isBusiness=root.dataset.productType==='businessCards';
    // The names of Shopify's options are irrelevant. Only their zero-based positions matter.
    const count=Array.isArray(source.names)?source.names.length:0;
    const mapping=window.ImpressResolveOptionMapping?.(root.dataset.productType,['size','sides','quantity'],count);
    const sizeIndex=mapping?.size, sideIndex=mapping?.sides, qtyIndex=mapping?.quantity;
    const defaultMargins=isBusiness
      ? {left:0.1,right:0.1,top:0.1,bottom:0.1}
      : {left:0.25,right:0.25,top:0.25,bottom:0.25};
    const inchesValue=raw=>Number(String(raw).replace(',','.'));
    function resolveSize(raw){
      const label=String(raw??'').trim();if(!label)return null;
      // Shopify's exact value is always the displayed choice, even for preset aliases.
      // Physical presets supply only margin settings, never the sellable option list.
      const m=/^(\d+(?:[.,]\d+)?)\s*(?:x|×)\s*(\d+(?:[.,]\d+)?)\s*(in(?:ches)?|inch|cm|mm|["”])?$/i.exec(label);
      if(!m)return null;
      const factor=/^cm$/i.test(m[3]||'')?1/2.54:/^mm$/i.test(m[3]||'')?1/25.4:1;
      const width=inchesValue(m[1])*factor,height=inchesValue(m[2])*factor;
      if(!(width>0&&height>0&&width<=120&&height<=120))return null;
      const preset=cfg.sizes.find(z=>norm(z.label)===norm(label)||z.variantLabels?.some(alias=>norm(alias)===norm(label))||
        (Math.abs(z.width-width)<.005&&Math.abs(z.height-height)<.005));
      return {...(preset||{}),label,width,height,margins:{...(preset?.margins||defaultMargins)}};
    }
    const rawRecords=Array.isArray(source.variants)?source.variants:[];
    const rawCount=Number(root.dataset.variantCount);
    const catalogComplete=!root.dataset.variantCount || rawCount===rawRecords.length;
    const validShape=Boolean(mapping)&&catalogComplete;
    const sizeMap=new Map();
    const records=rawRecords.map(v=>{
      if(!validShape||!Array.isArray(v.options)||v.options.length!==count)return null;
      const c=sideCount(v.options[sideIndex]),q=numericQuantity(v.options[qtyIndex]);
      const rawSize=v.options[sizeIndex];
      const size=resolveSize(rawSize);
      const price=Number(v.price);
      if(!size||![1,2].includes(c)||!Number.isSafeInteger(q)||q<=0||!Number.isFinite(price)||price<0||!v.id)return null;
      if(!sizeMap.has(size.label))sizeMap.set(size.label,size);
      return {id:String(v.id),size:size.label,sides:c,sideLabel:String(v.options[sideIndex]),quantity:q,price,available:!!v.available};
    }).filter(Boolean);
    // Prevent two source variants from mapping onto the same visible combination.
    const combinationSet=new Set();
    const supported=records.filter(r=>{
      const key=[r.size,r.sides,r.quantity].join('\u0000');
      if(combinationSet.has(key))return false;
      combinationSet.add(key);return true;
    });
    const useVariants=validShape&&supported.length>0&&supported.length===rawRecords.length;
    const runtimeSizes=useVariants?[...sizeMap.values()]:cfg.sizes;
    const runtimeCfg={...cfg,sizes:runtimeSizes};
    const editor=window.ImpressPaperEditor.mount(root,runtimeCfg);
    const initial=supported.find(v=>v.id===root.dataset.selectedVariant)||supported.find(v=>v.available)||supported[0];
    const state={size:initial?.size||runtimeSizes[0]?.label||'',sides:initial?.sides||1,quantity:initial?.quantity||1,
      orientation:cfg.orientation?.default||'Horizontal'};
    const money=(()=>{try{return new Intl.NumberFormat(document.documentElement.lang||'es-PR',{style:'currency',currency:root.dataset.currency||'USD'});}catch{return new Intl.NumberFormat('es-PR',{style:'currency',currency:'USD'});}})();
    let match=null,prepared=false,preparing=false;
    const sources={};
    function fillOptions(select,items,value){select.replaceChildren();items.forEach(item=>{const option=document.createElement('option');option.value=String(item.value);option.textContent=item.label;select.append(option);});select.value=String(value);}
    const sideLabel=(count,size=state.size)=>supported.find(v=>v.sides===count&&v.size===size)?.sideLabel||`${count} ${count===1?'cara':'caras'}`;
    const sizes=()=>useVariants?runtimeSizes.map(v=>({value:v.label,label:v.label})):[];
    const sidesFor=()=>useVariants?[...new Set(supported.filter(r=>r.size===state.size).map(r=>r.sides))].sort((a,b)=>a-b).map(n=>({value:n,label:sideLabel(n)})):[];
    const quantitiesFor=()=>useVariants?[...new Set(supported.filter(r=>r.size===state.size&&r.sides===state.sides).map(r=>r.quantity))].sort((a,b)=>a-b):[];
    fillOptions(input.size,sizes(),state.size);
    fillOptions(input.sides,sidesFor(),state.sides);
    fillOptions(input.pack,quantitiesFor().map(q=>({value:q,label:`${q} unidades`})),state.quantity);
    if(cfg.orientation?.enabled){fillOptions(input.orientation,(cfg.orientation.options||['Horizontal','Vertical']).map(x=>({value:x,label:x})),state.orientation);input.orientationRow.hidden=false;}else{input.orientationRow.hidden=true;}
    // The underlying selects retain the same data flow; branded icon tiles change
    // those selects, so the prices/availability pipeline stays untouched.
    function renderTiles(slot,select,items,iconKey,groupSuffix){
      slot.replaceChildren();
      items.forEach(item=>{
        const label=document.createElement('label');label.className='impress-paper__choice';
        const radio=document.createElement('input');radio.type='radio';radio.name=`${root.id}-${groupSuffix}`;
        radio.value=String(item.value);radio.checked=String(select.value)===radio.value;
        const surface=document.createElement('span');surface.className='impress-paper__choice-surface';
        const img=document.createElement('img');img.className='impress-paper__choice-icon';img.alt='';img.setAttribute('aria-hidden','true');
        const suffix=item.value===1?'One':item.value===2?'Two':item.value;
        img.src=root.dataset[iconKey+suffix]||'';
        const txt=document.createElement('span');txt.className='impress-paper__choice-label';txt.textContent=item.label;
        surface.append(img,txt);label.append(radio,surface);slot.append(label);
        radio.addEventListener('change',()=>{if(!radio.checked)return;select.value=radio.value;select.dispatchEvent(new Event('change',{bubbles:true}));});
      });
    }
    const sideSlot=el('sides-choices'),orientationSlot=el('orientation-choices');
    renderTiles(sideSlot,input.sides,sidesFor(),'ipIcon','caras');
    if(cfg.orientation?.enabled)renderTiles(orientationSlot,input.orientation,(cfg.orientation.options||['Horizontal','Vertical']).map(v=>({value:v,label:v})),'ipIcon','orientacion');
    function syncTiles(){for(const [slot,select] of [[sideSlot,input.sides],[orientationSlot,input.orientation]]){
      slot?.querySelectorAll('input[type="radio"]').forEach(r=>r.checked=r.value===String(select.value));
    }}
    function sync(){
      // Only show actual Shopify combinations. Changing size/sides adjusts dependent
      // choices without introducing imaginary variants or requiring a config edit.
      const sideChoices=sidesFor();
      if(sideChoices.length&&!sideChoices.some(v=>Number(v.value)===state.sides))state.sides=Number(sideChoices[0].value);
      const quantityChoices=quantitiesFor();
      if(quantityChoices.length&&!quantityChoices.includes(state.quantity))state.quantity=quantityChoices[0];
      fillOptions(input.size,sizes(),state.size);
      fillOptions(input.sides,sideChoices,state.sides);
      fillOptions(input.pack,quantityChoices.map(q=>({value:q,label:`${q} unidades`})),state.quantity);
      renderTiles(sideSlot,input.sides,sideChoices,'ipIcon','caras');
      const double=state.sides===2;
      if(cfg.orientation?.enabled)input.orientation.value=state.orientation;
      input.backField.hidden=!double;sources.back?.setActive(double);
      input.sideProps.value=sideLabel(state.sides);input.sizeProps.value=useVariants?state.size:'';
      const selectedSize=runtimeSizes.find(x=>x.label===state.size);
      input.orientationProps.value=cfg.orientation?.enabled?state.orientation:(selectedSize?.width>selectedSize?.height?'Horizontal':'Vertical');
      input.packProps.value=useVariants?`${state.quantity} unidades`:'';
      editor.setOptions({size:state.size,orientation:state.orientation,twoSides:double});
      syncTiles();
      match=useVariants?supported.find(r=>r.size===state.size&&r.sides===state.sides&&r.quantity===state.quantity)||null:null;
      input.variant.value=match?.id||'';
      input.price.textContent=match?money.format(match.price/100):'—';
      window.ImpressAddons?.setContext(form,{size:state.size,pack:state.quantity,units:1});
      window.ImpressAddons?.setBase(form,match?match.price:null);
      input.priceNote.textContent=match?`${state.quantity} unidades · ${money.format(match.price/100)} por paquete`:'No hay un precio Shopify para esta combinación.';
      input.submit.disabled=!match?.available;
      if(!useVariants){
        input.message.textContent=!mapping
          ? 'Compras deshabilitadas: el mapeo de índices requiere exactamente 3 opciones de Shopify. Revisa impress-variant-mapping.js.'
          : !catalogComplete?'Compras deshabilitadas: Shopify no ha entregado todas las variantes de este producto.'
          : 'Compras deshabilitadas: comprueba los valores de tamaño, caras y cantidad en las variantes reales de Shopify.';
      }else if(!match)input.message.textContent='Esta combinación no tiene una variante Shopify con precio.';
      else if(!match.available)input.message.textContent='Esta combinación está agotada o no disponible.';
      else input.message.textContent=double&&!sources.back?.ready()?'Para imprimir dos caras, adjunta también el arte del dorso.':'';
    }
    input.size.addEventListener('change',()=>{state.size=input.size.value;prepared=false;sync();});
    input.orientation.addEventListener('change',()=>{state.orientation=input.orientation.value;prepared=false;sync();});
    input.sides.addEventListener('change',()=>{state.sides=Number(input.sides.value);prepared=false;sync();});
    input.pack.addEventListener('change',()=>{state.quantity=Number(input.pack.value);prepared=false;sync();});
    for(const side of ['front','back']){
      const control=input[side],label=input[side+'Label'];
      sources[side]=window.ImpressArtworkSource.mount({
        original:control,maxBytes,
        onChange:()=>{prepared=false;sync();},
        onFile:(file)=>{
          label.textContent=file?file.name:side==='front'?'Seleccionar archivo frontal':'Seleccionar archivo posterior';
          editor.loadFile(side,file||null).then(()=>sync());
        }
      });
    }
    sources.back.setActive(state.sides===2);
    window.ImpressAddons?.connectArtwork(form,[sources.front,sources.back]);
    form.addEventListener('submit',async event=>{
      if(!match?.available||!input.variant.value||input.submit.disabled){event.preventDefault();return;}
      if((window.ImpressAddons && !window.ImpressAddons.ready(form))){event.preventDefault();return;}
      if(!sources.front.validate()){event.preventDefault();return;}
      if(state.sides===2&&!sources.back.validate()){event.preventDefault();input.message.textContent='Debes subir el arte del dorso.';return;}
      if(!form.checkValidity()){event.preventDefault();form.reportValidity();return;}
      if(prepared)return;
      event.preventDefault();if(preparing)return;preparing=true;input.submit.disabled=true;
      try{if(sources.front.original.files?.length || sources.back.original.files?.length)await editor.prepareOrderFiles();prepared=true;input.submit.disabled=false;form.requestSubmit(input.submit);}
      catch(error){input.message.textContent=`No se pudo preparar el pedido: ${error.message||'error'}. Conserva los archivos originales.`;input.submit.disabled=false;}
      finally{preparing=false;}
    });
    sync();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>loadAll(),{once:true});else loadAll();
  document.addEventListener('shopify:section:load',event=>loadAll(event.target));
})();
