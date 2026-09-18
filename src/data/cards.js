import { fallbackCards } from './fallbackCards';

export const REMOTE_CARDS_URL = 'https://raw.githubusercontent.com/RoyaleAPI/cr-api-data/master/docs/json/cards.json';

function normalize(raw) {
  const rows = Array.isArray(raw) ? raw : Object.values(raw || {});
  return rows
    .map(c => ({
      ...c,
      id: Number(c.id),
      elixir: Number(c.elixir ?? c.cost ?? 0),
      arena: Number(c.arena ?? 0),
      rarity: c.rarity || 'Common',
      type: c.type || 'Troop'
    }))
    .filter(c => c.id && c.name && Number.isFinite(c.elixir));
}

export async function loadCards() {
  try {
    const r = await fetch(REMOTE_CARDS_URL, { cache: 'no-store' });
    if (!r.ok) throw new Error('remote cards unavailable');
    const cards = normalize(await r.json());
    if (cards.length > 20) return cards;
  } catch (_) {}
  return fallbackCards;
}
