'use strict';

window.PT = {
  el(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = String(value);
    return node;
  },
  button(label, callback, kind = 'secondary') {
    const button = this.el('button', `btn btn-${kind}`, label);
    button.type = 'button';
    button.addEventListener('click', callback);
    return button;
  },
  field(label, value, callback, placeholder = '') {
    const wrapper = this.el('label', 'field');
    wrapper.append(this.el('span', 'field-label', label));
    const input = this.el('input', 'input');
    input.type = 'text';
    input.value = value || '';
    input.placeholder = placeholder;
    input.addEventListener('input', () => callback(input.value));
    wrapper.append(input);
    return wrapper;
  },
  id() {
    return (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  },
  clone(value) { return JSON.parse(JSON.stringify(value)); },
  async resize(t, target = '#app') {
    try { await t.sizeTo(target); } catch (error) { console.warn('Resize skipped:', error); }
  },
  error(root, message) {
    const existing = root.querySelector('.notice');
    if (existing) existing.remove();
    const notice = this.el('div', 'notice', message);
    root.prepend(notice);
  },
};
