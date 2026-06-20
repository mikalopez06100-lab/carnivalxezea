const fs = require('fs');
const path = require('path');
const { kv } = require('@vercel/kv');
const { DEFAULT_INVENTORY, HOLD_MINUTES } = require('./constants');

const KV_KEY = 'ezea:inventory';
const FILE_PATH = path.join(process.cwd(), 'data', 'inventory.json');

function hasKv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function normalizeInventory(raw) {
  const base = JSON.parse(JSON.stringify(DEFAULT_INVENTORY));
  if (!raw || typeof raw !== 'object') return base;
  for (const serie of Object.keys(base)) {
    if (!raw[serie]) continue;
    base[serie].onSale = raw[serie].onSale !== false;
    base[serie].pieces = { ...(raw[serie].pieces || {}) };
    base[serie].holds = { ...(raw[serie].holds || {}) };
  }
  return base;
}

async function readFileInventory() {
  try {
    if (!fs.existsSync(FILE_PATH)) return null;
    return JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
  } catch {
    return null;
  }
}

async function writeFileInventory(data) {
  fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

async function getInventory() {
  let data = null;
  if (hasKv()) {
    data = await kv.get(KV_KEY);
    if (!data) {
      data = normalizeInventory(await readFileInventory());
      await kv.set(KV_KEY, data);
    }
  } else {
    data = await readFileInventory();
  }
  return cleanupExpiredHolds(normalizeInventory(data));
}

async function saveInventory(data) {
  const normalized = normalizeInventory(data);
  if (hasKv()) {
    await kv.set(KV_KEY, normalized);
    return normalized;
  }
  try {
    await writeFileInventory(normalized);
  } catch {
    throw new Error('Stockage persistant non configuré. Liez Vercel KV / Upstash Redis au projet.');
  }
  return normalized;
}

function isHoldExpired(hold) {
  return !hold || !hold.expires || Date.now() > hold.expires;
}

function cleanupExpiredHolds(inventory) {
  let changed = false;
  for (const serie of Object.keys(inventory)) {
    const model = inventory[serie];
    if (!model.holds) model.holds = {};
    for (const [num, hold] of Object.entries(model.holds)) {
      if (isHoldExpired(hold)) {
        delete model.holds[num];
        if (model.pieces[num] === 'hold') delete model.pieces[num];
        changed = true;
      }
    }
  }
  return changed ? inventory : inventory;
}

function pieceIsAvailable(model, numero) {
  const key = String(numero);
  const status = model.pieces[key];
  if (status === 'sold' || status === 'fake') return false;
  if (status === 'hold') {
    const hold = model.holds?.[key];
    if (!isHoldExpired(hold)) return false;
  }
  return true;
}

async function placeHolds(items, sessionId) {
  const inventory = await getInventory();
  const expires = Date.now() + HOLD_MINUTES * 60 * 1000;

  for (const item of items) {
    const model = inventory[item.serie];
    if (!model || model.onSale === false) {
      throw new Error(`La série ${item.serie} n'est pas en vente.`);
    }
    if (!pieceIsAvailable(model, item.numero)) {
      throw new Error(`Pièce n°${item.numero} (${item.serie}) indisponible.`);
    }
  }

  for (const item of items) {
    const key = String(item.numero);
    inventory[item.serie].pieces[key] = 'hold';
    inventory[item.serie].holds[key] = { sessionId, expires };
  }

  await saveInventory(inventory);
  return inventory;
}

async function releaseHoldsBySession(sessionId) {
  const inventory = await getInventory();
  let changed = false;
  for (const serie of Object.keys(inventory)) {
    const model = inventory[serie];
    for (const [num, hold] of Object.entries(model.holds || {})) {
      if (hold.sessionId === sessionId) {
        delete model.holds[num];
        if (model.pieces[num] === 'hold') delete model.pieces[num];
        changed = true;
      }
    }
  }
  if (changed) await saveInventory(inventory);
  return inventory;
}

async function markItemsSold(items) {
  const inventory = await getInventory();
  for (const item of items) {
    const key = String(item.numero);
    inventory[item.serie].pieces[key] = 'sold';
    if (inventory[item.serie].holds?.[key]) delete inventory[item.serie].holds[key];
  }
  await saveInventory(inventory);
  return inventory;
}

module.exports = {
  getInventory,
  saveInventory,
  placeHolds,
  releaseHoldsBySession,
  markItemsSold,
  pieceIsAvailable,
  cleanupExpiredHolds,
};
