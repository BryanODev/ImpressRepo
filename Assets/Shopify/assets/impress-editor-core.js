/* IMPRESS Editor Shared Core v0.3 — framework-free, browser-only helpers.
 * SHARED: move / resize / rotate, preview background, canvas sizing, tilt, pointer handling.
 * PRODUCT PLUGINS: Sticker and Banner own product visuals, print guides and SKU logic.
 * This file MUST load before either product editor script.
 */
(() => {
  'use strict';
  if (window.ImpressEditorCore) return;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const snapshotTransform = state => ({ x:state.x, y:state.y, scale:state.scale, angle:state.angle });
  // One interaction for every editor: a visible button in an empty stage opens
  // the SAME Shopify file property input used by the regular upload area.
  function bindEmptyUpload(button, input) {
    if(!button || !input || button.dataset.impressUploadBound==='true')return;
    button.dataset.impressUploadBound='true';
    button.addEventListener('click',event=>{
      // A centered upload button may sit inside a clickable empty canvas.
      // Don't open two choosers when its click bubbles to the canvas stage.
      if(!button.classList.contains('impress-preview-upload') && event.target.closest?.('.impress-preview-upload'))return;
      const target=typeof input==='function'?input():input;
      if(target && !target.files?.length && !target.disabled)target.click();
    });
  }

  function handles(g, rotateOffset=36) {
    const {cx,cy,w,h,angle} = g, co=Math.cos(angle), si=Math.sin(angle);
    const pt=(x,y)=>({x:cx+x*co-y*si,y:cy+x*si+y*co});
    return {corners:[pt(-w/2,-h/2),pt(w/2,-h/2),pt(w/2,h/2),pt(-w/2,h/2)],rotate:pt(0,-h/2-rotateOffset)};
  }
  function pointer(canvas, event) {
    const r=canvas.getBoundingClientRect();
    return {x:event.clientX-r.left,y:event.clientY-r.top};
  }
  function hitTest(p,g,{rotateOffset=36,rotateRadius=19,scaleRadius=19,padding=8}={}) {
    if (!g) return null;
    const ps=handles(g,rotateOffset);
    if(Math.hypot(p.x-ps.rotate.x,p.y-ps.rotate.y)<rotateRadius)return 'rotate';
    if(ps.corners.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<scaleRadius))return 'scale';
    const dx=p.x-g.cx, dy=p.y-g.cy, ca=Math.cos(-g.angle),sa=Math.sin(-g.angle);
    const u=dx*ca-dy*sa,v=dx*sa+dy*ca;
    return Math.abs(u)<=g.w/2+padding&&Math.abs(v)<=g.h/2+padding?'move':null;
  }
  function startDrag(kind,p,g,state) {
    return {kind,start:p,prev:snapshotTransform(state),g:{...g},
      startAngle:Math.atan2(p.y-g.cy,p.x-g.cx),
      startDistance:Math.max(1,Math.hypot(p.x-g.cx,p.y-g.cy))};
  }
  function updateDrag(state,drag,p,options={}) {
    const {minPosition=-.6,maxPosition=1.6,minScale=.2,maxScale=2.5} = options;
    if(drag.kind==='move'){
      state.x=clamp(drag.prev.x+(p.x-drag.start.x)/drag.g.r.w,minPosition,maxPosition);
      state.y=clamp(drag.prev.y+(p.y-drag.start.y)/drag.g.r.h,minPosition,maxPosition);
    } else if(drag.kind==='scale') {
      state.scale=clamp(drag.prev.scale*Math.hypot(p.x-drag.g.cx,p.y-drag.g.cy)/drag.startDistance,minScale,maxScale);
    } else if(drag.kind==='rotate') {
      const angle=drag.prev.angle+Math.atan2(p.y-drag.g.cy,p.x-drag.g.cx)-drag.startAngle;
      state.angle=Math.atan2(Math.sin(angle),Math.cos(angle));
    }
  }
  function resetCanvas(target,ctx,width,height,dpr) {
    const w=Math.round(width*dpr), h=Math.round(height*dpr);
    if(target.width!==w||target.height!==h){target.width=w;target.height=h;}
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,width,height);
  }
  // ONE place to configure the preview stage for every Impress product.
  // Product renderers draw the actual product onto a transparent surface.
  const PREVIEW_DEFAULTS = Object.freeze({
    backgroundStart:'#f9fbfc',
    backgroundEnd:'#e6ecef',
    grid:false,
    gridSpacing:36,
    gridColor:'rgba(146,169,180,.14)',
    maxPixelRatio:2,
    minWidth:180,
    minHeight:180,
    fallbackWidth:560,
    fallbackHeight:450,
    perspective:950,
    tiltXDegrees:11,
    tiltYDegrees:13
  });

  /** Shared view/controller. Product modules supply drawEdit and drawFinal hooks.
   * The stage owns ONLY workspace appearance, canvas DPI and final-view tilt.
   * The product modules own their shapes, finishes, guides and exports.
   */
  class PreviewStage {
    constructor({canvas,finalCanvas,finalLayer,stage,viewKey='ieView',getMode,hasArtwork,
      drawEdit,drawFinal,settings={}}){
      if(!canvas||!finalCanvas||!finalLayer||!stage)throw new Error('Impress PreviewStage: missing DOM nodes');
      this.canvas=canvas;this.finalCanvas=finalCanvas;this.finalLayer=finalLayer;this.stage=stage;
      this.ctx=canvas.getContext('2d');this.finalCtx=finalCanvas.getContext('2d');
      if(!this.ctx||!this.finalCtx)throw new Error('Impress PreviewStage: Canvas 2D unsupported');
      this.viewKey=viewKey;
      this.settings={...PREVIEW_DEFAULTS,...settings};
      this.getMode=getMode;this.hasArtwork=hasArtwork;
      this.drawEdit=drawEdit;this.drawFinal=drawFinal;
      this.x=0;this.y=0;this.tiltRAF=0;
      this.reduced=Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
      this._attachTilt();
    }
    dimensions(){
      const r=this.canvas.getBoundingClientRect(),s=this.settings;
      return {W:Math.max(s.minWidth,r.width||s.fallbackWidth),
        H:Math.max(s.minHeight,r.height||s.fallbackHeight),
        dpr:Math.min(window.devicePixelRatio||1,s.maxPixelRatio)};
    }
    drawBackground(ctx,W,H){
      const s=this.settings;
      const grad=ctx.createLinearGradient(0,0,W,H);
      grad.addColorStop(0,s.backgroundStart);grad.addColorStop(1,s.backgroundEnd);
      ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
      if(s.grid){
        ctx.save();ctx.strokeStyle=s.gridColor;ctx.lineWidth=1;
        for(let x=0;x<W;x+=s.gridSpacing){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
        for(let y=0;y<H;y+=s.gridSpacing){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
        ctx.restore();
      }
    }
    render(){
      const {W,H,dpr}=this.dimensions(),mode=this.getMode();
      resetCanvas(this.canvas,this.ctx,W,H,dpr);
      this.drawBackground(this.ctx,W,H);
      if(mode==='final')this.redrawFinal();
      else this.drawEdit(this.ctx,W,H);
      this.stage.dataset[this.viewKey]=mode;
    }
    redrawFinal(){
      if(this.getMode()!=='final')return;
      const {W,H,dpr}=this.dimensions();
      resetCanvas(this.finalCanvas,this.finalCtx,W,H,dpr);
      this.drawFinal(this.finalCtx,W,H,{x:this.x,y:this.y});
      this.finalLayer.style.transform=`perspective(${this.settings.perspective}px) rotateX(${(-this.y*this.settings.tiltXDegrees).toFixed(2)}deg) rotateY(${(this.x*this.settings.tiltYDegrees).toFixed(2)}deg)`;
    }
    resetTilt(){this.x=0;this.y=0;}
    setTilt(x,y){
      if(this.getMode()!=='final'||this.reduced)return;
      this.x=clamp(x,-1,1);this.y=clamp(y,-1,1);
      if(this.tiltRAF)return;
      this.tiltRAF=requestAnimationFrame(()=>{this.tiltRAF=0;this.redrawFinal();});
    }
    _attachTilt(){
      const stage=this.stage;
      stage.addEventListener('pointerdown',event=>{
        if(this.getMode()==='final'&&this.hasArtwork()&&event.pointerType==='touch'){
          stage.setPointerCapture(event.pointerId);event.preventDefault();
        }
      });
      stage.addEventListener('pointermove',event=>{
        if(this.getMode()!=='final'||!this.hasArtwork()||this.reduced)return;
        if(event.pointerType==='touch'&&!stage.hasPointerCapture(event.pointerId))return;
        const r=stage.getBoundingClientRect();
        if(!r.width||!r.height)return;
        this.setTilt(((event.clientX-r.left)/r.width-.5)*2,((event.clientY-r.top)/r.height-.5)*2);
      });
      stage.addEventListener('pointerleave',event=>{
        if(this.getMode()==='final'&&event.pointerType!=='touch')this.setTilt(0,0);
      });
      for(const name of ['pointerup','pointercancel'])stage.addEventListener(name,event=>{
        if(stage.hasPointerCapture(event.pointerId))stage.releasePointerCapture(event.pointerId);
      });
    }
    observeResize(callback){
      if(typeof ResizeObserver!=='undefined'){
        this.resizeObserver=new ResizeObserver(callback);
        this.resizeObserver.observe(this.canvas.parentElement);
      }else window.addEventListener('resize',callback);
    }
  }


  /** A camera for the editable canvas only. Never modifies artwork state,
   * print geometry, history, metadata, or exported PNGs. */
  class ViewNavigation {
    constructor({canvas,stage,getMode,hasArtwork,render,min=1,max=4,controls=null,hint=null,fallbackHeight=400}){
      this.canvas=canvas;this.stage=stage;this.getMode=getMode;
      this.hasArtwork=hasArtwork;this.render=render;
      this.min=min;this.max=max;this.zoom=1;this.panX=0;this.panY=0;
      this.fallbackHeight=fallbackHeight;
      this.panDrag=null;
      // Keep any existing product-specific toolbar markup/styles; the camera and
      // input handling stay universal. New products get a built-in toolbar.
      this.toolbar=controls?.toolbar||document.createElement('div');
      this.hint=hint;
      if(!controls?.toolbar){
        this.toolbar.className='impress-view-toolbar';
        this.toolbar.setAttribute('role','group');
        this.toolbar.setAttribute('aria-label','Zoom y desplazamiento de la vista');
      }
      this.toolbar.title='Rueda: zoom · Arrastrar con botón central: desplazar vista';
      this.toolbar.hidden=true;
      const makeButton=(text,label,action)=>{
        const b=document.createElement('button');b.type='button';b.textContent=text;
        b.setAttribute('aria-label',label);b.title=label;
        b.addEventListener('click',action);this.toolbar.append(b);return b;
      };
      if(controls?.toolbar){
        this.zoomOut=controls.out;this.zoomIn=controls.in;
        this.level=controls.level;this.resetButton=controls.reset;
        this.zoomOut?.addEventListener('click',()=>this.zoomAt(this.zoom/1.25));
        this.zoomIn?.addEventListener('click',()=>this.zoomAt(this.zoom*1.25));
        this.resetButton?.addEventListener('click',()=>this.reset());
      }else{
        this.zoomOut=makeButton('−','Alejar vista',()=>this.zoomAt(this.zoom/1.25));
        this.level=document.createElement('output');this.level.textContent='100%';
        this.level.setAttribute('aria-label','Nivel de zoom de vista');this.toolbar.append(this.level);
        this.zoomIn=makeButton('+','Acercar vista',()=>this.zoomAt(this.zoom*1.25));
        this.resetButton=makeButton('↺','Restablecer zoom y vista',()=>this.reset());
        this.resetButton.className='impress-view-toolbar__reset';
        stage.append(this.toolbar);
      }
      stage.addEventListener('wheel',event=>{
        if(!this.active())return;
        event.preventDefault();
        const dy=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?400:1);
        this.zoomAt(this.zoom*Math.exp(-clamp(dy,-600,600)*.00165),event.clientX,event.clientY);
      },{passive:false});
      canvas.addEventListener('auxclick',event=>{
        if(event.button===1&&this.active())event.preventDefault();
      });
      canvas.addEventListener('mousedown',event=>{
        if(event.button===1&&this.active())event.preventDefault();
      });
      canvas.addEventListener('pointerdown',event=>{
        if(event.button!==1||!this.active())return;
        this.panDrag={id:event.pointerId,clientX:event.clientX,clientY:event.clientY,
          panX:this.panX,panY:this.panY};
        canvas.setPointerCapture(event.pointerId);
        canvas.style.cursor='grabbing';event.preventDefault();
      });
      canvas.addEventListener('pointermove',event=>{
        if(!this.panDrag||this.panDrag.id!==event.pointerId)return;
        this.panX=this.panDrag.panX+event.clientX-this.panDrag.clientX;
        this.panY=this.panDrag.panY+event.clientY-this.panDrag.clientY;
        this.clampPan();this.render();event.preventDefault();
      });
      const finish=event=>{
        if(!this.panDrag||this.panDrag.id!==event.pointerId)return;
        this.panDrag=null;
        if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
        canvas.style.cursor='default';this.render();
      };
      canvas.addEventListener('pointerup',finish);
      canvas.addEventListener('pointercancel',finish);
      this.sync();
    }
    active(){return this.getMode()==='edit'&&Boolean(this.hasArtwork());}
    isPanning(){return Boolean(this.panDrag);}
    cancelPan(){this.panDrag=null;this.canvas.style.cursor='default';}
    dimensions(){const r=this.canvas.getBoundingClientRect();return {W:r.width||560,H:r.height||this.fallbackHeight};}
    clampPan(W=this.dimensions().W,H=this.dimensions().H){
      this.panX=clamp(this.panX,-(this.zoom-1)*W/2,(this.zoom-1)*W/2);
      this.panY=clamp(this.panY,-(this.zoom-1)*H/2,(this.zoom-1)*H/2);
    }
    reset(redraw=true){this.zoom=1;this.panX=0;this.panY=0;this.panDrag=null;
      if(redraw)this.render();else this.sync();}
    zoomAt(value,clientX,clientY){
      if(!this.active())return;
      const {W,H}=this.dimensions(),r=this.canvas.getBoundingClientRect();
      const x=Number.isFinite(clientX)?clientX-r.left:W/2;
      const y=Number.isFinite(clientY)?clientY-r.top:H/2;
      const next=clamp(value,this.min,this.max);
      if(Math.abs(next-this.zoom)<1e-6)return;
      const ratio=next/this.zoom;
      this.panX=(x-W/2)-ratio*(x-W/2-this.panX);
      this.panY=(y-H/2)-ratio*(y-H/2-this.panY);
      this.zoom=next;this.clampPan(W,H);this.render();
    }
    point(event){
      const p=pointer(this.canvas,event),{W,H}=this.dimensions();
      return {x:W/2+(p.x-W/2-this.panX)/this.zoom,
        y:H/2+(p.y-H/2-this.panY)/this.zoom};
    }
    draw(ctx,W,H,fn){
      this.clampPan(W,H);
      ctx.save();ctx.translate(W/2+this.panX,H/2+this.panY);
      ctx.scale(this.zoom,this.zoom);ctx.translate(-W/2,-H/2);
      try{fn();}finally{ctx.restore();}
    }
    sync(){
      const active=this.active();this.toolbar.hidden=!active;
      if(this.hint)this.hint.hidden=!active;
      if(this.level)this.level.textContent=`${Math.round(this.zoom*100)}%`;
      if(this.zoomOut)this.zoomOut.disabled=!active||this.zoom<=this.min+1e-4;
      if(this.zoomIn)this.zoomIn.disabled=!active||this.zoom>=this.max-1e-4;
      if(this.resetButton)this.resetButton.disabled=!active||(this.zoom===1&&this.panX===0&&this.panY===0);
    }
  }

  /** Standard Impress workspace used by every product editor.
   * New product modules only supply drawEdit/drawFinal and product-specific
   * inputs. All editors inherit the same canvas camera, preview background,
   * final-view tilt, and optional image resolution analyzer.
   * Exports must render from product draw functions directly without camera.
   */
  function createWorkspace({canvas,finalCanvas,finalLayer,stage,viewKey,
      getMode,hasArtwork,drawEdit,drawFinal,render,
      controls=null,hint=null,zoomMin=1,zoomMax=4,
      fallbackHeight=400,settings={},qualityRoot=null,qualityType=null}){
    const navigation=new ViewNavigation({canvas,stage,getMode,hasArtwork,render,
      controls,hint,min:zoomMin,max:zoomMax,fallbackHeight});
    const preview=new PreviewStage({canvas,finalCanvas,finalLayer,stage,viewKey,
      getMode,hasArtwork,
      drawEdit:(ctx,W,H)=>navigation.draw(ctx,W,H,()=>drawEdit(ctx,W,H)),
      drawFinal,settings});
    const quality=qualityRoot && qualityType
      ? window.ImpressArtworkQuality?.mount(qualityRoot,qualityType) : null;
    return Object.freeze({preview,navigation,quality});
  }

  window.ImpressEditorCore=Object.freeze({
    version:'0.4',clamp,same,snapshotTransform,handles,pointer,hitTest,startDrag,updateDrag,resetCanvas,
    PreviewStage,ViewNavigation,createWorkspace,PREVIEW_DEFAULTS,bindEmptyUpload
  });
})();
