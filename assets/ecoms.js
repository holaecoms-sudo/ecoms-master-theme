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

  // «Qué incluye tu pack» + sticky label: read from the selected pack (server-rendered data).
  function syncPackInfo(qty, total) {
    const packs = $('[data-ec-packs]');
    const radio = packs?.querySelector('input[type="radio"]:checked');
    const label = radio ? radio.dataset.label || '' : '';
    $$('[data-ec-sticky-pack]').forEach((el) => {
      el.textContent = label;
      el.hidden = !label;
    });
    // Sticky thumbnail follows the selected pack's card image (e.g. the gift photo of the pack of 2).
    const packImg = radio ? radio.dataset.img || '' : '';
    $$('.ec-sticky__img').forEach((img) => {
      if (!img.dataset.src0) img.dataset.src0 = img.currentSrc || img.src;
      const next = packImg || img.dataset.src0;
      if (img.getAttribute('src') !== next) {
        img.removeAttribute('srcset');
        img.src = next;
      }
    });
    // Sticky savings pill: same real savings as the selected pack card.
    $$('[data-ec-sticky-save]').forEach((el) => {
      const stickySave = radio ? Number(radio.dataset.save) || 0 : (Number(el.dataset.unitSave) || 0) * qty;
      el.hidden = stickySave <= 0;
      const amount = el.querySelector('[data-ec-sticky-save-amount]');
      if (amount) amount.textContent = money(stickySave);
    });
    $$('[data-ec-pack-summary]').forEach((box) => {
      const title = box.closest('[data-ec-packs]')?.dataset.title || '';
      const inc = box.querySelector('[data-ec-ps-inc]');
      if (inc) inc.textContent = (radio && radio.dataset.sum) || `${qty} × ${title}`;
      const save = radio ? Number(radio.dataset.save) || 0 : 0;
      const saveEl = box.querySelector('[data-ec-ps-save]');
      if (saveEl) {
        saveEl.hidden = save <= 0;
        const amount = saveEl.querySelector('[data-ec-ps-save-amount]');
        if (amount) amount.textContent = money(save);
      }
      const threshold = Number(packs?.dataset.shipThreshold) || 0;
      const shipEl = box.querySelector('[data-ec-ps-ship]');
      if (shipEl) shipEl.hidden = !(threshold > 0 && total >= threshold);
    });
  }

  // «Esto incluye tu compra»: piece counts are per unit, so they follow the selected pack/quantity,
  // and the price line shows that pack's real total (same math as the automatic discounts).
  function syncIncludes(qty, total) {
    const radio = $('[data-ec-packs] input[type="radio"]:checked');
    const label = radio && Number(radio.value) === qty ? radio.dataset.label || '' : '';
    $$('[data-ec-incl-pack]').forEach((el) => {
      el.textContent = qty > 1 ? label || `${qty} unidades` : '';
      el.hidden = qty <= 1;
    });
    $$('[data-ec-incl-qty]').forEach((el) => {
      const base = el.dataset.ecInclQty || '';
      const m = base.match(/^(\D*)(\d+)(.*)$/);
      if (m) {
        el.textContent = `${m[1]}${Number(m[2]) * qty}${m[3]}`;
      } else if (!base) {
        el.textContent = `x${qty}`;
        el.hidden = qty <= 1;
      }
    });
    $$('[data-ec-incl-total]').forEach((el) => { el.textContent = money(total); });
    $$('[data-ec-incl-was]').forEach((el) => {
      const was = (Number(el.dataset.unitWas) || 0) * qty;
      el.textContent = money(was);
      el.hidden = was <= total;
    });
  }

  // Price block: total for the chosen quantity, compare-at for that quantity and savings.
  function paintPrice(qty, total) {
    $$('[data-ec-price-live]').forEach((box) => {
      const unitCmp = Number(box.dataset.unitCompare) || 0;
      const was = unitCmp * qty;
      const save = was - total;
      const set = (sel, text) => box.querySelectorAll(sel).forEach((el) => { el.textContent = text; });
      set('[data-ec-pp-now]', money(total));
      set('[data-ec-pp-was]', money(was));
      set('[data-ec-pp-save]', money(Math.max(0, save)));
      set('[data-ec-pp-pct]', String(was > 0 ? Math.round((Math.max(0, save) * 100) / was) : 0));
      set('[data-ec-pp-n]', String(qty));
      set('[data-ec-pp-each]', money(Math.round(total / qty)));
      box.querySelectorAll('[data-ec-pp-was], [data-ec-pp-savebox]').forEach((el) => { el.hidden = save <= 0; });
      box.querySelectorAll('[data-ec-pp-qty]').forEach((el) => { el.hidden = qty <= 1; });
    });
  }

  // Order buttons (floating bar and the app's button in the buy box): amount to pay on the label and, underneath,
  // what the shopper is taking home and the offer, both following the selected pack.
  let orderState = null;
  function orderSub(qty) {
    const packs = $('[data-ec-packs]');
    const radio = packs && packs.querySelector('input[type="radio"]:checked');
    const plural = (packs && packs.dataset.unitName) || 'unidades';
    const unit = qty === 1 ? plural.replace(/s$/i, '') : plural;
    const pct = radio ? Math.round(Number(radio.dataset.pct) || 0) : 0;
    const gift = radio && (radio.dataset.label || '').match(/regalamos\s+(\d+)/i);
    if (gift) return `${qty} ${unit} · ${gift[1]} de regalo`;
    return `${qty} ${unit} · ${pct > 0 ? `${pct}% de dto` : 'precio normal'}`;
  }
  function paintOrderButtons(qty, total) {
    if (qty != null) orderState = { qty, total };
    if (!orderState) return;
    const sub = orderSub(orderState.qty);
    $$('[data-ec-sticky-sub]').forEach((el) => { if (el.textContent !== sub) el.textContent = sub; });
    // The app's button: rewrite its text nodes in place (keeps its icon and styles); re-applied if the app redraws it.
    const base = ($('[data-ec-open-cod]') || {}).dataset?.ecOpenCod || '';
    if (!base) return;
    const wanted = base.trim().toLowerCase();
    $$('.ec-buy button, .ec-buy a').forEach((btn) => {
      if (btn.closest('.ec-sticky, [data-ec-form]') || btn.hasAttribute('data-ec-buy-now')) return;
      if (!(btn.textContent || '').trim().toLowerCase().startsWith(wanted)) return;
      const walker = document.createTreeWalker(btn, NodeFilter.SHOW_TEXT);
      const nodes = [];
      for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.data.trim()) nodes.push(n);
      if (!nodes.length) return;
      const main = `${base.trim()} · ${money(orderState.total)}`;
      if (nodes[0].data.trim() !== main) nodes[0].data = main;
      if (nodes[1]) { if (nodes[1].data.trim() !== sub) nodes[1].data = sub; return; }
      let small = btn.querySelector('[data-ec-order-sub]');
      if (!small) {
        small = document.createElement('small');
        small.setAttribute('data-ec-order-sub', '');
        small.style.cssText = 'display:block;margin-top:2px;font-size:12px;font-weight:600;opacity:.85';
        btn.appendChild(small);
      }
      if (small.textContent !== sub) small.textContent = sub;
    });
  }
  new MutationObserver(() => paintOrderButtons()).observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  function sync() {
    // Pages without the product form (e.g. quantity tiers with gifts) have no live price to follow.
    if (!unitPrice()) return;
    const qty = currentQty();
    const packs = $('[data-ec-packs]');
    $$('[data-ec-packs] input[type="radio"]').forEach((r) => { r.checked = Number(r.value) === qty; });
    const total = totalFor(unitPrice(), qty, packs);
    $$('[data-ec-cta-total]').forEach((el) => { el.textContent = money(total); });
    $$('[data-ec-sticky-price]').forEach((el) => { el.textContent = money(total); });
    $$('[data-ec-sticky-ship]').forEach((pill) => {
      const freeAt = Number(pill.dataset.freeAt) || 0;
      const localAt = Number(pill.dataset.localAt) || 0;
      const all = freeAt > 0 && total >= freeAt;
      const local = !all && localAt > 0 && total >= localAt;
      pill.hidden = !(all || local);
      pill.querySelectorAll('[data-ec-sticky-ship-all]').forEach((el) => { el.hidden = !all; });
      pill.querySelectorAll('[data-ec-sticky-ship-local]').forEach((el) => { el.hidden = !local; });
    });
    syncPackInfo(qty, total);
    syncIncludes(qty, total);
    paintOrderButtons(qty, total);
    // Shipping line under the price: delivered total, or «Envío gratis» once the threshold is reached.
    $$('[data-ec-shipline]').forEach((line) => {
      const cost = Number(line.dataset.cost) || 0;
      const freeAt = Number(line.dataset.freeAt) || 0;
      const localAt = Number(line.dataset.localAt) || 0;
      const free = freeAt > 0 && total >= freeAt;
      const local = !free && localAt > 0 && total >= localAt;
      line.classList.toggle('is-free', free || local);
      const paid = line.querySelector('[data-ec-shipline-paid]');
      const freeEl = line.querySelector('[data-ec-shipline-free]');
      const localEl = line.querySelector('[data-ec-shipline-local]');
      if (paid) paid.hidden = free || local;
      if (freeEl) freeEl.hidden = !free;
      if (localEl) localEl.hidden = !local;
      line.querySelectorAll('[data-ec-shipline-total]').forEach((el) => { el.textContent = money(total + cost); });
    });
    // «Llévalo en pack» applies to a single unit only: hide it while a bigger pack is selected.
    $$('[data-ec-packoff]').forEach((el) => { el.hidden = qty > 1; });
    // Price block follows the selected pack: total, compare-at for that quantity and savings.
    paintPrice(qty, total);
    $$('[data-ec-shipbar]').forEach((bar) => {
      const threshold = Number(bar.dataset.threshold) || 0;
      if (!threshold) return;
      const left = threshold - total;
      const fill = bar.querySelector('[data-ec-shipbar-fill]');
      if (fill) fill.style.width = `${Math.min(100, Math.round((total * 100) / threshold))}%`;
      const text = bar.querySelector('[data-ec-shipbar-text]');
      if (!text) return;
      if (left > 0) {
        const tpl = bar.querySelector('[data-ec-shipbar-progress]')?.innerHTML || '';
        text.innerHTML = tpl.replace('[amount]', `<b>${money(left)}</b>`);
      } else {
        text.innerHTML = `<b>${bar.querySelector('[data-ec-shipbar-success]')?.innerHTML || ''}</b>`;
      }
    });

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

  /* ---------- Delivery timeline (dates from today, skipping Sundays) ---------- */
  function addBusinessDays(days) {
    const d = new Date();
    let left = days;
    while (left > 0) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0) left -= 1;
    }
    return d;
  }
  const fmtDay = (d) => d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }).replace('.', '');
  function initDelivery(root = document) {
    $$('[data-ec-delivery] li', root).forEach((li, i) => {
      if (i === 0) return;
      const label = li.querySelector('[data-ec-date]');
      const from = addBusinessDays(Number(li.dataset.days) || 0);
      const max = Number(li.dataset.daysMax);
      label.textContent = max ? `${fmtDay(from)} - ${fmtDay(addBusinessDays(max))}` : fmtDay(from);
    });
  }

  /* ---------- Sticky add to cart ---------- */
  let stickyObserver;
  let stickyUpdate = null;
  let stickyScrollBound = false;
  function initSticky() {
    const sticky = $('[data-ec-sticky]');
    stickyObserver?.disconnect();
    if (!sticky) return;
    const ec = ecForm();
    const id = dawnInfo()?.dataset.section;
    // With «solo pago al recibir» our add button is hidden and the COD app's button sits in the buy block,
    // so watch the whole buy block instead (a hidden element never counts as on screen).
    const add = ec && ec.querySelector('[data-ec-add]');
    const target = ec ? (add && add.offsetParent ? add : ec.closest('.ec-buy') || ec) : id && document.getElementById(`ProductSubmitButton-${id}`);
    if (!target) return;
    const setVisible = (on) => {
      sticky.classList.toggle('is-on', on);
      sticky.inert = !on;
      sticky.setAttribute('aria-hidden', String(!on));
      document.body.classList.toggle('ec-sticky-on', on);
    };
    // «Desde que carga» (mobile only): also show it while the buy button is still below the screen, but only after the shopper has scrolled about a screen down.
    const early = sticky.hasAttribute('data-ec-sticky-early') && window.matchMedia('(max-width: 989px)').matches;
    // Never on first paint: only once the shopper has scrolled, and never while the buy button is on screen.
    let inView = true;
    let below = false;
    const update = () => setVisible(!inView && (!below || (early && window.scrollY > Math.max(480, window.innerHeight * 0.75))));
    stickyUpdate = update;
    stickyObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      below = entry.boundingClientRect.top > 0;
      update();
    });
    stickyObserver.observe(target);
    if (!stickyScrollBound) {
      stickyScrollBound = true;
      window.addEventListener('scroll', () => stickyUpdate && stickyUpdate(), { passive: true });
    }
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

  async function addVariant(variantId, quantity = 1, source = 'cross_sell', extraItems = []) {
    const payload = { items: [...extraItems, { id: Number(variantId), quantity }] };
    const sections = drawerSections();
    if (sections.length) {
      payload.sections = sections;
      payload.sections_url = window.location.pathname;
    }
    const json = await postCart(JSON.stringify(payload), true);
    track('ecoms_upsell_added', { variant_id: Number(variantId), quantity, source });
    // Cart page: reload so the line items, totals and suggestions update together.
    if (document.getElementById('main-cart-items')) { window.location.reload(); return; }
    if (!showDrawer(json)) window.location.href = window.routes?.cart_url || '/cart';
  }

  // Cash on delivery app (e.g. Releasit): after the pack is in the cart, click the app's cart button (found by
  // its text, preferring the one in the cart drawer) so its form opens with both products. The app renders the
  // button on its own, so wait for it a few seconds; if it never shows, the cart drawer stays open.
  // Card button inside the pay-on-delivery app (e.g. Releasit «Pagar con tarjeta»): the app sends the shopper to
  // Shopify checkout without our discount, so store the page's card code for the checkout session first.
  document.addEventListener('click', (event) => {
    const holder = $('[data-ec-card-code]');
    const el = event.target.closest('button, a, [role="button"]');
    if (!holder || !el || el.closest('[data-ec-buy-now]')) return;
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (!text.startsWith(holder.dataset.ecCardMatch || 'pagar con tarjeta')) return;
    const code = encodeURIComponent(holder.dataset.ecCardCode);
    document.cookie = `discount_code=${code}; path=/; max-age=3600; SameSite=Lax`;
    fetch(`${window.Shopify?.routes?.root || '/'}discount/${code}`, { credentials: 'same-origin', keepalive: true }).catch(() => {});
  }, true);

  // Rotating reviews under the buy button: one at a time, every 5 s, dots to jump; stops on interaction.
  function initReviewSliders() {
    $$('[data-ec-rsl]').forEach((box) => {
      if (box.dataset.ecRslOn) return;
      box.dataset.ecRslOn = '1';
      const items = $$('.ec-rsl__item', box);
      const dots = $$('[data-ec-rsl-to]', box);
      const first = items[0] && $('video', items[0]);
      if (first) first.play().catch(() => {});
      if (items.length < 2) return;
      let at = 0;
      const track = $('[data-ec-rsl-track]', box);
      const show = (i) => {
        at = (i + items.length) % items.length;
        if (track) {
          track.style.transform = `translateX(-${at * 100}%)`;
          dots.forEach((d, n) => d.setAttribute('aria-current', n === at ? 'true' : 'false'));
          return;
        }
        items.forEach((el, n) => {
          el.hidden = n !== at;
          const v = $('video', el);
          if (v) n === at ? v.play().catch(() => {}) : v.pause();
        });
        dots.forEach((d, n) => d.setAttribute('aria-current', n === at ? 'true' : 'false'));
      };
      let timer = setInterval(() => show(at + 1), track ? 4000 : 5000);
      if (track) {
        let x0 = null;
        track.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
        track.addEventListener('touchend', (e) => {
          if (x0 === null) return;
          const dx = e.changedTouches[0].clientX - x0;
          x0 = null;
          if (Math.abs(dx) < 40) return;
          clearInterval(timer);
          show(at + (dx < 0 ? 1 : -1));
          timer = setInterval(() => show(at + 1), 4000);
        }, { passive: true });
      }
      dots.forEach((d) => d.addEventListener('click', () => { clearInterval(timer); show(Number(d.dataset.ecRslTo)); }));
      $$('[data-ec-rsl-step]', box).forEach((b) => b.addEventListener('click', () => {
        clearInterval(timer);
        show(at + Number(b.dataset.ecRslStep));
        timer = setInterval(() => show(at + 1), 4000);
      }));
    });
  }

  // «Niveles con regalos»: the chosen tier unlocks gift cards; the button empties the cart, adds that quantity plus
  // the unlocked gifts and opens the cash on delivery app's form with the cart.
  function initGiftTiers() {
    $$('[data-ec-gt]').forEach((box) => {
      if (box.dataset.ecGtOn) return;
      box.dataset.ecGtOn = '1';
      const radios = $$('input[type="radio"]', box);
      const total = $('[data-ec-gt-total]', box);
      const current = () => radios.find((r) => r.checked) || radios[0];
      const paint = () => {
        const r = current();
        if (!r) return;
        const tier = Number(r.value);
        $$('.ec-gt__tier', box).forEach((l) => l.classList.toggle('is-on', l.contains(r)));
        $$('.ec-gt__gift', box).forEach((g) => {
          const open = tier >= Number(g.dataset.tier);
          g.classList.toggle('is-open', open);
          const st = $('.ec-gt__state', g);
          if (st) st.textContent = open ? st.dataset.open : st.dataset.locked;
        });
        if (total) total.textContent = r.dataset.total;
        paintPrice(Number(r.dataset.qty) || 1, Number(r.dataset.cents) || 0);
      };
      radios.forEach((r) => r.addEventListener('change', paint));
      paint();
      const go = $('[data-ec-gt-go]', box);
      go?.addEventListener('click', async () => {
        const r = current();
        if (!r) return;
        const tier = Number(r.value);
        const gifts = $$('.ec-gt__gift[data-gift]', box);
        go.disabled = true;
        go.setAttribute('aria-busy', 'true');
        try {
          // Start from an empty cart so the form shows exactly this pack (earlier tries or other items don't
          // pile up and change the total).
          const cleared = await fetch(`${window.Shopify?.routes?.root || '/'}cart/clear.js`, { method: 'POST', headers: { Accept: 'application/json' } });
          if (!cleared.ok) throw new Error('No se pudo preparar tu pedido. Intenta de nuevo.');
          const extra = gifts.filter((g) => tier >= Number(g.dataset.tier)).map((g) => ({ id: Number(g.dataset.gift), quantity: 1 }));
          // Straight to the pay-on-delivery form: the cart drawer opens invisibly (the app's cart button lives
          // there), its button is clicked, then the drawer closes behind the form.
          if (box.dataset.openCod) document.documentElement.classList.add('ec-silent-cart');
          await addVariant(box.dataset.variant, Number(r.dataset.qty), 'gift_tiers', extra);
          if (box.dataset.openCod) openCodForm(box.dataset.openCod, true);
        } catch (e) {
          document.documentElement.classList.remove('ec-silent-cart');
          const note = $('[data-ec-add-error]', box);
          if (note) { note.textContent = e.message; note.hidden = false; }
        } finally {
          go.disabled = false;
          go.removeAttribute('aria-busy');
        }
      });
    });
  }

  function codButton(text, fromCart) {
    const wanted = text.trim().toLowerCase();
    const ours = '[data-ec-add-variant], [data-ec-add], [data-ec-scroll-buy], .ec-packoff, .ec-sticky, .ec-ann';
    const hits = $$('button, a, [role="button"]').filter((el) => {
      if (el.closest(ours) || !el.offsetParent) return false;
      return (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase() === wanted;
    });
    const inCart = (el) => !!el.closest('cart-drawer, #CartDrawer, .drawer');
    return hits.find((el) => inCart(el) === !!fromCart) || hits[0];
  }

  function openCodForm(text, silent) {
    const find = () => codButton(text, true);
    let tries = 0;
    const timer = setInterval(() => {
      const btn = find();
      if (btn || ++tries > 20) {
        clearInterval(timer);
        if (btn) btn.click();
        if (!silent) return;
        // Silent mode: close the invisible drawer once the form is open; if the app's button never showed,
        // reveal the drawer so the shopper still sees their cart.
        setTimeout(() => {
          if (btn) $('cart-drawer')?.close?.();
          document.documentElement.classList.remove('ec-silent-cart');
        }, btn ? 700 : 0);
      }
    }, 200);
  }

  // «Llévalo en pack»: the offer only applies with the main product, so the same click also adds one unit
  // of the variant selected on this page, unless the product is already in the cart.
  async function mainItems(button) {
    const productId = Number(button.dataset.ecWithProduct);
    if (!productId) return [];
    const form = button.closest('section, .shopify-section')?.querySelector('[data-ec-form]') || $('[data-ec-form]');
    const variantId = Number(form?.querySelector('[name="id"]')?.value);
    if (!variantId) return [];
    try {
      const cart = await fetch(`${window.Shopify?.routes?.root || '/'}cart.js`, { headers: { Accept: 'application/json' } }).then((r) => r.json());
      if (cart.items?.some((line) => line.product_id === productId)) return [];
    } catch (e) { /* cart unknown: add it anyway */ }
    return [{ id: variantId, quantity: 1 }];
  }

  async function submitEcForm(form, submitter) {
    const error = form.querySelector('[data-ec-form-error]');
    const buttons = $$('[data-ec-add]');
    if (buttons.some((b) => b.getAttribute('aria-busy') === 'true')) return;
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
      if (error) {
        error.textContent = e.message;
        error.hidden = false;
        // The sticky bar can sit far from the form: bring the message into view.
        if (submitter && submitter.closest('[data-ec-sticky]')) error.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
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
      const error = ecForm()?.querySelector('[data-ec-form-error]');
      if (error) error.hidden = true;
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

    const toBuy = t.closest('[data-ec-scroll-buy]');
    if (toBuy) {
      // Quantity tiers with gifts: page CTAs take the shopper back to the tiers so they choose a pack first.
      // The floating bar is the exception: it opens the order form with the pack already chosen.
      const fromBar = !!toBuy.closest('.ec-sticky');
      const barCod = fromBar && toBuy.dataset.ecOpenCod && codButton(toBuy.dataset.ecOpenCod);
      if (barCod) { event.preventDefault(); barCod.click(); return; }
      const tiers = $('[data-ec-gt]');
      if (tiers) { event.preventDefault(); tiers.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      // Pack tiers on the page: every page CTA takes the shopper back up to choose a pack, so they know what they are buying.
      const packs = $('[data-ec-packs]');
      if (packs) { event.preventDefault(); packs.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      // With cash on delivery live, page CTAs open the app's form right away (its button sits in the buy box).
      const cod = toBuy.dataset.ecOpenCod && codButton(toBuy.dataset.ecOpenCod);
      if (cod) { event.preventDefault(); cod.click(); return; }
      const target = $('[data-ec-packs]') || ecForm();
      if (target) { event.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      return;
    }

    const play = t.closest('[data-ec-play]');
    if (play) {
      const video = play.parentElement.querySelector('video');
      if (video) { video.controls = true; video.muted = false; video.play().catch(() => {}); play.hidden = true; }
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
        const code = buyNow.dataset.discount;
        window.location.href = `${window.Shopify?.routes?.root || '/'}checkout${code ? `?discount=${encodeURIComponent(code)}` : ''}`;
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
        await addVariant(add.dataset.ecAddVariant, 1, add.dataset.ecSource || 'cross_sell', await mainItems(add));
        if (add.dataset.ecOpenCod) openCodForm(add.dataset.ecOpenCod);
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
    // Packs whose first tier is more than 1 unit: start the form at that quantity.
    const firstPack = $('[data-ec-packs] input[type="radio"]:checked');
    if (firstPack && Number(firstPack.value) !== currentQty()) setQty(Number(firstPack.value));
    initGalleries(root);
    initDelivery(root);
    initCountdowns();
    initSticky();
    initReviewSliders();
    initGiftTiers();
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

/* Accordions (product buy box and FAQ): opening one closes the others in the same group. */
(() => {
  if (window.__ecAccordion) return;
  window.__ecAccordion = true;
  document.addEventListener('toggle', (e) => {
    const d = e.target;
    if (!d || d.tagName !== 'DETAILS' || !d.open) return;
    const group = d.closest('.ec-faq');
    if (!group) return;
    group.querySelectorAll(':scope > details[open]').forEach((o) => { if (o !== d) o.open = false; });
  }, true);
})();

/* Moving call-to-action: the pay-on-delivery app's buttons («Pedir y pagar al recibir» on the page, «Confirmar pedido» in its popup)
   are found by their text and get a soft pulse and shine. The app renders them itself, so watch the page for them. */
(() => {
  if (window.__ecCtaAnim) return;
  window.__ecCtaAnim = true;
  const MATCH = /^(pedir y pagar al recibir|confirmar pedido)/i;
  let queued = false;
  const mark = () => {
    queued = false;
    document.querySelectorAll('button, [role="button"], a.button').forEach((el) => {
      if (el.classList.contains('ec-cta-anim')) return;
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (text && text.length < 60 && MATCH.test(text)) el.classList.add('ec-cta-anim');
    });
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(mark); } };
  new MutationObserver(queue).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  queue();
})();

/* Pack → gallery: choosing a pack can show a given gallery photo (pack setting «Foto de la galería al elegir este pack»). */
(() => {
  if (window.__ecPackGallery) return;
  window.__ecPackGallery = true;
  document.addEventListener('change', (e) => {
    const input = e.target;
    if (!input || !input.matches || !input.matches('.ec-pack input[type="radio"]')) return;
    const pos = parseInt(input.dataset.galPos, 10);
    if (!pos || pos < 1) return;
    const root = input.closest('[data-ec-product]') || document;
    const gal = root.querySelector('[data-ec-gal]') || document.querySelector('[data-ec-gal]');
    const track = gal && gal.querySelector('[data-ec-gal-track]');
    if (!track || !track.children.length) return;
    const i = Math.min(pos, track.children.length) - 1;
    track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
    gal.querySelectorAll('[data-ec-gal-to]').forEach((t, j) => t.setAttribute('aria-current', String(i === j)));
    const count = gal.querySelector('[data-ec-gal-count]');
    if (count) count.textContent = `${i + 1} / ${track.children.length}`;
    track.querySelectorAll('video').forEach((v) => v.pause());
  });
})();

/* Empty wrappers: apps (e.g. the pay-on-delivery form) inject invisible containers that keep their height and open a gap
   in the buy box. Collapse any empty in-flow wrapper next to the buy block; if the app fills it later it comes back. */
(() => {
  if (window.__ecVoid) return;
  window.__ecVoid = true;
  const SOLID = 'img, svg, picture, video, iframe, canvas, button, select, textarea, a, input:not([type="hidden"]), script[type="application/json"]';
  let queued = false;
  const isEmpty = (el) => !(el.textContent || '').trim() && !el.querySelector(SOLID);
  const scan = () => {
    queued = false;
    const buy = document.querySelector('.ec-buy');
    const info = buy && buy.closest('.ec-pdp__info');
    if (!info) return;
    const seen = new Set();
    // Direct children of the info column and of the buy block, plus one level below the buy block's form.
    const pool = [...info.children, ...buy.children, ...buy.querySelectorAll('form > *, .ec-buy__buttons > *')];
    pool.forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      if (/^(SCRIPT|STYLE|INPUT|FORM)$/.test(el.tagName) || el.hasAttribute('hidden')) return;
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' || cs.position === 'absolute' || cs.display === 'none') {
        if (el.classList.contains('ec-void')) el.classList.remove('ec-void');
        return;
      }
      const empty = isEmpty(el) && el.getBoundingClientRect().height > 6;
      el.classList.toggle('ec-void', empty);
    });
  };
  const queue = () => { if (!queued) { queued = true; setTimeout(scan, 150); } };
  new MutationObserver(queue).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('load', () => { queue(); setTimeout(queue, 1500); setTimeout(queue, 4000); });
  queue();
})();

/* Diagnostic: open the product page with ?ecdebug=1 and tap anywhere; a panel lists the elements under the finger
   (tag, id, classes, size, margins). For finding invisible elements without browser devtools. */
(() => {
  if (!/[?&]ecdebug=1/.test(location.search)) return;
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;left:6px;right:6px;top:6px;z-index:2147483647;max-height:55vh;overflow:auto;padding:8px;background:#000c;color:#9f9;font:11px/1.35 monospace;border-radius:8px;white-space:pre-wrap;pointer-events:none';
  box.textContent = 'ecdebug: toca el espacio en blanco';
  box.style.pointerEvents = 'auto';
  document.body.appendChild(box);
  // Tree of the buy block (form and everything inside it), refreshed 3 s and 6 s after load.
  const dump = () => {
    const buy = document.querySelector('.ec-buy');
    if (!buy) return;
    const out = [];
    const walk = (el, d) => {
      if (d > 5 || /^(SCRIPT|STYLE|PATH|SVG|USE)$/i.test(el.tagName)) return;
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      const cls = String(typeof el.className === 'string' ? el.className : '').trim().replace(/\s+/g, '.').slice(0, 40);
      out.push(`${'  '.repeat(d)}${el.tagName.toLowerCase()}${el.id ? '#' + el.id.slice(0, 24) : ''}${cls ? '.' + cls : ''} ${Math.round(r.height)}h d:${cs.display} m:${cs.margin === '0px' ? '-' : cs.margin} p:${cs.padding === '0px' ? '-' : cs.padding} op:${cs.opacity}${cs.visibility !== 'visible' ? ' vis:' + cs.visibility : ''}`);
      [...el.children].forEach((c) => walk(c, d + 1));
    };
    walk(buy, 0);
    box.textContent = out.join('\n');
  };
  setTimeout(dump, 3000); setTimeout(dump, 6000);
  document.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    const rows = document.elementsFromPoint(e.clientX, e.clientY).slice(0, 14).map((el) => {
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      const cls = String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).trim().replace(/\s+/g, '.').slice(0, 70);
      return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''} | ${Math.round(r.width)}x${Math.round(r.height)} | m:${cs.margin} p:${cs.padding} pos:${cs.position} op:${cs.opacity} vis:${cs.visibility}`;
    });
    box.textContent = `y=${Math.round(e.clientY)}\n` + rows.join('\n');
  }, true);
})();
