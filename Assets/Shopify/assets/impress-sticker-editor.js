/* Impress Sticker Editor — Shared Preview Foundation v0.2 — browser-only canvas engine, no libraries or server.
 * This is a customer-facing mockup editor, NOT a print-ready dieline generator.
 * The original artwork remains untouched in its separate Shopify upload input.
 */
(() => {
  'use strict';
  const $ = (root, selector) => root.querySelector(selector);
  const core = window.ImpressEditorCore;
  if (!core) { console.error('Impress Editor Core missing. Load impress-editor-core.js first.'); return; }
  const clamp = core.clamp;
  const snapshot = state => ({ x: state.x, y: state.y, scale: state.scale, angle: state.angle,
    stroke: state.stroke, color: state.color, removed: state.removed, tolerance: state.tolerance });
  const same = core.same;
  const imgSize = img => ({ width: img.width || img.naturalWidth, height: img.height || img.naturalHeight });

  function roundedPath(ctx, x,y,w,h,r) {
    const radius = clamp(r, 0, Math.min(w,h)/2);
    ctx.beginPath(); ctx.moveTo(x+radius,y); ctx.lineTo(x+w-radius,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+radius); ctx.lineTo(x+w,y+h-radius);
    ctx.quadraticCurveTo(x+w,y+h,x+w-radius,y+h); ctx.lineTo(x+radius,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-radius); ctx.lineTo(x,y+radius);
    ctx.quadraticCurveTo(x,y,x+radius,y); ctx.closePath();
  }
  const isContour = shape => /contour|contorno|die.?cut/i.test(shape);
  const isCircle = shape => /circ|redond|round/i.test(shape);
  const isSquare = shape => /square|cuadrad/i.test(shape);
  const DEFAULT_SAFE_INSET_INCHES = 0.0625; // Customer preview only; not a production toolpath.
  const BLUE_SPEED_FACTOR = 0.36; // Slower than the red cutline.
  function stickerPath(ctx, x,y,w,h,shape) {
    if (isCircle(shape)) {
      ctx.beginPath(); ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2); ctx.closePath();
    } else roundedPath(ctx,x,y,w,h,isSquare(shape) ? Math.min(w,h)*.012 : Math.min(w,h)*.018);
  }
  function sizeInches(size) {
    const match=String(size||'').match(/(\d+(?:[.,]\d+)?)\s*(?:x|×)\s*(\d+(?:[.,]\d+)?)/i);
    if(match) {
      // Sizes without a unit are inches; also honor explicit cm/mm labels.
      const unit=String(size).slice(match.index+match[0].length).trim().match(/^(mm|cm|in(?:ches)?|")/i)?.[1]?.toLowerCase() || 'in';
      const conversion=unit==='cm'?1/2.54:unit==='mm'?1/25.4:1;
      const width=Number(match[1].replace(',','.'))*conversion;
      const height=Number(match[2].replace(',','.'))*conversion;
      if(width>0 && height>0)return {width,height};
    }
    const single=String(size||'').match(/(\d+(?:[.,]\d+)?)\s*(?:in(?:ches)?|\")/i);
    if(single) {
      const n=Number(single[1].replace(',','.'));
      if(n>0)return {width:n,height:n};
    }
    return null;
  }
  function safeInsetPixels(r,size,safeInches=DEFAULT_SAFE_INSET_INCHES) {
    // r represents the size chosen in Shopify. Pixel/inch must follow the
    // selected physical dimensions, not the screen DPI or the user's zoom.
    const physical=sizeInches(size);
    const pixelsPerInch=physical ? Math.min(r.w/physical.width,r.h/physical.height)
      : Math.min(r.w,r.h)/2; // visual fallback if size text has no dimensions
    return safeInches*pixelsPerInch;
  }
  function insetStickerPath(ctx,r,shape,inset) {
    const w=r.w-2*inset, h=r.h-2*inset;
    if(w<=3||h<=3)return false;
    const x=r.x+inset, y=r.y+inset;
    if(isCircle(shape)) {
      ctx.beginPath();ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);ctx.closePath();
    } else {
      const outsideRadius=Math.min(r.w,r.h)*(isSquare(shape)?.012:.018);
      roundedPath(ctx,x,y,w,h,Math.max(0,outsideRadius-inset));
    }
    return true;
  }
  function dimensionRatio(size, shape) {
    if (isCircle(shape) || isSquare(shape)) return 1;
    const m = String(size||'').match(/(\d+(?:[.,]\d+)?)\s*(?:x|×)\s*(\d+(?:[.,]\d+)?)/i);
    if (!m) return 1;
    const ratio = Number(m[1].replace(',','.')) / Number(m[2].replace(',','.'));
    return clamp(Number.isFinite(ratio) ? ratio : 1, .45, 2.3);
  }
  function stickerRect(W,H, ratio) {
    const maxW = W*.76, maxH = H*.73;
    const w = Math.min(maxW, maxH*ratio);
    const h = w/ratio;
    return { x:(W-w)/2, y:(H-h)/2, w, h };
  }
  function makeTint(img, color) {
    const {width,height} = imgSize(img);
    const canvas = document.createElement('canvas');
    canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,width,height); ctx.drawImage(img,0,0,width,height);
    ctx.globalCompositeOperation='source-in';ctx.fillStyle=color;ctx.fillRect(0,0,width,height);
    ctx.globalCompositeOperation='source-over';
    return canvas;
  }

  function mount(root) {
    const cfg=window.ImpressProductConfigs?.stickers;
    if(!cfg) { console.error('Impress: missing impress-sticker-config.js'); return null; }
    const parsedSafeInches=Number(cfg.safeZoneInches);
    const safeZoneInches=Number.isFinite(parsedSafeInches) && parsedSafeInches > 0 && parsedSafeInches <= 1 ? parsedSafeInches : DEFAULT_SAFE_INSET_INCHES;
    const el = key => $(root, `[data-ie-${key}]`);
    const canvas=el('canvas'), finalCanvas=el('final-canvas'), finalLayer=el('final-layer'), stage=el('stage'),
      project=el('project'), outputFile=el('output-file');
    if (!canvas || !finalCanvas || !finalLayer || !stage || !project || !outputFile) return null;
    const c = canvas.getContext('2d');
    const fc = finalCanvas.getContext('2d');
    if (!c || !fc) return null;
    const ui = { scale:el('scale'), rotate:el('rotate'), stroke:el('stroke'), color:el('color'),
      guides:el('guides'), safeGuides:el('safe-guides'), tolerance:el('tolerance'), remove:el('remove-bg'), restore:el('restore-bg'),
      download:el('download'), note:el('editor-message'), empty:el('empty'), safeNote:el('safe-note'),
      contourAlert:el('contour-alert'), contourRemove:el('contour-remove') };
    // Customer-facing edit capabilities are controlled by the product config file.
    const allow=cfg.editor||{};
    const hideTool=(element)=>{if(!element)return;const row=element.closest('.impress-sticker__tool-row, .impress-sticker__bg-row'); if(row){row.hidden=true;row.style.display='none';} else element.hidden=true;};
    if(allow.allowScaling===false)hideTool(ui.scale);
    if(allow.allowRotation===false)hideTool(ui.rotate);
    if(allow.allowStroke===false)hideTool(ui.stroke);
    if(allow.allowBackgroundRemoval===false)hideTool(ui.remove);
    if(ui.guides)ui.guides.checked=cfg.cutGuideDefaultOn!==false;
    if(ui.safeGuides)ui.safeGuides.checked=cfg.safeGuideDefaultOn!==false;
    const initial = {x:.5,y:.5,scale:1,angle:0,stroke:0,color:'#ffffff',removed:false,tolerance:35};
    const state = {...initial};
    const history=[], future=[];
    let art=null, original=null, cleaned=null, tint=null, tintKey='';
    let objectURL=null, mode='edit', shape='Contour Cut', finish='Gloss', size='2 x 2 in';
    let guidePhase=0, guideFrame=0, lastTick=0;
    let contourCacheKey='', contourPaths=[], contourSafePaths=[], contourReady=false;
    const reduceMotion=Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    let drag=null, editBefore=null, waiting=false, fileToken=0;
    let latestGeometry=null;
    const editorControls=[ui.scale,ui.rotate,ui.stroke,ui.color,ui.tolerance,ui.remove,ui.download];

    function note(txt, bad=false) {
      if(ui.note) { ui.note.textContent=txt; ui.note.dataset.error=bad?'true':'false'; }
    }
    function syncUI() {
      ui.scale.value=String(Math.round(state.scale*100));
      ui.rotate.value=String(Math.round(state.angle*180/Math.PI));
      ui.stroke.value=String(state.stroke); ui.color.value=state.color;
      ui.tolerance.value=String(state.tolerance);
      el('scale-value').textContent=`${Math.round(state.scale*100)}%`;
      el('rotate-value').textContent=`${Math.round(state.angle*180/Math.PI)}°`;
      el('stroke-value').textContent=String(state.stroke);
      el('tolerance-value').textContent=String(state.tolerance);
      const active=!!art;
      for(const item of editorControls) if(item) item.disabled=!active || waiting ||
        ((item===ui.scale)&&allow.allowScaling===false) ||
        ((item===ui.rotate)&&allow.allowRotation===false) ||
        ((item===ui.stroke||item===ui.color)&&allow.allowStroke===false) ||
        ((item===ui.remove||item===ui.tolerance)&&allow.allowBackgroundRemoval===false);
      ui.restore.disabled=!original || !state.removed || waiting || allow.allowBackgroundRemoval===false;
      for (const action of ['undo','redo','center']) {
        const button=$(root,`[data-ie-action="${action}"]`);
        if(button) button.disabled=!active || waiting || (action==='undo'&&!history.length) || (action==='redo'&&!future.length);
      }
      if(ui.empty) ui.empty.hidden=active;
      if(project) project.value=active ? JSON.stringify({v:2,x:+state.x.toFixed(4),y:+state.y.toFixed(4),s:+state.scale.toFixed(3),r:Math.round(state.angle*180/Math.PI),b:state.stroke,c:state.color,rm:state.removed,t:state.tolerance}) : '';
    }
    function markBegin() { if(!editBefore) editBefore=snapshot(state); }
    function markEnd() {
      if(editBefore && !same(editBefore,snapshot(state))) {
        history.push(editBefore); if(history.length>35) history.shift(); future.length=0;
      }
      editBefore=null;syncUI();
    }
    function imageHasCuttableAlpha(image) {
      // A rectangle with an opaque border is not a contour-cut silhouette.
      // Sample the perimeter of the editable image, not its RGB colors: we must
      // never mistake a light background for transparency or a cutting path.
      if(!image) return false;
      const {width:w,height:h}=imgSize(image);
      const context=image.getContext?.('2d',{willReadFrequently:true});
      if(!context || !w || !h) return false;
      const data=context.getImageData(0,0,w,h).data;
      const stepX=Math.max(1,Math.floor(w/200)),stepY=Math.max(1,Math.floor(h/200));
      let borderSamples=0, transparentSamples=0;
      const sample=(x,y)=>{borderSamples++; if(data[(y*w+x)*4+3]<192)transparentSamples++;};
      for(let x=0;x<w;x+=stepX){sample(x,0);sample(x,h-1);}
      for(let y=1;y<h-1;y+=stepY){sample(0,y);sample(w-1,y);}
      return borderSamples>0 && transparentSamples/borderSamples>=0.03;
    }
    function syncContourHelp() {
      const needsBackgroundRemoval=isContour(shape) && !!art && !contourReady;
      if(ui.contourAlert)ui.contourAlert.hidden=true;
      if(ui.safeNote) {
        ui.safeNote.dataset.warning='false';
        ui.safeNote.textContent=needsBackgroundRemoval
          ? `Rojo: borde visible de la imagen. Azul: zona segura ${safeZoneInches}″ hacia adentro. Si quitas el fondo, ambas líneas seguirán la silueta.`
          : `Rojo: línea de corte. Azul: zona segura ${safeZoneInches}″ hacia adentro. Ambas son guías visuales, no líneas de producción.`;
      }
      if(ui.remove)ui.remove.textContent=needsBackgroundRemoval
        ? 'Quitar fondo para mejorar Contour Cut (beta)' : 'Quitar fondo simple (beta)';
    }
    function setArt(img) {
      art=img; tint=null;tintKey='';contourCacheKey='';
      contourReady=imageHasCuttableAlpha(img);
      syncContourHelp();syncUI();render();
    }
    function appliedState(newState) {
      Object.assign(state,newState);
      setArt(state.removed && cleaned ? cleaned : original);
    }
    function undo() {
      if(!history.length) return; future.push(snapshot(state)); appliedState(history.pop());
    }
    function redo() {
      if(!future.length) return; history.push(snapshot(state)); appliedState(future.pop());
    }
    function dimensions(ctx,W,H,isExport) {
      const ratio=dimensionRatio(size,shape);
      if(isExport) {
        return {x:0,y:0,w:W,h:H};
      }
      return stickerRect(W,H,ratio);
    }
    function paintArtwork(ctx,r,contour=false) {
      if (!art) { latestGeometry=null; return; }
      const {width:iW,height:iH}=imgSize(art);
      const base=Math.min(r.w*.78/iW,r.h*.78/iH);
      const w=iW*base*state.scale,h=iH*base*state.scale;
      const cx=r.x+state.x*r.w,cy=r.y+state.y*r.h;
      ctx.save();ctx.translate(cx,cy);ctx.rotate(state.angle);
      const strokeW=state.stroke*r.w/320;
      const key=`${state.color}:${art===cleaned?'clean':'orig'}`;
      if (strokeW>0) {
        if(!tint || tintKey!==key) { tint=makeTint(art,state.color);tintKey=key; }
        for(let i=0;i<32;i++) {
          const a=i*Math.PI*2/32;
          ctx.drawImage(tint,-w/2+Math.cos(a)*strokeW,-h/2+Math.sin(a)*strokeW,w,h);
        }
      }
      ctx.drawImage(art,-w/2,-h/2,w,h);
      ctx.restore();
      latestGeometry={r,cx,cy,w,h,angle:state.angle};
    }
    function paintReflection(ctx,W,H,r,tilt={x:0,y:0},contour=false) {
      // v0.3.1: use the real alpha of the already-rendered sticker as the mask.
      // The old rectangular fill stopped before overscaled/rotated contour artwork.
      // The finish is a browser-only visualization, never part of the printed PNG.
      const glossy=/gloss|brill/i.test(finish);
      const g=latestGeometry;
      let bx=r.x,by=r.y,bw=r.w,bh=r.h;
      if(contour && g) {
        const a=Math.abs(Math.cos(g.angle)), b=Math.abs(Math.sin(g.angle));
        const allowance=Math.max(7,Math.min(r.w,r.h)*.026)+state.stroke*r.w/320;
        bw=a*g.w+b*g.h+2*allowance;bh=b*g.w+a*g.h+2*allowance;
        bx=g.cx-bw/2;by=g.cy-bh/2;
      }
      const x0=bx-bw*.15, x1=bx+bw*1.15;
      const y0=by-bh*.24, y1=by+bh*1.24;
      const mid=clamp(.50+(tilt.y||0)*.28+(tilt.x||0)*.17,.12,.88);
      const radius=glossy?.18:.42;
      const gshine=ctx.createLinearGradient(x0,y0,x1,y1);
      const c=(v)=>clamp(v,0,1);
      gshine.addColorStop(0,'rgba(255,255,255,0)');
      gshine.addColorStop(c(mid-radius),'rgba(255,255,255,0)');
      gshine.addColorStop(c(mid-radius*.48),glossy?'rgba(255,255,255,.09)':'rgba(255,255,255,.025)');
      gshine.addColorStop(mid,glossy?'rgba(255,255,255,.43)':'rgba(255,255,255,.085)');
      gshine.addColorStop(c(mid+radius*.46),glossy?'rgba(255,255,255,.13)':'rgba(255,255,255,.03)');
      gshine.addColorStop(c(mid+radius),'rgba(255,255,255,0)');
      gshine.addColorStop(1,'rgba(255,255,255,0)');
      ctx.save();
      ctx.globalCompositeOperation='source-atop'; // alpha mask includes entire sticker including offsets
      ctx.fillStyle=glossy?'rgba(255,255,255,.055)':'rgba(232,238,242,.075)';
      ctx.fillRect(0,0,W,H); // subtle coating on ALL visible pixels, even outside the usual bounds
      ctx.fillStyle=gshine;
      ctx.fillRect(0,0,W,H); // moving reflection, also clipped by alpha mask
      ctx.restore();
    }
    function extractContourPaths(stickerLayer,W,H,insetPixels=0) {
      // Trace the perimeter of visible sticker pixels (art + customer-selected stroke).
      // This runs ONLY when the artwork/transform changes, never for every animation frame.
      const scale=Math.min(1,460/Math.max(W,H));
      const sw=Math.max(1,Math.round(W*scale)),sh=Math.max(1,Math.round(H*scale));
      const mask=document.createElement('canvas');mask.width=sw;mask.height=sh;
      const mc=mask.getContext('2d',{willReadFrequently:true});
      // Trace exactly at the visible artwork/stroke boundary; no automatic margin.
      mc.drawImage(stickerLayer,0,0,sw,sh);
      const rgba=mc.getImageData(0,0,sw,sh).data;
      const pixels=new Uint8Array(sw*sh);
      for(let i=0;i<pixels.length;i++)pixels[i]=rgba[i*4+3]>35?1:0;
      if(insetPixels>0) {
        // Approximate Euclidean inward offset (8-neighbor distance transform).
        // Run on the low-res alpha mask and cache it; never recompute per frame.
        const distances=new Float32Array(sw*sh);
        const diagonal=Math.SQRT2;
        const high=sw+sh;
        for(let y=0;y<sh;y++)for(let x=0;x<sw;x++) {
          const i=y*sw+x;
          // Canvas boundary is also outside the sticker.
          distances[i]=pixels[i]?Math.min(high,x+1,y+1,sw-x,sh-y):0;
        }
        for(let y=0;y<sh;y++)for(let x=0;x<sw;x++) {
          const i=y*sw+x;
          if(x>0)distances[i]=Math.min(distances[i],distances[i-1]+1);
          if(y>0)distances[i]=Math.min(distances[i],distances[i-sw]+1);
          if(x>0&&y>0)distances[i]=Math.min(distances[i],distances[i-sw-1]+diagonal);
          if(x+1<sw&&y>0)distances[i]=Math.min(distances[i],distances[i-sw+1]+diagonal);
        }
        for(let y=sh-1;y>=0;y--)for(let x=sw-1;x>=0;x--) {
          const i=y*sw+x;
          if(x+1<sw)distances[i]=Math.min(distances[i],distances[i+1]+1);
          if(y+1<sh)distances[i]=Math.min(distances[i],distances[i+sw]+1);
          if(x+1<sw&&y+1<sh)distances[i]=Math.min(distances[i],distances[i+sw+1]+diagonal);
          if(x>0&&y+1<sh)distances[i]=Math.min(distances[i],distances[i+sw-1]+diagonal);
        }
        const insetAtMaskScale=insetPixels*scale;
        for(let i=0;i<pixels.length;i++) {
          if(distances[i]<=insetAtMaskScale)pixels[i]=0;
        }
      }
      const filled=(x,y)=>x>=0&&y>=0&&x<sw&&y<sh&&pixels[y*sw+x]===1;
      // Clockwise boundary edges around solid pixels. This handles transparent PNG shapes,
      // curves, multiple separated shapes and ordinary rectangular JPG uploads.
      const edges=[],starts=new Map(),stride=sw+1;
      const add=(x1,y1,x2,y2)=>{
        const id=edges.length;
        const dir=x2>x1?0:y2>y1?1:x2<x1?2:3;
        edges.push({x2,y2,dir,used:false});
        const key=y1*stride+x1;
        if(!starts.has(key))starts.set(key,[]);
        starts.get(key).push(id);
      };
      for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)if(filled(x,y)) {
        if(!filled(x,y-1))add(x,y,x+1,y);
        if(!filled(x+1,y))add(x+1,y,x+1,y+1);
        if(!filled(x,y+1))add(x+1,y+1,x,y+1);
        if(!filled(x-1,y))add(x,y+1,x,y);
      }
      const paths=[];
      for(let i=0;i<edges.length;i++) {
        if(edges[i].used)continue;
        let edgeIndex=i,perimeter=0;
        const loop=[];
        while(edgeIndex!==undefined && !edges[edgeIndex].used) {
          const edge=edges[edgeIndex];edge.used=true;
          loop.push({x:edge.x2/scale,y:edge.y2/scale});perimeter++;
          const next=starts.get(edge.y2*stride+edge.x2)||[];
          let priority=Infinity,choice;
          for(const candidateIndex of next) {
            const candidate=edges[candidateIndex];if(candidate.used)continue;
            // At touching corners, turn right before proceeding straight.
            const turn=(candidate.dir-edge.dir+4)%4;
            const score=turn===1?0:turn===0?1:turn===3?2:3;
            if(score<priority){priority=score;choice=candidateIndex;}
          }
          edgeIndex=choice;
        }
        if(loop.length<16||perimeter<24)continue;
        let signedArea=0;
        for(let j=0;j<loop.length;j++){
          const a=loop[j],b=loop[(j+1)%loop.length];
          signedArea+=a.x*b.y-b.x*a.y;
        }
        if(signedArea<=40)continue; // Ignore holes and tiny isolated specks.
        // Compress collinear pixel edges; preserve the actual contour geometry.
        const simplified=[];
        for(let j=0;j<loop.length;j++) {
          const a=loop[(j-1+loop.length)%loop.length],b=loop[j],c=loop[(j+1)%loop.length];
          const ux=b.x-a.x,uy=b.y-a.y,vx=c.x-b.x,vy=c.y-b.y;
          if(Math.abs(ux*vy-uy*vx)>0.001)simplified.push(b);
        }
        if(simplified.length<3)continue;
        const path=new Path2D();
        const first=simplified[0];path.moveTo(first.x,first.y);
        for(let j=1;j<simplified.length;j++)path.lineTo(simplified[j].x,simplified[j].y);
        path.closePath();
        paths.push(path);
      }
      return paths;
    }
    function strokeAnimatedGuide(ctx,paths,color,phase,blur) {
      ctx.save();
      ctx.strokeStyle=color;
      ctx.lineWidth=1.8;
      ctx.lineCap='round';ctx.lineJoin='round';
      ctx.setLineDash([7,6]);ctx.lineDashOffset=-phase;
      ctx.shadowColor=color;ctx.shadowBlur=blur;
      for(const path of paths)ctx.stroke(path);
      ctx.restore();
    }
    function paintContourGuides(ctx,stickerLayer,r,W,H,phase=0) {
      // Both paths are traced from the visible artwork mask. Red = cut edge;
      // blue = same silhouette eroded 0.0625 in based on selected sticker size.
      const inset=safeInsetPixels(r,size,safeZoneInches);
      const key=[W,H,state.x,state.y,state.scale,state.angle,state.stroke,state.color,
        shape,size,inset,art===cleaned?'clean':'original'].join('|');
      if(contourCacheKey!==key) {
        contourPaths=extractContourPaths(stickerLayer,W,H);
        contourSafePaths=extractContourPaths(stickerLayer,W,H,inset);
        contourCacheKey=key;
      }
      if(ui.guides.checked) strokeAnimatedGuide(ctx,contourPaths,'rgba(235,88,96,.93)',phase,3);
      if(ui.safeGuides.checked) strokeAnimatedGuide(ctx,contourSafePaths,
        'rgba(62,177,206,.86)',phase*BLUE_SPEED_FACTOR,2);
    }
    function drawScene(ctx,W,H,{exporting=false,showControls=false,transparentBackground=false,tilt=null}={}) {
      // PreviewStage draws the common background (never bake into exports).
      const r=dimensions(ctx,W,H,exporting);
      const contour=isContour(shape)&&Boolean(art);
      // The sticker is rendered on a separate transparent layer. This is what lets
      // the whole product tilt in final view without tilting the editor background.
      const layer=document.createElement('canvas');layer.width=Math.ceil(W);layer.height=Math.ceil(H);
      const sc=layer.getContext('2d');
      if(contour) {
        paintArtwork(sc,r,true);
      } else {
        stickerPath(sc,r.x,r.y,r.w,r.h,shape);
        sc.fillStyle='#fff';sc.fill();
        sc.save();stickerPath(sc,r.x,r.y,r.w,r.h,shape);sc.clip();
        paintArtwork(sc,r);
        sc.restore();
      }
      // Keep the static export clean: customer visualization of a finish should
      // not be baked into the print reference PNG.
      if(!exporting) paintReflection(sc,W,H,r,tilt||{x:0,y:0},contour);
      ctx.save();
      if(!exporting) {
        ctx.shadowColor='rgba(16,45,57,.27)';
        ctx.shadowBlur=/gloss|brill/i.test(finish)?24:19;
        ctx.shadowOffsetY=14;
      }
      ctx.drawImage(layer,0,0,W,H);ctx.restore();
      if(!exporting&&!contour) {
        ctx.save();stickerPath(ctx,r.x,r.y,r.w,r.h,shape);
        ctx.lineWidth=1.5;ctx.strokeStyle='rgba(116,135,143,.56)';ctx.stroke();ctx.restore();
      }
      if(!exporting && mode==='edit' && !transparentBackground &&
          (ui.guides.checked || ui.safeGuides.checked)) {
        if(contour) {
          paintContourGuides(ctx,layer,r,W,H,guidePhase);
        } else {
          if(ui.guides.checked) {
            ctx.save();stickerPath(ctx,r.x,r.y,r.w,r.h,shape);
            ctx.strokeStyle='rgba(235,88,96,.93)';ctx.lineWidth=1.8;
            ctx.lineCap='round';ctx.setLineDash([7,6]);ctx.lineDashOffset=-guidePhase;
            ctx.shadowColor='rgba(235,88,96,.28)';ctx.shadowBlur=3;ctx.stroke();ctx.restore();
          }
          if(ui.safeGuides.checked) {
            ctx.save();
            if(insetStickerPath(ctx,r,shape,safeInsetPixels(r,size,safeZoneInches))) {
              ctx.strokeStyle='rgba(62,177,206,.86)';ctx.lineWidth=1.8;
              ctx.lineCap='round';ctx.setLineDash([7,6]);
              ctx.lineDashOffset=-guidePhase*BLUE_SPEED_FACTOR;
              ctx.shadowColor='rgba(62,177,206,.20)';ctx.shadowBlur=2;ctx.stroke();
            }
            ctx.restore();
          }
        }
      }
      if(!exporting&&showControls&&art&&latestGeometry)drawHandles(ctx,latestGeometry);
    }
    const handles = g => core.handles(g,36);
    function drawHandles(ctx,g) {
      const pts=handles(g);ctx.save();ctx.setLineDash([]);ctx.strokeStyle='rgba(65,105,120,.54)';ctx.lineWidth=1.1;
      ctx.beginPath();pts.corners.forEach((p,i)=> i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.stroke();
      ctx.setLineDash([]);ctx.beginPath();const top={x:(pts.corners[0].x+pts.corners[1].x)/2,y:(pts.corners[0].y+pts.corners[1].y)/2};
      ctx.moveTo(top.x,top.y);ctx.lineTo(pts.rotate.x,pts.rotate.y);ctx.stroke();
      for(const p of pts.corners) {ctx.beginPath();ctx.fillStyle='white';ctx.arc(p.x,p.y,7,0,Math.PI*2);ctx.fill();ctx.stroke();}
      ctx.beginPath();ctx.fillStyle='#3e8090';ctx.arc(pts.rotate.x,pts.rotate.y,8,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    const preview = new core.PreviewStage({
      canvas,finalCanvas,finalLayer,stage,viewKey:'ieView',
      getMode:()=>mode,hasArtwork:()=>Boolean(art),
      drawEdit:(ctx,W,H)=>drawScene(ctx,W,H,{showControls:true}),
      drawFinal:(ctx,W,H,tilt)=>drawScene(ctx,W,H,{transparentBackground:true,tilt})
    });
    function drawFinal(){preview.redrawFinal();}
    function animateGuides(now=0) {
      const shouldRun = !reduceMotion && mode==='edit' && (ui.guides.checked||ui.safeGuides.checked) && (isContour(shape) ? !!art : true);
      if(!shouldRun) { guideFrame=0; lastTick=0; return; }
      if(!lastTick) lastTick=now;
      const dt=Math.max(0, now-lastTick);
      if(dt>=30) {
        lastTick=now;
        guidePhase=(guidePhase + Math.min(90,dt)*0.042)%780;
        render();
      }
      guideFrame=requestAnimationFrame(animateGuides);
    }
    function refreshGuideAnimation() {
      const shouldRun = !reduceMotion && mode==='edit' && (ui.guides.checked||ui.safeGuides.checked) && (isContour(shape) ? !!art : true);
      if(shouldRun && !guideFrame) guideFrame=requestAnimationFrame(animateGuides);
      if(!shouldRun && guideFrame) { cancelAnimationFrame(guideFrame); guideFrame=0; lastTick=0; }
    }
    function render() {
      preview.render();
      syncUI();
      refreshGuideAnimation();
    }
    const point = e => core.pointer(canvas,e);
    const nearestHandle = (p,g) => core.hitTest(p,g,{rotateOffset:36,rotateRadius:19,scaleRadius:19,padding:8});
    canvas.addEventListener('pointerdown', e=> {
      if(!art||mode!=='edit'||waiting||!latestGeometry)return;
      const p=point(e),kind=nearestHandle(p,latestGeometry);
      if(!kind || (kind==='scale'&&allow.allowScaling===false) || (kind==='rotate'&&allow.allowRotation===false))return;
      markBegin();
      drag=core.startDrag(kind,p,latestGeometry,state);
      canvas.setPointerCapture(e.pointerId);e.preventDefault();canvas.style.cursor='grabbing';
    });
    canvas.addEventListener('pointermove',e=> {
      const p=point(e);
      if(!drag){canvas.style.cursor=art&&mode==='edit'&&latestGeometry&&nearestHandle(p,latestGeometry)?'grab':'default';return;}
      core.updateDrag(state,drag,p,{minPosition:-.6,maxPosition:1.6});
      render();e.preventDefault();
    });
    const finishDrag=()=> {if(drag){drag=null;markEnd();canvas.style.cursor='default';render();}};
    canvas.addEventListener('pointerup',finishDrag);canvas.addEventListener('pointercancel',finishDrag);
    for(const [key,prop,parse] of [
      ['scale','scale',v=>Number(v)/100],['rotate','angle',v=>Number(v)*Math.PI/180],
      ['stroke','stroke',Number],['color','color',String]
    ]) {
      if((key==='scale'&&allow.allowScaling===false)||(key==='rotate'&&allow.allowRotation===false)||((key==='stroke'||key==='color')&&allow.allowStroke===false))continue;
      ui[key].addEventListener('pointerdown',markBegin);
      ui[key].addEventListener('keydown',markBegin);
      ui[key].addEventListener('input',e=>{markBegin();state[prop]=parse(e.target.value);render();});
      ui[key].addEventListener('change',()=>{markEnd();render();});
    }
    ui.guides.addEventListener('change',()=>{refreshGuideAnimation();render();});
    ui.safeGuides.addEventListener('change',()=>{refreshGuideAnimation();render();});
    if(ui.contourRemove)ui.contourRemove.addEventListener('click',()=>ui.remove?.click());
    ui.tolerance.addEventListener('input',()=>{state.tolerance=Number(ui.tolerance.value);syncUI();});
    for(const name of ['undo','redo','center']) {
      $(root,`[data-ie-action="${name}"]`).addEventListener('click',()=>{
        if(!art)return;
        if(name==='undo')undo();else if(name==='redo')redo();
        else {markBegin();state.x=.5;state.y=.5;markEnd();render();}
      });
    }
    root.querySelectorAll('[data-ie-mode]').forEach(button=>button.addEventListener('click',()=>{
      mode=button.dataset.ieMode;
      preview.resetTilt();
      root.querySelectorAll('[data-ie-mode]').forEach(b=>b.classList.toggle('is-active',b===button));
      syncContourHelp();render();
    }));
    function loadFile(file) {
      const token=++fileToken;
      original=null;cleaned=null;setArt(null);history.length=0;future.length=0;
      Object.assign(state,initial); if(objectURL){URL.revokeObjectURL(objectURL);objectURL=null;}
      outputFile.value='';
      if(!file){note('Sube una imagen para comenzar.');return Promise.resolve(false);}
      if(!/\.(png|jpe?g|webp)$/i.test(file.name)) {
        note('PDF adjunto: el editor de imagen se desactiva, pero Shopify conserva el archivo original.');return Promise.resolve(false);
      }
      objectURL=URL.createObjectURL(file);
      return new Promise(resolve=> {
        const img=new Image();
        img.onload=()=> {
          if(token!==fileToken){resolve(false);return;}
          const orig=document.createElement('canvas');
          // Editor working copy is constrained for browser memory. Original file is not downsampled.
          const factor=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight));
          orig.width=Math.max(1,Math.round(img.naturalWidth*factor));
          orig.height=Math.max(1,Math.round(img.naturalHeight*factor));
          orig.getContext('2d',{willReadFrequently:true}).drawImage(img,0,0,orig.width,orig.height);
          original=orig;setArt(orig);
          note(!contourReady && isContour(shape)
            ? 'Esta imagen tiene un fondo opaco. Usa «Quitar fondo para Contour Cut» o sube un PNG transparente.'
            : `Imagen lista · ${img.naturalWidth} × ${img.naturalHeight} px. Arrastra para mover; usa las esquinas para escalar.`);
          URL.revokeObjectURL(objectURL);objectURL=null;resolve(true);
        };
        img.onerror=()=>{if(token===fileToken)note('No se pudo abrir esta imagen.',true);resolve(false);};
        img.src=objectURL;
      });
    }
    // Basic uniform-color, border-connected flood fill. Not semantic/AI segmentation.
    function simpleBackgroundRemove(source,tolerance) {
      const {width:w,height:h}=source;
      const imgctx=source.getContext('2d',{willReadFrequently:true});
      const data=imgctx.getImageData(0,0,w,h);const a=data.data;
      const cornerOffsets=[0,4*(w-1),4*(w*(h-1)),4*(w*h-1)];
      const rgb=[0,1,2].map(i=>cornerOffsets.reduce((s,o)=>s+a[o+i],0)/4);
      const cutoff=Math.pow(tolerance*3.4,2);
      const visited=new Uint8Array(w*h), queue=new Int32Array(w*h);let head=0,tail=0;
      const add=index=>{if(index<0||index>=w*h||visited[index])return;visited[index]=1;
        const k=index*4,delta=(a[k]-rgb[0])**2+(a[k+1]-rgb[1])**2+(a[k+2]-rgb[2])**2;
        if(delta<=cutoff||a[k+3]<32){queue[tail++]=index;a[k+3]=0;}};
      for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}
      for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
      while(head<tail){const n=queue[head++],x=n%w,y=(n-x)/w;
        if(x>0)add(n-1);if(x<w-1)add(n+1);if(y>0)add(n-w);if(y<h-1)add(n+w);
      }
      const out=document.createElement('canvas');out.width=w;out.height=h;
      out.getContext('2d').putImageData(data,0,0);return out;
    }
    ui.remove.addEventListener('click',()=> {
      if(!original||waiting||allow.allowBackgroundRemoval===false)return;
      markBegin();waiting=true;syncUI();note('Procesando fondo simple…');
      // Yield to paint the processing state before a potentially expensive pixel operation.
      setTimeout(()=>{
        try {
          cleaned=simpleBackgroundRemove(original,Number(ui.tolerance.value));
          state.tolerance=Number(ui.tolerance.value);state.removed=true;setArt(cleaned);
          note(contourReady
            ? 'Fondo eliminado (beta). Revisa el contorno rojo: puede necesitar retoques antes de imprimir.'
            : 'No se pudo identificar una silueta fiable. Prueba otra sensibilidad o sube un PNG transparente.', !contourReady);
        } catch(err){note('No se pudo eliminar el fondo de esta imagen.',true);}
        finally{waiting=false;markEnd();render();}
      },16);
    });
    ui.restore.addEventListener('click',()=>{
      if(!original)return;markBegin();state.removed=false;setArt(original);markEnd();render();note('Fondo original restaurado.');
    });
    function exportCanvas() {
      if(!art)return null;
      const ratio=dimensionRatio(size,shape);
      const max=1600, W=Math.round(max*ratio/Math.max(ratio,1)),H=Math.round(max/Math.max(1,ratio));
      const out=document.createElement('canvas');out.width=W;out.height=H;
      const ctx=out.getContext('2d');
      const {x,y,w,h}=dimensions(ctx,W,H,true);
      // Export is an isolated flattened preview with transparent outside the sticker.
      drawScene(ctx,W,H,{exporting:true});
      return out;
    }
    function exportBlob() {
      const out=exportCanvas();if(!out)return Promise.resolve(null);
      return new Promise((resolve,reject)=>out.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG failed')),'image/png'));
    }
    ui.download.addEventListener('click',async()=>{
      if(!art)return;
      try {const blob=await exportBlob();const url=URL.createObjectURL(blob);
        const anchor=document.createElement('a');anchor.href=url;anchor.download='impress-vista-edicion.png';
        document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
        note('Vista PNG descargada. No es un archivo de producción.');
      }catch{note('No se pudo generar el PNG.',true);}
    });
    function setOptions(next) {
      shape=next.shape||shape;finish=next.finish||finish;size=next.size||size;
      syncContourHelp();
      render();
    }
    async function prepareOrderFiles() {
      // Shopify may reject multiple file properties or larger uploads; verify on a real test order.
      if(!art){outputFile.value='';return true;}
      const blob=await exportBlob();
      if(!blob || blob.size>15*1024*1024)throw new Error('La vista editada supera el límite de esta prueba.');
      const file=new File([blob],'impress-vista-editada.png',{type:'image/png'});
      const dt=new DataTransfer();dt.items.add(file);outputFile.files=dt.files;
      if(!outputFile.files.length)throw new Error('No se pudo adjuntar la vista editada.');
      return true;
    }
    preview.observeResize(render);
    if(el('guides-label'))el('guides-label').textContent='Corte';
    syncContourHelp();syncUI();render();
    return {loadFile,setOptions,prepareOrderFiles,hasEditableImage:()=>Boolean(art),note};
  }
  window.ImpressStickerEditor={mount};
})();
