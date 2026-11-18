// Reads and writes the one small data file the website uses (prices, sold-out items, hours, notice).
// Works with both Private and Public Blob stores. It tries the kind set in BLOB_ACCESS first
// (default: private), then the other kind.
// The Blob library is loaded inside the functions, so a missing or outdated library shows up as a
// readable error message instead of crashing the whole function.

const FILE = 'shop-data.json';

function order() {
  return String(process.env.BLOB_ACCESS || '').toLowerCase() === 'public' ? ['public', 'private'] : ['private', 'public'];
}

async function sdk() {
  return await import('@vercel/blob');
}

// Returns the saved data object, or null if nothing has been saved yet. Throws if the store cannot be read.
export async function readShopData() {
  const blob = await sdk();
  let lastErr = null;
  let sawEmpty = false;
  for (const access of order()) {
    try {
      if (typeof blob.get === 'function') {
        const r = await blob.get(FILE, { access });
        if (!r || r.statusCode !== 200 || !r.stream) {
          sawEmpty = true;
          continue;
        }
        return await new Response(r.stream).json();
      }
      // Older library without get(): can only read Public stores.
      if (access !== 'public') {
        throw new Error('The installed @vercel/blob is too old for a Private store. Set "@vercel/blob": "latest" in package.json and redeploy.');
      }
      const { blobs } = await blob.list({ prefix: FILE, limit: 1 });
      if (!blobs.length) {
        sawEmpty = true;
        continue;
      }
      const r = await fetch(blobs[0].url + '?v=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) throw new Error('blob ' + r.status);
      return await r.json();
    } catch (e) {
      lastErr = e;
    }
  }
  if (sawEmpty) return null;
  throw lastErr || new Error('Blob read failed');
}

export async function writeShopData(jsonText) {
  const blob = await sdk();
  let lastErr = null;
  for (const access of order()) {
    try {
      await blob.put(FILE, jsonText, {
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
