const SERIES_KEYS = ['drip', 'splash', 'brush', 'spin'];
const TOTAL_PER_MODEL = 25;
const PRICE_CENTS = 25000; // 250 €
const HOLD_MINUTES = 30;

const DEFAULT_INVENTORY = {
  drip: { onSale: true, pieces: { '2': 'fake', '9': 'fake', '10': 'fake', '11': 'fake', '16': 'fake', '17': 'fake', '24': 'fake' }, holds: {} },
  splash: { onSale: true, pieces: { '3': 'fake', '4': 'fake', '7': 'fake', '9': 'fake', '13': 'fake' }, holds: {} },
  brush: { onSale: true, pieces: { '2': 'fake', '5': 'fake', '8': 'fake', '10': 'fake', '13': 'fake', '24': 'fake' }, holds: {} },
  spin: { onSale: true, pieces: { '7': 'fake', '10': 'fake', '15': 'fake', '16': 'fake', '20': 'fake', '25': 'fake' }, holds: {} },
};

const SERIES_LABELS = {
  drip: 'SLIME',
  splash: 'SPLASH',
  brush: 'BRUSH',
  spin: 'TWISTER',
};

const COLOR_LABELS = {
  cyan: 'Cyan',
  vert: 'Vert',
  jaune: 'Jaune',
  rose: 'Rose',
};

module.exports = {
  SERIES_KEYS,
  TOTAL_PER_MODEL,
  PRICE_CENTS,
  HOLD_MINUTES,
  DEFAULT_INVENTORY,
  SERIES_LABELS,
  COLOR_LABELS,
};
