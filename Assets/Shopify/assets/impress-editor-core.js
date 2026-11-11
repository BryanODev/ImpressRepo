/* IMPRESS Editor Shared Core v0.2 — framework-free, browser-only helpers.
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

  window.ImpressEditorCore=Object.freeze({
    version:'0.2',clamp,same,snapshotTransform,handles,pointer,hitTest,startDrag,updateDrag,resetCanvas,
    PreviewStage,PREVIEW_DEFAULTS
  });
})();
