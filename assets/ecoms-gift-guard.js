/*
 * ECOMS · Gift guard — the 2 "· Regalo" curtains only ship free with the qualifying quantity of Proyector
 * Navideño in the order (Cálida needs 2+, Multicolor needs 3+). Enforced in both the Releasit cash-on-delivery
 * form and the theme's own cart/checkout, since either one can be reached without going through the gift_tiers
 * pack selector on the product page.
 */
(() => {
  if (window.EcomsGiftGuard) return;

  const MSG = 'Las cortinas de regalo vienen con el Pack Familiar (2 proyectores) o el Pack para Regalar (3). Elige un pack para recibirlas gratis.';
  const isGift = (n) => /·\s*Regalo/i.test(n);
  const need = (n) => (/Multicolor/i.test(n) ? 3 : 2);
  const isProj = (n) => /Proyector Navide/i.test(n);
  const root = () => (window.Shopify && Shopify.routes && Shopify.routes.root) || '/';

  // Releasit's cash-on-delivery form renders its own line items outside our markup, so it's read straight
  // from the DOM it builds.
  const formState = () => {
    const lines = [...document.querySelectorAll('.rsi-product-item-wrapper')].filter((l) => l.offsetParent);
    const name = (l) => (l.querySelector('.rsi-product-item-name') || {}).textContent || '';
    const qty = (l) => parseInt((l.querySelector('.rsi-quantity-input') || {}).value || (l.querySelector('.rsi-product-item-quantity') || {}).textContent || '0', 10) || 0;
    const p = lines.filter((l) => isProj(name(l))).reduce((s, l) => s + qty(l), 0);
    return { lines, bad: lines.filter((l) => isGift(name(l)) && p < need(name(l))) };
  };

  const note = (on) => {
    let n = document.getElementById('ec-gift-guard-note');
    const btn = [...document.querySelectorAll('[data-rsi-cod-button]')].find((b) => b.offsetParent && !b.closest('cart-drawer, #CartDrawer, .drawer'));
    if (on && !n && btn) {
      n = document.createElement('p');
      n.id = 'ec-gift-guard-note';
      n.setAttribute('role', 'alert');
      n.style.cssText = 'margin:10px 0;padding:10px 12px;border-radius:8px;background:#fdecea;color:#8a1c12;font:600 14px/1.4 sans-serif';
      n.textContent = MSG;
      btn.parentElement.insertBefore(n, btn);
    }
    if (!on && n) n.remove();
    document.querySelectorAll('[data-rsi-cod-button]').forEach((b) => { b.style.opacity = on ? '.45' : ''; });
  };

  let busy = false;
  const runForm = () => {
    const { lines, bad } = formState();
    if (!lines.length) { note(false); return; }
    // An unearned gift alongside real items: remove it automatically (Releasit's own remove button) instead
    // of just blocking, so the shopper isn't stuck without understanding why.
    if (bad.length && lines.length > bad.length && !busy) {
      busy = true;
      const x = bad[0].querySelector('.rsi-product-item-remove');
      if (x) x.click();
      setTimeout(() => { busy = false; runForm(); }, 1500);
      return;
    }
    note(bad.length > 0);
  };

  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-rsi-cod-button]');
    if (!b || b.closest('cart-drawer, #CartDrawer, .drawer')) return;
    if (formState().bad.length) {
      e.preventDefault();
      e.stopImmediatePropagation();
      note(true);
    }
  }, true);

  let t;
  new MutationObserver(() => {
    clearTimeout(t);
    t = setTimeout(runForm, 600);
  }).observe(document.body, { childList: true, subtree: true });

  // Theme cart/checkout: zero out any unearned gift line before the order can go through.
  let fixing = false;
  const fixCart = async () => {
    if (fixing) return;
    fixing = true;
    try {
      const cart = await fetch(root() + 'cart.js', { headers: { Accept: 'application/json' } }).then((r) => r.json());
      const p = cart.items.filter((i) => isProj(i.product_title)).reduce((s, i) => s + i.quantity, 0);
      const bad = cart.items.filter((i) => isGift(i.product_title) && p < need(i.product_title));
      if (!bad.length) return;
      const updates = {};
      bad.forEach((i) => { updates[i.key] = 0; });
      await fetch(root() + 'cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ updates }),
      });
      if (document.getElementById('main-cart-items') || document.querySelector('cart-drawer.active')) window.location.reload();
    } catch (e) {
      /* best-effort: never block the cart on a network error */
    } finally {
      fixing = false;
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') subscribe(PUB_SUB_EVENTS.cartUpdate, () => setTimeout(fixCart, 300));
  });

  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (!f || !f.matches || !f.matches('form[action*="/cart"]')) return;
    if (!e.submitter || e.submitter.name !== 'checkout') return;
    e.preventDefault();
    fixCart().then(() => { window.location.href = root() + 'checkout'; });
  }, true);

  fixCart();
  window.EcomsGiftGuard = { runForm, fixCart, formState };
})();
