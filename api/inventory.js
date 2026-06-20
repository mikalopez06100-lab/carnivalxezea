const { getInventory } = require('../lib/inventory');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const inventory = await getInventory();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ inventory });
  } catch (err) {
    console.error('inventory GET', err);
    return res.status(500).json({ error: 'Impossible de charger le stock.' });
  }
};
