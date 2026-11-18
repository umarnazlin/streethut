import { put, get } from '@vercel/blob';

// Reads and writes the one small data file the website uses (prices, sold-out items, hours, notice).
// Works with both Private and Public Blob stores. It tries the kind set in BLOB_ACCESS first
// (default: private), then the other kind.

const FILE = 'shop-data.json';

function order() {
  return String(process.env.BLOB_ACCESS || '').toLowerCase() === 'public' ? ['public', 'private'] : ['private', 'public'];
}

// Returns the saved data object, or null if nothing has been saved yet. Throws if the store cannot be read.
export async function readShopData() {
  let lastErr = null;
  let sawEmpty = false;
  for (const access of order()) {
    try {
      const r = await get(FILE, { access });
      if (!r || r.statusCode !== 200 || !r.stream) {
        sawEmpty = true;
        continue;
      }
      return await new Response(r.stream).json();
    } catch (e) {
      lastErr = e;
    }
  }
  if (sawEmpty) return null;
  throw lastErr || new Error('Blob read failed');
}

export async function writeShopData(jsonText) {
  let lastErr = null;
  for (const access of order()) {
    try {
      await put(FILE, jsonText, {
        access,
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 60,
      });
      return;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Blob write failed');
}
