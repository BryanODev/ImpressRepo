import { getStore } from '@netlify/blobs';
import catalog from '../../jobs-table/products.json' with { type: 'json' };
import { trello, json } from './lib/trello-auth.mjs';
import { randomUUID } from 'node:crypto';

const normalize = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

function optionDefault(option) {
  if (option.default !== undefined) return option.default;
  if (option.type === 'checkbox') return false;
  if (option.type === 'checkboxGroup') return [];
  if (option.type === 'select' || option.type === 'selectWithCustom') return option.options?.[0] ?? '';
  return '';
}

function productFor(item) {
  let product = catalog.products.find(p => p.id === item.productId);
  if (product) return product;
  const name = normalize(item.product || item.productName || '');
  if (name === 'banner' || name === 'lona') return catalog.products.find(p => p.id === 'banner_lona');
  return catalog.products.find(p => normalize(p.name) === name) || null;
}

function buildRows(inputItems) {
  if (!Array.isArray(inputItems) || inputItems.length > 100) throw new Error('Invalid items');
  return inputItems.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Invalid item');
    const product = productFor(item);
    if (!product) throw new Error(`Unknown product: ${item.productId || item.product || item.productName || ''}`);
    const quantity = Number(item.quantity ?? 1);
    const cost = Number(item.cost ?? 0);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000 || !Number.isFinite(cost) || cost < 0) {
      throw new Error('Invalid quantity/cost');
    }
    const defaults = Object.fromEntries((product.options || []).map(o => [o.id, optionDefault(o)]));
    const options = item.options && typeof item.options === 'object' && !Array.isArray(item.options) ? item.options : {};
    for (const key of Object.keys(options)) {
      if (!(product.options || []).some(o => o.id === key || o.id + '__custom' === key)) {
        throw new Error(`Unknown option '${key}' for '${product.name}'`);
      }
    }
    const merged = { ...defaults, ...options };
    // Accept dimensions as an explicit-size option for products that offer 'tamano'.
    if (typeof item.size === 'string' && (product.options || []).some(o => o.id === 'tamano')) {
      merged.tamano = item.size;
    }
    return {
      id: `row-${randomUUID()}`,
      quantity,
      productId: product.id,
      productName: product.name,
      description: product.name,
      options: merged,
      cost,
      fileName: typeof item.fileName === 'string' ? item.fileName.slice(0, 250) : '',
      finished: item.finished === true,
    };
  });
}

export default async function handler(request) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const expected = process.env.ACTION_SECRET;
  if (!expected) return json({ error: 'ACTION_SECRET not configured' }, 500);
  if (request.headers.get('authorization') !== `Bearer ${expected}`) return json({ error: 'Unauthorized' }, 401);
  let input;
  try { input = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const { business, board, list, description = '', items = [] } = input ?? {};
  if (![business, board, list].every(v => typeof v === 'string' && v.trim()) ||
      typeof description !== 'string' || JSON.stringify(input).length > 180000) {
    return json({ error: 'Missing or invalid business, board, list, or description' }, 400);
  }

  let rows;
  try { rows = buildRows(items); }
  catch (error) { return json({ error: error.message }, 400); }

  try {
    const boards = await trello('/members/me/boards?filter=open&fields=name,url');
    const candidates = boards.filter(b => normalize(b.name) === normalize(board));
    if (candidates.length !== 1) return json({
      error: candidates.length ? 'Board name is ambiguous' : 'Board not found',
      availableBoards: boards.map(b => b.name),
    }, 400);
    const chosenBoard = candidates[0];
    const lists = await trello(`/boards/${chosenBoard.id}/lists?filter=open&fields=name`);
    const matchingLists = lists.filter(l => normalize(l.name) === normalize(list));
    if (matchingLists.length !== 1) return json({
      error: matchingLists.length ? 'List name is ambiguous' : 'List not found',
      availableLists: lists.map(l => l.name),
    }, 400);
    const card = await trello('/cards', 'POST', {
      name: business.trim(),
      idList: matchingLists[0].id,
      desc: description,
    });
    try {
      // Same store as the Power-Up. A newly-created card is seeded before anyone opens it.
      const store = getStore({ name: 'trello-card-items', consistency: 'strong' });
      await store.setJSON(card.id, rows, { onlyIfNew: true });
    } catch (error) {
      console.error('Card created but items could not be saved:', error);
      return json({
        error: 'Card created, but Items table failed to save',
        cardId: card.id, url: card.url,
      }, 502);
    }
    return json({
      success: true,
      board: chosenBoard.name,
      list: matchingLists[0].name,
      cardId: card.id,
      url: card.url,
      itemCount: rows.length,
      itemsSaved: true,
    });
  } catch (error) {
    console.error('create-job:', error);
    return json({ error: 'Trello API request failed' }, 502);
  }
}
