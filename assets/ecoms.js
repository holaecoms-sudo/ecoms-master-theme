/*
 * ECOMS MASTER · storefront behaviour layered on top of Dawn.
 * It never replaces Dawn's product form, cart or checkout: it sets the real quantity input,
 * submits Dawn's own form and re-renders Dawn's cart drawer through the Section Rendering API.
 */
(() => {
  if (window.Ecoms) return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const currency = () => (window.Shopify && Shopify.currency && Shopify.currency.active) || 'CLP';
  const money = (cents) => {
    const iso = currency();
    const zeroDecimals = ['CLP', 'JPY', 'KRW', 'PYG', 'ISK', 'VND'].includes(iso);
    try {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: iso,
        minimumFractionDigits: zeroDecimals ? 0 : 2,
        maximumFractionDigits: zeroDecimals ? 0 : 2,
      }).format(cents / 100);
    } catch (e) {
      return `$${Math.round(cents / 100)}`;
    }
  };

  // Dawn declares PUB_SUB_EVENTS with const in constants.js: global lexical scope, not window.
  const events = () => (typeof PUB_SUB_EVENTS !== 'undefined' ? PUB_SUB_EVENTS : null);

  const track = (name, payload) => {
    try {
      window.Shopify?.analytics?.publish?.(name, payload);
    } catch (e) {
      /* analytics must never break the purchase flow */
    }
  };

  /* ---------- Main product helpers ---------- */
  const mainInfo = () => $('product-info[id^="MainProduct-"]');
  const mainSectionId = () => mainInfo()?.dataset.section;
  const mainForm = () => {
    const id = mainSectionId();
    return id ? document.getElementById(`product-form-${id}`) : null;
  };

  function qtyInput() {
    const id = mainSectionId();
    if (!id) return null;
    let input = document.getElementById(`Quantity-${id}`);
    if (input) return input;
    // No quantity block in the template: keep a hidden field inside Dawn's form.
    const form = mainForm();
    if (!form) return null;
    input = form.querySelector('input[name="quantity"]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'quantity';
      input.value = '1';
      input.dataset.ecHidden = 'true';
      form.appendChild(input);
    }
    return input;
  }

  const currentQty = () => Math.max(1, parseInt(qtyInput()?.value, 10) || 1);

  function setQty(q) {
    const input = qtyInput();
    if (!input) return;
    const min = Number(input.min) || 1;
    const max = input.max ? Number(input.max) : Infinity;
    const step = Number(input.step) || 1;
    let next = Math.min(max, Math.max(min, q));
    next = min + Math.round((next - min) / step) * step;
    input.value = String(next);
    input.dispatchEvent(new Event('change', { bubbles: true }));
    sync();
  }

  /* ---------- Packs & totals ---------- */
  function tiersOf(packs) {
    try {
      return JSON.parse(packs.dataset.tiers || '[]').sort((a, b) => a.q - b.q);
    } catch (e) {
      return [{ q: 1, pct: 0 }];
    }
  }

  // Mirrors Shopify's automatic discounts with a minimum quantity: the best tier reached applies.
  function totalFor(packs, qty) {
    const unit = Number(packs.dataset.unit) || 0;
    let pct = 0;
    tiersOf(packs).forEach((t) => {
      if (qty >= t.q) pct = t.pct;
    });
    const subtotal = unit * qty;
    const discount = Math.round((subtotal * pct) / 10000) * 100;
    return subtotal - discount;
  }

  function sync() {
    const qty = currentQty();
    const packs = $('[data-ec-packs]');
    $$('[data-ec-packs] input[type="radio"]').forEach((r) => {
      r.checked = Number(r.value) === qty;
    });
    if (!packs) return;
    const total = totalFor(packs, qty);

    const sticky = $('[data-ec-sticky-price]');
    if (sticky) sticky.textContent = money(total);

    const id = mainSectionId();
    const button = id && document.getElementById(`ProductSubmitButton-${id}`);
    if (!button) return;
    let label = button.querySelector('[data-ec-cta-total]');
    if (!packs.hasAttribute('data-cta-total') || button.disabled) {
      label?.remove();
      return;
    }
    if (!label) {
      label = document.createElement('span');
      label.className = 'ec-cta-total';
      label.dataset.ecCtaTotal = '';
      const text = button.querySelector('span');
      text ? text.after(label) : button.appendChild(label);
    }
    label.textContent = ` - ${money(total)}`;
  }

  document.addEventListener('change', (event) => {
    const radio = event.target.closest('[data-ec-packs] input[type="radio"]');
    if (radio) {
      setQty(Number(radio.value));
      track('ecoms_pack_selected', { quantity: Number(radio.value), discount_pct: Number(radio.dataset.pct) || 0 });
      return;
    }
    if (event.target === qtyInput()) sync();
  });

  /* ---------- Re-render ECOMS fragments when the variant changes ---------- */
  async function refreshSection(el, variantId) {
    const url = new URL(window.location.href);
    url.searchParams.set('variant', variantId);
    url.searchParams.set('section_id', el.dataset.ecRefreshSection);
    try {
      const html = await (await fetch(url)).text();
      const fresh = new DOMParser().parseFromString(html, 'text/html').getElementById(el.id);
      if (fresh && el.isConnected) el.replaceWith(fresh);
    } catch (e) {
      /* keep the previous prices; the cart is always the source of truth */
    }
  }

  function onVariantChange({ data }) {
    if (!data || data.sectionId !== mainSectionId()) return;
    const jobs = $$('[data-ec-refresh][id]').map((el) => {
      const fresh = data.html?.getElementById(el.id);
      if (fresh) {
        el.replaceWith(document.importNode(fresh, true));
        return null;
      }
      if (el.dataset.ecRefreshSection && data.variant) return refreshSection(el, data.variant.id);
      return null;
    });
    Promise.all(jobs).then(() => {
      sync();
      initCountdowns();
      initSticky();
    });
  }

  /* ---------- Countdown (real end date only) ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  let countdownTimer;
  function initCountdowns() {
    const nodes = $$('[data-ec-countdown]');
    if (!nodes.length) return;
    const tick = () => {
      const now = Date.now() / 1000;
      $$('[data-ec-countdown]').forEach((el) => {
        const left = Math.floor(Number(el.dataset.ecCountdown) - now);
        if (!Number.isFinite(left) || left <= 0) {
          el.hidden = true;
          return;
        }
        const d = Math.floor(left / 86400);
        const h = Math.floor((left % 86400) / 3600);
        const m = Math.floor((left % 3600) / 60);
        const s = left % 60;
        const hasDays = !!el.querySelector('[data-u="d"]');
        const values = { d, h: hasDays ? h : h + d * 24, m, s };
        el.querySelectorAll('[data-u]').forEach((b) => {
          b.textContent = pad(values[b.dataset.u]);
        });
        el.querySelectorAll('[data-ec-cd-inline]').forEach((b) => {
          b.textContent = `${pad(h + d * 24)}:${pad(m)}:${pad(s)}`;
        });
      });
    };
    tick();
    clearInterval(countdownTimer);
    countdownTimer = setInterval(tick, 1000);
  }

  /* ---------- Sticky add to cart ---------- */
  let stickyObserver;
  function initSticky() {
    const sticky = $('[data-ec-sticky]');
    const id = mainSectionId();
    const target = id && document.getElementById(`ProductSubmitButton-${id}`);
    stickyObserver?.disconnect();
    if (!sticky || !target) return;
    const setVisible = (on) => {
      sticky.classList.toggle('is-on', on);
      sticky.inert = !on;
      sticky.setAttribute('aria-hidden', String(!on));
      document.body.classList.toggle('ec-sticky-on', on);
    };
    stickyObserver = new IntersectionObserver(([entry]) => {
      setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    stickyObserver.observe(target);
  }

  /* ---------- Buy now: add the current selection, then go to Shopify checkout ---------- */
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-ec-buy-now]');
    if (!button) return;
    const form = document.getElementById(button.dataset.form);
    if (!form) return;
    event.preventDefault();
    button.setAttribute('aria-busy', 'true');
    button.disabled = true;
    const body = new FormData(form);
    if (!body.get('quantity')) body.set('quantity', String(currentQty()));
    try {
      const response = await fetch(`${window.routes?.cart_add_url || '/cart/add'}.js`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body,
      });
      const json = await response.json();
      if (!response.ok || json.status) throw new Error(json.description || json.message || 'Error');
      track('ecoms_buy_now', { variant_id: Number(body.get('id')), quantity: Number(body.get('quantity')) });
      window.location.href = `${window.Shopify?.routes?.root || '/'}checkout`;
    } catch (error) {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      const productForm = form.closest('product-form');
      if (productForm?.handleErrorMessage) productForm.handleErrorMessage(error.message);
    }
  });

  /* ---------- Add extra products (cross-sell, upsell, cart drawer) ---------- */
  async function addVariant(variantId, quantity = 1, source = 'cross_sell') {
    const drawer = $('cart-drawer');
    const payload = { items: [{ id: Number(variantId), quantity }] };
    if (drawer) {
      payload.sections = drawer.getSectionsToRender().map((s) => s.id);
      payload.sections_url = window.location.pathname;
    }
    const response = await fetch(`${window.routes?.cart_add_url || '/cart/add'}.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    if (!response.ok || json.status) throw new Error(json.description || json.message || 'Error');
    track('ecoms_upsell_added', { variant_id: Number(variantId), quantity, source });
    if (drawer && json.sections) {
      drawer.classList.remove('is-empty');
      drawer.renderContents(json);
      if (typeof publish === 'function' && events()) {
        publish(events().cartUpdate, { source: 'ecoms', cartData: json });
      }
    } else {
      window.location.href = window.routes?.cart_url || '/cart';
    }
  }

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-ec-add-variant]');
    if (!button) return;
    event.preventDefault();
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    try {
      await addVariant(button.dataset.ecAddVariant, 1, button.dataset.ecSource || 'cross_sell');
    } catch (error) {
      const note = button.parentElement.querySelector('[data-ec-add-error]');
      if (note) {
        note.textContent = error.message;
        note.hidden = false;
      }
    } finally {
      if (button.isConnected) {
        button.disabled = false;
        button.removeAttribute('aria-busy');
      }
    }
  });

  /* ---------- Boot ---------- */
  function init() {
    initCountdowns();
    initSticky();
    sync();
  }

  function boot() {
    init();
    if (typeof subscribe === 'function' && events()) {
      subscribe(events().variantChange, onVariantChange);
    }
    document.addEventListener('shopify:section:load', init);
  }

  window.Ecoms = { money, setQty, addVariant, sync };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
