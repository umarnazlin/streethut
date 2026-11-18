import { list } from '@vercel/blob';
import { send } from './_lib.js';

// Public: the website reads prices, sold-out items, hours and the notice banner from here.
// The response is cached for 30 seconds so Blob is not read on every page view.
export default async function handler(req, res) {
  try {
    const { blobs } = await list({ prefix: 'shop-data.json', limit: 1 });
    if (!blobs.length) {
      return send(res, 404, { error: 'No saved data yet' }, { 'Cache-Control': 'public, s-maxage=30' });
    }
    const r = await fetch(blobs[0].url + '?v=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('blob ' + r.status);
    const data = await r.json();
    return send(res, 200, data, { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' });
  } catch (e) {
    return send(res, 502, { error: 'Data unavailable' }, { 'Cache-Control': 'no-store' });
  }
}
