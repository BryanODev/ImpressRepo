/* ImpressArtworkSource — local file submissions only.
 * One original file is attached to the Shopify product form per printed side.
 * Never substitute the preview for the customer's full-resolution original.
 */
(() => {
  'use strict';
  if (window.ImpressArtworkSource) return;
  const EXTENSIONS = /\.(svg|png|jpe?g|tiff?|pdf)$/i;
  const LIMIT = 20 * 1024 * 1024;
  function mount({original, onFile=()=>{}, onChange=()=>{}, maxBytes=LIMIT}) {
    if (!(original instanceof HTMLInputElement) || original.type !== 'file')
      throw new Error('Impress: original artwork file input missing');
    let active = !original.disabled;
    let mustProvide = true;
    const formatMessage = 'Formatos: SVG, PNG, JPG, JPEG, TIF, TIFF o PDF.';
    const maximum = Math.min(LIMIT, Math.max(1, Number(maxBytes) || LIMIT));
    original.setAttribute('accept', '.svg,.png,.jpg,.jpeg,.tif,.tiff,.pdf');
    const validate = (report=true) => {
      original.setCustomValidity('');
      if (!active) return true;
      const file = original.files && original.files[0];
      if (!file && mustProvide) original.setCustomValidity('Selecciona el archivo original para continuar.');
      else if (!EXTENSIONS.test(file.name)) original.setCustomValidity(formatMessage);
      else if (!file.size) original.setCustomValidity('Este archivo está vacío. Selecciona otro.');
      else if (file.size > maximum) original.setCustomValidity('El archivo supera el máximo de 20 MB. Reduce su tamaño antes de subirlo.');
      const okay=original.checkValidity();
      if (report && !okay) original.reportValidity();
      return okay;
    };
    function handleChange(){
      const okay=validate(true);
      onFile(okay ? original.files?.[0] || null : null);
      onChange();
    }
    original.addEventListener('change', handleChange);
    const setActive=(value)=>{
      active=Boolean(value);
      original.disabled=!active;
      original.required=active && mustProvide;
      if(!active)original.setCustomValidity('');
    };
    setActive(active);
    return {
      validate, ready:()=>active ? validate(false) : true,
      setActive,
      setRequired(value){mustProvide=Boolean(value);original.required=active && mustProvide;original.setCustomValidity('');},
      original
    };
  }
  window.ImpressArtworkSource=Object.freeze({mount});
})();
