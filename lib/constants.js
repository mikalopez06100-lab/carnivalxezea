const SERIES_KEYS = ['drip', 'splash', 'brush', 'spin', 'drop'];
const TOTAL_PER_MODEL = 50;
const PRICE_CENTS = 25000; // 250 €
const HOLD_MINUTES = 30;

const DEFAULT_INVENTORY = {
  drip: { onSale: true, pieces: { '4': 'fake', '18': 'fake', '20': 'fake', '22': 'fake', '32': 'fake', '34': 'fake', '41': 'fake', '48': 'fake' }, holds: {} },
  splash: { onSale: true, pieces: { '6': 'fake', '8': 'fake', '14': 'fake', '18': 'fake', '26': 'fake', '33': 'fake' }, holds: {} },
  brush: { onSale: true, pieces: { '4': 'fake', '10': 'fake', '16': 'fake', '20': 'fake', '26': 'fake', '38': 'fake', '48': 'fake' }, holds: {} },
  spin: { onSale: true, pieces: { '14': 'fake', '20': 'fake', '30': 'fake', '32': 'fake', '40': 'fake', '50': 'fake' }, holds: {} },
  drop: { onSale: true, pieces: { '5': 'fake', '12': 'fake', '23': 'fake', '31': 'fake', '38': 'fake', '45': 'fake' }, holds: {} },
};

const SERIES_LABELS = {
  drip: 'SLIME',
  splash: 'SPLASH',
  brush: 'BRUSH',
  spin: 'TWISTER',
  drop: 'DROP',
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
