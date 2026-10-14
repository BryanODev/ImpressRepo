/* Shared storage for the Trello Power-Up. The API never exposes ACTION_SECRET. */
(function () {
    'use strict';
    const API = 'https://idyllic-axolotl-60cda8.netlify.app/.netlify/functions/card-items';
    const LEGACY_KEY = 'itemsTable';

    async function request(t, method, cardId, body) {
        const signedJwt = await t.jwt();
        if (!signedJwt) throw new Error('Please sign in to Trello to access Items.');
        const response = await fetch(API + '?cardId=' + encodeURIComponent(cardId), {
            method: method,
            headers: {
                'Authorization': 'Bearer ' + signedJwt,
                ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
            },
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
            cache: 'no-store',
        });
        const result = await response.json().catch(() => ({ error: 'Invalid response from Netlify' }));
        if (!response.ok) {
            const error = new Error(result.error || 'Could not connect to the Items backend');
            error.status = response.status;
            throw error;
        }
        return result;
    }

    async function getCardId(t) {
        const card = await t.card('id');
        if (!card?.id) throw new Error('No Trello card is open');
        return card.id;
    }

    async function load(t) {
        const cardId = await getCardId(t);
        const remote = await request(t, 'GET', cardId);
        if (remote.exists) return { items: remote.items, version: remote.version };

        // One-time migration: do not delete the existing Trello pluginData.
        const oldRows = await t.get('card', 'shared', LEGACY_KEY);
        if (Array.isArray(oldRows) && oldRows.length > 0) {
            try {
                const saved = await request(t, 'PUT', cardId, { items: oldRows, version: null });
                return { items: oldRows, version: saved.version };
            } catch (error) {
                if (error.status !== 409) throw error;
                const latest = await request(t, 'GET', cardId);
                if (latest.exists) return { items: latest.items, version: latest.version };
                throw error;
            }
        }
        return { items: [], version: null };
    }

    async function save(t, items, version) {
        const cardId = await getCardId(t);
        return request(t, 'PUT', cardId, { items, version });
    }

    window.ImpressItemsStore = Object.freeze({ load, save });
})();
