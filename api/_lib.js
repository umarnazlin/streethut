// Shared helpers for the Street Hut API. Files starting with "_" are not exposed as routes by Vercel.

export function send(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

// Checks the Google sign-in token sent as "Authorization: Bearer <token>".
// Returns the admin's email when the token is genuine, made for this site, and the
// email is on the ADMIN_EMAILS list. Returns null otherwise.
export async function adminFrom(req) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token || token.length > 4000) return null;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const admins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!clientId || admins.length === 0) return null;

  let info;
  try {
    const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token));
    if (!r.ok) return null;
    info = await r.json();
  } catch (e) {
    return null;
  }

  const issuerOk = info.iss === 'accounts.google.com' || info.iss === 'https://accounts.google.com';
  const verified = info.email_verified === true || info.email_verified === 'true';
  const notExpired = Number(info.exp) * 1000 > Date.now();
  const email = String(info.email || '').toLowerCase();

  if (info.aud !== clientId || !issuerOk || !verified || !notExpired || !email) return null;
  return admins.includes(email) ? email : null;
}

// Accepts only the shape the website uses and trims everything else away.
export function sanitize(body) {
  if (!body || typeof body !== 'object') return null;
  const out = { prices: {}, soldOut: [], hours: {}, notice: {} };

  const prices = body.prices && typeof body.prices === 'object' ? Object.entries(body.prices) : [];
  if (prices.length > 300) return null;
  for (const [key, value] of prices) {
    const n = Number(value);
    if (!/^[a-z0-9-]{1,60}\|\d{1,2}$/.test(key)) return null;
    if (!Number.isFinite(n) || n <= 0 || n > 10000000) return null;
    out.prices[key] = Math.round(n);
  }

  const sold = Array.isArray(body.soldOut) ? body.soldOut : [];
  if (sold.length > 300) return null;
  for (const id of sold) {
    if (typeof id !== 'string' || !/^[a-z0-9-]{1,60}$/.test(id)) return null;
    if (!out.soldOut.includes(id)) out.soldOut.push(id);
  }

  for (const group of ['hours', 'notice']) {
    const src = body[group] && typeof body[group] === 'object' ? body[group] : {};
    for (const lang of ['en', 'si', 'ta']) {
      out[group][lang] = String(src[lang] == null ? '' : src[lang]).trim().slice(0, 200);
    }
  }
  return out;
}
