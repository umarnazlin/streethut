import { send, adminFrom } from './_lib.js';

// Tells the page whether the signed-in Google account is an approved admin.
export default async function handler(req, res) {
  const email = await adminFrom(req);
  if (!email) return send(res, 401, { admin: false }, { 'Cache-Control': 'no-store' });
  return send(res, 200, { admin: true, email }, { 'Cache-Control': 'no-store' });
}
