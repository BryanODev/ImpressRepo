/* Impress Artwork Quality v1 — informational effective-DPI estimate.
 * Reads ORIGINAL raster dimensions returned by ImpressArtworkPreview, never the
 * reduced canvas preview or output PNG. Does not alter original uploads, artwork,
 * Shopify variants/prices, editor transforms, or checkout behavior.
 * SVG/PDF may contain a mixture of vector and raster; neither is assigned a fake DPI.
 */
(() => {
  'use strict';
  if (window.ImpressArtworkQuality) return;
  const mounts = new WeakMap();
  const threshold = type => type === 'banners' ? {low:50,good:72} : {low:150,good:300};
  const safe = n => Number.isFinite(Number(n)) && Number(n)>0 ? Number(n) : 0;
  const raster = /\.(?:png|jpe?g|tiff?)$/i;
  const svg = /\.svg$/i;
  const pdf = /\.pdf$/i;
  const stateFor = () => ({file:null,result:null,pending:false,error:false});
  function compute({result, printWidthIn, printHeightIn, scale=1, fit=1, contour=false}) {
    const rawW=safe(result?.width),rawH=safe(result?.height);
    const viewW=safe(result?.image?.width),viewH=safe(result?.image?.height);
    const w=safe(printWidthIn),h=safe(printHeightIn),s=safe(scale),f=safe(fit);
    if(!rawW || !rawH || !viewW || !viewH || !w || !h || !s || !f)return null;
    // Contour Cut is sold by PRINTED ARTWORK HEIGHT, irrespective of its width.
    // Other products: calculate the dimensions of artwork as placed in the
    // editor, including the customer's art scale, but excluding camera zoom/pan.
    // The editor adds decorative padding (.78/.90); that is NOT a guaranteed
    // physical print margin, so do not inflate DPI using that padding.
    if(contour)return rawH/h;
    const factor=Math.min(w*f/viewW,h*f/viewH)*s;
    return Math.min(rawW/(viewW*factor),rawH/(viewH*factor));
  }
  function mount(root,type) {
    if(mounts.has(root))return mounts.get(root);
    const host=root.querySelector('[data-impress-quality]');
    if(!host)return null;
    const resolution=host.querySelector('[data-impress-quality-resolution]');
    const value=host.querySelector('[data-impress-quality-status]');
    let active='front';
    const sides={front:stateFor(),back:stateFor()};
    let placement={}, previous='';
    function refresh() {
      const entry=sides[active];
      if(!entry.file){host.hidden=true;previous='';return;}
      const name=entry.file.name||'';
      let status='unknown',info='',description='',title='';
      if(svg.test(name)){
        info='Archivo SVG';description='DPI: no aplica';
        title='Puede contener vectores e imágenes incrustadas. Verificar elementos raster antes de producir.';
      }else if(pdf.test(name)){
        info='Archivo PDF';description='DPI: por revisar';
        title='El PDF puede contener vectores y mapas de bits con resoluciones distintas. Requiere inspección.';
      }else if(entry.pending){
        info='Preparando archivo…';description='Analizando…';
      }else if(entry.error||!entry.result){
        info='Archivo original';description='DPI: no evaluado';
        title='No se pudo leer la resolución original. Revisar archivo antes de producción.';
      }else if(raster.test(name)){
        const rw=safe(entry.result.width),rh=safe(entry.result.height);
        info=rw&&rh?`Resolución · ${Math.round(rw).toLocaleString('en-US')} × ${Math.round(rh).toLocaleString('en-US')} px`:'Resolución no disponible';
        const dpi=compute({...placement,result:entry.result});
        if(dpi!==null){
          const rounded=Math.floor(dpi+1e-9),t=threshold(type);
          status=dpi<t.low?'low':dpi<t.good?'warning':'good';
          description=`${rounded.toLocaleString('en-US')} DPI · ${status==='good'?'Buena':status==='warning'?'Aceptable':'Baja'}`;
          title=`DPI efectivo estimado al tamaño de impresión seleccionado. Objetivo: ${t.good}+ DPI. No garantiza nitidez ni detecta desenfoque. El zoom de vista no influye.`;
        }else{description='DPI: tamaño no disponible';title='Selecciona un tamaño de impresión válido para evaluar el archivo.';}
      }else{
        info='Archivo original';description='DPI: por revisar';
        title='Este formato requiere revisión manual de la resolución.';
      }
      const signature=[active,name,info,description,status,title].join('|');
      if(signature===previous)return;
      previous=signature;
      host.hidden=false;
      host.dataset.quality=status;
      host.title=title;
      resolution.textContent=info;
      value.textContent=description;
    }
    const api={
      setFile(file,side='front'){
        sides[side]={file:file||null,result:null,pending:Boolean(file),error:false};
        if(side===active)refresh();
      },
      setResult(file,result,side='front'){
        if(sides[side].file!==file)return; // stale asynchronous decode
        sides[side].result=result||null;sides[side].pending=false;sides[side].error=!result;
        if(side===active)refresh();
      },
      setActive(side){active=side==='back'?'back':'front';refresh();},
      setPlacement(next){placement={...next};refresh();}
    };
    mounts.set(root,api);
    return api;
  }
  window.ImpressArtworkQuality=Object.freeze({mount,compute,threshold});
})();
