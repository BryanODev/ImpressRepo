/* IM Stickers Hero: accessible, Shopify-editor-safe carousel. */
(() => {
  'use strict';
  if (window.__imStickersHeroLoaded) return;
  window.__imStickersHeroLoaded = true;

  const mounted = new WeakMap();
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  const inEditor = Boolean(window.Shopify && window.Shopify.designMode);

  function init(root) {
    if (!root || mounted.has(root)) return;
    const slides = Array.from(root.querySelectorAll('[data-ims-slide]'));
    if (!slides.length) return;
    const dots = Array.from(root.querySelectorAll('[data-ims-dot]'));
    const counter = root.querySelector('[data-ims-counter]');
    const announcement = root.querySelector('[data-ims-announcement]');
    const prev = root.querySelector('[data-ims-prev]');
    const next = root.querySelector('[data-ims-next]');
    const viewport = root.querySelector('[data-ims-viewport]');
    const interval = Math.max(3000, Number(root.dataset.interval) || 6000);
    const autoplay = root.dataset.autoplay === 'true' && slides.length > 1 && !inEditor && !(reduceMotion && reduceMotion.matches);
    let active = 0;
    let timer = null;
    let hovered = false;
    let focused = false;
    let visible = true;
    let editorSelected = false;
    let touchX = null;
    let touchY = null;
    let observer = null;

    function stop() {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    }
    function canPlay() {
      return autoplay && !document.hidden && visible && !hovered && !focused && !editorSelected;
    }
    function resume() {
      stop();
      if (canPlay()) timer = window.setInterval(() => goTo(active + 1, false), interval);
    }
    function goTo(index, announce) {
      const target = ((index % slides.length) + slides.length) % slides.length;
      active = target;
      slides.forEach((slide, i) => {
        const selected = i === target;
        slide.classList.toggle('is-active', selected);
        slide.setAttribute('aria-hidden', String(!selected));
        if (selected) slide.removeAttribute('inert');
        else slide.setAttribute('inert', '');
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === target);
        dot.setAttribute('aria-current', String(i === target));
      });
      if (counter) counter.textContent = String(target + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
      if (announcement && announce) announcement.textContent = 'Diapositiva ' + (target + 1) + ' de ' + slides.length;
    }
    function manual(index) {
      goTo(index, true);
      resume();
    }
    if (prev) prev.addEventListener('click', () => manual(active - 1));
    if (next) next.addEventListener('click', () => manual(active + 1));
    dots.forEach((dot, i) => dot.addEventListener('click', () => manual(i)));

    if (root.dataset.pauseHover === 'true' || root.dataset.pauseHover === undefined) {
      root.addEventListener('mouseenter', () => { hovered = true; stop(); });
      root.addEventListener('mouseleave', () => { hovered = false; resume(); });
    }
    root.addEventListener('focusin', () => { focused = true; stop(); });
    root.addEventListener('focusout', event => {
      if (!root.contains(event.relatedTarget)) { focused = false; resume(); }
    });
    root.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); manual(active + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); manual(active - 1); }
    });

    if (viewport) {
      viewport.addEventListener('touchstart', event => {
        if (event.touches.length !== 1) return;
        touchX = event.touches[0].clientX;
        touchY = event.touches[0].clientY;
      }, { passive: true });
      viewport.addEventListener('touchend', event => {
        if (touchX === null || !event.changedTouches.length) return;
        const dx = event.changedTouches[0].clientX - touchX;
        const dy = event.changedTouches[0].clientY - touchY;
        touchX = null;
        touchY = null;
        if (Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy) * 1.25) manual(active + (dx < 0 ? 1 : -1));
      }, { passive: true });
      viewport.addEventListener('touchcancel', () => { touchX = null; touchY = null; }, { passive: true });
    }
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        visible = Boolean(entries[0] && entries[0].isIntersecting);
        resume();
      }, { threshold: 0.12 });
      observer.observe(root);
    }
    const onVisibility = () => resume();
    document.addEventListener('visibilitychange', onVisibility);
    goTo(0, false);
    resume();
    mounted.set(root, {
      selectBlock(id) {
        const idx = slides.findIndex(s => s.dataset.blockId === id);
        if (idx !== -1) { editorSelected = true; stop(); goTo(idx, false); }
      },
      deselectBlock() { editorSelected = false; resume(); },
      destroy() { stop(); if (observer) observer.disconnect(); document.removeEventListener('visibilitychange', onVisibility); }
    });
  }

  function initAll(scope) {
    if (scope.matches && scope.matches('[data-imstickers-hero]')) init(scope);
    scope.querySelectorAll && scope.querySelectorAll('[data-imstickers-hero]').forEach(init);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initAll(document), { once: true });
  else initAll(document);

  document.addEventListener('shopify:section:load', event => initAll(event.target));
  document.addEventListener('shopify:section:unload', event => {
    const section = event.target.querySelector('[data-imstickers-hero]');
    if (section && mounted.has(section)) { mounted.get(section).destroy(); mounted.delete(section); }
  });
  document.addEventListener('shopify:block:select', event => {
    const section = event.target.closest('[data-imstickers-hero]');
    if (section && mounted.has(section)) mounted.get(section).selectBlock(event.detail && event.detail.blockId);
  });
  document.addEventListener('shopify:block:deselect', event => {
    const section = event.target.closest('[data-imstickers-hero]');
    if (section && mounted.has(section)) mounted.get(section).deselectBlock();
  });
})();
