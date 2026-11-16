/* Impress Banner Editor — Shared Preview Foundation v0.2 — independent client-side canvas module.
 * The mounting illustration is NOT a calibrated production template.
 * Original artwork is never modified or replaced.
 */
(() => {
  'use strict';
  const core=window.ImpressEditorCore;
  if(!core) { console.error('Impress Editor Core missing. Load impress-editor-core.js first.'); return; }
  const clamp=core.clamp;
  const $=(root,s)=>root.querySelector(s);
  const initial=()=>({x:.5,y:.5,scale:1,angle:0});
  const snap=s=>({x:s.x,y:s.y,scale:s.scale,angle:s.angle});
  const same=core.same;
  function parseSize(size){
    // Accept both Shopify's typography (2’ x 3’) and explicit ft/in dimensions.
    const text=String(size||'').trim().replace(/[×✕*]/g,'x').replace(/[’‘′`]/g,"'");
    const m=/^\s*(\d+(?:[.,]\d+)?)\s*(ft|feet|foot|pies|pie|inches|inch|in|pulgadas|pulgada|pulg|'|")?\s*x\s*(\d+(?:[.,]\d+)?)\s*(ft|feet|foot|pies|pie|inches|inch|in|pulgadas|pulgada|pulg|'|")?\s*$/i.exec(text);if(!m)return null;
    const first=Number(m[1].replace(',','.')),second=Number(m[3].replace(',','.'));
    const u1=(m[2]||m[4]||'').toLowerCase(),u2=(m[4]||m[2]||'').toLowerCase();
    if(!(first>0&&second>0)||!u1||!u2)return null;
    const isFoot=u=>/^(ft|feet|foot|pie|pies|')$/.test(u);
    const isInch=u=>/^(in|inches|inch|pulg|pulgada|pulgadas|")$/.test(u);
    const mul1=isFoot(u1)?12:isInch(u1)?1:0;
    const mul2=isFoot(u2)?12:isInch(u2)?1:0;
    if(!mul1||!mul2)return null;
    const heightIn=first*mul1,widthIn=second*mul2;
    return {heightIn,widthIn,ratio:widthIn/heightIn};
  }
  function orientedSize(dims,orientation){
    if(!dims)return null;
    let {widthIn,heightIn}=dims;
    if(orientation==='Vertical'&&widthIn>heightIn)[widthIn,heightIn]=[heightIn,widthIn];
    if(orientation==='Horizontal'&&heightIn>widthIn)[widthIn,heightIn]=[heightIn,widthIn];
    return {widthIn,heightIn,ratio:widthIn/heightIn};
  }
  function bannerRect(W,H,dims,exporting=false){
    if(exporting)return {x:0,y:0,w:W,h:H};
    const ratio=dims?.ratio||2;
    let w=Math.min(W*.86,H*.72*ratio),h=w/ratio;
    return {x:(W-w)/2,y:(H-h)/2,w,h};
  }
  // 0.5" visible grommet diameter (12.7 mm), at the upper end of the
  // 3/8"–1/2" range provided for Impress. UI only: NOT a production specification.
  const DEFAULT_SETTINGS=Object.freeze({diameter:0.5,corner:0.75,spacing:24});
  const parseSetting=(v, fallback, min, max)=>{
    const n=Number(v);return Number.isFinite(n)&&n>=min&&n<=max?n:fallback;
  };
  function settingsFor(config){
    const g=config?.grommets||{};
    return {
      diameter:parseSetting(g.diameterInches,.5,.125,1.5),
      corner:parseSetting(g.cornerCenterInches,.75,.25,6),
      spacing:parseSetting(g.maxSpacingInches,24,3,120)
    };
  }
  function grommetRadius(r,dims,settings=DEFAULT_SETTINGS){
    // Convert physical inches to scene pixels using the selected banner size.
    // Deliberately no large pixel minimum; oversized rings would mislead buyers.
    const pxPerIn=Math.min(r.w/Math.max(1,dims?.widthIn||48), r.h/Math.max(1,dims?.heightIn||24));
    return settings.diameter*pxPerIn/2;
  }
  // Grommet centers typically sit about 1/2"–1" in from each banner edge.
  // Use 3/4" as a provisional preview default; these are center coordinates,
  // NOT measurements from the rim of the metal eyelet or print bleed.
  function grommetPositions(r,dims,settings=DEFAULT_SETTINGS,cornerOnly=false){
    // PROVISIONAL: corner centers 0.75" from both edges, additional holes at
    // intervals no greater than ~24" around the perimeter (production TBC).
    const widthIn=Math.max(1,dims?.widthIn||48),heightIn=Math.max(1,dims?.heightIn||24);
    // Keep center inside the sheet even if someone uses a very small banner.
    const insetX=Math.min(settings.corner,Math.max(.1,(widthIn-settings.diameter)/2));
    const insetY=Math.min(settings.corner,Math.max(.1,(heightIn-settings.diameter)/2));
    const xp=insetX*r.w/widthIn,yp=insetY*r.h/heightIn;
    const left=r.x+xp,right=r.x+r.w-xp,top=r.y+yp,bottom=r.y+r.h-yp;
    if(cornerOnly)return [{x:left,y:top},{x:right,y:top},{x:left,y:bottom},{x:right,y:bottom}];
    const xs=Math.max(1,Math.ceil((widthIn-2*insetX)/settings.spacing));
    const ys=Math.max(1,Math.ceil((heightIn-2*insetY)/settings.spacing));
    const points=[];
    for(let i=0;i<=xs;i++){
      const x=left+(right-left)*i/xs;
      points.push({x,y:top});points.push({x,y:bottom});
    }
    for(let i=1;i<ys;i++){
      const y=top+(bottom-top)*i/ys;
      points.push({x:left,y});points.push({x:right,y});
    }
    return points;
  }
  function mountCount(size,settings=DEFAULT_SETTINGS,orientation='Horizontal',kind='Argollas',spacingInches=null){
    const dims=orientedSize(parseSize(size),orientation);
    if(!dims)return null;
    if(kind!=='Argollas'&&kind!=='Argollas4')return 0;
    return grommetPositions({x:0,y:0,w:200,h:120},dims,
      {...settings,spacing:spacingInches||settings.spacing},kind==='Argollas4').length;
  }
  function mount(root){
    const config=window.ImpressProductConfigs?.banners;
    if(!config){console.error('Impress: missing impress-banner-config.js');return null;}
    const settings=settingsFor(config);
    const allow=config.editor||{};
    const el=k=>$(root,`[data-ib-${k}]`);
    const canvas=el('canvas'),stage=el('stage'),finalCanvas=el('final-canvas'),finalLayer=el('final-layer'),project=el('project'),output=el('output-file');
    if(!canvas||!stage||!finalCanvas||!finalLayer||!project||!output)return null;
    const ctx=canvas.getContext('2d'),fx=finalCanvas.getContext('2d');
    let quality=null;
    if(!ctx||!fx)return null;
    const ui={scale:el('scale'),rotate:el('rotate'),scaleValue:el('scale-value'),rotateValue:el('rotate-value'),download:el('download'),empty:el('empty'),editorMessage:el('editor-message'),guideNote:el('guide-note'),cut:el('show-cut'),mount:el('show-mount')};
    if(allow.allowScaling===false){const row=ui.scale.closest('.impress-banner__tool');if(row)row.style.display='none';}
    if(allow.allowRotation===false){const row=ui.rotate.closest('.impress-banner__tool');if(row)row.style.display='none';}
    ui.cut.checked=config.cutGuideDefaultOn!==false;
    ui.mount.checked=config.mountGuideDefaultOn!==false;
    let art=null,original=null,objectUrl=null,token=0,mode='edit',mounting='Sin guía',size=config.sizes?.[0]||'2 x 4 ft',orientation=config.orientation?.default||'Horizontal',spacingInches=null,folding=null;
    const state=initial(),history=[],future=[];
    let drag=null,editStart=null,geometry=null,guidePhase=0,guideRAF=0,lastGuideTime=0;
    const reduced=Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    const note=(str,bad=false)=>{ui.editorMessage.textContent=str;ui.editorMessage.style.color=bad?'#c55249':'';};
    function syncUI(){
      ui.scale.value=String(Math.round(state.scale*100));ui.rotate.value=String(Math.round(state.angle*180/Math.PI));
      ui.scaleValue.textContent=`${Math.round(state.scale*100)}%`;ui.rotateValue.textContent=`${Math.round(state.angle*180/Math.PI)}°`;
      for(const control of [ui.scale,ui.rotate,ui.download])control.disabled=!art || (control===ui.scale&&allow.allowScaling===false) || (control===ui.rotate&&allow.allowRotation===false);
      for(const action of ['undo','redo','center']){
        const btn=$(root,`[data-ib-action="${action}"]`);
        btn.disabled=!art||(action==='undo'&&!history.length)||(action==='redo'&&!future.length);
      }
      ui.empty.hidden=Boolean(art)||Boolean(root.querySelector('[data-ib-art-input]')?.files?.length);
      project.value=art?JSON.stringify({version:1,product:'banner',mounting,size,orientation,x:+state.x.toFixed(5),y:+state.y.toFixed(5),scale:+state.scale.toFixed(4),angle:Math.round(state.angle*180/Math.PI)}):'';
    }
    function begin(){if(!editStart)editStart=snap(state)}
    function end(){if(editStart&&!same(editStart,snap(state))){history.push(editStart);if(history.length>40)history.shift();future.length=0;}editStart=null;syncUI();}
    function apply(next){Object.assign(state,next);render();}
    function drawArtwork(c,r){
      geometry=null;
      if(!art){
        const attachment=root.querySelector('[data-ib-art-input]')?.files?.[0];
        if(!attachment||!/\.pdf$/i.test(attachment.name))return;
        c.save();c.fillStyle='#adbac2';c.textAlign='center';
        c.font=`800 ${Math.max(12,Math.min(31,r.h*.21))}px system-ui, sans-serif`;
        c.fillText('PDF ADJUNTO',r.x+r.w/2,r.y+r.h/2+5,Math.max(20,r.w*.85));c.restore();return;
      }
      const iw=art.width,ih=art.height;
      const base=Math.min(r.w*.90/iw,r.h*.90/ih);
      const w=iw*base*state.scale,h=ih*base*state.scale;
      const cx=r.x+r.w*state.x,cy=r.y+r.h*state.y;
      c.save();c.translate(cx,cy);c.rotate(state.angle);c.drawImage(art,-w/2,-h/2,w,h);c.restore();
      geometry={r,cx,cy,w,h,angle:state.angle};
    }
    function paintHardware(c,r,dims){
      // Argollas are shown at their actual proportional size. Palos/boards are
      // mounted BEHIND the banner and cannot be seen from the front in Vista Final.
      if(mounting!=='Argollas'&&mounting!=='Argollas4')return;
      const pts=grommetPositions(r,dims,{...settings,spacing:spacingInches||settings.spacing},mounting==='Argollas4'),radius=grommetRadius(r,dims,settings);
      pts.forEach(p=>{
        c.save();
        c.beginPath();c.arc(p.x,p.y,radius,0,Math.PI*2);
        c.fillStyle='rgba(233,239,241,.88)';c.fill();
        c.strokeStyle='rgba(122,139,149,.92)';c.lineWidth=Math.min(1.05,Math.max(.65,radius*.38));c.stroke();
        c.beginPath();c.arc(p.x,p.y,Math.max(.35,radius*.48),0,Math.PI*2);
        c.fillStyle='rgba(101,122,132,.56)';c.fill();
        c.restore();
      });
    }
    function drawGuides(c,r,dims){
      if(ui.cut.checked){
        c.save();c.strokeStyle='rgba(235,89,97,.87)';c.lineWidth=1.8;c.setLineDash([7,6]);c.lineDashOffset=-guidePhase;
        c.strokeRect(r.x,r.y,r.w,r.h);c.restore();
      }
      if(ui.mount.checked){
        c.save();c.strokeStyle='rgba(50,163,192,.95)';c.lineWidth=1.8;c.setLineDash([4,5]);c.lineDashOffset=-guidePhase*.35;
        // Approximate hem/fold zones. These are visualization guides only.
        if(folding==='sides'||folding==='all'){
          const inX=Math.min(9,Math.max(3,r.w*.025)),inY=Math.min(9,Math.max(3,r.h*.025));
          for(const x of [r.x+inX,r.x+r.w-inX]){c.beginPath();c.moveTo(x,r.y);c.lineTo(x,r.y+r.h);c.stroke();}
          if(folding==='all')for(const y of [r.y+inY,r.y+r.h-inY]){c.beginPath();c.moveTo(r.x,y);c.lineTo(r.x+r.w,y);c.stroke();}
        }
        if(mounting==='Argollas'||mounting==='Argollas4'){
          // Match the actual 1/2" visual footprint, not a fixed large canvas circle.
          const radius=grommetRadius(r,dims,settings);
          c.lineWidth=Math.min(1.3,Math.max(.8,radius*.55));
          c.setLineDash([2.5,2]);
          grommetPositions(r,dims,{...settings,spacing:spacingInches||settings.spacing},mounting==='Argollas4')
            .forEach(p=>{c.beginPath();c.arc(p.x,p.y,radius,0,Math.PI*2);c.stroke();});
        }else if(mounting==='Palos'){
          // Guide only: show where hidden rear boards/pockets are expected.
          // These are NOT visible hardware, and disappear in Vista Final.
          const margin=Math.min(7,Math.max(3,r.h*.032));
          c.setLineDash([4,5]);
          for(const y of [r.y+margin,r.y+r.h-margin]){
            c.beginPath();c.moveTo(r.x+4,y);c.lineTo(r.x+r.w-4,y);c.stroke();
          }
        }
        c.restore();
      }
    }
    const handles=g=>core.handles(g,32);
    function drawHandles(c,g){
      const ps=handles(g);c.save();c.strokeStyle='#274b5b';c.lineWidth=1.2;c.setLineDash([5,5]);
      c.beginPath();ps.corners.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.stroke();c.setLineDash([]);
      const mid={x:(ps.corners[0].x+ps.corners[1].x)/2,y:(ps.corners[0].y+ps.corners[1].y)/2};
      c.beginPath();c.moveTo(mid.x,mid.y);c.lineTo(ps.rotate.x,ps.rotate.y);c.stroke();
      ps.corners.forEach(p=>{c.beginPath();c.arc(p.x,p.y,6,0,2*Math.PI);c.fillStyle='#fff';c.fill();c.stroke();});
      c.beginPath();c.arc(ps.rotate.x,ps.rotate.y,7.5,0,2*Math.PI);c.fillStyle='#ed5d5b';c.fill();c.restore();
    }
    function drawScene(c,W,H,{exporting=false,final=false}={}){
      const dims=orientedSize(parseSize(size),orientation)||{heightIn:24,widthIn:48,ratio:2};
      const r=bannerRect(W,H,dims,exporting);
      // PreviewStage draws the shared workspace background (not export files).
      c.save();
      if(!exporting){c.shadowColor='#233f5240';c.shadowBlur=21;c.shadowOffsetY=13;}
      c.fillStyle='#fffdf6';c.fillRect(r.x,r.y,r.w,r.h);c.restore();
      c.save();c.beginPath();c.rect(r.x,r.y,r.w,r.h);c.clip();
      drawArtwork(c,r);
      c.restore();
      if(!exporting){
        c.save();c.strokeStyle='rgba(115,139,148,.58)';c.lineWidth=1;c.strokeRect(r.x,r.y,r.w,r.h);c.restore();
        if(final)paintHardware(c,r,dims);
        else {drawGuides(c,r,dims);if(art&&geometry)drawHandles(c,geometry);}
      }
      return r;
    }
    const workspace=core.createWorkspace({
      canvas,finalCanvas,finalLayer,stage,viewKey:'ibView',
      getMode:()=>mode,hasArtwork:()=>Boolean(art),
      drawEdit:(ctx,W,H)=>drawScene(ctx,W,H),
      drawFinal:(ctx,W,H)=>drawScene(ctx,W,H,{final:true}),
      render:()=>render(),qualityRoot:root,qualityType:'banners'
    });
    const {preview,navigation}=workspace;
    quality=workspace.quality;
    function drawFinal(){preview.redrawFinal();}
    function animate(now){
      if(!guideRAF)return;
      const dt=lastGuideTime?Math.min(55,now-lastGuideTime):0;lastGuideTime=now;guidePhase=(guidePhase+dt*.055)%1000;
      render();
      if(guideRAF)guideRAF=requestAnimationFrame(animate);
    }
    function animationState(){
      const shouldRun=!reduced&&mode==='edit'&&(ui.cut.checked||ui.mount.checked);
      if(shouldRun&&!guideRAF){lastGuideTime=0;guideRAF=requestAnimationFrame(animate);}
      else if(!shouldRun&&guideRAF){cancelAnimationFrame(guideRAF);guideRAF=0;lastGuideTime=0;}
    }
    function render(){
      preview.render();
      syncUI();navigation.sync();animationState();
      const d=orientedSize(parseSize(size),orientation);
      quality?.setPlacement({printWidthIn:d?.widthIn,printHeightIn:d?.heightIn,scale:state.scale,fit:1});
    }
    const point=e=>navigation.point(e);
    const nearest=(p,g)=>core.hitTest(p,g,{rotateOffset:32,rotateRadius:19,scaleRadius:18,padding:8});
    canvas.addEventListener('pointerdown',e=>{
      if(mode!=='edit'||!art||!geometry||e.button!==0||navigation.isPanning())return;
      const p=point(e),kind=nearest(p,geometry);if(!kind||(kind==='scale'&&allow.allowScaling===false)||(kind==='rotate'&&allow.allowRotation===false))return;
      begin();drag=core.startDrag(kind,p,geometry,state);
      canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';e.preventDefault();
    });
    canvas.addEventListener('pointermove',e=>{
      if(navigation.isPanning())return;
      const p=point(e);if(!drag){canvas.style.cursor=art&&mode==='edit'&&geometry&&nearest(p,geometry)?'grab':'default';return;}
      core.updateDrag(state,drag,p,{minPosition:-.7,maxPosition:1.7});
      render();e.preventDefault();
    });
    function finishDrag(){if(drag){drag=null;end();render();canvas.style.cursor='default';}}
    canvas.addEventListener('pointerup',finishDrag);canvas.addEventListener('pointercancel',finishDrag);
    [['scale','scale',v=>Number(v)/100],['rotate','angle',v=>Number(v)*Math.PI/180]].forEach(([key,prop,convert])=>{
      if((key==='scale'&&allow.allowScaling===false)||(key==='rotate'&&allow.allowRotation===false))return;
      const node=ui[key];node.addEventListener('pointerdown',begin);node.addEventListener('keydown',begin);
      node.addEventListener('input',e=>{begin();state[prop]=convert(e.target.value);render()});
      node.addEventListener('change',()=>{end();render()});
    });
    for(const action of ['undo','redo','center']){
      $(root,`[data-ib-action="${action}"]`).addEventListener('click',()=>{
        if(!art)return;
        if(action==='undo'&&history.length){future.push(snap(state));apply(history.pop());}
        if(action==='redo'&&future.length){history.push(snap(state));apply(future.pop());}
        if(action==='center'){begin();state.x=.5;state.y=.5;end();render();}
      });
    }
    [ui.cut,ui.mount].forEach(x=>x.addEventListener('change',render));
    root.querySelectorAll('[data-ib-mode]').forEach(btn=>btn.addEventListener('click',()=>{
      mode=btn.dataset.ibMode;preview.resetTilt();root.querySelectorAll('[data-ib-mode]').forEach(b=>b.classList.toggle('is-active',b===btn));render();
    }));
    function setArt(img){art=img;syncUI();render();}
    let pendingArtwork=Promise.resolve();
    function loadFile(file){navigation.reset(false);pendingArtwork=decodeArtwork(file);return pendingArtwork;}
    async function decodeArtwork(file){
      const current=++token;art=null;original=null;history.length=0;future.length=0;Object.assign(state,initial());
      quality?.setFile(file);
      output.value='';if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}
      setArt(null);
      if(!file){note('Sube un diseño para comenzar.');return false;}
      note('Preparando vista del archivo…');
      try{
        const result=await window.ImpressArtworkPreview.render(file,{maxDimension:2000});
        if(current!==token)return false;
        original=result.image;quality?.setResult(file,result);setArt(result.image);note(result.notice);return true;
      }catch(error){
        if(current!==token)return false;
        quality?.setResult(file,null);
        note('Original seleccionado; la vista no pudo abrirse: '+(error?.message||'formato no disponible'),true);
        return false;
      }
    }
    function exportCanvas(){
      if(!art)return null;
      const dims=orientedSize(parseSize(size),orientation)||{ratio:2};const ratio=clamp(dims.ratio,.3,6);
      const W=Math.round(1800*Math.min(1,ratio)),H=Math.round(1800/Math.max(1,ratio));
      const out=document.createElement('canvas');out.width=W;out.height=H;
      drawScene(out.getContext('2d'),W,H,{exporting:true});return out;
    }
    async function exportBlob(){const out=exportCanvas();if(!out)return null;
      return new Promise((resolve,reject)=>out.toBlob(blob=>blob?resolve(blob):reject(new Error('No se pudo generar PNG.')),'image/png'));
    }
    ui.download.addEventListener('click',async()=>{
      if(!art)return;
      try{const blob=await exportBlob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='impress-banner-vista-editada.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);note('Vista PNG descargada; no es un archivo de producción.');}
      catch{note('No se pudo exportar la vista.',true)}
    });
    function setOptions(opts){
      mounting=opts.mounting||'Sin guía';size=opts.size||size;orientation=opts.orientation||orientation;
      spacingInches=opts.spacingInches===12||opts.spacingInches===24?opts.spacingInches:null;
      folding=opts.folding==='all'||opts.folding==='sides'?opts.folding:null;
      ui.guideNote.textContent=mounting==='Argollas4'
        ? 'Cuatro argollas ilustrativas, una por esquina; dobladillos laterales. Posiciones por confirmar en producción.'
        : mounting==='Argollas'
        ? `Argollas ilustrativas alrededor del perímetro; separación máxima aproximada de ${spacingInches||settings.spacing}″. Posiciones por confirmar en producción.`
        : mounting==='Palos'
          ? 'Líneas azules: ubicación orientativa de los palos detrás del banner. Los palos no se ven desde el frente en Vista final.'
          : folding==='sides' ? 'Líneas azules: dobladillos solo a izquierda y derecha; sin argollas.' : 'Sin guía de montaje para esta variante. Consulta las especificaciones de producción.';
      render();
    }
    async function prepareOrderFiles(){
      await pendingArtwork;
      if(!art)throw new Error('No se pudo visualizar el arte. Usa otro archivo o revisa que el PDF/TIFF sea compatible.');
      if(!art){output.value='';return true;}
      const blob=await exportBlob();
      if(!blob||blob.size>15*1024*1024)throw new Error('La vista editada es demasiado grande para esta prueba.');
      const file=new File([blob],'impress-banner-vista.png',{type:'image/png'});
      const dt=new DataTransfer();dt.items.add(file);output.files=dt.files;
      if(!output.files.length)throw new Error('No se pudo adjuntar la vista editada.');
      return true;
    }
    preview.observeResize(render);
    syncUI();render();
    return {loadFile,setOptions,prepareOrderFiles,mountCount:(size,orientation,kind,spacing)=>mountCount(size,settings,orientation||'Horizontal',kind,spacing),parseSize};
  }
  window.ImpressBannerEditor={mount,mountCount,parseSize};
})();
