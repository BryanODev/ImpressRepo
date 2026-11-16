/* IMPRESS PAPER EDITOR — One reusable OOP canvas editor for Business Cards and Flyers.
 * Depends on impress-editor-core.js / PreviewStage. Each side keeps independent art/history.
 * Trim guides are illustrations, not production bleed or print-ready PDF output.
 */
(() => {
  'use strict';
  const core=window.ImpressEditorCore;
  if(!core){console.error('Impress paper: shared editor core missing');return;}
  const clamp=core.clamp;
  const clean=()=>({x:.5,y:.5,scale:1,angle:0});
  const snap=state=>core.snapshotTransform(state);
  class PaperEditor {
    constructor(root,config){
      this.root=root;this.cfg=config;
      this.el=name=>root.querySelector(`[data-ip-${name}]`);
      this.canvas=this.el('canvas');this.stage=this.el('stage');this.finalCanvas=this.el('final-canvas');
      this.project=this.el('project');this.outFront=this.el('output-front');this.outBack=this.el('output-back');
      this.sides={front:this.makeSide(),back:this.makeSide()};this.current='front';this.mode='edit';
      this.size=config.sizes[0];this.orientation=config.orientation?.default||'Horizontal';this.twoSides=false;
      this.showCut=config.cutGuideDefaultOn!==false;this.showSafe=config.safeGuideDefaultOn!==false;
      this.drag=null;this.geometry=null;this.download=this.el('download');this.empty=this.el('empty');
      this.status=this.el('editor-status');this.historyStart=null;
      const workspace=core.createWorkspace({
        canvas:this.canvas,finalCanvas:this.finalCanvas,finalLayer:this.el('final-layer'),
        stage:this.stage,viewKey:'ipView',getMode:()=>this.mode,
        hasArtwork:()=>Boolean(this.side.art),
        drawEdit:(ctx,W,H)=>this.paint(ctx,W,H,false),
        drawFinal:(ctx,W,H)=>this.paint(ctx,W,H,true),
        render:()=>this.render(),qualityRoot:root,qualityType:root.dataset.productType
      });
      this.preview=workspace.preview;this.navigation=workspace.navigation;
      this.quality=workspace.quality;
      this.attach();this.preview.observeResize(()=>this.render());this.render();
    }
    makeSide(){return {state:clean(),art:null,original:null,url:null,history:[],future:[],token:0};}
    get side(){return this.sides[this.current];}
    dimensions(){
      let w=this.size.width,h=this.size.height;
      if(this.cfg.orientation?.enabled&&this.orientation==='Vertical'&&w>h)[w,h]=[h,w];
      if(this.cfg.orientation?.enabled&&this.orientation==='Horizontal'&&w<h)[w,h]=[h,w];
      return {w,h};
    }
    margins(){
      // Print margins stay attached to the physical sheet when it rotates 90°.
      const m=this.size.margins||{left:0,right:0,top:0,bottom:0};
      const originallyHorizontal=this.size.width>=this.size.height;
      const nowHorizontal=this.dimensions().w>=this.dimensions().h;
      if(originallyHorizontal===nowHorizontal)return m;
      // Clockwise rotation: original bottom becomes left, original top becomes right.
      return {left:m.bottom,right:m.top,top:m.left,bottom:m.right};
    }
    pageRect(W,H,exporting=false){
      if(exporting)return {x:0,y:0,w:W,h:H};
      const dims=this.dimensions(),ratio=dims.w/dims.h;
      let w=Math.min(W*.83,H*.79*ratio);let h=w/ratio;
      if(h>H*.79){h=H*.79;w=h*ratio;}
      return {x:(W-w)/2,y:(H-h)/2,w,h};
    }
    paint(ctx,W,H,final,exporting=false,sideName=this.current){
      const side=this.sides[sideName],r=this.pageRect(W,H,exporting),dims=this.dimensions();
      ctx.save();ctx.shadowBlur=exporting?0:25;ctx.shadowColor='rgba(30,50,65,.18)';ctx.shadowOffsetY=exporting?0:8;
      ctx.fillStyle='#fff';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.restore();
      this.geometry=null;
      if(side.art){
        const state=side.state,iw=side.art.width,ih=side.art.height;
        const base=Math.min(r.w*.90/iw,r.h*.90/ih);
        const w=iw*base*state.scale,h=ih*base*state.scale,cx=r.x+r.w*state.x,cy=r.y+r.h*state.y;
        ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();ctx.translate(cx,cy);ctx.rotate(state.angle);ctx.drawImage(side.art,-w/2,-h/2,w,h);ctx.restore();
        if(!final&&!exporting)this.geometry={r,cx,cy,w,h,angle:state.angle};
      }else if(!exporting&&side.original&&/\.pdf$/i.test(side.original.name)){
        ctx.save();ctx.fillStyle='#b5bdc4';ctx.textAlign='center';ctx.font=`700 ${Math.max(13,Math.min(23,r.w*.085))}px system-ui,sans-serif`;
        ctx.fillText('PDF ADJUNTO',r.x+r.w/2,r.y+r.h/2,Math.max(30,r.w*.85));ctx.restore();
      }
      if(!final&&!exporting){
        const m=this.margins();
        ctx.save();
        if(this.showCut){ctx.strokeStyle='rgba(222,67,79,.9)';ctx.lineWidth=2;ctx.setLineDash([8,6]);ctx.strokeRect(r.x+.5,r.y+.5,r.w-1,r.h-1);}
        if(this.showSafe){
          const sw=Math.max(0,r.w*(1-(m.left+m.right)/dims.w)),sh=Math.max(0,r.h*(1-(m.top+m.bottom)/dims.h));
          ctx.strokeStyle='#2eaccc';ctx.lineWidth=1.65;ctx.setLineDash([5,5]);
          ctx.strokeRect(r.x+m.left*r.w/dims.w,r.y+m.top*r.h/dims.h,sw,sh);
        }
        ctx.restore();
        if(this.geometry)this.drawHandles(ctx,this.geometry);
      }
    }
    drawHandles(ctx,g){
      const pts=core.handles(g,30);ctx.save();ctx.strokeStyle='#245666';ctx.lineWidth=1.3;ctx.setLineDash([5,4]);
      ctx.beginPath();pts.corners.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.stroke();ctx.setLineDash([]);
      const mid={x:(pts.corners[0].x+pts.corners[1].x)/2,y:(pts.corners[0].y+pts.corners[1].y)/2};
      ctx.beginPath();ctx.moveTo(mid.x,mid.y);ctx.lineTo(pts.rotate.x,pts.rotate.y);ctx.stroke();
      pts.corners.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.stroke();});
      ctx.beginPath();ctx.arc(pts.rotate.x,pts.rotate.y,7,0,Math.PI*2);ctx.fillStyle='#fbbf00';ctx.fill();ctx.stroke();ctx.restore();
    }
    render(){this.preview.render();this.sync();this.navigation.sync();
      const d=this.dimensions();
      this.quality?.setPlacement({printWidthIn:d.w,printHeightIn:d.h,scale:this.side.state.scale,fit:1});
    }
    sync(){
      const side=this.side,s=side.state;
      this.el('scale').value=Math.round(s.scale*100);this.el('rotate').value=Math.round(s.angle*180/Math.PI);
      this.el('scale-output').textContent=`${Math.round(s.scale*100)}%`;this.el('rotate-output').textContent=`${Math.round(s.angle*180/Math.PI)}°`;
      this.el('scale').disabled=!side.art||this.cfg.editor?.allowScaling===false;
      this.el('rotate').disabled=!side.art||this.cfg.editor?.allowRotation===false;
      this.download.disabled=!side.art;
      for(const action of ['undo','redo','center']){const b=this.root.querySelector(`[data-ip-action="${action}"]`);b.disabled=!side.art||(action==='undo'&&!side.history.length)||(action==='redo'&&!side.future.length);}
      this.empty.hidden=Boolean(side.original);
      this.empty.disabled=Boolean(side.original);
      this.el('empty-label').textContent=this.current==='front'?'Haz clic para subir el frente':'Haz clic para subir el dorso';
      this.el('spec').textContent=`${this.dimensions().w} × ${this.dimensions().h}″ · ${this.current==='front'?'Frente':'Dorso'}`;
      const dim=this.dimensions(),m=this.margins();
      this.el('guide-description').textContent=`Margen interior: izquierda ${m.left}″, derecha ${m.right}″, arriba ${m.top}″ y abajo ${m.bottom}″. Tamaño final ${dim.w} × ${dim.h}″. Guías ilustrativas (no sangrado).`;
      const btn=this.root.querySelectorAll('[data-ip-side]');btn.forEach(b=>{const active=b.dataset.ipSide===this.current;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));if(b.dataset.ipSide==='back')b.disabled=!this.twoSides;});
      this.project.value=JSON.stringify({v:1,type:this.root.dataset.productType,size:this.size.label,orientation:this.orientation,sides:this.twoSides?2:1,front:{...this.sides.front.state,filename:this.sides.front.original?.name||null},back:this.twoSides?{...this.sides.back.state,filename:this.sides.back.original?.name||null}:null});
    }
    start(){if(!this.historyStart)this.historyStart=snap(this.side.state);}
    end(){if(this.historyStart&&!core.same(this.historyStart,snap(this.side.state))){this.side.history.push(this.historyStart);if(this.side.history.length>40)this.side.history.shift();this.side.future.length=0;}this.historyStart=null;this.render();}
    setSide(side){if(side==='back'&&!this.twoSides)return;this.end();this.current=side;this.quality?.setActive(side);this.preview.resetTilt();this.navigation.reset(false);this.render();}
    setOptions({size,orientation,twoSides}){
      if(size){const found=this.cfg.sizes.find(s=>s.label===size);if(found)this.size=found;}
      if(orientation)this.orientation=orientation;
      if(typeof twoSides==='boolean'){this.twoSides=twoSides;if(!twoSides&&this.current==='back')this.current='front';}
      this.render();
    }
    setMode(mode){this.mode=mode;this.preview.resetTilt();this.stage.dataset.ipView=mode;
      this.root.querySelectorAll('[data-ip-mode]').forEach(b=>b.classList.toggle('is-active',b.dataset.ipMode===mode));this.render();}
    loadFile(sideName,file){
      const operation=this.decodeArtwork(sideName,file);
      this.sides[sideName].loadingPromise=operation;
      return operation;
    }
    async decodeArtwork(sideName,file){
      const side=this.sides[sideName],token=++side.token;
      if(side.url){URL.revokeObjectURL(side.url);side.url=null;}
      side.art=null;side.original=file||null;side.state=clean();side.history=[];side.future=[];
      if(sideName===this.current)this.navigation.reset(false);
      this.quality?.setFile(file,sideName);
      if(!file){this.render();return;}
      this.status.textContent='Preparando vista del archivo…';this.render();
      try{
        const result=await window.ImpressArtworkPreview.render(file,{maxDimension:1600});
        if(token!==side.token)return;
        side.art=result.image;
        this.quality?.setResult(file,result,sideName);
        this.status.textContent=result.notice;
      }catch(error){
        if(token!==side.token)return;
        this.quality?.setResult(file,null,sideName);
        this.status.textContent='El original está seleccionado, pero no se pudo mostrar la vista: '+(error?.message||'formato no disponible')+' Revisa el archivo antes de ordenar.';
      }
      this.render();
    }
    attach(){
      this.root.querySelectorAll('[data-ip-side]').forEach(b=>b.addEventListener('click',()=>this.setSide(b.dataset.ipSide)));
      const activeUpload=()=>this.el('file-'+this.current);
      core.bindEmptyUpload(this.empty,activeUpload);
      core.bindEmptyUpload(this.stage,activeUpload);
      this.root.querySelectorAll('[data-ip-mode]').forEach(b=>b.addEventListener('click',()=>this.setMode(b.dataset.ipMode)));
      this.el('guide-cut').checked=this.showCut;this.el('guide-safe').checked=this.showSafe;
      this.el('guide-cut').addEventListener('change',e=>{this.showCut=e.target.checked;this.render();});
      this.el('guide-safe').addEventListener('change',e=>{this.showSafe=e.target.checked;this.render();});
      this.el('scale').addEventListener('pointerdown',()=>this.start());
      this.el('scale').addEventListener('input',e=>{this.start();this.side.state.scale=clamp(Number(e.target.value)/100,.2,2.5);this.render();});
      this.el('scale').addEventListener('change',()=>this.end());
      this.el('rotate').addEventListener('pointerdown',()=>this.start());
      this.el('rotate').addEventListener('input',e=>{this.start();this.side.state.angle=Number(e.target.value)*Math.PI/180;this.render();});
      this.el('rotate').addEventListener('change',()=>this.end());
      for(const a of ['undo','redo','center'])this.root.querySelector(`[data-ip-action="${a}"]`)?.addEventListener('click',()=>{
        const side=this.side;
        if(a==='center'){this.start();side.state.x=.5;side.state.y=.5;this.end();return;}
        const src=a==='undo'?side.history:side.future,dst=a==='undo'?side.future:side.history;
        if(!src.length)return;dst.push(snap(side.state));side.state=src.pop();this.render();
      });
      this.download.addEventListener('click',async()=>{try{const blob=await this.exportSide(this.current);if(!blob)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`impress-${this.root.dataset.productType}-${this.current}-vista.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){this.status.textContent=e.message;}});
      this.canvas.addEventListener('pointerdown',e=>{
        if(this.mode!=='edit'||!this.side.art||e.button!==0||this.navigation.isPanning())return;
        const p=this.navigation.point(e),kind=core.hitTest(p,this.geometry,{rotateOffset:30});if(!kind)return;
        if(kind==='rotate'&&this.cfg.editor?.allowRotation===false)return;
        if(kind==='scale'&&this.cfg.editor?.allowScaling===false)return;
        this.start();this.drag=core.startDrag(kind,p,this.geometry,this.side.state);this.canvas.setPointerCapture(e.pointerId);e.preventDefault();
      });
      this.canvas.addEventListener('pointermove',e=>{if(this.navigation.isPanning()||!this.drag)return;core.updateDrag(this.side.state,this.drag,this.navigation.point(e));this.render();e.preventDefault();});
      for(const type of ['pointerup','pointercancel'])this.canvas.addEventListener(type,e=>{if(!this.drag)return;this.drag=null;if(this.canvas.hasPointerCapture(e.pointerId))this.canvas.releasePointerCapture(e.pointerId);this.end();});
    }
    exportSide(sideName){
      if(!this.sides[sideName].art)return Promise.resolve(null);
      const dims=this.dimensions(),max=1600;
      const W=Math.max(200,Math.round(max*dims.w/Math.max(dims.w,dims.h)));
      const H=Math.max(200,Math.round(max*dims.h/Math.max(dims.w,dims.h)));
      const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');
      this.paint(ctx,W,H,true,true,sideName);
      return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('No se generó la vista PNG')),'image/png'));
    }
    async prepareOrderFiles(){
      await Promise.all([this.sides.front.loadingPromise,this.sides.back.loadingPromise].filter(Boolean));
      if(this.sides.front.original&&!this.sides.front.art)throw new Error('No se pudo visualizar el frente. Revisa el archivo o usa otra versión.');
      if(this.twoSides&&this.sides.back.original&&!this.sides.back.art)throw new Error('No se pudo visualizar el dorso. Revisa el archivo o usa otra versión.');
      for(const [name,input] of [['front',this.outFront],['back',this.outBack]]){
        input.disabled=true;input.value='';
        if(name==='back'&&!this.twoSides)continue;
        const blob=await this.exportSide(name);
        if(!blob)continue; // PDF original kept attached, no false preview.
        if(typeof DataTransfer==='undefined')continue;
        const transfer=new DataTransfer();transfer.items.add(new File([blob],`impress-${name}-vista.png`,{type:'image/png'}));
        input.files=transfer.files;input.disabled=false;
      }
      this.sync();
    }
  }
  const store=new WeakMap();
  window.ImpressPaperEditor=Object.freeze({mount(root,config){if(store.has(root))return store.get(root);const editor=new PaperEditor(root,config);store.set(root,editor);return editor;}});
})();
