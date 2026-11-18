/* Impress Sticker Configurator v0.3 config — no extra hosting required.
 * Artwork preview initializes independently from Shopify variant validation.
 * Checkout uses ONLY a mapped, real Shopify variant ID and variant price.
 * The preview is illustrative. Original artwork is attached as a native file property.
 */
(() => {
  'use strict';

  const VALID_EXTENSIONS = /\.(svg|png|jpe?g|tiff?|pdf)$/i;
  const productConfig = () => window.ImpressProductConfigs?.stickers || null;
  const unique = array => [...new Set(array)];
  const isContourShape = shape => /contour|contorno|die.?cut/i.test(String(shape || ''));

  // Display-only format for Contour Cut. The actual Shopify size string
  // remains the <option> value for variant IDs, prices and add-on matching.
  function contourHeightLabel(size) {
    const source = String(size || '').trim();
    const match = /(?:^|\s)(\d+(?:[.,]\d+)?)\s*(?:x|×)\s*(\d+(?:[.,]\d+)?)/i.exec(source);
    if (!match) return source;
    const suffix = source.slice(match.index + match[0].length).trim();
    const units = suffix.match(/^(mm|cm|in(?:ches)?|pulg(?:adas?)?\.?|ft|pies|[\"″'])/i);
    let unit = 'in';
    if (units) {
      const raw = units[1].toLowerCase();
      unit = /^mm$|^cm$|^ft$/.test(raw) ? raw : /^pies/.test(raw) ? 'pies' : 'in';
    }
    return `${match[2].replace(',', '.')} ${unit} de alto`;
  }


  function parsePack(value) {
    // Accepts "2 x 2 in | 50", "2 × 2 in|100 pcs", "3 in • 250" and "4 in - 500".
    // A plain "2 x 2 in" is NOT a size/quantity pack; do not guess its price.
    const match = /^\s*(.+?)\s*(?:\||¦|•|—|\s-\s)\s*(\d+)\s*(?:pcs?\.?|piezas?|stickers?|unidades?)?\s*$/i
      .exec(String(value ?? ''));
    if (!match) return null;
    const size = match[1].trim();
    const pieces = Number(match[2]);
    return size && Number.isSafeInteger(pieces) && pieces > 0 ? { size, pieces } : null;
  }

  function init(root) {
    if (root.dataset.impressInitialized === 'true') return;
    const form = root.querySelector('form.impress-sticker__form');
    if (!form) return;
    const cfg=productConfig();
    if(!cfg) {
      root.querySelector('[data-impress-form-message]')?.replaceChildren(document.createTextNode('Falta impress-sticker-config.js. No se puede comprar hasta instalarlo.'));
      console.error('Impress: missing sticker configuration file.');
      return;
    }
    // The UI must never use a second option catalogue from the JS config.
    // It will show only combinations that exist as Shopify variants.
    const MAX_FILE_BYTES=Math.max(1,Number(cfg.maxArtworkMB)||20)*1024*1024;
    root.dataset.impressInitialized = 'true';
    form.enctype = 'multipart/form-data';

    const find = selector => root.querySelector(selector);
    const shapeHost = find('[data-impress-shapes]');
    const finishHost = find('[data-impress-finishes]');
    const sizeSelect = find('[data-impress-sizes]');
    const sizeLabel = find('[data-impress-size-label]');
    const sizeHelp = find('[data-impress-contour-size-help]');
    const piecesSelect = find('[data-impress-pieces]');
    const savingsBadge = find('[data-impress-savings-badge]');
    const variantIdInput = find('[data-impress-variant-id]');
    const propSize = find('[data-impress-property-size]');
    const propPieces = find('[data-impress-property-pieces]');
    const price = find('[data-impress-price]');
    const priceNote = find('[data-impress-price-note]');
    const submit = find('[data-impress-submit]');
    const message = find('[data-impress-form-message]');
    const artInput = find('[data-impress-art-input]');
    const fileLabel = find('[data-impress-file-label]');
    const fileHint = find('[data-impress-file-hint]');
    const finishPreview = find('[data-impress-preview-finish]');
    const editor = window.ImpressStickerEditor?.mount(root);
    if (!editor) console.error('Impress Editor v0.4.0 is missing; check impress-sticker-editor.js');
    const variantData = find('[data-impress-variants]');
    const sectionId = root.id.replace(/^ImpressSticker-/, '');
    // Shopify Liquid resolves these asset URLs with CDN cache-busting versions.
    const iconAssets = {
      'contour cut': root.dataset.impressIconContour,
      square: root.dataset.impressIconSquare,
      circular: root.dataset.impressIconCircular,
      rectangle: root.dataset.impressIconRectangle
    };
    const finishIconAssets = {
      gloss: root.dataset.impressIconGloss,
      mate: root.dataset.impressIconMate
    };
    const required = [shapeHost, finishHost, sizeSelect, piecesSelect, variantIdInput,
      propSize, propPieces, price, priceNote, submit, message, artInput,
      fileLabel, fileHint, finishPreview];
    if (required.some(item => !item)) {
      console.error('Impress: missing an editor element; verify matching .liquid + .js files.');
      return;
    }

    const dropzone = find('.impress-sticker__dropzone');
    // The theme scrolls .page-wrapper, not window/html. Focusing the native file
    // input can nonetheless scroll html and reveal a blank strip below the page.
    // Keep the file input for Shopify's original file-property submission;
    // this safeguard only corrects unintended *outer* scrolling.
    const correctOuterScroll = () => {
      if (window.scrollX || window.scrollY) {
        window.scrollTo({left: 0, top: 0, behavior: 'instant'});
      }
    };
    dropzone?.addEventListener('click', () => {
      if (artInput.disabled) return;
      artInput.focus({preventScroll: true});
      artInput.click();
      correctOuterScroll();
    });
    // The picker can trigger browser scrolling when it closes, after its
    // change/cancel event. Never reset the user's .page-wrapper position.
    for (const eventName of ['change', 'cancel']) {
      artInput.addEventListener(eventName, () => {
        correctOuterScroll();
        requestAnimationFrame(correctOuterScroll);
      });
    }

    // Artwork is independent from variant mapping; no pricing problem may disable editing.
    window.ImpressEditorCore?.bindEmptyUpload(root.querySelector('[data-ie-empty]'),()=>artInput);
    window.ImpressEditorCore?.bindEmptyUpload(root.querySelector('[data-ie-stage]'),()=>artInput);
    let prepared = false;
    const stickerSource = window.ImpressArtworkSource.mount({
      original:artInput,
      maxBytes:MAX_FILE_BYTES,
      onChange:()=>{prepared=false;},
      onFile:(file)=>{
        fileLabel.textContent=file?file.name:'Seleccionar archivo';
        dropzone?.classList.toggle('is-file-ready',Boolean(file));
        fileHint.textContent=file ? 'Original seleccionado. Se preparará una vista editable, conservando el archivo original.' : 'SVG, PNG, JPG, JPEG, TIF o PDF · máximo 20 MB.';
        editor?.loadFile(file||null);
      }
    });
    window.ImpressAddons?.connectArtwork(form,[stickerSource]);

    function makeChoice(host, group, value, selected, callback) {
      const label = document.createElement('label');
      label.className = 'impress-sticker__choice';
      if (group === 'shape') label.classList.add('impress-sticker__choice--shape');
      if (group === 'finish') label.classList.add('impress-sticker__choice--finish');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = `impress-${group}-${sectionId}`;
      radio.value = String(value);
      radio.checked = String(value) === String(selected);
      radio.addEventListener('change', callback);
      const box = document.createElement('span');
      if (group === 'shape' || group === 'finish') {
        const content = document.createElement('span');
        content.className = 'impress-sticker__choice-inner';
        const icon = document.createElement('span');
        icon.className = 'impress-sticker__choice-icon';
        const svgImage = document.createElement('img');
        svgImage.className = 'impress-sticker__shape-icon';
        const iconUrl = (group === 'shape' ? iconAssets : finishIconAssets)[String(value).trim().toLowerCase()];
        if(iconUrl) svgImage.src = iconUrl;
        else svgImage.hidden = true; // New Shopify values need no JS list or broken image.
        svgImage.width = 39;
        svgImage.height = 39;
        svgImage.alt = '';
        svgImage.draggable = false;
        svgImage.decoding = 'async';
        icon.append(svgImage);
        const labelText = document.createElement('span');
        labelText.className = 'impress-sticker__choice-text';
        labelText.textContent = String(value); // Product option values must never become HTML.
        content.append(icon, labelText);
        box.append(content);
      } else {
        box.textContent = String(value);
      }
      label.append(radio, box);
      host.append(label);
    }
    function renderChoices(host, group, values, current, callback) {
      host.replaceChildren();
      values.forEach(value => makeChoice(host, group, value, current, callback));
    }
    function renderSelect(select, values, current, labelForValue = value => String(value)) {
      select.replaceChildren();
      values.forEach(value => {
        const option = document.createElement('option');
        option.value = String(value);
        option.textContent = labelForValue(value);
        option.selected = String(value) === String(current);
        select.append(option);
      });
      select.disabled = values.length === 0;
    }

    function updatePreview(state) {
      root.dataset.impressShape = /circ|round|redond/i.test(state.shape || '') ? 'circular' :
        /square|cuadrad/i.test(state.shape || '') ? 'square' :
        /contour|contorno|die.?cut/i.test(state.shape || '') ? 'contour' : 'rectangle';
      root.dataset.impressFinish = /gloss|brill/i.test(state.finish || '') ? 'gloss' : 'matte';
      finishPreview.textContent = (state.finish || 'Acabado').toUpperCase();
      const contour = isContourShape(state.shape);
      const customerSize = contour ? contourHeightLabel(state.size) : (state.size || '');
      // Production sees the requested customer-facing height AND the real
      // Shopify tariff category; the variant ID is not changed.
      propSize.value = contour && state.size
        ? `${customerSize} (tarifa Shopify: ${state.size})` : (state.size || '');
      if (sizeLabel) sizeLabel.textContent = contour ? 'Altura del diseño' : 'Tamaño';
      sizeSelect.setAttribute('aria-label', contour ? 'Altura del diseño' : 'Tamaño');
      if (sizeHelp) sizeHelp.hidden = !contour;
      propPieces.value = state.pieces || '';
      editor?.setOptions(state);
    }

    let rawVariants = [];
    let parsingError = '';
    try {
      if (!variantData) throw new Error('No se encontraron variantes en el producto.');
      rawVariants = JSON.parse(variantData.textContent);
      if (!Array.isArray(rawVariants)) throw new Error('Las variantes no son una lista.');
    } catch (error) {
      parsingError = error.message;
    }

    // Shopify option NAMES are irrelevant; the central map defines the columns.
    const mapping=window.ImpressResolveOptionMapping?.('stickers',['shape','finish','pack'],3);
    const count=Number(root.dataset.variantCount);
    const catalogComplete=!root.dataset.variantCount||count===rawVariants.length;
    const validVariants = rawVariants
      .map(variant => {
        if (!mapping || !Array.isArray(variant.options) || variant.options.length !== 3) return null;
        const pack = parsePack(variant.options[mapping.pack]);
        if (!pack || !variant.options[mapping.shape] || !variant.options[mapping.finish]) return null;
        const cents = Number(variant.price);
        if (!Number.isFinite(cents) || cents < 0) return null;
        return {
          id: String(variant.id), shape: String(variant.options[mapping.shape]),
          finish: String(variant.options[mapping.finish]), ...pack,
          priceCents: cents, available: Boolean(variant.available),
          savingsPercent: Number.isInteger(Number(variant.savingsPercent)) &&
            Number(variant.savingsPercent) > 0 && Number(variant.savingsPercent) <= 100
            ? Number(variant.savingsPercent) : 0
        };
      })
      .filter(Boolean);

    const purchasable = validVariants;
    const tupleKeys=purchasable.map(v=>[v.shape,v.finish,v.size,v.pieces].join('\u0000'));
    const allValid = !parsingError && Boolean(mapping) && catalogComplete &&
      rawVariants.length > 0 && purchasable.length === rawVariants.length &&
      new Set(tupleKeys).size===tupleKeys.length &&
      purchasable.every(v=>v.id && v.id!=='undefined');

    const state = { shape: '', finish: '', size: '', pieces: 0 };
    const money = (() => {
      try {
        return new Intl.NumberFormat(document.documentElement.lang || 'es-PR', {
          style: 'currency', currency: root.dataset.currency || 'USD'
        });
      } catch {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
      }
    })();

    if (allValid) {
      const initial = purchasable.find(v => v.id === root.dataset.initialVariant) ||
        purchasable.find(v => v.available) || purchasable[0];
      Object.assign(state, { shape: initial.shape, finish: initial.finish,
        size: initial.size, pieces: initial.pieces });
      root.dataset.impressMode = 'shopify';

      renderChoices(shapeHost, 'shape', unique(purchasable.map(v => v.shape)), state.shape, event => {
        state.shape = event.currentTarget.value;
        syncShopify();
      });

      function syncShopify() {
        const shapeMatches = purchasable.filter(v => v.shape === state.shape);
        const finishes = unique(shapeMatches.map(v => v.finish));
        if (!finishes.includes(state.finish)) state.finish = finishes[0];
        renderChoices(finishHost, 'finish', finishes, state.finish, event => {
          state.finish = event.currentTarget.value;
          syncShopify();
        });
        const finishMatches = shapeMatches.filter(v => v.finish === state.finish);
        const sizes = unique(finishMatches.map(v => v.size));
        if (!sizes.includes(state.size)) state.size = sizes[0];
        renderSelect(sizeSelect, sizes, state.size, isContourShape(state.shape) ? contourHeightLabel : undefined);
        const sizeMatches = finishMatches.filter(v => v.size === state.size);
        const quantities = unique(sizeMatches.map(v => v.pieces)).sort((a, b) => a - b);
        if (!quantities.includes(state.pieces)) state.pieces = quantities[0];
        // Display only. Never change the Shopify variant, cart price or add-on price.
        renderSelect(piecesSelect, quantities, state.pieces, pieces => {
          const variant = sizeMatches.find(v => v.pieces === Number(pieces));
          return variant?.savingsPercent > 0
            ? `${pieces} · Ahorra ${variant.savingsPercent}%` : String(pieces);
        });

        const match = sizeMatches.find(v => v.pieces === state.pieces);
        if (savingsBadge) {
          const percent = match?.savingsPercent || 0;
          savingsBadge.textContent = percent > 0 ? `Ahorra ${percent}%` : '';
          savingsBadge.hidden = percent <= 0;
        }
        const ready = Boolean(match && match.available);
        variantIdInput.value = match ? match.id : '';
        price.textContent = match ? money.format(match.priceCents / 100) : '—';
        window.ImpressAddons?.setContext(form,{size:state.size,pack:state.pieces,units:1});
        window.ImpressAddons?.setBase(form,match ? match.priceCents : null);
        priceNote.textContent = match ? `${state.pieces} piezas · ${isContourShape(state.shape) ? contourHeightLabel(state.size) : state.size}` : 'No hay precio para esta combinación';
        submit.disabled = !ready;
        message.textContent = match && !ready ? 'Esta combinación está agotada.' : '';
        updatePreview(state);
      }

      sizeSelect.addEventListener('change', () => { state.size = sizeSelect.value; syncShopify(); });
      piecesSelect.addEventListener('change', () => { state.pieces = Number(piecesSelect.value); syncShopify(); });
      syncShopify();
    } else {
      // No invented demo values: keep the artwork editor but disable checkout.
      root.dataset.impressMode = 'preview';
      shapeHost.replaceChildren();finishHost.replaceChildren();
      renderSelect(sizeSelect, [], '');renderSelect(piecesSelect, [], '');
      variantIdInput.value = '';price.textContent = '—';
      if (savingsBadge) { savingsBadge.textContent = ''; savingsBadge.hidden = true; }
      window.ImpressAddons?.setBase(form,null);
      priceNote.textContent = 'Sin variantes Shopify válidas';submit.disabled = true;
      message.textContent = !mapping
        ? 'Compras deshabilitadas: revisa los índices shape, finish y pack en impress-variant-mapping.js.'
        : !catalogComplete?'Compras deshabilitadas: catálogo de variantes incompleto.'
        : 'Compras deshabilitadas: configura variantes de Shopify con Forma, Acabado y Tamaño | Cantidad (ej. 2 x 2 in | 50).';
    }

    let preparing = false;
    form.addEventListener('submit', async event => {
      if (!allValid || !variantIdInput.value || submit.disabled) {
        event.preventDefault();
        if (!allValid) message.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
      if ((window.ImpressAddons && !window.ImpressAddons.ready(form))) { event.preventDefault(); return; }
      if (!stickerSource.validate()) {
        event.preventDefault();
        return;
      }
      if (prepared) return; // The second, fully prepared native form submission.
      event.preventDefault();
      if (preparing) return;
      preparing = true;
      submit.disabled = true;
      try {
        if (editor && artInput.files?.length) await editor.prepareOrderFiles();
        prepared = true;
        submit.disabled = false;
        form.requestSubmit(submit); // Submit with original + preview using Shopify product form.
      } catch (error) {
        message.textContent = 'No se pudo preparar la vista editada: ' + (error?.message || 'Error desconocido');
        editor?.note('No se pudo preparar el archivo para Shopify.', true);
      } finally {
        preparing = false;
        if (!prepared) submit.disabled = false;
      }
    });
  }

  const initAll = (container = document) => container.querySelectorAll('[data-impress-sticker]').forEach(init);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAll(), { once: true });
  } else {
    initAll();
  }
  document.addEventListener('shopify:section:load', event => initAll(event.target));
})();
