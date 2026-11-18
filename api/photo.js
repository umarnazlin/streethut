import { send, adminFrom } from './_lib.js';
import { readPhoto, writePhoto } from './_blob.js';

// GET  /api/photo?id=<item-id>  public: returns the saved photo (JPEG).
// POST /api/photo?id=<item-id>  admin only: body {"image":"data:image/jpeg;base64,..."} saves the photo.
export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x');
  const id = url.searchParams.get('id') || '';
  if (!/^[a-z0-9-]{1,60}$/.test(id)) return send(res, 400, { error: 'Bad id' });

  if (req.method === 'GET') {
    try {
      const buf = await readPhoto(id);
      if (!buf) return send(res, 404, { error: 'No photo' }, { 'Cache-Control': 'public, s-maxage=30' });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      return res.end(buf);
    } catch (e) {
      return send(res, 502, { error: 'Photo unavailable' }, { 'Cache-Control': 'no-store' });
    }
  }

  if (req.method !== 'POST') return send(res, 405, { error: 'GET or POST only' }, { Allow: 'GET, POST' });

  const email = await adminFrom(req);
  if (!email) return send(res, 401, { error: 'Not allowed' }, { 'Cache-Control': 'no-store' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { return send(res, 400, { error: 'Invalid JSON' }); }
  }
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec((body && body.image) || '');
  if (!m) return send(res, 400, { error: 'Send a JPEG photo' });
  const buf = Buffer.from(m[1], 'base64');
  if (buf.length < 500 || buf.length > 1500000 || buf[0] !== 0xff || buf[1] !== 0xd8) return send(res, 400, { error: 'Photo is not a valid JPEG under 1.5 MB' });

  try {
    await writePhoto(id, buf);
  } catch (e) {
    return send(res, 500, { error: 'Storage error: ' + String((e && e.message) || e).slice(0, 160) });
  }
  return send(res, 200, { ok: true }, { 'Cache-Control': 'no-store' });
}
