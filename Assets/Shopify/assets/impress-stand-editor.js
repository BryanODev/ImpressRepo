/* Impress Stand Editor — Shared Preview Foundation v1.0 — independent client-side canvas module.
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
    let h=Math.min(H*.71,W*.78/ratio),w=h*ratio;
    return {x:(W-w)/2,y:H*.455-h/2,w,h};
  }
  function mount(root){
    const standType=root.dataset.standType==='xstand'?'xstand':'rollup';
    const physical={rollup:{widthIn:33,heightIn:72},xstand:{widthIn:23.5,heightIn:60}}[standType];
    const config={grommets:{diameterInches:0.5,cornerCenterInches:0.75,maxSpacingInches:24},
      editor:{allowScaling:true,allowRotation:true},orientation:{default:'Vertical'},
      sizes:[`${physical.heightIn} in x ${physical.widthIn} in`],
      cutGuideDefaultOn:true,mountGuideDefaultOn:true};
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
    let art=null,original=null,objectUrl=null,token=0,mode='edit',base='with',mounting='Sin guía',size=config.sizes[0],orientation='Vertical',spacingInches=null,folding=null;
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
      project.value=art?JSON.stringify({version:1,product:standType,base,size,orientation,x:+state.x.toFixed(5),y:+state.y.toFixed(5),scale:+state.scale.toFixed(4),angle:Math.round(state.angle*180/Math.PI)}):'';
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
    // PROVISIONAL 0.25-inch mounting guides for Roll-Up. This is a visual
    // planning assumption, not a final machine specification/cut instruction.
    const CLIP_IN=.25;
    function drawGuides(c,r){
      c.save();
      if(ui.cut.checked){
        c.strokeStyle='#e75560';c.lineWidth=1.7;c.setLineDash([7,6]);
        c.strokeRect(r.x,r.y,r.w,r.h);
      }
      if(ui.mount.checked){
        c.strokeStyle='#249fc2';c.fillStyle='#249fc2';c.lineWidth=1.8;c.setLineDash([3,4]);
        if(standType==='rollup'){
          const offset=CLIP_IN/physical.heightIn*r.h;
          // Proportional guides: only 1/288 of the 72-inch height.
          for(const y of [r.y+offset,r.y+r.h-offset]){
            c.beginPath();c.moveTo(r.x,y);c.lineTo(r.x+r.w,y);c.stroke();
          }
        }else{
          const ix=1/physical.widthIn*r.w,iy=1/physical.heightIn*r.h;
          for(const [x,y] of [[r.x+ix,r.y+iy],[r.x+r.w-ix,r.y+iy],[r.x+ix,r.y+r.h-iy],[r.x+r.w-ix,r.y+r.h-iy]]){
            c.beginPath();c.arc(x,y,Math.max(2,Math.min(5,r.w*.012)),0,Math.PI*2);c.stroke();
          }
        }
      }
      c.restore();
    }
    function hardwareBehind(c,r){
      if(base!=='with')return;
      const mid=r.x+r.w/2, top=r.y, bottom=r.y+r.h;
      c.save();c.lineCap='round';
      if(standType==='rollup'){
        // A rear vertical telescopic support, only visible near the top and bottom.
        const pole=c.createLinearGradient(mid-5,0,mid+5,0);
        pole.addColorStop(0,'#75848d');pole.addColorStop(.4,'#f3f7f8');pole.addColorStop(1,'#54626b');
        c.strokeStyle=pole;c.lineWidth=Math.max(5,r.w*.045);
        c.beginPath();c.moveTo(mid,top-13);c.lineTo(mid,bottom+15);c.stroke();
      }else{
        // X-Stand crossed tension rods are BEHIND the vinyl print.
        // Their outward tips stay visible at the four corners.
        const rods=c.createLinearGradient(r.x-25,0,r.x+r.w+25,0);
        rods.addColorStop(0,'#3c4850');rods.addColorStop(.4,'#c8d0d6');rods.addColorStop(1,'#424b54');
        c.strokeStyle=rods;c.lineWidth=Math.max(4,r.w*.032);
        const ex=Math.max(9,r.w*.09), ey=Math.max(9,r.w*.038);
        for(const [sx,sy,exx,eyy] of [
          [mid,bottom+26,r.x-ex,top-ey],[mid,bottom+26,r.x+r.w+ex,top-ey],
          [mid,bottom+26,r.x-ex,bottom+ey],[mid,bottom+26,r.x+r.w+ex,bottom+ey]
        ]){c.beginPath();c.moveTo(sx,sy);c.lineTo(exx,eyy);c.stroke();}
        c.fillStyle='#4a555e';
        for(const x of [r.x-ex,r.x+r.w+ex])for(const y of [top-ey,bottom+ey]){
          c.beginPath();c.arc(x,y,Math.max(3,r.w*.025),0,Math.PI*2);c.fill();
        }
        c.strokeStyle='#4a555e';c.lineWidth=Math.max(5,r.w*.037);
        c.beginPath();c.moveTo(mid,bottom+26);c.lineTo(mid,bottom+50);c.stroke();
        c.strokeStyle='#2e3943';c.lineWidth=Math.max(6,r.w*.05);
        c.beginPath();c.moveTo(mid-r.w*.3,bottom+50);c.lineTo(mid+r.w*.3,bottom+50);c.stroke();
      }
      c.restore();
    }
    function hardwareFront(c,r){
      if(base!=='with')return;
      const mid=r.x+r.w/2,top=r.y,bottom=r.y+r.h;
      c.save();
      if(standType==='rollup'){
        // Top clamp / aluminum rail.
        const rail=c.createLinearGradient(0,top-4,0,top+5);
        rail.addColorStop(0,'#cbd7dc');rail.addColorStop(.45,'#59666c');rail.addColorStop(1,'#f6fafb');
        c.fillStyle=rail;c.fillRect(r.x-3,top-3,r.w+6,7);
        c.fillStyle='#525e65';c.fillRect(r.x+r.w*.15,top-7,r.w*.7,3);
        // Large cassette at bottom; rolled print sits inside this housing.
        const g=c.createLinearGradient(0,bottom+2,0,bottom+30);
        g.addColorStop(0,'#f4f8f9');g.addColorStop(.27,'#b9c4c9');g.addColorStop(.66,'#5c6b74');g.addColorStop(1,'#202e39');
        c.fillStyle=g;
        c.beginPath();c.moveTo(r.x-13,bottom+3);c.lineTo(r.x+r.w+13,bottom+3);
        c.lineTo(r.x+r.w+21,bottom+24);c.lineTo(r.x-21,bottom+24);c.closePath();c.fill();
        c.fillStyle='#293842';c.fillRect(r.x-23,bottom+20,r.w+46,7);
        c.fillStyle='#2d3c43';c.fillRect(r.x-17,bottom+27,18,4);c.fillRect(r.x+r.w-1,bottom+27,18,4);
      }else{
        // Small sockets on the corners indicate where the X-Stand tensions the print.
        c.strokeStyle='#6d7d84';c.lineWidth=1.5;
        for(const [x,y] of [[r.x+3,top+3],[r.x+r.w-3,top+3],[r.x+3,bottom-3],[r.x+r.w-3,bottom-3]]){
          c.fillStyle='#ccd3d6';c.beginPath();c.arc(x,y,Math.max(2.2,r.w*.018),0,Math.PI*2);c.fill();c.stroke();
        }
      }
      c.restore();
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
      // PreviewStage draws shared workspace. Stand hardware lives ONLY in final preview.
      if(final&&!exporting)hardwareBehind(c,r);
      c.save();
      if(!exporting){c.shadowColor='#233f5240';c.shadowBlur=21;c.shadowOffsetY=13;}
      c.fillStyle='#fffdf6';c.fillRect(r.x,r.y,r.w,r.h);c.restore();
      c.save();c.beginPath();c.rect(r.x,r.y,r.w,r.h);c.clip();
      drawArtwork(c,r);
      c.restore();
      if(!exporting){
        c.save();c.strokeStyle='rgba(115,139,148,.58)';c.lineWidth=1;c.strokeRect(r.x,r.y,r.w,r.h);c.restore();
        if(final)hardwareFront(c,r);
        else {drawGuides(c,r);if(art&&geometry)drawHandles(c,geometry);}
      }
      return r;
    }
    const workspace=core.createWorkspace({
      canvas,finalCanvas,finalLayer,stage,viewKey:'ibView',
      getMode:()=>mode,hasArtwork:()=>mode==='final'||Boolean(art),
      drawEdit:(ctx,W,H)=>drawScene(ctx,W,H),
      drawFinal:(ctx,W,H)=>drawScene(ctx,W,H,{final:true}),
      render:()=>render(),qualityRoot:root,qualityType:'banners',settings:{tiltYDegrees:55,tiltXDegrees:10}
    });
    const {preview,navigation}=workspace;
    quality=workspace.quality;
    const viewer=root.querySelector('[data-stand-viewer]');
    const viewAngle=root.querySelector('[data-stand-view-angle]');
    const angleValue=root.querySelector('[data-stand-angle-value]');
    function setViewAngle(angle){
      const v=clamp(Number(angle)||0,-55,55);
      if(viewAngle)viewAngle.value=String(Math.round(v));
      if(angleValue)angleValue.textContent=`${Math.round(v)}°`;
      preview.setTilt(v/55,0);
    }
    viewAngle?.addEventListener('input',()=>setViewAngle(viewAngle.value));
    root.querySelector('[data-stand-view-reset]')?.addEventListener('click',()=>setViewAngle(0));
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
      mode=btn.dataset.ibMode;preview.resetTilt();if(viewer)viewer.hidden=mode!=='final';setViewAngle(0);root.querySelectorAll('[data-ib-mode]').forEach(b=>b.classList.toggle('is-active',b===btn));render();
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
      try{const blob=await exportBlob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`impress-${standType}-vista-editada.png`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);note('Vista PNG descargada; no es un archivo de producción.');}
      catch{note('No se pudo exportar la vista.',true)}
    });
    function setOptions(opts){
      base=opts.base==='without'?'without':'with';
      ui.guideNote.textContent=standType==='rollup'
        ? 'Líneas azules: 0.25″ arriba y abajo para sujeción (valor orientativo; verificar en producción).'
        : 'Puntos azules: referencia de tensión en las esquinas del X-Stand (ubicación por confirmar).';
      render();
    }
    async function prepareOrderFiles(){
      await pendingArtwork;
      if(!art)throw new Error('No se pudo visualizar el arte. Usa otro archivo o revisa que el PDF/TIFF sea compatible.');
      if(!art){output.value='';return true;}
      const blob=await exportBlob();
      if(!blob||blob.size>15*1024*1024)throw new Error('La vista editada es demasiado grande para esta prueba.');
      const file=new File([blob],`impress-${standType}-vista.png`,{type:'image/png'});
      const dt=new DataTransfer();dt.items.add(file);output.files=dt.files;
      if(!output.files.length)throw new Error('No se pudo adjuntar la vista editada.');
      return true;
    }
    preview.observeResize(render);
    syncUI();render();
    return {loadFile,setOptions,prepareOrderFiles,parseSize};
  }
  window.ImpressStandEditor={mount,parseSize};
})();
