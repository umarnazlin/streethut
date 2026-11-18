import { send, adminFrom, sanitize } from './_lib.js';
import { writeShopData } from './_blob.js';

// Admin only: saves prices, sold-out items, hours and the notice banner to Vercel Blob.
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' }, { Allow: 'POST' });

  const email = await adminFrom(req);
  if (!email) return send(res, 401, { error: 'Not allowed' }, { 'Cache-Control': 'no-store' });

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return send(res, 400, { error: 'Invalid JSON' });
    }
  }
  const clean = sanitize(body);
  if (!clean) return send(res, 400, { error: 'Invalid data' });

  try {
    await writeShopData(JSON.stringify(clean));
  } catch (e) {
    const why = String((e && e.message) || e).slice(0, 160);
    return send(res, 500, { error: 'Storage error: ' + why });
  }
  return send(res, 200, { ok: true }, { 'Cache-Control': 'no-store' });
}
