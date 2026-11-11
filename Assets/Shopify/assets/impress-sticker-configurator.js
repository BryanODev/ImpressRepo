/* Impress Sticker Configurator v0.3 config — no extra hosting required.
 * Artwork preview initializes independently from Shopify variant validation.
 * Checkout uses ONLY a mapped, real Shopify variant ID and variant price.
 * The preview is illustrative. Original artwork is attached as a native file property.
 */
(() => {
  'use strict';

  const VALID_EXTENSIONS = /\.(png|jpe?g|webp|pdf)$/i;
  const productConfig = () => window.ImpressProductConfigs?.stickers || null;
  const unique = array => [...new Set(array)];


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
    const shapes=Array.isArray(cfg.shapes)?cfg.shapes:[];
    const finishes=Array.isArray(cfg.finishes)?cfg.finishes:[];
    const quantities=Array.isArray(cfg.quantities)?cfg.quantities.filter(v=>Number.isSafeInteger(v)&&v>0):[];
    const allowedSize=(shape,size)=>Array.isArray(cfg.sizesByShape?.[shape]) && cfg.sizesByShape[shape].includes(size);
    const firstShape=shapes[0]||'';
    const sizesFor=shape=>cfg.sizesByShape?.[shape]||[];
    const MAX_FILE_BYTES=Math.max(1,Number(cfg.maxArtworkMB)||20)*1024*1024;
    root.dataset.impressInitialized = 'true';
    form.enctype = 'multipart/form-data';

    const find = selector => root.querySelector(selector);
    const shapeHost = find('[data-impress-shapes]');
    const finishHost = find('[data-impress-finishes]');
    const sizeSelect = find('[data-impress-sizes]');
    const piecesSelect = find('[data-impress-pieces]');
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

    // Artwork is independent from variant mapping; no pricing problem may disable editing.
    artInput.addEventListener('change', () => {
      const file = artInput.files?.[0];
      fileLabel.textContent = file ? file.name : 'Seleccionar archivo';
      dropzone?.classList.remove('is-file-ready');
      if (!file) {
        artInput.setCustomValidity('');
        fileHint.textContent = 'Selecciona un archivo para adjuntarlo al pedido.';
        editor?.loadFile(null);
        return;
      }
      if (!VALID_EXTENSIONS.test(file.name)) {
        artInput.setCustomValidity('Usa PNG, JPG, WEBP o PDF.');
        fileHint.textContent = 'Formato no admitido. Usa PNG, JPG, WEBP o PDF.';
        editor?.loadFile(null);
        artInput.reportValidity();
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        artInput.setCustomValidity('El archivo supera 20 MB (límite de esta prueba).');
        fileHint.textContent = 'Archivo demasiado grande para esta prueba (20 MB máx.).';
        editor?.loadFile(null);
        artInput.reportValidity();
        return;
      }
      artInput.setCustomValidity('');
      dropzone?.classList.add('is-file-ready');
      fileHint.textContent = /\.pdf$/i.test(file.name)
        ? 'PDF adjunto sin editor visual. Se enviará el PDF original.'
        : 'Arte original conservado. La edición se adjunta como vista de referencia.';
      editor?.loadFile(file);
    });

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
        svgImage.src = (group === 'shape' ? iconAssets : finishIconAssets)[String(value).trim().toLowerCase()] || '';
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
    function renderSelect(select, values, current) {
      select.replaceChildren();
      values.forEach(value => {
        const option = document.createElement('option');
        option.value = String(value);
        option.textContent = String(value);
        option.selected = String(value) === String(current);
        select.append(option);
      });
      select.disabled = values.length === 0;
    }

    function updatePreview(state) {
      root.dataset.impressShape = /circ|round|redond/i.test(state.shape || '') ? 'circular' :
        /square|cuadrad/i.test(state.shape || '') ? 'square' :
        /rect/i.test(state.shape || '') ? 'rectangle' : 'contour';
      root.dataset.impressFinish = /gloss|brill/i.test(state.finish || '') ? 'gloss' : 'matte';
      finishPreview.textContent = (state.finish || 'Acabado').toUpperCase();
      propSize.value = state.size || '';
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

    // No option/price guesses: all 4 visible controls map to a real Shopify variant.
    const validVariants = rawVariants
      .map(variant => {
        if (!Array.isArray(variant.options) || variant.options.length !== 3) return null;
        const pack = parsePack(variant.options[2]);
        if (!pack || !variant.options[0] || !variant.options[1]) return null;
        const cents = Number(variant.price);
        if (!Number.isFinite(cents) || cents < 0) return null;
        return {
          id: String(variant.id), shape: String(variant.options[0]),
          finish: String(variant.options[1]), ...pack,
          priceCents: cents, available: Boolean(variant.available)
        };
      })
      .filter(Boolean);

    // Catalog allow-list: hide disabled choices, but NEVER invent a Shopify price.
    const purchasable = validVariants.filter(v => shapes.includes(v.shape) && finishes.includes(v.finish) &&
      allowedSize(v.shape,v.size) && quantities.includes(v.pieces));
    const allValid = !parsingError && rawVariants.length > 0 && purchasable.length > 0 &&
      shapes.length > 0 && finishes.length > 0 && quantities.length > 0 &&
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
        renderSelect(sizeSelect, sizes, state.size);
        const sizeMatches = finishMatches.filter(v => v.size === state.size);
        const quantities = unique(sizeMatches.map(v => v.pieces)).sort((a, b) => a - b);
        if (!quantities.includes(state.pieces)) state.pieces = quantities[0];
        renderSelect(piecesSelect, quantities, state.pieces);

        const match = sizeMatches.find(v => v.pieces === state.pieces);
        const ready = Boolean(match && match.available);
        variantIdInput.value = match ? match.id : '';
        price.textContent = match ? money.format(match.priceCents / 100) : '—';
        priceNote.textContent = match ? `${state.pieces} piezas · ${state.size}` : 'No hay precio para esta combinación';
        submit.disabled = !ready;
        message.textContent = match && !ready ? 'Esta combinación está agotada.' : '';
        updatePreview(state);
      }

      sizeSelect.addEventListener('change', () => { state.size = sizeSelect.value; syncShopify(); });
      piecesSelect.addEventListener('change', () => { state.pieces = Number(piecesSelect.value); syncShopify(); });
      syncShopify();
    } else {
      // Preview/demo mode: NEVER submit a guessed price or mismatched variant.
      root.dataset.impressMode = 'preview';
      Object.assign(state, { shape: firstShape, finish: finishes[0]||'',
        size: sizesFor(firstShape)[0]||'', pieces: quantities[0]||0 });
      const syncDemo = () => {
        const sizes = sizesFor(state.shape);
        if (!sizes.includes(state.size)) state.size = sizes[0];
        renderSelect(sizeSelect, sizes, state.size);
        updatePreview(state);
        variantIdInput.value = '';
        price.textContent = '—';
        priceNote.textContent = 'Vista previa · Precio no configurado';
        submit.disabled = true;
      };
      renderChoices(shapeHost, 'shape', shapes, state.shape, event => {
        state.shape = event.currentTarget.value; syncDemo();
      });
      renderChoices(finishHost, 'finish', finishes, state.finish, event => {
        state.finish = event.currentTarget.value; syncDemo();
      });
      renderSelect(piecesSelect, quantities, state.pieces);
      sizeSelect.addEventListener('change', () => { state.size = sizeSelect.value; syncDemo(); });
      piecesSelect.addEventListener('change', () => { state.pieces = Number(piecesSelect.value); syncDemo(); });
      syncDemo();

      const current = rawVariants[0]?.options?.join(' / ') || '(sin variantes válidas)';
      const reason = parsingError ? `${parsingError}. ` : '';
      message.textContent = 'MODO VISTA PREVIA — ' + reason +
        'Para habilitar el precio y el carrito, configura las variantes de Shopify como ' +
        'Forma y Acabado permitidos en el archivo de configuración, con Tamaño | Cantidad real en Shopify. ' +
        'Ejemplo: “Contour Cut / Gloss / 2 x 2 in | 50”. ' +
        'Primera variante encontrada: “' + current + '”.';
    }

    let prepared = false;
    let preparing = false;
    form.addEventListener('submit', async event => {
      if (!allValid || !variantIdInput.value || submit.disabled) {
        event.preventDefault();
        if (!allValid) message.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
      if (!artInput.files?.length || !artInput.checkValidity()) {
        event.preventDefault();
        artInput.reportValidity();
        return;
      }
      if (prepared) return; // The second, fully prepared native form submission.
      event.preventDefault();
      if (preparing) return;
      preparing = true;
      submit.disabled = true;
      try {
        if (editor) await editor.prepareOrderFiles();
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
