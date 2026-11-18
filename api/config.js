import { send } from './_lib.js';

// The Google client ID is public by design. It tells the sign-in button which app it belongs to.
export default function handler(req, res) {
  send(
    res,
    200,
    { clientId: process.env.GOOGLE_CLIENT_ID || null },
    { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
  );
}
