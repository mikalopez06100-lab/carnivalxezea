const Stripe = require('stripe');
const { placeHolds } = require('../lib/inventory');
const { PRICE_CENTS, SERIES_LABELS, COLOR_LABELS, TOTAL_PER_MODEL } = require('../lib/constants');

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY manquant');
  return new Stripe(key);
}

function getOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Le panier est vide.');
  }
  if (items.length > 5) {
    throw new Error('Maximum 5 pièces par commande.');
  }
  const seen = new Set();
  const normalized = [];
  for (const raw of items) {
    const serie = String(raw.serie || '').toLowerCase();
    const color = String(raw.color || '').toLowerCase();
    const numero = parseInt(raw.numero, 10);
    if (!SERIES_LABELS[serie]) throw new Error(`Série invalide : ${serie}`);
    if (!COLOR_LABELS[color]) throw new Error(`Couleur invalide : ${color}`);
    if (!Number.isInteger(numero) || numero < 1 || numero > TOTAL_PER_MODEL) {
      throw new Error(`Numéro invalide : ${numero}`);
    }
    const key = `${serie}:${numero}`;
    if (seen.has(key)) throw new Error('Doublon dans le panier.');
    seen.add(key);
    normalized.push({ serie, color, numero });
  }
  return normalized;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items, email, name, phone, address } = req.body || {};
    const normalized = validateItems(items);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email invalide.' });
    }
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Nom complet requis.' });
    }
    const phoneStr = String(phone || '').trim();
    if (!phoneStr || phoneStr.replace(/\D/g, '').length < 8) {
      return res.status(400).json({ error: 'Téléphone invalide.' });
    }
    const addressStr = String(address || '').trim();
    if (!addressStr || addressStr.length < 10) {
      return res.status(400).json({ error: 'Adresse de livraison requise.' });
    }
    const cpMatch = addressStr.match(/\b(\d{5})\b/);
    if (!cpMatch) {
      return res.status(400).json({ error: 'Code postal manquant dans l\'adresse.' });
    }
    const dept = parseInt(cpMatch[1].slice(0, 2), 10);
    const frMetro = (dept >= 1 && dept <= 95) || dept === 20;
    if (!frMetro) {
      return res.status(400).json({ error: 'Livraison France métropolitaine uniquement.' });
    }

    const stripe = getStripe();
    const origin = getOrigin(req);

    const line_items = normalized.map((item) => ({
      price_data: {
        currency: 'eur',
        unit_amount: PRICE_CENTS,
        product_data: {
          name: `Carnival × Ezéa — ${SERIES_LABELS[item.serie]} #${String(item.numero).padStart(2, '0')}`,
          description: `Couleur ${COLOR_LABELS[item.color]} · Édition limitée numérotée`,
          images: [`${origin}/assets/drip-jaune.png`],
        },
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items,
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancel`,
      metadata: {
        customer_name: name || '',
        customer_phone: phoneStr,
        shipping_address: addressStr,
        shipping_postal_code: cpMatch[1],
        shipping_method: 'france_metro_included',
        items: JSON.stringify(normalized),
      },
      payment_intent_data: {
        metadata: {
          items: JSON.stringify(normalized),
        },
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    await placeHolds(normalized, session.id);

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('checkout', err);
    const message = err.message || 'Erreur lors du paiement.';
    const status = message.includes('indisponible') || message.includes('panier') ? 400 : 500;
    return res.status(status).json({ error: message });
  }
};
