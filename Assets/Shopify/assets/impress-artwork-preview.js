/* ImpressArtworkPreview — shared original-to-canvas preview for all Impress editors.
 * SVG/PNG/JPEG use the browser. TIFF and PDF are rendered on the customer's
 * device using lazily loaded, pinned client-side decoders (no separate API).
 * Originals are never converted or modified in the Shopify file properties.
 * PDF/TIFF multi-page files: the FIRST page is the editable visual reference.
 */
(() => {
  'use strict';
  if (window.ImpressArtworkPreview) return;
  const MAX_SIDE = 2000, MAX_PIXELS=16_000_000;
  const extensions=/\.(svg|png|jpe?g|tiff?|pdf)$/i;
  const cache=new Map();
  const cdns={
    pdf:[
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js'
    ],
    tiff:[
      'https://cdn.jsdelivr.net/npm/utif@3.1.0/UTIF.min.js',
      'https://unpkg.com/utif@3.1.0/UTIF.min.js'
    ]
  };
  const worker='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  function script(src){return new Promise((resolve,reject)=>{
    const tag=document.createElement('script');tag.src=src;tag.async=true;
    const timer=setTimeout(()=>{tag.remove();reject(new Error('El decodificador no respondió.'));},10000);
    tag.onload=()=>{clearTimeout(timer);resolve();};
    tag.onerror=()=>{clearTimeout(timer);tag.remove();reject(new Error('No se pudo cargar el decodificador.'));};
    document.head.append(tag);
  });}
  async function library(name, globalName){
    if(window[globalName])return window[globalName];
    if(!cache.has(name))cache.set(name,(async()=>{
      for(const src of cdns[name]){
        try{await script(src);if(window[globalName])return window[globalName];}catch(_){/* try mirror */}
      }
      throw new Error('No se pudo abrir este formato en el navegador. Revisa tu conexión o sube un PNG/JPG.');
    })());
    try{return await cache.get(name);}catch(e){cache.delete(name);throw e;}
  }
  function blank(w,h){
    if(!Number.isFinite(w)||!Number.isFinite(h)||w<1||h<1||w*h>MAX_PIXELS)
      throw new Error('El documento es demasiado grande para mostrarlo en esta vista.');
    const canvas=document.createElement('canvas');canvas.width=Math.round(w);canvas.height=Math.round(h);return canvas;
  }
  async function image(file,maxSide){
    let url=URL.createObjectURL(file);
    try{
      const img=await new Promise((resolve,reject)=>{
        const el=new Image();el.onload=()=>resolve(el);el.onerror=()=>reject(new Error('No se pudo interpretar la imagen.'));el.src=url;
      });
      const factor=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
      const out=blank(Math.max(1,Math.round(img.naturalWidth*factor)),Math.max(1,Math.round(img.naturalHeight*factor)));
      out.getContext('2d',{willReadFrequently:true}).drawImage(img,0,0,out.width,out.height);
      return {image:out,width:img.naturalWidth,height:img.naturalHeight,notice:'Imagen cargada. El archivo original se conserva.'};
    }finally{URL.revokeObjectURL(url);}
  }
  async function svg(file,maxSide){
    const raw=await file.text();
    if(raw.length>8_000_000)throw new Error('SVG demasiado complejo para la vista previa.');
    const parsed=new DOMParser().parseFromString(raw,'image/svg+xml');
    if(parsed.querySelector('parsererror')||parsed.documentElement.localName!=='svg')
      throw new Error('El archivo SVG no es válido.');
    const forbidden=new Set(['script','foreignObject','iframe','object','embed','audio','video','animate','animateTransform','animateMotion','set']);
    const nodes=[parsed.documentElement,...parsed.documentElement.querySelectorAll('*')];
    for(const node of nodes){
      if(forbidden.has(node.localName)){node.remove();continue;}
      for(const attr of [...node.attributes]){
        const value=attr.value.trim();const key=attr.localName.toLowerCase();
        if(key.startsWith('on')||(key==='style'&&(/@import|url\s*\(/i).test(value))||
          ((key==='href'||key==='src')&&!(/^(#|data:image\/(?:png|jpeg|gif|webp);base64,)/i).test(value))||
          (/url\s*\(\s*['"]?\s*(?:https?:|\/\/|data:)/i).test(value))node.removeAttributeNode(attr);
      }
    }
    // SVG can be infinitely scalable, but browser <img> otherwise defaults to a
    // tiny 300x150 intrinsic viewport. Give the WORKING copy ample resolution.
    const root=parsed.documentElement;
    const viewBox=(root.getAttribute('viewBox')||'').split(/[\s,]+/).map(Number);
    const naturalValue=value=>{const n=Number.parseFloat(value||'');return Number.isFinite(n)&&n>0?n:null;};
    const vw=viewBox.length===4&&viewBox[2]>0?viewBox[2]:null;
    const vh=viewBox.length===4&&viewBox[3]>0?viewBox[3]:null;
    const sw=naturalValue(root.getAttribute('width'))||vw||1;
    const sh=naturalValue(root.getAttribute('height'))||vh||1;
    const ratio=sw/sh;
    if(!Number.isFinite(ratio)||ratio<0.02||ratio>50)
      throw new Error('El SVG tiene proporciones que no se pueden mostrar.');
    const width=Math.max(1,Math.round(maxSide*Math.min(1,ratio)));
    const height=Math.max(1,Math.round(maxSide/Math.max(1,ratio)));
    root.setAttribute('width',String(width));root.setAttribute('height',String(height));
    const clean=new XMLSerializer().serializeToString(root);
    return {...await image(new Blob([clean],{type:'image/svg+xml'}),maxSide),notice:'SVG cargado para editar. Se conserva el SVG original.'};
  }
  async function tiff(file,maxSide){
    const UTIF=await library('tiff','UTIF');
    const buf=await file.arrayBuffer();
    const pages=UTIF.decode(buf);
    if(!pages.length)throw new Error('El TIFF no contiene una imagen legible.');
    const frame=pages[0];
    const w=frame.width||frame.t256?.[0],h=frame.height||frame.t257?.[0];
    if(!w||!h||w*h>MAX_PIXELS)throw new Error('El TIFF supera la capacidad de vista previa del navegador.');
    UTIF.decodeImage(buf,frame);
    const data=UTIF.toRGBA8(frame);
    const tmp=blank(w,h);
    tmp.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data),w,h),0,0);
    const ratio=Math.min(1,maxSide/Math.max(w,h));
    if(ratio===1)return {image:tmp,width:w,height:h,notice:pages.length>1?'Vista de la primera página TIFF; se conserva el archivo completo.':'TIFF cargado para editar; se conserva el original.'};
    const out=blank(Math.max(1,Math.round(w*ratio)),Math.max(1,Math.round(h*ratio)));
    out.getContext('2d').drawImage(tmp,0,0,out.width,out.height);
    return {image:out,width:w,height:h,notice:pages.length>1?'Vista de la primera página TIFF; se conserva el archivo completo.':'TIFF cargado para editar; se conserva el original.'};
  }
  async function pdf(file,maxSide){
    const pdfjs=await library('pdf','pdfjsLib');
    pdfjs.GlobalWorkerOptions.workerSrc=worker;
    const bytes=new Uint8Array(await file.arrayBuffer());
    let doc=null;
    try{
      doc=await pdfjs.getDocument({data:bytes,isEvalSupported:false}).promise;
      const page=await doc.getPage(1);const original=page.getViewport({scale:1});
      const ratio=Math.min(2,maxSide/Math.max(original.width,original.height));
      const viewport=page.getViewport({scale:ratio});
      const W=Math.max(1,Math.round(viewport.width)),H=Math.max(1,Math.round(viewport.height));
      const out=blank(W,H);const ctx=out.getContext('2d');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
      await page.render({canvasContext:ctx,viewport}).promise;
      return {image:out,width:W,height:H,notice:doc.numPages>1?'Se muestra la primera página del PDF. El PDF completo se adjunta al pedido.':'PDF cargado para editar como vista. El original se conserva.'};
    }finally{try{await doc?.destroy();}catch(_){/*cleanup*/}}
  }
  async function render(file,options={}){
    if(!file||!extensions.test(file.name))throw new Error('Formatos permitidos: SVG, PNG, JPG, JPEG, TIF y PDF.');
    const maxSide=Math.max(300,Math.min(MAX_SIDE,Number(options.maxDimension)||1600));
    const ext=file.name.toLowerCase().split('.').pop();
    if(ext==='svg')return svg(file,maxSide);
    if(ext==='tif'||ext==='tiff')return tiff(file,maxSide);
    if(ext==='pdf')return pdf(file,maxSide);
    return image(file,maxSide);
  }
  window.ImpressArtworkPreview=Object.freeze({render});
})();
