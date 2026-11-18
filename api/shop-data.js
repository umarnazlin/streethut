import { send } from './_lib.js';
import { readShopData } from './_blob.js';

// Public: the website reads prices, sold-out items, hours and the notice banner from here.
// The response is cached for 30 seconds so the store is not read on every page view.
// Add ?debug=1 to the address to see the reason when it fails.
export default async function handler(req, res) {
  try {
    const data = await readShopData();
    if (!data) {
      return send(res, 404, { error: 'No saved data yet' }, { 'Cache-Control': 'public, s-maxage=30' });
    }
    return send(res, 200, data, { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' });
  } catch (e) {
    const body = { error: 'Data unavailable' };
    if (String(req.url || '').includes('debug=1')) body.detail = String((e && e.message) || e).slice(0, 300);
    return send(res, 502, body, { 'Cache-Control': 'no-store' });
  }
}
