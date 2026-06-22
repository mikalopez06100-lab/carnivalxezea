// Panier + API stock + Stripe Checkout
(function shop() {
  const PRICE = 250;
  const CART_KEY = 'ezea-cart';
  const TOTAL_PER_MODEL = 50;
  const SERIES_LABELS = { drip: 'SLIME', splash: 'SPLASH', brush: 'BRUSH', spin: 'TWISTER', drop: 'DROP' };
  const COLOR_LABELS = { cyan: 'Cyan', vert: 'Vert', jaune: 'Jaune', rose: 'Rose' };

  let STATE = null;

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
  }
  function setCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    renderCart();
  }

  window.fetchInventory = async function fetchInventory() {
    const res = await fetch('/api/inventory', { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Stock indisponible');
    STATE = data.inventory;
    if (typeof window.onInventoryLoaded === 'function') window.onInventoryLoaded();
    return STATE;
  };

  window.getShopState = () => STATE;

  window.pieceStatus = function pieceStatus(serie, n) {
    if (!STATE || !STATE[serie]) return 'free';
    return STATE[serie].pieces[String(n)] || 'free';
  };

  window.isOnSale = function isOnSale(serie) {
    return STATE?.[serie]?.onSale !== false;
  };

  window.availCount = function availCount(serie) {
    if (!STATE?.[serie]) return TOTAL_PER_MODEL;
    return TOTAL_PER_MODEL - Object.keys(STATE[serie].pieces || {}).length;
  };

  window.isPieceTaken = function isPieceTaken(serie, n) {
    const s = pieceStatus(serie, n);
    return s === 'fake' || s === 'sold' || s === 'hold';
  };

  function cartItemKey(item) {
    return item.serie + ':' + item.numero;
  }

  window.addToCart = function addToCart(item) {
    const { serie, color, numero } = item;
    if (!serie || !color || !numero) return { ok: false, error: 'Sélection incomplète.' };
    if (!isOnSale(serie)) return { ok: false, error: 'Cette série n\'est pas en vente.' };
    if (isPieceTaken(serie, numero)) return { ok: false, error: 'Ce numéro n\'est plus disponible.' };

    const cart = getCart();
    const key = cartItemKey({ serie, numero });
    if (cart.some(i => cartItemKey(i) === key)) {
      return { ok: false, error: 'Cette pièce est déjà dans le panier.' };
    }
    cart.push({ serie, color, numero: parseInt(numero, 10) });
    setCart(cart);
    return { ok: true };
  };

  window.removeFromCart = function removeFromCart(index) {
    const cart = getCart();
    cart.splice(index, 1);
    setCart(cart);
  };

  function renderCart() {
    const cart = getCart();
    const countEl = document.getElementById('cart-count');
    const listEl = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const emptyEl = document.getElementById('cart-empty');
    const footerEl = document.getElementById('cart-footer');
    if (!countEl) return;

    countEl.textContent = cart.length;
    countEl.style.display = cart.length ? 'inline-flex' : 'none';

    if (!listEl) return;
    listEl.innerHTML = '';
    if (!cart.length) {
      if (emptyEl) emptyEl.style.display = 'block';
      if (footerEl) footerEl.style.display = 'none';
      return;
    }
    if (emptyEl) emptyEl.style.display = 'none';
    if (footerEl) footerEl.style.display = 'block';

    cart.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML =
        '<div class="cart-item-info">' +
          '<strong>' + SERIES_LABELS[item.serie] + ' #' + String(item.numero).padStart(2, '0') + '</strong>' +
          '<span>' + COLOR_LABELS[item.color] + ' · Édition limitée</span>' +
        '</div>' +
        '<div class="cart-item-right">' +
          '<span class="cart-item-price">' + PRICE + '€</span>' +
          '<button type="button" class="cart-remove" aria-label="Retirer">×</button>' +
        '</div>';
      row.querySelector('.cart-remove').addEventListener('click', () => removeFromCart(idx));
      listEl.appendChild(row);
    });

    if (totalEl) totalEl.textContent = (cart.length * PRICE) + '€';
  }

  window.openCart = function openCart() {
    document.getElementById('cart-drawer')?.classList.add('open');
    document.getElementById('cart-overlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeCart = function closeCart() {
    document.getElementById('cart-drawer')?.classList.remove('open');
    document.getElementById('cart-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
  };

  function isFranceMetroPostalCode(postalCode) {
    const cp = String(postalCode || '').replace(/\s/g, '');
    if (!/^\d{5}$/.test(cp)) return false;
    const dept = parseInt(cp.slice(0, 2), 10);
    if (dept >= 1 && dept <= 95) return true;
    if (dept === 20) return true;
    return false;
  }

  function extractPostalCode(address) {
    const match = String(address || '').match(/\b(\d{5})\b/);
    return match ? match[1] : '';
  }

  async function checkout() {
    const cart = getCart();
    if (!cart.length) return;

    const name = document.getElementById('cart-name')?.value?.trim() || '';
    const email = document.getElementById('cart-email')?.value?.trim() || '';
    const phone = document.getElementById('cart-phone')?.value?.trim() || '';
    const address = document.getElementById('cart-address')?.value?.trim() || '';
    const errEl = document.getElementById('cart-error');
    const btn = document.getElementById('cart-checkout');

    if (!name) {
      if (errEl) errEl.textContent = 'Nom complet requis.';
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (errEl) errEl.textContent = 'Email invalide.';
      return;
    }
    if (!phone || phone.replace(/\D/g, '').length < 8) {
      if (errEl) errEl.textContent = 'Téléphone invalide.';
      return;
    }
    if (!address || address.length < 10) {
      if (errEl) errEl.textContent = 'Adresse de livraison requise.';
      return;
    }
    const postalCode = extractPostalCode(address);
    if (!isFranceMetroPostalCode(postalCode)) {
      if (errEl) errEl.textContent = 'Livraison France métropolitaine uniquement (code postal 01–95 ou 20).';
      return;
    }
    if (errEl) errEl.textContent = '';
    if (btn) { btn.disabled = true; btn.textContent = 'REDIRECTION…'; }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, email, name, phone, address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Paiement impossible');

      setCart([]);
      window.location.href = data.url;
    } catch (e) {
      if (errEl) errEl.textContent = e.message;
      if (btn) { btn.disabled = false; btn.textContent = 'PAYER AVEC STRIPE'; }
      await fetchInventory().catch(() => {});
      if (typeof window.renderPieceGrid === 'function') window.renderPieceGrid();
    }
  }

  function handleCheckoutReturn() {
    const params = new URLSearchParams(location.search);
    if (params.get('checkout') === 'success') {
      setCart([]);
      const banner = document.getElementById('checkout-banner');
      if (banner) {
        banner.classList.add('show');
        banner.textContent = 'Paiement confirmé — merci ! Votre commande sera expédiée à l\'adresse indiquée sous ~15 jours.';
      }
      history.replaceState({}, '', location.pathname);
    }
    if (params.get('checkout') === 'cancel') {
      const banner = document.getElementById('checkout-banner');
      if (banner) {
        banner.classList.add('show', 'warn');
        banner.textContent = 'Paiement annulé — vos pièces sont de nouveau disponibles.';
      }
      history.replaceState({}, '', location.pathname);
      fetchInventory().catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderCart();
    handleCheckoutReturn();

    document.getElementById('cart-btn')?.addEventListener('click', openCart);
    document.getElementById('cart-close')?.addEventListener('click', closeCart);
    document.getElementById('cart-overlay')?.addEventListener('click', closeCart);
    document.getElementById('cart-checkout')?.addEventListener('click', checkout);

    fetchInventory().catch(() => {
      console.warn('Stock API indisponible — mode hors-ligne');
    });

    setInterval(() => fetchInventory().catch(() => {}), 60000);
  });
})();
