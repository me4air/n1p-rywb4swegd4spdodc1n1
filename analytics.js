/* Аналитика прототипа N1broker.
   Трекер наблюдает за интерфейсом снаружи (DOM, указатель, скролл, ввод) и не требует правок app.js,
   поэтому обновления прототипа подтягиваются без конфликтов. Формат событий — в server/README.md.
   Подключение: <script src="analytics.js"></script> после app.js.
   Если бэкенд на другом домене: <script src="analytics.js" data-endpoint="https://…/collect"></script>
   Отладка: открыть прототип с ?debug=1 (выключить — ?debug=0). Код клиента: ?c=K7F2 */
(function () {
  'use strict';
  if (window.N1A) return;
  const phone = document.querySelector('.phone');
  if (!phone) return;

  // ---------- Настройки ----------
  const script = document.currentScript;
  const CFG = {
    endpoint: (script && script.dataset.endpoint) || '/collect',
    version: '1.0.0',
    flushMs: 3000, maxBatch: 50, maxQueue: 3000,
    sessionGapMs: 30 * 60 * 1000, // новая сессия после 30 минут без событий
    inputDebounceMs: 700, tapOutcomeMs: 400,
  };
  // На статическом хостинге без бэкенда (GitHub Pages, file://) и без data-endpoint события некуда отправлять
  const relative = !/^https?:/i.test(CFG.endpoint);
  let sendEnabled = !(relative && (location.protocol === 'file:' || /\.github\.io$/i.test(location.hostname)));

  // ---------- Хранилище (с запасным вариантом в памяти) ----------
  const mem = {};
  const store = (area) => ({
    get(k) { try { const v = window[area].getItem(k); return v == null ? (k in mem ? mem[k] : null) : v; } catch (e) { return k in mem ? mem[k] : null; } },
    set(k, v) { mem[k] = v; try { window[area].setItem(k, v); } catch (e) {} },
    del(k) { delete mem[k]; try { window[area].removeItem(k); } catch (e) {} },
  });
  const ls = store('localStorage'), ss = store('sessionStorage');
  const uuid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });

  // ---------- Кто: устройство, код клиента из ссылки, сессия ----------
  const qs = new URLSearchParams(location.search);
  let deviceId = ls.get('n1a-device');
  if (!deviceId) { deviceId = uuid(); ls.set('n1a-device', deviceId); }
  const code = (qs.get('c') || '').trim();
  if (/^[\w-]{1,64}$/.test(code)) ls.set('n1a-user', code);
  let userId = ls.get('n1a-user') || null;
  if (qs.has('debug')) { if (qs.get('debug') === '0') ss.del('n1a-debug'); else ss.set('n1a-debug', '1'); }
  const DEBUG = ss.get('n1a-debug') === '1';

  let session = null;
  try { session = JSON.parse(ls.get('n1a-session')); } catch (e) {}
  let sessionSaveT = 0;
  const saveSession = () => { clearTimeout(sessionSaveT); sessionSaveT = setTimeout(() => ls.set('n1a-session', JSON.stringify(session)), 200); };

  // ---------- Очередь и отправка ----------
  let queue = [];
  try { queue = JSON.parse(ls.get('n1a-queue')) || []; } catch (e) {}
  const log = []; // все события этой загрузки страницы — для режима отладки и выгрузки
  const stat = { sent: 0, failed: 0, lastError: '' };
  let persistT = 0, inflight = false, backoff = 0, retryT = 0;
  const persistNow = () => { clearTimeout(persistT); ls.set('n1a-queue', JSON.stringify(queue)); if (session) ls.set('n1a-session', JSON.stringify(session)); };
  const persistSoon = () => { clearTimeout(persistT); persistT = setTimeout(persistNow, 300); };
  const envelope = () => {
    const ua = navigator.userAgent, touch = matchMedia('(hover: none) and (pointer: coarse)').matches;
    const ctx = {
      tracker_version: CFG.version, page_modified: document.lastModified, url: location.origin + location.pathname,
      referrer: document.referrer || null, user_agent: ua,
      platform: /iPhone|iPad|iPod/.test(ua) ? 'ios' : /Android/.test(ua) ? 'android' : 'desktop', input_type: touch ? 'touch' : 'mouse',
      viewport: innerWidth + 'x' + innerHeight, screen_size: screen.width + 'x' + screen.height, dpr: window.devicePixelRatio || 1,
      language: navigator.language, timezone: (Intl.DateTimeFormat().resolvedOptions() || {}).timeZone || null,
    };
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((k) => { if (qs.get(k)) ctx[k] = qs.get(k).slice(0, 100); });
    return ctx;
  };
  function takeBatch(maxCount, maxBytes) {
    const out = []; let size = 0;
    for (let i = 0; i < queue.length && out.length < maxCount; i++) {
      const s = JSON.stringify(queue[i]).length;
      if (out.length && size + s > maxBytes) break;
      out.push(queue[i]); size += s;
    }
    return out;
  }
  const drop = (batch) => { const ids = new Set(batch.map((e) => e.event_id)); queue = queue.filter((e) => !ids.has(e.event_id)); stat.sent += batch.length; persistSoon(); dbgStatus(); };
  function flush(beacon) {
    if (!queue.length || !sendEnabled) return;
    if (beacon && navigator.sendBeacon) { // страница уходит: браузер досылает запрос сам
      const batch = takeBatch(300, 55000), body = JSON.stringify({ sent_at: Date.now(), context: envelope(), events: batch });
      if (navigator.sendBeacon(CFG.endpoint, new Blob([body], { type: 'text/plain' }))) drop(batch);
      return;
    }
    if (inflight) return;
    const batch = takeBatch(CFG.maxBatch, 200000), body = JSON.stringify({ sent_at: Date.now(), context: envelope(), events: batch });
    inflight = true;
    // text/plain — «простой» запрос: браузер не делает предварительный OPTIONS при отправке на другой домен
    fetch(CFG.endpoint, { method: 'POST', body, headers: { 'Content-Type': 'text/plain' }, credentials: 'omit', keepalive: body.length < 60000 })
      .then((r) => {
        if (r.ok) { backoff = 0; drop(batch); return; }
        stat.failed += 1; stat.lastError = 'HTTP ' + r.status;
        if (r.status >= 400 && r.status < 500 && r.status !== 429) drop(batch); // сервер отверг пачку — повтор не поможет
        else backoff = Math.min(60000, (backoff || 2000) * 2);
      })
      .catch((e) => { stat.failed += 1; stat.lastError = String(e && e.message || e); backoff = Math.min(60000, (backoff || 2000) * 2); })
      .then(() => {
        inflight = false; dbgStatus();
        if (backoff) { clearTimeout(retryT); retryT = setTimeout(flush, backoff); } else if (queue.length >= CFG.maxBatch) flush();
      });
  }
  setInterval(() => { if (!backoff) flush(); }, CFG.flushMs);

  // ---------- Чтение состояния интерфейса ----------
  const q = (s, r) => (r || document).querySelector(s);
  const qa = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const clean = (s, max) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, max || 80);
  const tc = (sel, r) => { const el = typeof sel === 'string' ? q(sel, r) : sel; return el ? clean(el.textContent, 120) : ''; };
  const vis = (el, max) => el ? clean(el.innerText != null ? el.innerText : el.textContent, max) : '';
  const num = (s) => { if (s == null) return null; const m = String(s).replace(/\s/g, '').replace(',', '.').match(/\d+(\.\d+)?/); return m ? Number(m[0]) : null; };
  const r3 = (n) => Math.round(n * 1000) / 1000;
  const NOTE_ID = 'zholbarys_electro';

  function curScreen() {
    const lg = q('#screen-login');
    if (lg && !lg.hidden && !lg.classList.contains('out')) return 'login';
    const s = q('.screens > .screen:not([hidden])');
    return s ? s.id.replace('screen-', '') : null;
  }
  const TAB_SLUGS = { pfdetail: ['overview', 'composition', 'info'], pfheld: ['overview', 'papers', 'about', 'history'] };
  function curTab(scr) {
    let el, id;
    switch (scr) {
      case 'note': el = q('#note-chips .selected'); id = el && el.dataset.nt; break;
      case 'stock': el = q('#st-chips .selected'); id = el && el.dataset.st; break;
      case 'pfdetail': el = q('#screen-pfdetail .pfd-chip.selected'); id = el && (TAB_SLUGS.pfdetail[+el.dataset.pfdTab] || el.dataset.pfdTab); break;
      case 'pfheld': el = q('#screen-pfheld .pfd-chip.selected'); id = el && (TAB_SLUGS.pfheld[+el.dataset.pfhTab] || el.dataset.pfhTab); break;
      case 'more': el = q('#screen-more [data-mt].selected'); id = el && el.dataset.mt; break;
      case 'news': el = q('#screen-news .chip-tab.selected'); id = el && el.dataset.tab; break;
      case 'catalog': el = q('#cat-chips .selected'); id = el && el.dataset.ct; break;
    }
    return el && id != null ? { id: String(id), name: tc(el) || String(id) } : null;
  }
  const byField = (obj, field, value) => { for (const k in (obj || {})) if (obj[k] && typeof obj[k] === 'object' && obj[k][field] === value) return k; return null; };
  const isOptStock = () => { const s = q('#screen-stock'); return !!s && s.classList.contains('opt'); };
  const pbIsOpt = () => { const s = q('#pb-sum'); return !!s && !!s.dataset.o; };
  const optionId = () => byField((window.OPT || {}).items, 'name', tc('#st-title')) || tc('#st-sub') || null;
  const portfolioId = () => { const t = tc('#screen-pfdetail .note-nav b'); return byField(window.PFD, 'navTitle', t) || t || null; };
  const articleId = () => { const t = tc('#art-scroll .art-title'); return byField(window.ARTICLE, 'title', t) || (t ? t.slice(0, 60) : null); };
  function curEntity(scr) {
    switch (scr) {
      case 'stock': return isOptStock() ? ['option', optionId()] : ['stock', tc('#st-sub') || null];
      case 'note': return ['structured_note', NOTE_ID];
      case 'article': return ['article', articleId()];
      case 'pfdetail': case 'pfheld': return ['named_portfolio', portfolioId()];
      case 'pfbuy': case 'pfdone': return pbIsOpt() ? ['option', optionId()] : ['named_portfolio', portfolioId()];
      case 'advisory': return ['advisory', 'advisory'];
      default: return [null, null];
    }
  }
  const sheet = { open: false, saw: false, closing: false, id: null, at: 0 };
  const res = { on: false, at: 0, info: null };
  function sheetId() {
    const s = q('#sheet');
    return q('[data-plat]', s) ? 'platform' : q('[data-theme-opt]', s) ? 'theme' : q('[data-cur-opt]', s) ? 'portfolio_currency' : q('[data-bal-act]', s) ? 'balance' : q('.op-md', s) ? 'option_explainer' : 'other';
  }
  const curOverlay = () => res.on ? 'option_result' : sheet.open ? 'sheet:' + sheet.id : null;
  const chartMode = () => { const ch = q('#st-chart'); return ch && ch.parentNode.classList.contains('cdl') ? 'candle' : 'line'; };
  const chartRange = () => { const r = q('#screen-stock .st-range.selected'); return r ? r.dataset.rg : null; };

  const counters = { purchases: 0, transfers: 0, bought: {}, favorites: {} };
  const appState = () => ({
    theme: document.documentElement.dataset.theme || 'light',
    portfolio_currency: tc('#cur-chip').indexOf('₸') >= 0 ? 'KZT' : 'USD',
    free_balance_usd: num(tc('#pb-acc')),
    held_portfolios: qa('#pf-named .pf-named').length,
    open_options: qa('#screen-portfolio .opt-hold').length,
    purchases_count: counters.purchases,
    favorites: Object.keys(counters.favorites).filter((k) => counters.favorites[k]),
  });

  // ---------- Создание событий ----------
  // Слой 1 — сырые взаимодействия, слой 2 — навигация и интерфейс, слой 3 — бизнес-события
  const LAYER1 = ['element_tapped', 'input_focused', 'input_changed', 'input_blurred', 'input_cleared', 'scroll_depth_reached', 'carousel_scrolled', 'chart_scrubbed', 'chart_panned'];
  const LAYER2 = ['session_started', 'app_loaded', 'app_backgrounded', 'app_foregrounded', 'screen_viewed', 'tab_selected', 'sheet_opened', 'sheet_closed', 'snackbar_shown', 'snackbar_dismissed', 'hint_opened', 'accordion_toggled', 'js_error'];
  const layerOf = (t) => LAYER1.indexOf(t) >= 0 ? 1 : LAYER2.indexOf(t) >= 0 ? 2 : 3;
  let sessionIsNew = false;
  function ensureSession(now) {
    if (!session || !session.id || now - session.last > CFG.sessionGapMs) { session = { id: uuid(), start: now, last: now, seq: 0 }; sessionIsNew = true; }
    session.last = now;
  }
  // reserve — событие с уже занятым временем и порядковым номером; в очередь попадает после commit
  function reserve(type, ctx) {
    const now = Date.now();
    ensureSession(now);
    if (sessionIsNew) { sessionIsNew = false; track('session_started', { entry_screen: curScreen(), entry_hash: location.hash || null, state: appState() }); }
    session.seq += 1; saveSession();
    const scr = ctx ? ctx.screen : curScreen(), tab = ctx ? ctx.tab : (curTab(scr) || {}).id, ent = ctx ? ctx.ent : curEntity(scr), ov = curOverlay();
    const ev = { event_id: uuid(), event_type: type, layer: layerOf(type), time: now, seq: session.seq, session_id: session.id, device_id: deviceId, user_id: userId, screen: scr };
    if (tab) ev.screen_tab = tab;
    if (ent && ent[0]) { ev.entity_type = ent[0]; ev.entity_id = ent[1]; }
    if (ov) ev.overlay = ov;
    ev.props = {};
    return ev;
  }
  function commit(ev) {
    for (const k in ev.props) if (ev.props[k] === undefined) delete ev.props[k];
    queue.push(ev); log.push(ev);
    if (queue.length > CFG.maxQueue) queue.splice(0, queue.length - CFG.maxQueue);
    if (log.length > 5000) log.shift();
    persistSoon(); dbgAdd(ev);
    if (queue.length >= CFG.maxBatch && !backoff) flush();
    return ev;
  }
  function track(type, props, ctx) { const ev = reserve(type, ctx); Object.assign(ev.props, props || {}); return commit(ev); }

  // ---------- Описание элемента под пальцем ----------
  const INTERACTIVE = 'button, a, label, input, textarea, select, .tap, .instr, .cond[data-hint], [role="tab"], [role="switch"], [data-k]';
  const NAMES = [
    ['[data-back], .back', 'back'], ['.srch-cancel', 'cancel'], ['.srch-clear, .lg-x', 'clear'],
    ['[data-close-sheet]', (el) => el.classList.contains('sh-x') ? 'close' : 'ok'], ['.sh-row', 'option'],
    ['#sn-act', 'ok'], ['#optpush', 'option_push'], ['[data-or-close]', 'close'], ['[data-or-buy]', 'buy_another'], ['[data-sim-ev]', 'option_event'],
    ['.profile-info', 'profile'], ['.bell', 'bell'], ['label.search', 'search_field'], ['.main-banner', 'banner'], ['.balance', 'balance_card'],
    ['.event', 'event_card'], ['.news-herocard', 'news_hero'], ['.nbig', 'news_big'], ['.news-item', 'news_card'],
    ['.product', 'product_card'], ['.advisory', 'advisory_card'], ['.lesson', 'lesson'], ['.header, .pfd-h2l', 'section_header'],
    ['[data-toggle]', 'show_more'], ['#st-more', 'news_more'], ['.more-btn, .pfd-soft', 'show_all'], ['.instr', 'instrument'],
    ['.cur-chip', 'currency_chip'], ['.abtn', 'action'], ['.pf-head', 'platform_head'], ['.cur-row', 'balance_row'],
    ['.mcell', 'menu_cell'], ['.hero-prod', 'hero_product'], ['.pfcar, [data-pfn-open]', 'portfolio_card'], ['.pcard', 'product_row'], ['.op-li', 'option_card'],
    ['.great', 'sector_card'], ['.promo', 'theme_banner'], ['.catchip', 'filter_chip'], ['#cat-plat, #cat-plat-nav', 'platform_chip'],
    ['.sort', 'sort'], ['.filt', 'filter'], ['.chip-tab, .note-chip, .st-chip, .pfd-chip', 'tab'], ['.share', 'share'],
    ['[data-promo]', 'promo_action'], ['.art-btn', 'idea_button'], ['.art-idea', 'idea_card'], ['[data-media]', 'media_fact'], ['.cond[data-hint]', 'hint'],
    ['[data-nt-go], [data-st-go], [data-op-more]', 'more_link'], ['[data-doc], .mr-doc', 'document'], ['[data-acc]', 'accordion'],
    ['#st-fav', 'favorite'], ['#st-mode', 'chart_mode'], ['.st-range', 'chart_range'], ['[data-bk-dir], [data-pb-dir]', (el) => 'direction_' + (el.dataset.bkDir || el.dataset.pbDir)],
    ['[data-st-trade]', (el) => el.classList.contains('sell') ? 'sell' : 'buy'], ['[data-pfh-sell]', 'sell'], ['[data-pfh-buy]', 'buy_more'],
    ['[data-buy], [data-pfd-buy]', 'buy'], ['[data-adv-apply]', 'apply'], ['[data-pb-step]', (el) => +el.dataset.pbStep > 0 ? 'stepper_plus' : 'stepper_minus'],
    ['[data-pb-buy], [data-xf-go]', 'confirm'], ['[data-pd-port], [data-xf-port]', 'to_portfolio'], ['[data-xf-swap]', 'swap'],
    ['[data-mr-sw]', 'switch'], ['[data-theme-open]', 'theme_row'], ['[data-logout]', 'logout'], ['[data-mr-na]', 'item'],
    ['#lg-go', 'continue'], ['#lg-docs', 'documents'], ['[data-k]', 'keypad_key'], ['input, textarea', 'input'], ['label', 'field'],
  ];
  const BLOCKS = [
    ['.bottomnav', 'tabbar'], ['#sheet', 'sheet'], ['#sheet-scrim', 'scrim'], ['#snack', 'snackbar'], ['#optres', 'option_result'], ['#optpush', 'push'], ['#art-promo', 'promo'], ['#lg-kb', 'keypad'],
    ['.note-nav, .navbar, .cat-nav, .art-nav, .pfh-nav, .srch-top, .profile-bar', 'nav'],
    ['.note-buy, .st-trade, .pfh-bar', 'cta'], ['.cat-float', 'float_bar'],
    ['.note-chips, .mr-chips, .pfd-tabs, .pfh-tabs, .chiprow, .cat-chips', 'tabs'],
    ['.banners', 'banners'], ['.events', 'events'], ['.products', 'products'], ['.collections', 'collections'], ['.advisories', 'advisories'], ['.academy', 'academy'],
    ['.menu2', 'menu'], ['.pfcars', 'portfolios'], ['.buy-ops', 'options'], ['.greats', 'sectors'], ['.promos', 'themes'], ['.prod-set', 'products'], ['.recent', 'recent'],
    ['.news-herowrap, .news-cards, .nlist', 'news'], ['.actions', 'actions'], ['.pf-named', 'named_portfolio'], ['.pf-card', 'platform'], ['.pf-balance', 'balance'],
    ['#cat-list', 'list'], ['.srch-body', 'results'], ['.art-rel', 'related'], ['.pd-comp', 'composition'], ['.accs', 'faq'], ['.cond-grid', 'conditions'],
    ['.st-price', 'chart'], ['.bk', 'orderbook'], ['.pb-amount', 'amount'], ['.pb-seg', 'segment'], ['.xf-accs', 'accounts'], ['.op-list', 'list'], ['.mr-list, .mr-docs', 'list'],
  ];
  const GLOBAL_BLOCKS = { tabbar: 1, sheet: 1, scrim: 1, snackbar: 1, option_result: 1, push: 1 };
  const nameOf = (el) => { for (const [sel, n] of NAMES) if (el.matches(sel)) return typeof n === 'function' ? n(el) : n; return (el.className && String(el.className).split(' ')[0]) || el.tagName.toLowerCase(); };
  const blockOf = (el) => { for (const [sel, n] of BLOCKS) if (el.closest(sel)) return n; return null; };
  const LABELS = ['.name', '.title', '.bottom b', '.ttl', '.t', '.plat span', '.lb span', 'h2', 'h3', 'b', 'span'];
  function labelOf(el) {
    for (const s of LABELS) { const n = el.querySelector(s); if (n) { const t = vis(n); if (t) return t; } }
    const row = el.closest('.mr-row');
    const inner = el.querySelector('input');
    return vis(el) || el.getAttribute('aria-label') || el.getAttribute('placeholder') || (inner && inner.getAttribute('placeholder')) || (row ? tc('.mr-t b', row) : '') || '';
  }
  const SECTION_STOP = '.screen, .note-scroll, .pfd-pane, #note-body, #st-body, .mr-body, #news-body, .srch-body, .cat-scroll, .art-scroll, #sheet';
  function sectionOf(el) {
    if (el.matches('.header, .note-h2')) return clean((el.querySelector('h2') || el).textContent);
    let n = el;
    while (n && n !== phone && !n.matches(SECTION_STOP)) {
      for (let s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.matches('.header, .note-h2, .shdr, .art-h')) return clean((s.querySelector('h2') || s).textContent);
      n = n.parentElement;
    }
    return null;
  }
  function groupOf(el) {
    const card = el.closest('.collection, .prod-set, .note-card, .op-card, .pf-card');
    const h = card && card.querySelector('h3, .plat span');
    return h && !h.contains(el) && !el.contains(h) ? clean(h.textContent) : null;
  }
  function positionOf(el) {
    for (let n = el, i = 0; n && n.parentElement && i < 2; n = n.parentElement, i++) { // сам элемент или его обёртка в списке
      if (i && !n.matches('.scell, .adv-pad, .note-pad, .mr-m')) break;
      const first = (c) => String(c.className).split(' ')[0];
      const sib = Array.prototype.filter.call(n.parentElement.children, (c) => c.tagName === n.tagName && first(c) === first(n));
      if (sib.length > 1) return sib.indexOf(n) + 1;
    }
    return null;
  }
  function resolve(target) {
    let node = target;
    while (node && node !== phone) {
      let el = node.closest(INTERACTIVE);
      if (!el || !phone.contains(el)) return null;
      if (el.matches('.st-logo, .op-ih')) { node = el.parentElement; continue; } // логотип-блок и шапка карточки опциона — не самостоятельные элементы
      if (el.matches('input[readonly]')) el = el.closest('label') || el;
      return el;
    }
    return null;
  }
  function describe(el, target) {
    const scr = curScreen(), onLogin = !!target.closest('#screen-login');
    if (!el) {
      const leaf = target.children.length ? '' : vis(target, 60), block = blockOf(target);
      return { kind: 'other', block, props: { element_id: block === 'scrim' ? 'sheet.scrim' : scr + '.background', element_type: 'none', block: block || undefined, section: sectionOf(target) || undefined, element_text: onLogin ? undefined : leaf || undefined } };
    }
    const masked = onLogin && el.matches('[data-k], input, label'); // на экране входа номер и цифры не записываются
    const name = nameOf(el), block = blockOf(el);
    const id = block === 'tabbar' ? 'tabbar.' + (el.dataset.go || 'support')
      : block === 'sheet' ? 'sheet.' + sheetId() + '.' + name
      : [GLOBAL_BLOCKS[block] ? null : scr, block, name].filter(Boolean).join('.');
    const type = el.getAttribute('role') || (el.matches('input, textarea, label') ? 'input' : el.matches('.chip-tab, .note-chip, .st-chip, .pfd-chip, .catchip, .tab') ? 'tab' : el.matches('.instr') ? 'row' : el.matches('button, a') ? 'button' : 'card');
    const props = { element_id: id, element_type: type, block: block || undefined, section: sectionOf(el) || undefined, group: groupOf(el) || undefined, position: masked ? undefined : positionOf(el) || undefined };
    if (!masked) {
      props.element_text = labelOf(el) || undefined;
      const attrs = {}; let n = 0;
      for (const k in el.dataset) if (n++ < 8) attrs[k] = clean(el.dataset[k], 40) || true;
      if (n) props.attrs = attrs;
    }
    return { kind: el.matches('[data-back], .back, .srch-cancel') ? 'back' : block === 'tabbar' ? 'tabbar' : 'other', block, masked, props };
  }

  // ---------- Тапы (слой 1) ----------
  let pd = null, lastTap = null, pendingTap = null, lastMutation = 0, lastScrollAt = 0, lastIntentAt = 0, dragAt = -1e9, lastHistAt = -1e9;
  const snack = { open: false, at: 0, perf: -1e9, ok: false, text: '' };
  const snap = () => ({ screen: curScreen(), sheet: sheet.open, res: res.on, focus: document.activeElement && (document.activeElement.id || document.activeElement.tagName) });
  const inDebug = (t) => !!(t && t.closest && t.closest('#n1a-debug'));
  window.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary || e.button > 0 || inDebug(e.target)) return;
    if (pendingTap) finalizeTap();
    const now = performance.now();
    pd = { x: e.clientX, y: e.clientY, t: now, target: e.target, type: e.pointerType, moved: 0, scrolling: now - lastScrollAt < 120 };
  }, true);
  window.addEventListener('pointermove', (e) => { if (pd && e.isPrimary) { pd.moved = Math.max(pd.moved, Math.hypot(e.clientX - pd.x, e.clientY - pd.y)); if (pd.moved > 4) lastIntentAt = performance.now(); } }, true);
  window.addEventListener('pointercancel', () => { pd = null; }, true);
  window.addEventListener('pointerup', (e) => {
    if (!pd || !e.isPrimary) return;
    const d = pd; pd = null;
    if (Math.max(d.moved, Math.hypot(e.clientX - d.x, e.clientY - d.y)) > (d.type === 'mouse' ? 4 : 10)) { dragAt = performance.now(); return; } // это свайп или перетаскивание, не тап
    const target = d.target instanceof Element ? d.target : null;
    if (!target || !phone.contains(target)) return;
    const el = resolve(target), desc = describe(el, target), rect = phone.getBoundingClientRect(), now = performance.now();
    lastIntentAt = -1e9; // тап завершает жест прокрутки: дальнейшие сдвиги — дело прототипа
    const ev = reserve('element_tapped');
    Object.assign(ev.props, desc.props, { press_ms: Math.round(now - d.t) });
    if (!desc.masked) { ev.props.x = r3((d.x - rect.left) / rect.width); ev.props.y = r3((d.y - rect.top) / rect.height); }
    if (d.scrolling) ev.props.during_scroll = true; // тап, которым остановили прокрутку
    lastTap = { t: now, id: ev.props.element_id, text: ev.props.element_text, block: desc.block, section: ev.props.section, group: ev.props.group, position: ev.props.position, kind: desc.kind, el };
    pendingTap = { ev, s0: snap(), perf: now, timer: setTimeout(finalizeTap, CFG.tapOutcomeMs) };
  }, true);
  // Итог тапа: переход, изменение состояния, заглушка «недоступно в прототипе» или ничего
  function finalizeTap() {
    const p = pendingTap; if (!p) return;
    pendingTap = null; clearTimeout(p.timer);
    const s1 = snap(), pr = p.ev.props;
    if (s1.screen !== p.s0.screen) { pr.outcome = 'navigate'; pr.to_screen = s1.screen; }
    else if (snack.perf > p.perf && !snack.ok) { pr.outcome = 'stub'; pr.stub_text = snack.text; }
    else if (lastMutation > p.perf || snack.perf > p.perf || s1.sheet !== p.s0.sheet || s1.res !== p.s0.res || s1.focus !== p.s0.focus) pr.outcome = 'state';
    else pr.outcome = 'none';
    commit(p.ev);
  }
  const recentTap = (ms) => lastTap && performance.now() - lastTap.t < (ms || 1000) ? lastTap : null;

  // ---------- Экраны (слой 2) ----------
  let cur = { screen: null, tab: null, ent: [null, null], since: Date.now() };
  let view = { depth: {}, car: {}, pan: {}, promo: false };
  const pbCtx = { at: 0, err: '', hadError: false, last: null, submitAt: -1e9 };
  const xfCtx = { at: 0, err: '', hadError: false, last: null, submitAt: -1e9 };
  const search = { from: null, last: '', hadTap: false };
  const optFifo = []; // купленные опционы в порядке покупки — чтобы подписать результат срабатывания
  function checkScreen(initial) {
    const scr = curScreen(); if (!scr) return;
    const ent = curEntity(scr);
    if (!initial && scr === cur.screen && ent[0] === cur.ent[0] && ent[1] === cur.ent[1]) return;
    const prev = cur, now = Date.now(), tap = recentTap();
    const trigger = initial ? 'initial' : tap ? (tap.kind === 'back' ? 'back_button' : tap.kind === 'tabbar' ? 'tabbar' : 'tap') : performance.now() - lastHistAt < 600 ? 'browser_nav' : 'auto';
    if (prev.screen) onLeave(prev, scr, now);
    cur = { screen: scr, tab: (curTab(scr) || {}).id || null, ent, since: now };
    view = { depth: {}, car: {}, pan: {}, promo: false };
    const props = { prev_screen: prev.screen, prev_screen_ms: prev.screen ? now - prev.since : undefined, trigger, source_element: tap ? tap.id : undefined };
    if (scr === 'stock') props.mode = ent[0];
    if (scr === 'pfbuy' || scr === 'pfdone') props.mode = ent[0] === 'option' ? 'option' : 'portfolio';
    props.state = appState();
    track('screen_viewed', props);
    onEnter(scr, prev, trigger, tap);
  }
  const prevCtx = (p) => ({ screen: p.screen, tab: p.tab, ent: p.ent });
  function onLeave(prev, to, now) {
    if (prev.screen === 'article') track('article_read', { article_id: prev.ent[1], max_scroll_pct: (view.depth['art-scroll'] || {}).max || 0, read_ms: now - prev.since }, prevCtx(prev));
    if (prev.screen === 'pfbuy' && to !== 'pfdone') track('purchase_abandoned', Object.assign({ last_value: pbCtx.last, had_error: pbCtx.hadError, time_on_screen_ms: now - prev.since, to_screen: to }, pbCtx.info), prevCtx(prev));
    if (prev.screen === 'xfer' && to !== 'xferdone') track('transfer_abandoned', { last_value: xfCtx.last, had_error: xfCtx.hadError, time_on_screen_ms: now - prev.since, to_screen: to }, prevCtx(prev));
  }
  function purchaseInfo() {
    const opt = pbIsOpt(), info = { product_type: opt ? 'option' : 'named_portfolio', product_id: opt ? optionId() : portfolioId(), product_name: tc('#pb-iname') };
    if (opt) { const on = q('#pb-top .pb-seg .on'); info.direction = on ? on.dataset.pbDir : null; }
    return info;
  }
  function purchaseCalc() {
    const v = num(q('#pb-input').value);
    return pbIsOpt() ? { qty: v, unit: 'contracts', price: num(tc('#pb-price')), amount: num(tc('#pb-sumv')), fee: num(tc('#pb-fee')), total: num(tc('#pb-tot')), win_payout: num(tc('#pb-win')) }
      : { amount: v, unit: 'usd', qty: num(tc('#pb-qty')), fee: num(tc('#pb-fee')), total: num(tc('#pb-tot')) };
  }
  const pbMin = () => pbIsOpt() ? (window.PBOPT || {}).min : (((window.PFD || {})[portfolioId()] || {}).pbuy || {}).min;
  function pbError() {
    const a = q('#pb-amount'); if (!a || a.dataset.err !== '1') return '';
    const raw = q('#pb-input').value, v = num(raw), min = pbMin();
    return !raw ? 'empty' : min != null && v < min ? 'min' : 'max';
  }
  function xferInfo() {
    const from = tc('#xf-cur') === '₸' ? 'KZT' : 'USD', m = /-\s*(\S+)/.exec(tc('#xf-ta'));
    return { platform: m ? m[1] : null, from, to: from === 'USD' ? 'KZT' : 'USD', balance_from: num(tc('#xf-ba')), balance_to: num(tc('#xf-bb')) };
  }
  function xfError() {
    const a = q('#xf-amount'); if (!a || a.dataset.err !== '1') return '';
    const raw = q('#xf-input').value, v = num(raw), min = num(tc('#xf-hint'));
    return !raw ? 'empty' : min != null && v < min ? 'min' : 'max';
  }
  function errCheck(kind) {
    const pb = kind === 'pb', c = pb ? pbCtx : xfCtx, e = pb ? pbError() : xfError();
    if (e && e !== c.err) {
      c.hadError = true;
      const trigger = performance.now() - c.submitAt < 400 ? 'submit' : 'blur';
      if (pb) track('purchase_validation_failed', Object.assign({ error: e, value: num(q('#pb-input').value), min: pbMin(), free_balance: num(tc('#pb-acc')), trigger }, purchaseInfo()));
      else { const i = xferInfo(); track('transfer_validation_failed', { error: e, value: num(q('#xf-input').value), min: num(tc('#xf-hint')), balance_from: i.balance_from, currency: i.from, trigger }); }
    }
    c.err = e;
  }
  function productOf(scr, ent) {
    if (scr === 'note') return { product_type: 'structured_note', product_id: NOTE_ID, product_name: (window.NOTE || {}).title };
    if (scr === 'advisory') return { product_type: 'advisory', product_id: 'advisory' };
    if (scr === 'pfdetail') return { product_type: 'named_portfolio', product_id: ent[1], product_name: tc('#screen-pfdetail .note-nav b') };
    if (scr === 'stock' && ent[0] === 'option') return { product_type: 'option', product_id: ent[1], product_name: tc('#st-title'), underlying: tc('#st-sub') };
    return null;
  }
  function onEnter(scr, prev, trigger, tap) {
    const forward = trigger === 'tap' || trigger === 'tabbar' || trigger === 'initial';
    const product = productOf(scr, cur.ent);
    if (product && forward && prev.screen !== 'pfbuy') {
      track('product_opened', Object.assign(product, { source_screen: prev.screen, source_block: tap ? tap.block : undefined, source_element: tap ? tap.id : undefined, section: tap ? tap.section : undefined, position: tap ? tap.position : undefined }));
    }
    if (scr === 'pfbuy' && prev.screen !== 'pfbuy') {
      Object.assign(pbCtx, { at: Date.now(), err: '', hadError: false, last: null, info: purchaseInfo() });
      track('purchase_started', Object.assign({ source: prev.screen === 'pfheld' ? 'held_portfolio' : 'product_page', free_balance: num(tc('#pb-acc')) }, pbCtx.info));
    }
    if (scr === 'xfer' && prev.screen !== 'xfer') {
      Object.assign(xfCtx, { at: Date.now(), err: '', hadError: false, last: null });
      track('transfer_started', xferInfo());
    }
    if (scr === 'search' && prev.screen !== 'note' && prev.screen !== 'stock') { search.from = prev.screen; search.last = ''; search.hadTap = false; }
  }

  // ---------- Шторка, снекбар, пуш и экран результата опциона ----------
  function sheetCheck() {
    const s = q('#sheet'), hasOpen = s.classList.contains('open');
    if (s.hidden) sheet.closing = false;
    if (!sheet.open && !s.hidden && (hasOpen || !sheet.closing)) {
      const tap = recentTap();
      Object.assign(sheet, { open: true, saw: hasOpen, id: sheetId(), at: Date.now() });
      const props = { sheet_id: sheet.id, title: tc('#sheet .sh-head h2'), source_element: tap ? tap.id : undefined };
      if (sheet.id === 'balance') props.currency = tc('#sheet .bal-cur b').replace(/^Баланс\s*/, '');
      track('sheet_opened', props);
    } else if (sheet.open && hasOpen) sheet.saw = true;
    else if (sheet.open && sheet.saw && !hasOpen) {
      const tap = recentTap(1500), el = tap && tap.el, id = sheet.id, ms = Date.now() - sheet.at;
      const row = el && el.closest && el.closest('.sh-row');
      const method = row ? 'option' : el && el.matches && el.matches('[data-close-sheet]') ? (el.classList.contains('sh-x') ? 'cross' : 'button') : tap && tap.block === 'scrim' ? 'scrim' : 'auto';
      const sel = row ? (row.dataset.plat || row.dataset.curOpt || row.dataset.themeOpt || row.dataset.balAct) : undefined;
      Object.assign(sheet, { open: false, saw: false, closing: true });
      track('sheet_closed', { sheet_id: id, close_method: method, selected_option: sel, open_ms: ms });
    }
  }
  function snackCheck(textChanged) {
    const el = q('#snack'), on = el.classList.contains('open'), text = tc('.sn-text', el);
    if (on && (!snack.open || textChanged)) {
      const tap = recentTap(1500);
      Object.assign(snack, { open: true, at: Date.now(), perf: performance.now(), ok: el.classList.contains('ok'), text });
      track('snackbar_shown', { kind: snack.ok ? 'success' : 'stub', text, source_element: tap ? tap.id : undefined, source_text: tap ? tap.text : undefined });
    } else if (!on && snack.open) {
      const tap = recentTap(600), ms = Date.now() - snack.at;
      snack.open = false;
      track('snackbar_dismissed', { method: tap && tap.id === 'snackbar.ok' ? 'button' : Date.now() - cur.since < 300 ? 'navigation' : ms >= 4700 ? 'timeout' : 'other', shown_ms: ms, text: snack.text });
    }
  }
  let push = { on: false, at: 0, tapped: false, info: null };
  function pushCheck() {
    const el = q('#optpush'), on = !el.hidden && el.classList.contains('in');
    if (on && !push.on) {
      push = { on: true, at: Date.now(), tapped: false, info: { result: el.dataset.win === '1' ? 'win' : 'lose', title: tc('.opp-t', el) } };
      track('option_push_shown', Object.assign({ system: true }, push.info));
    } else if (push.on && !on) {
      if (!push.tapped) track('option_push_expired', Object.assign({ system: true, shown_ms: Date.now() - push.at }, push.info));
      push.on = false;
    }
  }
  function resCheck() {
    const el = q('#optres'), on = !el.hidden && el.classList.contains('open');
    if (on && !res.on) {
      const tap = recentTap(1500);
      res.info = { result: /не сработал/i.test(tc('.pd-t', el)) ? 'lose' : 'win', option_name: tc('.pd-s', el), amount: num(tc('.pb-sr.t b:last-child', el)) };
      res.on = true; res.at = Date.now();
      track('option_result_viewed', Object.assign({ source: tap && tap.id === 'push.option_push' ? 'push' : 'home_event' }, res.info));
    } else if (!on && res.on) {
      const tap = recentTap(1500);
      res.on = false;
      track('option_result_closed', { action: tap && /buy_another$/.test(tap.id || '') ? 'buy_another' : 'close', view_ms: Date.now() - res.at, result: res.info.result });
    }
  }
  function settled(node) {
    const rec = optFifo.shift() || {};
    track('option_settled', Object.assign({ system: true, sim_id: node.dataset.simEv, result: /не сработал/i.test(tc('.t', node)) ? 'lose' : 'win', amount: num(tc('.v', node)) }, rec));
  }
  const scrub = {};
  function scrubCheck(el) {
    const key = el.classList.contains('pfh-bal') ? 'held_portfolio' : 'stock', on = el.classList.contains('scrub');
    if (on && !scrub[key]) scrub[key] = Date.now();
    else if (!on && scrub[key]) {
      const props = { chart: key, duration_ms: Date.now() - scrub[key] };
      if (key === 'stock') { props.range = chartRange(); props.mode = chartMode(); }
      scrub[key] = 0; track('chart_scrubbed', props);
    }
  }

  // Изменения, которые происходят сами по себе (таймеры, реакция на скролл) и не считаются результатом тапа
  const NOISE_SELF = '.phone, #cat-sticky, #cat-nav, #art-promo, #pf-nav, .st-ph, .pfh-bal, .hscroll, #snack, #sheet, #sheet-scrim, #optpush, #optres';
  const NOISE_IN = '#snack, .opt-hold, #optpush, #n1a-debug';
  const mo = new MutationObserver((recs) => {
    let screenDirty = false, snackDirty = false, snackText = false, sheetDirty = false, pushDirty = false, resDirty = false;
    for (const r of recs) {
      const el = r.target.nodeType === 1 ? r.target : r.target.parentElement;
      if (!el) continue;
      const attr = r.type === 'attributes' ? r.attributeName : null;
      if (!el.closest(NOISE_IN) && !(attr && el.matches(NOISE_SELF)) && !(r.type === 'childList' && el.classList.contains('events'))) lastMutation = performance.now();
      if (attr) {
        if (el.id === 'screen-login' || el.id === 'screen-stock' || (attr === 'hidden' && el.classList.contains('screen')) || attr === 'data-o') screenDirty = true;
        if (el.id === 'sheet') sheetDirty = true;
        else if (el.id === 'snack') snackDirty = true;
        else if (el.id === 'optpush') pushDirty = true;
        else if (el.id === 'optres') resDirty = true;
        else if (el.id === 'art-promo' && attr === 'class' && el.classList.contains('show') && !view.promo) { view.promo = true; track('article_promo_shown', { article_id: articleId() }); }
        else if (attr === 'class' && (el.classList.contains('st-ph') || el.classList.contains('pfh-bal'))) scrubCheck(el);
        else if (attr === 'data-err') errCheck(el.id === 'pb-amount' ? 'pb' : 'xf');
      } else if (r.type === 'childList') {
        if (el.classList.contains('sn-text')) { snackDirty = true; snackText = true; }
        if (el.classList.contains('events')) r.addedNodes.forEach((n) => { if (n.nodeType === 1 && n.dataset.simEv) settled(n); });
      }
    }
    if (screenDirty) checkScreen();
    if (sheetDirty) sheetCheck();
    if (snackDirty) snackCheck(snackText);
    if (pushDirty) pushCheck();
    if (resDirty) resCheck();
  });
  mo.observe(phone, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'class', 'aria-expanded', 'aria-checked', 'aria-pressed', 'data-err', 'data-o', 'data-win'] });
  window.addEventListener('popstate', () => { lastHistAt = performance.now(); }, true);
  window.addEventListener('hashchange', () => { if (!recentTap(600)) lastHistAt = performance.now(); defer(checkScreen); }, true);

  // «Сразу после обработчиков прототипа»: задача через MessageChannel, а не setTimeout — таймеры браузер может придерживать
  const deferQ = [], mc = window.MessageChannel ? new MessageChannel() : null;
  if (mc) mc.port1.onmessage = () => { deferQ.splice(0).forEach((fn) => { try { fn(); } catch (e) { if (DEBUG) console.error('[N1A]', e); } }); };
  const defer = (fn) => { if (mc) { deferQ.push(fn); mc.port2.postMessage(0); } else setTimeout(fn, 0); };

  // ---------- Осмысленные действия по клику (слои 2 и 3) ----------
  // Слушатель на window в фазе перехвата срабатывает раньше обработчиков прототипа: до — снимаем состояние, после (post) — читаем результат
  window.addEventListener('click', (e) => {
    const t = e.target;
    if (!e.isTrusted || !(t instanceof Element) || !phone.contains(t) || inDebug(t)) return; // isTrusted: прототип иногда сам «нажимает» элементы — это не действие человека
    if (performance.now() - dragAt < 80) return; // щелчок после перетаскивания ленты прототип гасит сам
    if (q('#note-hint')) return; // при открытой подсказке любой тап только закрывает её
    const scr = curScreen(), tab0 = curTab(scr), t0 = performance.now();
    const post = defer;
    const on = (sel, fn) => { const m = t.closest(sel); if (m && phone.contains(m)) fn(m); };

    post(() => { // смена вкладки или фильтра каталога
      if (curScreen() !== scr) return;
      const tab1 = curTab(scr);
      if (!tab1 || !tab0 || tab1.id === tab0.id) return;
      cur.tab = tab1.id; view = { depth: {}, car: {}, pan: {}, promo: view.promo };
      if (scr === 'catalog') track('catalog_filter_changed', { filter: tab1.id, prev_filter: tab0.id, results_count: qa('#cat-list .instr').length });
      else track('tab_selected', { tab_id: tab1.id, tab_name: tab1.name, prev_tab: tab0.id, trigger: t.closest('.note-chip, .st-chip, .pfd-chip, .chip-tab') ? 'chip' : 'link' });
    });
    on('.cond[data-hint]', (c) => post(() => { if (q('#note-hint')) track('hint_opened', { hint_key: c.dataset.hint, label: tc('.lb span', c) }); }));
    on('[data-acc]', (b) => post(() => track('accordion_toggled', { section: sectionOf(b), question: tc(q('b', b)), state: b.getAttribute('aria-expanded') === 'true' ? 'open' : 'closed' })));
    on('[data-toggle]', (b) => post(() => { const card = b.closest('.pf-card'); if (card) track('platform_list_toggled', { platform: tc('.plat span', card), state: card.classList.contains('open') ? 'open' : 'closed' }); }));

    // бумаги, новости, баннеры
    on('.instr', (r) => {
      if (r.matches('.st-logo, .op-ih') || r.closest('.pf-named')) return;
      const name = tc('.name', r), sub = tc('.ticker', r);
      const cat = ((window.CATALOG || {}).items || []).filter((i) => i.name === name)[0];
      const p = { name, ticker: /^[A-Z0-9.]{1,8}$/.test(sub) ? sub : cat ? cat.ticker : ((window.STOCK || {}).byName || {})[name] || undefined, subtitle: sub || undefined, price: tc('.price', r) || undefined,
        list_id: blockOf(r) || undefined, section: sectionOf(r) || undefined, group: groupOf(r) || undefined, position: positionOf(r) || undefined };
      if (r.classList.contains('opt-hold')) p.held_option = true;
      if (scr === 'search') { p.search_query = q('#srch-q').value.slice(0, 100); search.hadTap = true; }
      const ev = reserve('instrument_tapped');
      post(() => { const s1 = curScreen(); p.is_available = s1 !== scr && (s1 === 'stock' || s1 === 'note'); Object.assign(ev.props, p); commit(ev); });
    });
    on('[data-news], .news-item', (n) => {
      const p = { article_id: n.dataset.news || null, title: tc(q('.title, .bottom b', n)), source: tc(q('.meta b', n)), block: nameOf(n), section: sectionOf(n) || undefined, position: positionOf(n) || undefined };
      if (scr === 'news' && tab0) p.news_tab = tab0.id;
      const ev = reserve('news_tapped');
      post(() => { p.is_available = scr !== 'article' && curScreen() === 'article'; Object.assign(ev.props, p); commit(ev); });
    });
    on('.main-banner, .product, .promo, .great, .hero-prod, .pcard, .pfcar, .advisory, .lesson, .mcell, .adv-exp[data-pfn-open]', (b) => {
      const p = { placement: blockOf(b) || nameOf(b), kind: nameOf(b), title: labelOf(b), section: sectionOf(b) || undefined, position: positionOf(b) || undefined };
      const ev = reserve('banner_tapped');
      post(() => { const s1 = curScreen(); p.target = s1 !== scr ? s1 : snack.perf > t0 ? 'stub' : 'none'; Object.assign(ev.props, p); commit(ev); });
    });
    on('[data-doc], .mr-doc', (d) => track('document_tapped', { doc_title: labelOf(d), section: sectionOf(d) || undefined }));
    on('[data-promo]', () => track('article_promo_tapped', { article_id: articleId() }));

    // страница бумаги и опциона
    on('.st-range', (b) => track('stock_chart_range_changed', { ticker: tc('#st-sub'), range: b.dataset.rg }));
    on('#st-mode', () => post(() => track('stock_chart_mode_changed', { ticker: tc('#st-sub'), mode: chartMode() })));
    on('#st-fav', () => post(() => {
      const ent = curEntity('stock'), state = q('#st-fav').getAttribute('aria-pressed') === 'true';
      counters.favorites[ent.join(':')] = state;
      track('favorite_toggled', { entity_type: ent[0], entity_id: ent[1], state: state ? 'on' : 'off' });
    }));
    on('#st-more', () => track('stock_news_expanded', { ticker: tc('#st-sub') }));
    on('[data-bk-dir]', (b) => track('orderbook_direction_changed', { option_id: optionId(), direction: b.dataset.bkDir }));
    on('[data-st-trade]', (b) => {
      const sell = b.classList.contains('sell');
      if (isOptStock()) track('product_buy_tapped', { product_type: 'option', product_id: optionId(), direction: sell ? 'down' : 'up', result: 'purchase_opened' });
      else track('trade_tapped', { ticker: tc('#st-sub'), side: sell ? 'sell' : 'buy', result: 'stub' });
    });

    // продукты и покупка
    on('[data-buy]', () => track('product_buy_tapped', { product_type: 'structured_note', product_id: NOTE_ID, result: 'stub' }));
    on('[data-adv-apply]', () => track('product_buy_tapped', { product_type: 'advisory', product_id: 'advisory', result: 'stub' }));
    on('[data-pfd-buy]', () => track('product_buy_tapped', { product_type: 'named_portfolio', product_id: portfolioId(), source: 'product_page', result: 'purchase_opened' }));
    on('[data-pfh-buy]', () => track('product_buy_tapped', { product_type: 'named_portfolio', product_id: portfolioId(), source: 'held_portfolio', result: 'purchase_opened' }));
    on('[data-pfh-sell]', () => track('product_sell_tapped', { product_type: 'named_portfolio', product_id: portfolioId(), result: 'stub' }));
    on('[data-pb-dir]', (b) => post(() => { pbCtx.info = purchaseInfo(); track('purchase_direction_changed', Object.assign({ price: num(tc('#pb-hint')) }, pbCtx.info, { direction: b.dataset.pbDir })); }));
    on('[data-pb-step]', (b) => post(() => amountChanged(q('#pb-input'), +b.dataset.pbStep > 0 ? 'stepper_plus' : 'stepper_minus')));
    on('[data-pb-buy]', () => {
      const ev = reserve('purchase_submitted'), info = purchaseInfo(), calc = purchaseCalc();
      pbCtx.submitAt = performance.now();
      post(() => {
        const ok = curScreen() === 'pfdone';
        Object.assign(ev.props, info, calc, { result: ok ? 'success' : 'error', error: ok ? undefined : pbError() || 'invalid' });
        commit(ev);
        if (!ok) return;
        const key = info.product_type + ':' + info.product_id + ':' + (info.direction || ''), repeat = (counters.bought[key] || 0) > 0;
        counters.bought[key] = (counters.bought[key] || 0) + 1; counters.purchases += 1;
        if (info.product_type === 'option') optFifo.push({ option_id: info.product_id, direction: info.direction, qty: calc.qty, invested: calc.amount });
        track('purchase_completed', Object.assign({}, info, calc, { balance_after: num(tc('#pb-acc')), is_repeat: repeat, time_to_buy_ms: Date.now() - pbCtx.at }));
      });
    });

    // портфель и перевод
    on('[data-cur-opt]', (b) => track('portfolio_currency_changed', { currency: b.dataset.curOpt }));
    on('[data-bal-act]', (b) => track('balance_action_tapped', { action: ({ topup: 'topup', xfer: 'transfer', out: 'withdraw' })[b.dataset.balAct] || b.dataset.balAct, platform: tc('#sheet .sh-head h2'), currency: tc('#sheet .bal-cur b').replace(/^Баланс\s*/, ''), is_available: b.dataset.balAct === 'xfer' }));
    on('[data-xf-swap]', () => post(() => { const i = xferInfo(); track('transfer_accounts_swapped', { from: i.from, to: i.to }); }));
    on('[data-xf-go]', () => {
      const ev = reserve('transfer_submitted'), i = xferInfo(), v = num(q('#xf-input').value), recv = num(tc('#xf-r2v'));
      xfCtx.submitAt = performance.now();
      post(() => {
        const ok = curScreen() === 'xferdone';
        Object.assign(ev.props, { platform: i.platform, value: v, currency_from: i.from, currency_to: i.to, result: ok ? 'success' : 'error', error: ok ? undefined : xfError() || 'invalid' });
        commit(ev);
        if (!ok) return;
        counters.transfers += 1;
        track('transfer_completed', { platform: i.platform, amount_from: v, currency_from: i.from, amount_to: recv, currency_to: i.to, rate: (window.PFMONEY || {}).rate, time_to_transfer_ms: Date.now() - xfCtx.at });
      });
    });

    // каталог, поиск, настройки, опцион после покупки
    on('[data-plat]', (b) => track('catalog_platform_changed', { platform: b.dataset.plat }));
    on('#srch-clear', () => track('input_cleared', { field_id: 'search.query', prev_value: q('#srch-q').value.slice(0, 100) }));
    on('[data-back="search"]', () => track('search_closed', { last_query: search.last, had_result_tap: search.hadTap, source_screen: search.from }));
    on('[data-mr-sw]', (b) => post(() => track('setting_toggled', { setting: tc('.mr-t b', b.closest('.mr-row')), value: b.getAttribute('aria-checked') === 'true' })));
    on('[data-theme-opt]', (b) => { ss.set('n1a-reload', 'theme_change|' + Date.now()); track('theme_changed', { theme: b.dataset.themeOpt }); persistNow(); }); // на телефоне страница сразу перезагрузится
    on('[data-logout]', () => track('logout_completed', {}));
    on('#optpush', () => { if (push.on && !push.tapped) { push.tapped = true; track('option_push_tapped', Object.assign({ shown_ms: Date.now() - push.at }, push.info)); } });
  }, true);

  // ---------- Поля ввода (номер телефона на экране входа не записывается) ----------
  const FIELDS = { 'srch-q': () => 'search.query', 'pb-input': () => pbIsOpt() ? 'pfbuy.qty' : 'pfbuy.amount', 'xf-input': () => 'xfer.amount' };
  const inputs = {};
  const fieldOf = (el) => el && el.id && FIELDS[el.id] ? el : null;
  const fst = (el) => inputs[el.id] || (inputs[el.id] = { focusAt: 0, timer: 0, method: 'keyboard', last: undefined });
  const fieldValue = (el) => el.id === 'srch-q' ? el.value.slice(0, 100) : num(el.value);
  function amountChanged(el, method) {
    const s = fst(el), id = FIELDS[el.id](), value = fieldValue(el);
    clearTimeout(s.timer); s.timer = 0;
    if (method) s.method = method;
    if (value === s.last && !method) return;
    s.last = value;
    track('input_changed', { field_id: id, value, value_length: String(el.value).length, method: s.method });
    if (el.id === 'srch-q') {
      search.last = value;
      if (value.trim()) { const found = window.SEARCH && SEARCH.find ? SEARCH.find(value).length : qa('#srch-body .scell').length; track('search_query_entered', { query: value, query_length: value.length, results_count: found, has_results: found > 0, source_screen: search.from }); }
    } else if (el.id === 'pb-input') {
      pbCtx.last = value;
      track('purchase_amount_changed', Object.assign({ value, method: s.method }, purchaseCalc(), purchaseInfo()));
    } else if (el.id === 'xf-input') {
      xfCtx.last = value; const i = xferInfo();
      track('transfer_amount_changed', { value, currency: i.from, calc_receive: num(tc('#xf-r2v')), currency_to: i.to });
    }
  }
  window.addEventListener('focusin', (e) => { const el = fieldOf(e.target); if (!el) return; fst(el).focusAt = Date.now(); track('input_focused', { field_id: FIELDS[el.id]() }); }, true);
  window.addEventListener('input', (e) => {
    const el = fieldOf(e.target); if (!el) return;
    const s = fst(el); s.method = e.inputType === 'insertFromPaste' ? 'paste' : 'keyboard';
    clearTimeout(s.timer); s.timer = setTimeout(() => amountChanged(el), CFG.inputDebounceMs);
  }, true);
  window.addEventListener('focusout', (e) => {
    const el = fieldOf(e.target); if (!el) return;
    const s = fst(el), id = FIELDS[el.id]();
    if (s.timer) amountChanged(el);
    const ev = reserve('input_blurred');
    defer(() => { // проверка суммы в прототипе срабатывает на потере фокуса — читаем её результат после
      const err = el.id === 'pb-input' ? pbError() : el.id === 'xf-input' ? xfError() : '';
      Object.assign(ev.props, { field_id: id, value: fieldValue(el), time_in_field_ms: s.focusAt ? Date.now() - s.focusAt : undefined });
      if (el.id !== 'srch-q') ev.props.validation = !el.value ? 'empty' : err || 'ok';
      commit(ev);
    });
  }, true);

  // ---------- Скролл: глубина экрана, ленты, история графика ----------
  ['wheel', 'touchmove', 'keydown'].forEach((t) => window.addEventListener(t, () => { lastIntentAt = performance.now(); }, { capture: true, passive: true }));
  const carTimers = new WeakMap();
  const scrollKey = (el) => el.id || String(el.className).split(' ').filter((c) => c && c !== 'hscroll' && c !== 'screen' && c !== 'chiprow')[0] || 'scroll';
  document.addEventListener('scroll', (e) => {
    const el = e.target;
    if (!(el instanceof Element) || !phone.contains(el) || inDebug(el)) return;
    const now = performance.now(); lastScrollAt = now;
    if (now - lastIntentAt > 3000) return; // прокрутку вызвал сам прототип, а не человек
    if (el.classList.contains('st-chart')) { // история на графике
      const max = el.scrollWidth - el.clientWidth; if (max <= 0) return;
      const key = el.id, off = Math.round((1 - el.scrollLeft / max) * 100), v = view.pan[key] || (view.pan[key] = { max: 0, sent: 0, timer: 0 });
      v.max = Math.max(v.max, off);
      clearTimeout(v.timer);
      v.timer = setTimeout(() => { if (v.max - v.sent >= 5) { v.sent = v.max; track('chart_panned', { chart: key === 'st-chart' ? 'stock' : key === 'op-chart' ? 'option' : 'held_portfolio', max_offset_pct: v.max }); } }, 500);
      return;
    }
    if (el.scrollWidth - el.clientWidth > 8 && (el.classList.contains('hscroll') || el.scrollHeight - el.clientHeight <= 8)) { // горизонтальная лента
      clearTimeout(carTimers.get(el));
      carTimers.set(el, setTimeout(() => {
        if (!el.isConnected) return;
        const right = el.getBoundingClientRect().right - 12, kids = el.children, key = scrollKey(el);
        let pos = 0;
        for (let i = 0; i < kids.length; i++) if (kids[i].getBoundingClientRect().left < right) pos = i + 1;
        if (pos > (view.car[key] || 0)) { view.car[key] = pos; track('carousel_scrolled', { carousel_id: key, section: sectionOf(el) || undefined, max_position: pos, items_total: kids.length }); }
      }, 400));
      return;
    }
    if (el.scrollHeight - el.clientHeight < 40) return; // вертикальная прокрутка экрана
    const key = scrollKey(el), pct = Math.min(100, Math.round((el.scrollTop + el.clientHeight) / el.scrollHeight * 100));
    const v = view.depth[key] || (view.depth[key] = { hit: 0, max: 0 });
    v.max = Math.max(v.max, pct);
    const m = pct >= 99 ? 100 : pct >= 75 ? 75 : pct >= 50 ? 50 : pct >= 25 ? 25 : 0;
    if (m > v.hit && el.scrollTop > 8) { v.hit = m; track('scroll_depth_reached', { depth_pct: m, container: key }); }
  }, { capture: true, passive: true });

  // ---------- Жизненный цикл страницы ----------
  let hiddenAt = 0, shownAt = Date.now(), errors = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = Date.now(); finalizeTap(); track('app_backgrounded', { visible_ms: hiddenAt - shownAt }); flush(true); persistNow(); }
    else { shownAt = Date.now(); track('app_foregrounded', { hidden_ms: hiddenAt ? shownAt - hiddenAt : undefined }); }
  });
  window.addEventListener('pagehide', () => { finalizeTap(); flush(true); persistNow(); }); // сначала отдаём браузеру, потом сохраняем остаток очереди
  window.addEventListener('error', (e) => { if (errors++ < 10) track('js_error', { message: clean(e.message, 200), source: clean(String(e.filename || '').split('/').pop(), 60), line: e.lineno, col: e.colno }); });

  // ---------- Режим отладки: ?debug=1 ----------
  let dbg = null;
  function dbgStatus() {
    if (!dbg) return;
    dbg.status.textContent = !sendEnabled ? 'отправка выключена: не задан адрес бэкенда' : `отправлено ${stat.sent} · в очереди ${queue.length}` + (stat.lastError && backoff ? ` · ошибка: ${stat.lastError}` : '');
    dbg.count.textContent = log.length;
  }
  function dbgAdd(ev) {
    if (!dbg) return;
    try { console.log('[N1A]', ev.event_type, ev.props, ev); } catch (e) {}
    const row = document.createElement('div');
    row.className = 'r l' + ev.layer;
    const d = new Date(ev.time), p2 = (n) => String(n).padStart(2, '0'), brief = JSON.stringify(ev.props);
    row.innerHTML = '<div class="h"><i></i><b></b><span class="s"></span><time></time></div><div class="p"></div><pre hidden></pre>';
    row.querySelector('b').textContent = ev.event_type;
    row.querySelector('.s').textContent = ev.screen + (ev.screen_tab ? '/' + ev.screen_tab : '');
    row.querySelector('time').textContent = `${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
    row.querySelector('.p').textContent = brief.length > 2 ? brief : '';
    row.addEventListener('click', () => { const pre = row.querySelector('pre'); pre.textContent = JSON.stringify(ev, null, 2); pre.hidden = !pre.hidden; });
    // событие тапа фиксируется позже своего времени — вставляем по порядковому номеру, новые сверху
    let before = dbg.list.firstChild;
    while (before && +before.dataset.seq > ev.seq) before = before.nextSibling;
    row.dataset.seq = ev.seq;
    dbg.list.insertBefore(row, before);
    while (dbg.list.children.length > 400) dbg.list.lastChild.remove();
    dbgStatus();
  }
  if (DEBUG) {
    const box = document.createElement('div');
    box.id = 'n1a-debug';
    box.innerHTML = `<style>
      #n1a-debug{position:fixed;z-index:99999;right:0;top:0;bottom:0;width:380px;display:flex;flex-direction:column;background:#101418;color:#e6e9ee;font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;box-shadow:-2px 0 16px rgba(0,0,0,.3)}
      #n1a-debug.min{bottom:auto;height:auto}#n1a-debug.min .list{display:none}
      #n1a-debug header{display:flex;gap:6px;align-items:center;padding:8px 10px;background:#1a2027;font-family:system-ui,sans-serif}
      #n1a-debug header b{flex:1;font-size:13px}#n1a-debug header button{font:12px system-ui,sans-serif;color:#e6e9ee;background:#2a323c;border:0;border-radius:6px;padding:5px 8px;cursor:pointer}
      #n1a-debug .st{padding:4px 10px;color:#9aa5b1;background:#151a20;font-family:system-ui,sans-serif}
      #n1a-debug .list{flex:1;overflow:auto;overscroll-behavior:contain}
      #n1a-debug .r{padding:6px 10px;border-bottom:1px solid #222a33;cursor:pointer}
      #n1a-debug .h{display:flex;gap:6px;align-items:baseline}#n1a-debug .h b{font-weight:600}#n1a-debug .h .s{flex:1;color:#8b96a3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#n1a-debug time{color:#6b7682}
      #n1a-debug .h i{width:7px;height:7px;border-radius:50%;flex:none;align-self:center;background:#6b7682}#n1a-debug .l2 .h i{background:#4c9bf5}#n1a-debug .l3 .h i{background:#35c27a}#n1a-debug .l3 .h b{color:#7ee2ac}
      #n1a-debug .p{color:#9aa5b1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#n1a-debug pre{margin:6px 0 0;white-space:pre-wrap;word-break:break-word;color:#cfd6de}
      @media (min-width:901px){body{padding-right:380px}}
      @media (max-width:900px){#n1a-debug{left:0;top:auto;width:auto;height:42vh}#n1a-debug.min{height:auto}}
    </style><header><b>События · <span class="cnt">0</span></b><button data-a="dl">Скачать</button><button data-a="clr">Очистить</button><button data-a="min">Свернуть</button></header><div class="st"></div><div class="list"></div>`;
    document.body.appendChild(box);
    dbg = { list: box.querySelector('.list'), status: box.querySelector('.st'), count: box.querySelector('.cnt') };
    box.querySelector('header').addEventListener('click', (e) => {
      const a = e.target.dataset.a;
      if (a === 'min') { const m = box.classList.toggle('min'); e.target.textContent = m ? 'Развернуть' : 'Свернуть'; }
      if (a === 'clr') { dbg.list.textContent = ''; log.length = 0; dbgStatus(); }
      if (a === 'dl') {
        const url = URL.createObjectURL(new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' })), link = document.createElement('a');
        link.href = url; link.download = `n1a-events-${new Date().toISOString().replace(/[:.]/g, '-')}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
    });
    if (!sendEnabled) console.warn('[N1A] События не отправляются: укажите адрес бэкенда в data-endpoint тега <script src="analytics.js">');
  }

  // ---------- Старт ----------
  const nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {};
  const mark = String(ss.get('n1a-reload') || '').split('|'); ss.del('n1a-reload');
  const reloadReason = mark[0] && Date.now() - Number(mark[1]) < 5000 ? mark[0] : null;
  track('app_loaded', { is_reload: nav.type === 'reload' || !!reloadReason, reload_reason: reloadReason || (nav.type === 'reload' ? 'manual' : undefined), load_ms: nav.domContentLoadedEventEnd ? Math.round(nav.domContentLoadedEventEnd) : undefined, queued_from_last_visit: queue.length || undefined });
  sheetCheck(); checkScreen(true); dbgStatus();
  setTimeout(flush, 800);

  window.N1A = {
    config: CFG, track: (type, props) => track(String(type), props), flush: () => flush(),
    identify: (id) => { if (/^[\w-]{1,64}$/.test(String(id))) { userId = String(id); ls.set('n1a-user', userId); } return userId; },
    get log() { return log.slice(); }, get queue() { return queue.slice(); }, get stat() { return Object.assign({ sending: sendEnabled }, stat); },
  };
})();
