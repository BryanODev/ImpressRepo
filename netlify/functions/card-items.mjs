import { getStore } from '@netlify/blobs';
import { authorizePowerUp, trello, json } from './lib/trello-auth.mjs';

const validId = (s) => typeof s === 'string' && /^[a-f0-9]{24}$/i.test(s);
const getStoreForItems = () => getStore({name: 'trello-card-items', consistency: 'strong'});

export default async function handler(request) {
  if (request.method === 'OPTIONS') return json({}, 204);
  if (!['GET', 'PUT'].includes(request.method)) return json({ error: 'Method not allowed' }, 405);

  try {
    const jwt = await authorizePowerUp(request);
    if (!jwt) return json({ error: 'Unauthorized Power-Up session' }, 401);

    const cardId = new URL(request.url).searchParams.get('cardId');
    if (!validId(cardId)) return json({ error: 'Invalid card ID' }, 400);

    // Check that the caller is working on the card's board, and is a board member.
    const [card, members] = await Promise.all([
      trello(`/cards/${cardId}?fields=idBoard`),
      trello(`/boards/${jwt.idBoard}/members?fields=id`),
    ]);
    if (card.idBoard !== jwt.idBoard || !members.some(m => m.id === jwt.idMember)) {
      return json({ error: 'Not authorized for this board/card' }, 403);
    }

    const store = getStoreForItems();
    if (request.method === 'GET') {
      const record = await store.getWithMetadata(cardId, { type: 'json', consistency: 'strong' });
      if (!record) return json({ exists: false, items: [], version: null });
      if (!Array.isArray(record.data)) throw new Error('Invalid saved items format');
      return json({ exists: true, items: record.data, version: record.etag });
    }

    const input = await request.json();
    if (!input || !Array.isArray(input.items) || input.items.length > 200 ||
        JSON.stringify(input.items).length > 180000 ||
        !input.items.every(row => row && typeof row === 'object' && !Array.isArray(row)) ||
        !(input.version === null || typeof input.version === 'string')) {
      return json({ error: 'Invalid items or version' }, 400);
    }

    const current = await store.getMetadata(cardId, { consistency: 'strong' });
    if ((current?.etag || null) !== input.version) {
      return json({ error: 'The Items table changed. Reopen the table before saving.' }, 409);
    }
    const saved = await store.setJSON(
      cardId,
      input.items,
      input.version === null ? { onlyIfNew: true } : { onlyIfMatch: input.version },
    );
    if (!saved.modified) return json({ error: 'The Items table changed. Reopen before saving.' }, 409);
    return json({ success: true, version: saved.etag });
  } catch (error) {
    if (error?.status === 404) return json({ error: 'Card/board not found' }, 404);
    if (error instanceof SyntaxError) return json({ error: 'Invalid JSON' }, 400);
    console.error('card-items:', error);
    return json({ error: 'Unable to access the Items table' }, 502);
  }
}
