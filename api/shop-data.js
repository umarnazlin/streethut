import { send } from './_lib.js';
import { readShopData } from './_blob.js';

// Public: the website reads prices, sold-out items, hours and the notice banner from here.
// The response is cached for 30 seconds so the store is not read on every page view.
export default async function handler(req, res) {
  try {
    const data = await readShopData();
    if (!data) {
      return send(res, 404, { error: 'No saved data yet' }, { 'Cache-Control': 'public, s-maxage=30' });
    }
    return send(res, 200, data, { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' });
  } catch (e) {
    return send(res, 502, { error: 'Data unavailable' }, { 'Cache-Control': 'no-store' });
  }
}
