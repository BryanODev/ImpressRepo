/* IMPRESS / Shopify-driven add-ons: prices are always real service variant prices.
 * A matching group of service variants is one yes/no option whose price changes with
 * print size (and optionally pack quantity). Ordinary services remain checkboxes.
 * No lists of sizes, product names or prices are maintained in JavaScript.
 */
(() => {
  'use strict';
  if (window.ImpressAddons) return;
  const mounted = new WeakMap();
  const money = (cents, currency) => {
    try { return new Intl.NumberFormat(document.documentElement.lang || 'es-PR', {style:'currency',currency:currency||'USD'}).format(cents/100); }
    catch { return `$${(cents/100).toFixed(2)}`; }
  };
  const newJob = () => (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID() : `imp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  /* Physical size matcher. Explicit units avoid silently treating 3x4 inches as
     3x4 feet. Orientation is interchangeable; e.g. 4x3 ft = 3x4 ft. */
  function sizeKey(raw) {
    const text=String(raw??'').trim().toLowerCase().replace(/[×✕*]/g,'x').replace(/\s+/g,' ');
    if(!text)return '';
    const units={'in':25.4,'inch':25.4,'inches':25.4,'pulg':25.4,'pulgada':25.4,'pulgadas':25.4,'"':25.4,
      'ft':304.8,'feet':304.8,'foot':304.8,'pie':304.8,'pies':304.8,"'":304.8,
      'cm':10,'mm':1,'m':1000};
    const unit='(inches|inch|in|pulgadas|pulgada|pulg|"|feet|foot|ft|pies|pie|\'|cm|mm|m)';
    const number='(\\d+(?:[.,]\\d+)?)';
    const match=new RegExp('^'+number+'\\s*'+unit+'?\\s*(?:x\\s*'+number+'\\s*'+unit+'?)?$','i').exec(text);
    if(match){
      const a=Number(match[1].replace(',','.'));
      const b=match[3]?Number(match[3].replace(',','.')):null;
      const first=match[2]||match[4];const second=match[4]||match[2];
      if(a>0 && (b===null||b>0) && first && units[first] && units[second]){
        const dims=[Math.round(a*units[first]*100)/100];
        if(b!==null)dims.push(Math.round(b*units[second]*100)/100);
        return `dimensions:${dims.sort((x,y)=>x-y).join('x')}`;
      }
    }
    return `label:${text.replace(/\s*x\s*/g,'x').replace(/\s+/g,'')}`;
  }
  // A Shopify sticker option can be written "2 x 2 in", while a finishing service
  // is entered as "2 in". Both mean the same nominal sticker size, but we do not
  // equate a rectangular sticker (2 x 3) with a 2-inch finishing service.
  function sameSize(serviceSize, printSize) {
    const service=sizeKey(serviceSize), product=sizeKey(printSize);
    if (service===product) return true;
    if (!service.startsWith('dimensions:')||!product.startsWith('dimensions:')) return false;
    const a=service.slice(11).split('x').map(Number);
    const b=product.slice(11).split('x').map(Number);
    return (a.length===1&&b.length===2&&b[0]===b[1]&&a[0]===b[0]) ||
      (b.length===1&&a.length===2&&a[0]===a[1]&&b[0]===a[0]);
  }
  const parsePositiveInt=value=>/^\d+$/.test(String(value??''))&&Number(value)>0 ? Number(value) : null;
  const candidateFromNode=node=>({
    id:String(node.dataset.id||''),group:String(node.dataset.group||'').trim(),size:String(node.dataset.size||''),
    pack:parsePositiveInt(node.dataset.pack),price:Number(node.dataset.price),
    role:String(node.dataset.role||''),charge:String(node.dataset.charge||'').replace(/-/g,'_'),
    available:node.dataset.available==='true',required:node.dataset.required==='true'
  });
  function resolveService(entries, context) {
    const possible=entries.map(entry=>{
      const normalized=sizeKey(entry.size);
      if(normalized && !sameSize(entry.size,context.size))return null;
      if(entry.pack!==null && entry.pack!==context.pack)return null;
      return {entry,score:(normalized?2:0)+(entry.pack!==null?1:0)};
    }).filter(Boolean).sort((a,b)=>b.score-a.score);
    if(!possible.length)return {entry:null,issue:'missing'};
    if(possible.length>1&&possible[0].score===possible[1].score)return {entry:null,issue:'duplicate'};
    return {entry:possible[0].entry,issue:null};
  }
  function mount(form) {
    if(!form)return null;
    if(mounted.has(form))return mounted.get(form);
    const host=form.querySelector('[data-impress-addons]');
    if(!host)return null;
    const normalBoxes=[...host.querySelectorAll('[data-impress-addon-choice]')];
    const candidates=[...host.querySelectorAll('[data-impress-addon-candidate]')].map(candidateFromNode);
    const ids=host.querySelector('[data-impress-addon-ids]');
    const quantities=host.querySelector('[data-impress-addon-quantities]');
    const modes=host.querySelector('[data-impress-addon-modes]');
    const job=host.querySelector('[data-impress-job-id]');
    const artChoice=host.querySelector('[data-impress-art-choice]');
    const notes=host.querySelector('[data-impress-artwork-notes]');
    const noteField=notes?.querySelector('textarea');
    const sum=host.querySelector('[data-impress-addon-total]');
    const sumValue=host.querySelector('[data-impress-addon-subtotal]');
    const grand=host.querySelector('[data-impress-addon-grand]');
    const grandValue=host.querySelector('[data-impress-addon-grand-value]');
    const message=host.querySelector('[data-impress-addon-message]');
    const orderSummary=form.querySelector('[data-impress-price-summary]');
    const orderBase=orderSummary?.querySelector('[data-impress-base-price]');
    const orderServices=orderSummary?.querySelector('[data-impress-services-price]');
    const orderGrand=orderSummary?.querySelector('[data-impress-grand-price]');
    const groupHost=host.querySelector('[data-impress-addon-groups]');
    // Only sticker pages provide this location. Other product pages keep their
    // existing service layout. The group remains within the same product form.
    const finishingSlot=form.querySelector('[data-impress-addon-finishing-slot]');
    if(finishingSlot&&groupHost)finishingSlot.append(groupHost);
    const state={base:null,currency:host.dataset.currency||'USD',artworkSources:[],size:'',pack:null,units:1};
    const groups=new Map();
    const boxes=[...normalBoxes];
    for(const c of candidates){
      const key=c.group.toLocaleLowerCase();
      if(!groups.has(key))groups.set(key,{title:c.group,entries:[],selected:false});
      groups.get(key).entries.push(c);
    }
    let serial=0;
    for(const group of groups.values()){
      const required=group.entries.some(x=>x.required);
      group.required=required;
      group.mixed=required&&group.entries.some(x=>!x.required);
      group.selected=required;
      const choice=document.createElement('input');choice.type='checkbox';choice.hidden=true;
      choice.dataset.impressAddonChoice='';choice.dataset.required=required?'true':'false';choice.dataset.quantity='1';
      group.choice=choice;groupHost.append(choice);boxes.push(choice);
      const frame=document.createElement('fieldset');frame.className='impress-addons__group';
      const legend=document.createElement('legend');legend.textContent=group.title;frame.append(legend);
      const options=document.createElement('div');options.className='impress-addons__group-options';
      const radioName=`impress-addon-${form.id||'form'}-${serial++}`;
      const makeRadio=(yes)=>{
        const label=document.createElement('label');label.className='impress-addons__group-option';
        const radio=document.createElement('input');radio.type='radio';radio.name=radioName;radio.value=yes?'yes':'no';
        radio.checked=yes?required:!required;
        const icon=document.createElement('span');icon.className='impress-addons__group-icon';icon.setAttribute('aria-hidden','true');
        const content=document.createElement('span');content.className='impress-addons__group-option-content';
        const copy=document.createElement('span');copy.textContent=yes?group.title:`Sin ${group.title}`;
        content.append(copy);
        if(yes){
          const amount=document.createElement('small');amount.className='impress-addons__group-option-price';
          content.append(amount);group.yesAmount=amount;
        }
        label.append(radio,icon,content);options.append(label);
        radio.addEventListener('change',()=>{if(!radio.checked)return;group.selected=yes;update();});
        return radio;
      };
      group.no=makeRadio(false);group.yes=makeRadio(true);group.no.disabled=required;
      const pricing=document.createElement('small');pricing.className='impress-addons__group-price';
      frame.append(options,pricing);groupHost.append(frame);group.priceLabel=pricing;
    }
    if(finishingSlot)finishingSlot.hidden=groups.size===0;
    const selected=()=>boxes.filter(b=>b.checked&&!b.disabled);
    const hasArtwork=()=>selected().some(b=>b.dataset.role==='artwork');
    const update=()=>{
      const issues=[];
      for(const box of normalBoxes)if(box.dataset.required==='true'){
        if(box.disabled)issues.push('Un servicio obligatorio no está disponible.');
        else box.checked=true;
      }
      for(const group of groups.values()){
        const result=resolveService(group.entries,state);
        const entry=result.entry;
        const valid=entry && entry.available && Number.isSafeInteger(entry.price) && entry.price>=0 && /^\d+$/.test(entry.id);
        group.yes.checked=group.selected;group.no.checked=!group.selected;
        group.no.disabled=group.required;
        // Keep a previously selected group selected when switching to a size without
        // a price. Don't silently remove it: show a clear error and block checkout.
        group.yes.disabled=!group.selected && !valid;
        const amount=valid?money(entry.price*(entry.charge==='per_unit'?state.units:1),state.currency):'';
        group.yesAmount.textContent=valid?`+${amount}`:'No disponible';
        group.priceLabel.textContent=valid
          ? (entry.charge==='per_unit'&&state.units>1?`${money(entry.price,state.currency)} × ${state.units} unidades`:'')
          : result.issue==='duplicate'?'Hay dos precios para esta medida. Corrige los metacampos en Shopify.':'No disponible para este tamaño o cantidad.';
        const box=group.choice;
        box.checked=group.selected&&Boolean(valid)&&!group.mixed;
        box.disabled=false;box.dataset.id=valid?entry.id:'';
        box.dataset.price=valid?String(entry.price):'0';
        box.dataset.quantity=valid&&entry.charge==='per_unit'?String(state.units):'1';
        box.dataset.role=valid?entry.role:'';box.dataset.charge=valid?entry.charge:'';
        if(group.mixed)issues.push(`${group.title}: no mezcles servicios opcionales y obligatorios en el mismo grupo.`);
        else if(group.selected&&!valid)issues.push(`${group.title}: falta un precio de Shopify válido para el tamaño y cantidad seleccionados.`);
      }
      const chosen=selected();
      ids.value=chosen.map(b=>b.dataset.id).join(',');
      if(quantities)quantities.value=chosen.map(b=>`${b.dataset.id}:${parsePositiveInt(b.dataset.quantity)||1}`).join(',');
      if(modes)modes.value=chosen.filter(b=>b.dataset.charge==='per_unit').map(b=>b.dataset.id+':per_unit').join(',');
      if(chosen.length&&!job.value)job.value=newJob();
      artChoice.value=hasArtwork()?'Diseño solicitado a Impress':'Archivo del cliente';
      if(notes){notes.hidden=!hasArtwork();noteField.disabled=!hasArtwork();noteField.required=hasArtwork();}
      const cost=chosen.reduce((n,b)=>n+(Number(b.dataset.price)||0)*(parsePositiveInt(b.dataset.quantity)||1),0);
      sum.hidden=chosen.length===0;
      sumValue.textContent=money(cost,state.currency);
      grand.hidden=state.base===null||chosen.length===0;
      if(!grand.hidden)grandValue.textContent=money(state.base+cost,state.currency);
      // Always show the same exact breakdown below all Impress product editors.
      // A missing Shopify match is NOT a zero-priced product.
      if(orderSummary){
        if(orderBase)orderBase.textContent=state.base===null?'—':money(state.base,state.currency);
        if(orderServices)orderServices.textContent=money(cost,state.currency);
        if(orderGrand)orderGrand.textContent=state.base===null?'—':money(state.base+cost,state.currency);
      }
      message.textContent=issues.join(' ');
      state.artworkSources.forEach(source=>source?.setRequired?.(!hasArtwork()));
      form.dataset.impressAddonBlocked=issues.length?'true':'false';
    };
    for(const box of normalBoxes)box.addEventListener('change',update);
    const api={update,hasArtwork,hasSelected:()=>selected().length>0,
      setBase(cents){state.base=Number.isFinite(cents)?cents:null;update();},
      setContext(next){state.size=String(next?.size||'');state.pack=parsePositiveInt(next?.pack);state.units=parsePositiveInt(next?.units)||1;update();},
      connectArtwork(sources){state.artworkSources=Array.isArray(sources)?sources:[sources];update();},
      ready(){update();if(form.dataset.impressAddonBlocked==='true'){message.scrollIntoView?.({block:'nearest'});return false;}
        if(noteField?.required&&!noteField.checkValidity()){noteField.reportValidity();return false;}
        return true;}
    };
    mounted.set(form,api);
    update();
    form.addEventListener('submit',event=>{if(!api.ready())event.preventDefault();},true);
    return api;
  }
  window.ImpressAddons=Object.freeze({mount,get:form=>mounted.get(form)||mount(form),
    setBase:(form,cents)=>mount(form)?.setBase(cents),
    setContext:(form,context)=>mount(form)?.setContext(context),
    hasArtwork:form=>Boolean(mount(form)?.hasArtwork()),
    ready:form=>mount(form)?.ready()!==false,
    connectArtwork:(form,sources)=>mount(form)?.connectArtwork(sources),
    // Pure selectors exposed for regression tests; no Shopify network required.
    pricing:Object.freeze({sizeKey,sameSize,resolveService})});
  const init=(scope=document)=>scope.querySelectorAll('.impress-sticker__form,.impress-paper__form,.impress-banner__form').forEach(mount);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init(),{once:true});else init();
  document.addEventListener('shopify:section:load',e=>init(e.target));
})();
