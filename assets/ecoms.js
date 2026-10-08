/*
 * ECOMS MASTER · storefront behaviour.
 * - ECOMS product hero (sections/ecoms-product): variants, gallery, quantity, packs, add to cart.
 * - Dawn main-product (legacy templates): packs + totals on Dawn's own form.
 * Cart and checkout stay native: AJAX Cart API + Dawn's cart drawer, Shopify checkout.
 */
(() => {
  if (window.Ecoms) return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  // Dawn declares PUB_SUB_EVENTS with const in constants.js: global lexical scope, not window.
  const events = () => (typeof PUB_SUB_EVENTS !== 'undefined' ? PUB_SUB_EVENTS : null);

  const money = (cents) => {
    const iso = (window.Shopify && Shopify.currency && Shopify.currency.active) || 'CLP';
    const zero = ['CLP', 'JPY', 'KRW', 'PYG', 'ISK', 'VND'].includes(iso);
    try {
      return new Intl.NumberFormat('es-CL', { style: 'currency', currency: iso, minimumFractionDigits: zero ? 0 : 2, maximumFractionDigits: zero ? 0 : 2 }).format(cents / 100);
    } catch (e) {
      return `$${Math.round(cents / 100)}`;
    }
  };

  const track = (name, payload) => {
    try {
      window.Shopify?.analytics?.publish?.(name, payload);
    } catch (e) {
      /* analytics must never break the purchase flow */
    }
  };

  const cartAddUrl = () => `${window.routes?.cart_add_url || '/cart/add'}.js`;

  /* ---------- Which product form drives the page ---------- */
  const ecForm = () => $('[data-ec-form]');
  const dawnInfo = () => $('product-info[id^="MainProduct-"]');
  const mainForm = () => {
    const ec = ecForm();
    if (ec) return ec;
    const id = dawnInfo()?.dataset.section;
    return id ? document.getElementById(`product-form-${id}`) : null;
  };

  function qtyInput() {
    const ec = ecForm();
    if (ec) return ec.querySelector('[data-ec-qty-input]');
    const id = dawnInfo()?.dataset.section;
    if (!id) return null;
    let input = document.getElementById(`Quantity-${id}`);
    if (input) return input;
    const form = mainForm();
    if (!form) return null;
    input = form.querySelector('input[name="quantity"]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'quantity';
      input.value = '1';
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

  // Mirrors Shopify automatic discounts with a minimum quantity: the best tier reached applies.
  function totalFor(unit, qty, packs) {
    let pct = 0;
    if (packs) tiersOf(packs).forEach((t) => { if (qty >= t.q) pct = t.pct; });
    const subtotal = unit * qty;
    return subtotal - Math.round((subtotal * pct) / 10000) * 100;
  }

  let currentUnit = null;
  function unitPrice() {
    if (currentUnit != null) return currentUnit;
    const packs = $('[data-ec-packs]');
    if (packs) return Number(packs.dataset.unit) || 0;
    const v = currentVariant();
    return v ? v.price : 0;
  }

  function sync() {
    const qty = currentQty();
    const packs = $('[data-ec-packs]');
    $$('[data-ec-packs] input[type="radio"]').forEach((r) => { r.checked = Number(r.value) === qty; });
    const total = totalFor(unitPrice(), qty, packs);
    $$('[data-ec-cta-total]').forEach((el) => { el.textContent = money(total); });
    $$('[data-ec-sticky-price]').forEach((el) => { el.textContent = money(total); });

    // Dawn main-product: append the total to Dawn's own submit button.
    if (ecForm() || !packs) return;
    const id = dawnInfo()?.dataset.section;
    const button = id && document.getElementById(`ProductSubmitButton-${id}`);
    if (!button) return;
    let label = button.querySelector('.ec-cta-total');
    if (!packs.hasAttribute('data-cta-total') || button.disabled) { label?.remove(); return; }
    if (!label) {
      label = document.createElement('span');
      label.className = 'ec-cta-total';
      const text = button.querySelector('span');
      text ? text.after(label) : button.appendChild(label);
    }
    label.textContent = ` - ${money(total)}`;
  }

  /* ---------- ECOMS product: variants ---------- */
  let productJson = null;
  function product() {
    if (productJson) return productJson;
    try {
      productJson = JSON.parse($('[data-ec-product-json]')?.textContent || 'null');
    } catch (e) {
      productJson = null;
    }
    return productJson;
  }
  function currentVariant() {
    const p = product();
    const id = Number(ecForm()?.querySelector('[data-ec-variant-input]')?.value);
    return p?.variants.find((v) => v.id === id) || null;
  }

  function selectedOptions(root) {
    return $$('[data-ec-option]', root).map((fs) => fs.querySelector('input:checked')?.value);
  }

  async function onOptionChange(root) {
    const p = product();
    if (!p) return;
    const opts = selectedOptions(root);
    $$('[data-ec-option]', root).forEach((fs, i) => {
      const label = fs.querySelector('[data-ec-option-label]');
      if (label) label.textContent = opts[i] || '';
    });
    const variant = p.variants.find((v) => v.options.every((o, i) => o === opts[i]));
    const input = ecForm()?.querySelector('[data-ec-variant-input]');
    const addButtons = $$('[data-ec-add]');
    if (!variant) {
      addButtons.forEach((b) => { b.disabled = true; });
      return;
    }
    if (input) input.value = variant.id;
    currentUnit = variant.price;
    const url = new URL(window.location.href);
    url.searchParams.set('variant', variant.id);
    window.history.replaceState({}, '', url);
    if (variant.featured_media) goToMedia(variant.featured_media.id);
    sync();
    await refreshFor(variant.id, root.closest('[data-ec-product]'));
    currentUnit = null;
    sync();
  }

  // Re-render server-side fragments (price, buttons, packs) for the selected variant.
  async function refreshFor(variantId, hero) {
    const jobs = [];
    const sectionIds = new Set();
    if (hero) sectionIds.add(hero.dataset.sectionId);
    $$('[data-ec-refresh-section]').forEach((el) => sectionIds.add(el.dataset.ecRefreshSection));
    sectionIds.forEach((sectionId) => {
      const url = new URL(window.location.href);
      url.searchParams.set('variant', variantId);
      url.searchParams.set('section_id', sectionId);
      jobs.push(
        fetch(url)
          .then((r) => r.text())
          .then((html) => {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            $$('[data-ec-refresh][id]').forEach((el) => {
              const fresh = doc.getElementById(el.id);
              if (fresh) el.replaceWith(document.importNode(fresh, true));
            });
          })
          .catch(() => {})
      );
    });
    await Promise.all(jobs);
    initCountdowns();
    initSticky();
  }

  /* ---------- Gallery ---------- */
  function galleryOf(el) { return el.closest('[data-ec-gal]'); }
  function galIndex(gal) {
    const track = $('[data-ec-gal-track]', gal);
    return Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
  }
  function syncGal(gal, i) {
    const n = $('[data-ec-gal-track]', gal).children.length;
    $$('[data-ec-gal-to]', gal).forEach((t, j) => t.setAttribute('aria-current', String(i === j)));
    const count = $('[data-ec-gal-count]', gal);
    if (count) count.textContent = `${i + 1} / ${n}`;
  }
  function goGal(gal, i) {
    const track = $('[data-ec-gal-track]', gal);
    const n = track.children.length;
    i = ((i % n) + n) % n;
    track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
    syncGal(gal, i);
    $$('video', track).forEach((v) => v.pause());
  }
  function goToMedia(mediaId) {
    const slide = $(`[data-ec-gal] [data-media-id="${mediaId}"]`);
    if (!slide) return;
    const gal = galleryOf(slide);
    goGal(gal, Array.from(slide.parentElement.children).indexOf(slide));
  }
  function initGalleries(root = document) {
    $$('[data-ec-gal]:not([data-ready])', root).forEach((gal) => {
      gal.dataset.ready = 'true';
      const track = $('[data-ec-gal-track]', gal);
      let raf = 0;
      track.addEventListener('scroll', () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => syncGal(gal, galIndex(gal)));
      }, { passive: true });
      track.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') goGal(gal, galIndex(gal) + 1);
        if (e.key === 'ArrowLeft') goGal(gal, galIndex(gal) - 1);
      });
    });
  }

  /* ---------- Countdown (real end date only) ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  let countdownTimer;
  function initCountdowns() {
    if (!$$('[data-ec-countdown]').length) return;
    const tick = () => {
      const now = Date.now() / 1000;
      $$('[data-ec-countdown]').forEach((el) => {
        const left = Math.floor(Number(el.dataset.ecCountdown) - now);
        if (!Number.isFinite(left) || left <= 0) { el.hidden = true; return; }
        const d = Math.floor(left / 86400);
        const h = Math.floor((left % 86400) / 3600);
        const m = Math.floor((left % 3600) / 60);
        const s = left % 60;
        const hasDays = !!el.querySelector('[data-u="d"]');
        const values = { d, h: hasDays ? h : h + d * 24, m, s };
        el.querySelectorAll('[data-u]').forEach((b) => { b.textContent = pad(values[b.dataset.u]); });
        el.querySelectorAll('[data-ec-cd-inline]').forEach((b) => { b.textContent = `${pad(h + d * 24)}:${pad(m)}:${pad(s)}`; });
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
    stickyObserver?.disconnect();
    if (!sticky) return;
    const ec = ecForm();
    const id = dawnInfo()?.dataset.section;
    const target = ec ? ec.querySelector('[data-ec-add]') : id && document.getElementById(`ProductSubmitButton-${id}`);
    if (!target) return;
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

  /* ---------- Cart ---------- */
  async function postCart(body, isJson) {
    const response = await fetch(cartAddUrl(), {
      method: 'POST',
      headers: isJson ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body,
    });
    const json = await response.json();
    if (!response.ok || json.status) throw new Error(json.description || json.message || 'No se pudo agregar al carrito');
    return json;
  }

  function showDrawer(json) {
    const drawer = $('cart-drawer');
    if (drawer && json.sections) {
      drawer.classList.remove('is-empty');
      drawer.renderContents(json);
      if (typeof publish === 'function' && events()) publish(events().cartUpdate, { source: 'ecoms', cartData: json });
      return true;
    }
    return false;
  }

  function drawerSections() {
    const drawer = $('cart-drawer');
    return drawer ? drawer.getSectionsToRender().map((s) => s.id) : [];
  }

  async function addVariant(variantId, quantity = 1, source = 'cross_sell') {
    const payload = { items: [{ id: Number(variantId), quantity }] };
    const sections = drawerSections();
    if (sections.length) {
      payload.sections = sections;
      payload.sections_url = window.location.pathname;
    }
    const json = await postCart(JSON.stringify(payload), true);
    track('ecoms_upsell_added', { variant_id: Number(variantId), quantity, source });
    if (!showDrawer(json)) window.location.href = window.routes?.cart_url || '/cart';
  }

  async function submitEcForm(form, submitter) {
    const error = form.querySelector('[data-ec-form-error]');
    const buttons = $$('[data-ec-add]');
    buttons.forEach((b) => b.setAttribute('aria-busy', 'true'));
    if (error) error.hidden = true;
    const body = new FormData(form);
    const sections = drawerSections();
    if (sections.length) {
      body.append('sections', sections.join(','));
      body.append('sections_url', window.location.pathname);
    }
    try {
      const json = await postCart(body, false);
      if (!showDrawer(json)) window.location.href = window.routes?.cart_url || '/cart';
    } catch (e) {
      if (error) { error.textContent = e.message; error.hidden = false; }
    } finally {
      buttons.forEach((b) => b.removeAttribute('aria-busy'));
      submitter?.blur();
    }
  }

  /* ---------- Events ---------- */
  document.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-ec-form]');
    if (!form) return;
    event.preventDefault();
    submitEcForm(form, event.submitter);
  });

  document.addEventListener('change', (event) => {
    const t = event.target;
    const pack = t.closest('[data-ec-packs] input[type="radio"]');
    if (pack) {
      setQty(Number(pack.value));
      track('ecoms_pack_selected', { quantity: Number(pack.value), discount_pct: Number(pack.dataset.pct) || 0 });
      return;
    }
    if (t.closest('[data-ec-option]')) { onOptionChange(t.closest('[data-ec-product]') || document); return; }
    if (t === qtyInput()) sync();
  });

  document.addEventListener('click', async (event) => {
    const t = event.target;

    const step = t.closest('[data-ec-qty-step]');
    if (step) { setQty(currentQty() + Number(step.dataset.ecQtyStep)); return; }

    const galStep = t.closest('[data-ec-gal-step]');
    if (galStep) { const gal = galleryOf(galStep); goGal(gal, galIndex(gal) + Number(galStep.dataset.ecGalStep)); return; }

    const galTo = t.closest('[data-ec-gal-to]');
    if (galTo) { goGal(galleryOf(galTo), Number(galTo.dataset.ecGalTo)); return; }

    const play = t.closest('[data-ec-play]');
    if (play) {
      const video = play.parentElement.querySelector('video');
      if (video) { video.controls = true; video.muted = false; video.play(); play.hidden = true; }
      return;
    }

    const buyNow = t.closest('[data-ec-buy-now]');
    if (buyNow) {
      const form = document.getElementById(buyNow.dataset.form);
      if (!form) return;
      event.preventDefault();
      buyNow.setAttribute('aria-busy', 'true');
      const body = new FormData(form);
      if (!body.get('quantity')) body.set('quantity', String(currentQty()));
      try {
        await postCart(body, false);
        track('ecoms_buy_now', { variant_id: Number(body.get('id')), quantity: Number(body.get('quantity')) });
        window.location.href = `${window.Shopify?.routes?.root || '/'}checkout`;
      } catch (e) {
        buyNow.removeAttribute('aria-busy');
        const error = form.querySelector('[data-ec-form-error]');
        if (error) { error.textContent = e.message; error.hidden = false; }
        else form.closest('product-form')?.handleErrorMessage?.(e.message);
      }
      return;
    }

    const add = t.closest('[data-ec-add-variant]');
    if (add) {
      event.preventDefault();
      add.disabled = true;
      add.setAttribute('aria-busy', 'true');
      try {
        await addVariant(add.dataset.ecAddVariant, 1, add.dataset.ecSource || 'cross_sell');
      } catch (e) {
        const note = add.parentElement.querySelector('[data-ec-add-error]');
        if (note) { note.textContent = e.message; note.hidden = false; }
      } finally {
        if (add.isConnected) { add.disabled = false; add.removeAttribute('aria-busy'); }
      }
    }
  });

  // Dawn main-product (legacy templates): refresh ECOMS fragments on Dawn's variant change.
  function onDawnVariantChange({ data }) {
    if (!data || data.sectionId !== dawnInfo()?.dataset.section) return;
    $$('[data-ec-refresh][id]').forEach((el) => {
      const fresh = data.html?.getElementById(el.id);
      if (fresh) el.replaceWith(document.importNode(fresh, true));
    });
    if (data.variant) refreshFor(data.variant.id, null).then(sync);
    sync();
    initSticky();
  }

  /* ---------- Boot ---------- */
  function init(root = document) {
    productJson = null;
    initGalleries(root);
    initCountdowns();
    initSticky();
    sync();
  }

  function boot() {
    init();
    if (typeof subscribe === 'function' && events()) subscribe(events().variantChange, onDawnVariantChange);
    document.addEventListener('shopify:section:load', (e) => init(e.target));
  }

  window.Ecoms = { money, setQty, addVariant, sync };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
