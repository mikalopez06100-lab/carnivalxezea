const { isAdminRequest } = require('../../lib/auth');
const { getInventory, saveInventory } = require('../../lib/inventory');
const { SERIES_KEYS, TOTAL_PER_MODEL } = require('../../lib/constants');

function sanitizeInventory(body) {
  const out = {};
  for (const serie of SERIES_KEYS) {
    const src = body?.[serie] || {};
    const pieces = {};
    for (const [num, status] of Object.entries(src.pieces || {})) {
      const n = parseInt(num, 10);
      if (!Number.isInteger(n) || n < 1 || n > TOTAL_PER_MODEL) continue;
      if (status === 'fake' || status === 'sold') pieces[String(n)] = status;
    }
    out[serie] = {
      onSale: src.onSale !== false,
      pieces,
      holds: {},
    };
  }
  return out;
}

module.exports = async function handler(req, res) {
  if (!isAdminRequest(req)) {
    return res.status(401).json({ error: 'Non autorisé. Connectez-vous sur /admin.' });
  }

  if (req.method === 'GET') {
    try {
      const inventory = await getInventory();
      return res.status(200).json({ inventory });
    } catch (err) {
      console.error('admin inventory GET', err);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const inventory = sanitizeInventory(req.body?.inventory || req.body);
      await saveInventory(inventory);
      return res.status(200).json({ ok: true, inventory });
    } catch (err) {
      console.error('admin inventory PUT', err);
      return res.status(500).json({ error: 'Impossible de sauvegarder.' });
    }
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'Method not allowed' });
};
