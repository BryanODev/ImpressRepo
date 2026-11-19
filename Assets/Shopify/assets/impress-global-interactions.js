/* IMPRESS | Sitewide storefront image interaction guards
 * Native drag and right-click 'Save image as' are suppressed for <img>.
 * This is a convenience/deterrent, NOT copy protection: site images
 * remain accessible to browsers, screenshots and developer tools.
 * Do not intercept pointer, click, wheel, or canvas events used by editors.
 */
(() => {
  /* Distinguish real keyboard navigation from a phone tap. The theme's focus
   * outlines remain available when a keyboard is used for navigation. */
  const root = document.documentElement;
  const keyboardNavKeys = new Set([
    'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Home', 'End', 'PageUp', 'PageDown'
  ]);

  document.addEventListener('keydown', (event) => {
    if (keyboardNavKeys.has(event.key)) {
      root.classList.add('impress-keyboard-navigation');
    }
  }, true);

  const useTouchOrPointer = () => root.classList.remove('impress-keyboard-navigation');
  document.addEventListener('pointerdown', useTouchOrPointer, { capture: true, passive: true });
  document.addEventListener('touchstart', useTouchOrPointer, { capture: true, passive: true });

  const isImage = (target) => target instanceof Element && Boolean(target.closest('img'));

  document.addEventListener('dragstart', (event) => {
    if (isImage(event.target)) event.preventDefault();
  }, true);

  document.addEventListener('contextmenu', (event) => {
    if (isImage(event.target)) event.preventDefault();
  }, true);
})();
