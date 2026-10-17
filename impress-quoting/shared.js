'use strict';
window.IQ = (() => {
  const DEFAULT_SETTINGS = {
    business: '', phone: '', address: '',
    documentTitle: 'Customer Order',
    footer: 'Please keep this copy for your records.',
    taxRate: 0, currency: 'USD'
  };
  const EMPTY_QUOTE = { version: 1, customer: '', items: [], paidCents: 0, notes: '', taxRate: null, updatedAt: null };
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function normalizeQuote(raw) {
    const q = raw && typeof raw === 'object' ? raw : {};
    const items = Array.isArray(q.items) ? q.items.slice(0, 40).map(x => ({
      id: String(x.id || ''),
      name: String(x.name || '').slice(0, 160),
      qty: (Number.isFinite(Number(x.qty)) && Number(x.qty) > 0) ? Number(x.qty) : 1,
      cents: x.cents === null || x.cents === undefined || x.cents === '' ? null : Math.max(0, Math.round(Number(x.cents) || 0))
    })) : [];
    return {
      ...EMPTY_QUOTE,
      customer: String(q.customer || '').slice(0,160),
      items,
      paidCents: Math.max(0,Math.round(Number(q.paidCents) || 0)),
      taxRate: q.taxRate == null ? null : Math.min(100,Math.max(0,Number(q.taxRate)||0)),
      notes: String(q.notes || '').slice(0,700),
      updatedAt: q.updatedAt || null
    };
  }
  function normalizeSettings(raw) {
    const s = raw && typeof raw === 'object' ? raw : {};
    return {...DEFAULT_SETTINGS, ...s, taxRate: Math.min(100,Math.max(0,Number(s.taxRate)||0)), currency:'USD'};
  }
  function centsFromText(text) {
    if (String(text).trim() === '') return null;
    const n = Number(text);
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
  }
  function dollars(cents) { return (Number(cents || 0) / 100).toFixed(2); }
  function money(cents, settings) { return new Intl.NumberFormat('en-US',{style:'currency',currency:settings.currency||'USD'}).format((cents||0)/100); }
  function totals(quote, settings) {
    const unpriced = quote.items.filter(i => i.cents === null).length;
    const subtotal = quote.items.reduce((acc,item) => acc + (item.cents===null ? 0 : Math.round(item.cents * item.qty)), 0);
    const tax = Math.round(subtotal * settings.taxRate / 100);
    const total = subtotal + tax;
    return { unpriced, priced:quote.items.length-unpriced, subtotal, tax, total, due:Math.max(0,total-quote.paidCents), overpaid:Math.max(0,quote.paidCents-total) };
  }
  function theme(t) {
    const set = (v) => { document.documentElement.dataset.theme = v === 'dark' ? 'dark' : 'light'; };
    const context = t.getContext() || {};
    set(context.theme || context.initialTheme || 'light');
    if (typeof t.subscribeToThemeChanges === 'function') t.subscribeToThemeChanges(set);
  }
  const uid = () => 'i' + (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
  const getJobReference = (card) => {
    const match = String(card?.name || '').match(/^\s*#\s*([a-z0-9-]+)/i);
    return match ? '#'+match[1] : (card?.shortLink ? '#'+card.shortLink : '');
  };
  return {DEFAULT_SETTINGS, EMPTY_QUOTE, escapeHTML, normalizeQuote, normalizeSettings, centsFromText, dollars, money, totals, theme, uid, getJobReference};
})();
