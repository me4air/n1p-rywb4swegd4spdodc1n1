(function () {
  const D = window.DATA, A = 'assets/';
  const $ = (id) => document.getElementById(id);
  const tag = ([kind, text]) => `<span class="tag ${kind}">${text}</span>`;
  const header = (text, chevron = true, go = '') => `
    <${chevron ? 'button' : 'div'} class="header ${chevron ? 'tap' : ''}" ${go ? `data-go="${go}"` : ''}>
      <h2>${text}</h2>${chevron ? `<img src="${A}imgChevronForwardM.svg" alt="">` : ''}
    </${chevron ? 'button' : 'div'}>`;

  const mainBanner = (b) => `
    <a class="main-banner tap">
      <div class="bg" style="background:${b.bg}">${b.bgImg ? `<img src="${A}${b.bgImg.src}" style="position:absolute;max-width:none;${b.bgImg.style}" alt="">` : ''}</div>
      <div class="row">
        <div class="text"><b>${b.title.join('<br>')}</b><span>${b.sub}</span></div>
        <div class="img"><div>${b.img ? `<img src="${A}${b.img}" style="${b.imgStyle}" alt="">` : ''}</div></div>
      </div>
    </a>`;

  const event = (e) => `
    <button class="card event tap">
      <div class="m"><span>${e.top}</span>${e.topRight ? `<span>${e.topRight}</span>` : ''}</div>
      <div class="t">${e.title}</div>
      <div class="v" style="color:var(--content-${e.color})">${e.value}</div>
    </button>`;

  function tileLogo(l) { return tileLogoImpl(l); }
  const tileLogoImpl = (l) => `<span class="logo tile" style="background:${l.bg};padding:${l.pad}px"><img src="${A}${l.src}" alt="" class="${l.invert ? 'inv' : ''} ${l.crop || ''}"></span>`;
  const thumbHtml = (n) => n.img ? `<img class="thumb" src="${A}${n.img}" alt="">`
    : n.logo ? `<img class="thumb" src="${A}${n.logo}" alt="">`
    : n.thumb.bg ? `<span class="thumb tile">${tileLogo(n.thumb).replace('class="logo tile"', 'class="logo tile fill"')}</span>`
    : `<span class="thumb sq"><img class="${n.thumb.cls || ''}" src="${A}${n.thumb.src}" alt=""></span>`;
  const newsItem = (n) => `
    <div class="divider"></div>
    <button class="news-item tap">
      <div class="col">
        <div class="meta"><b>${n.src}</b><span>· ${n.time}</span></div>
        <div class="title">${n.title}</div>
        <div class="tags">${n.tags.map(tag).join('')}</div>
      </div>
      ${thumbHtml(n)}
    </button>`;

  const newsCardHtml = (n) => `
    <button class="nsmall news-item tap" data-news="${n.id || ''}">
      <div class="col">
        <div class="meta"><b>${n.src}</b><span>· ${n.time}</span></div>
        <div class="title">${n.title}</div>
        <div class="tags">${n.tags.map(tag).join('')}</div>
      </div>
      ${thumbHtml(n)}
    </button>`;
  // Новости на Главной и в Портфеле: большая карточка + отдельные карточки (Figma 104:26747 / 104:26765)
  const newsBlock = (N) => `
    <div class="news-herowrap"><button class="card news-herocard tap" data-news="${N.hero.id || ''}">
      <div class="news-hero">
        <img src="${A}${N.hero.img}" alt="">
        <div class="meta"><b>${N.hero.src}</b><span>· ${N.hero.time}</span></div>
        <div class="bottom"><b>${N.hero.title}</b><span class="tag info">${N.hero.tag}</span></div>
      </div>
      <div class="news-lead">
        <p>${N.lead.map(([k, t]) => (k === 'b' ? `<b>${t}</b>` : t)).join('')} <span class="rd">Читать дальше</span></p>
        <div class="tags">${N.leadTags.map(tag).join('')}</div>
      </div>
    </button></div>
    <div class="news-cards">${N.items.map(newsCardHtml).join('')}</div>`;

  const product = (p) => `
    <a class="product tap">
      <div class="card-bg" style="background:${p.bg}"></div>
      <div class="art"><img src="${A}${p.art}" style="${p.artStyle}" alt=""></div>
      <div class="shade">
        <div class="head"><b>${p.title.join('<br>')}</b><span class="promo-chip">${p.promo}</span></div>
        <div class="chips">${p.chips.map((c) => `<span class="chip">${c}</span>`).join('')}</div>
      </div>
    </a>`;

  const logoHtml = (l) => typeof l === 'string' ? `<img class="logo" src="${A}${l}" alt="">`
    : l.bg ? tileLogo(l) : `<span class="logo sq"><img class="${l.cls || ''}" src="${A}${l.src}" alt=""></span>`;
  const instr = (i) => `
    <button class="instr tap">
      ${typeof i.logo === 'string'
        ? `<img class="logo" src="${A}${i.logo}" alt="">`
        : `<span class="logo tile" style="background:${i.logo.bg};padding:${i.logo.pad}px"><img src="${A}${i.logo.src}" alt="" class="${i.logo.invert ? 'inv' : ''} ${i.logo.crop || ''}"></span>`}
      <div class="data">
        <div class="row"><span class="name">${i.name}</span><span class="price">${i.price}</span></div>
        <div class="row"><span class="ticker">${i.ticker}</span><span class="delta${i.neg ? ' neg' : ''}">${i.delta}</span></div>
      </div>
    </button>`;

  const lesson = (l) => `
    <a class="lesson tap">
      <div class="bg" style="background:${l.bg}"><img src="${A}${l.img}" style="${l.imgStyle}" alt=""></div>
      <span class="dur">${l.dur}</span>
      <div class="ttl">${l.title}</div>
    </a>`;

  const collectionsHtml = () => `<div class="hscroll collections">${D.collections.map((c) => `
      <div class="card collection"><h3>${c.title}</h3><div class="list">${c.items.map(instr).join('')}</div></div>`).join('')}</div>`;

  const n = D.news;
  $('screen-home').innerHTML = `
    <div class="profile-bar">
      <div class="profile-info">
        <div class="avatar"><img src="${A}imgEllipse662.svg" alt=""><span>${D.user.initials}</span></div>
        <div><div class="profile-name">${D.user.name}</div><div class="profile-role">${D.user.status}</div></div>
      </div>
      <button class="bell tap"><img src="${A}imgBellM.svg" alt=""><span class="badge">${D.user.unread}</span></button>
    </div>

    <div class="search-row"><label class="search tap" data-go="search"><img src="${A}imgMagnifierM.svg" alt=""><input type="text" placeholder="Название, тикер или isin" readonly tabindex="-1"></label></div>

    <div class="hscroll banners">${D.mainBanners.map(mainBanner).join('')}</div>

    <div class="section-pad">
      <button class="card balance tap" data-go="portfolio">
        <div class="l1"><span>${D.balance.label}</span><span>${D.balance.venues}</span></div>
        <div class="l2"><span class="t-h-l">${D.balance.total}</span><img src="${A}imgChevronForwardM.svg" alt=""></div>
        <div class="l3"><span class="tag success">${D.balance.delta}</span><span class="t-b-s">${D.balance.period}</span></div>
      </button>
    </div>

    <div class="hscroll events">${D.events.map(event).join('')}</div>

    ${header('Новости об инвестициях', true, 'news')}
    ${newsBlock(n)}

    ${header('Новое от N1broker', true, 'buy')}
    <div class="hscroll products">${D.products.map(product).join('')}</div>

    ${header('Подборки ценных бумаг', false)}
    ${collectionsHtml()}

    ${header('Advisory-сервис', false)}
    <div class="hscroll advisories">${D.advisory.map((x) => `
      <a class="advisory tap">
        <span class="who">${x.name}</span>
        <div class="bg" style="background:${x.bg}"></div><img src="${A}${x.img}" style="${x.imgStyle}" alt="">
        <div class="txt"><b>${x.title}</b><span>${x.sub}</span></div>
      </a>`).join('')}</div>

    ${header('Академия инвестиций')}
    <div class="hscroll academy">${D.lessons.map(lesson).join('')}</div>
    <div style="height:8px"></div>`;

  // ---------- Портфель ----------
  const P = D.portfolio, PN = P.news;
  const pfInstr = (i) => {
    const l = i.logo;
    const logo = typeof l === 'string'
      ? `<img class="logo" src="${A}${l}" alt="">`
      : l.bg ? tileLogo(l)
      : `<span class="logo sq"><img class="${l.cls || ''}" src="${A}${l.src}" alt=""></span>`;
    return `<button class="instr tap${i.extra ? ' extra' : ''}">${logo}
      <div class="data">
        <div class="row"><span class="name">${i.name}</span><span class="price">${i.price}</span></div>
        <div class="row"><span class="ticker">${i.qty}</span><span class="delta${i.neg ? ' neg' : ''}">${i.delta}</span></div>
      </div></button>`;
  };
  const platform = (p) => `
    <div class="card pf-card">
      <button class="pf-head tap">
        <div class="r1"><b>${p.amount}</b><span class="tag ${p.kind}">${p.delta}</span></div>
        <div class="plat"><span>${p.name}</span><i></i></div>
      </button>
      <div class="list">${p.items.map(pfInstr).join('')}</div>
      <div class="curs">${p.currencies.map((c) => `
        <button class="cur-row tap"><img src="${A}${c.flag}" alt=""><b>${c.name}</b><span>${c.amount}</span></button>`).join('')}</div>
      <button class="more-btn tap" data-toggle>Показать больше</button>
    </div>`;
  $('screen-portfolio').innerHTML = `
    <div class="section-pad">
      <div class="card pf-balance">
        <div class="top"><span class="t-h-l">${P.balance.total}</span><span class="cur-chip">${P.balance.currency}<i></i></span></div>
        <div class="meta"><span class="tag success">${P.balance.delta}</span><span class="t-b-s">${P.balance.period}</span></div>
      </div>
    </div>
    <div class="actions">${P.actions.map((x) => `
      <button class="abtn tap${x.primary ? ' primary' : ''}"><span class="b"><i style="--ic:url(${A}pf/${x.icon})"></i></span><span>${x.label}</span></button>`).join('')}</div>
    <div class="hscroll banners">${P.banners.map(mainBanner).join('')}</div>
    ${P.platforms.map(platform).join('')}
    <div class="pf-news">
      ${header('Новости о ваших инструментах', false)}
      ${newsBlock(PN)}
    </div>
    <div style="height:8px"></div>`;

  // ---------- Детальная новость (Figma 104:26920) ----------
  const AR = window.ARTICLE.diesel;
  const arText = (s) => s.replace(/\[([A-Z.]+)\]/g, '<b>[$1]</b>');
  $('screen-article').innerHTML = `
    <div class="art-nav"><button class="back tap" data-back="article" aria-label="Назад"><i></i></button><button class="share tap" aria-label="Поделиться"><i></i></button></div>
    <div class="art-scroll">
      <div class="art-hero"><img src="${A}${AR.hero}" alt=""></div>
      <div class="art-src"><span class="logo tile" style="background:#ff1a2d"><img src="${A}logos/kap.svg" alt="" style="display:none"><b style="color:#fff;font:600 28px/32px Roboto">K</b></span>
        <div><b>${AR.source}</b><span>${AR.time}</span></div></div>
      <div class="art-tags">${AR.tags.map((t, i) => `<span class="art-tag${i === 0 ? ' info' : ''}">${t}</span>`).join('')}</div>
      <h1 class="art-title">${AR.title}</h1>
      <div class="art-body">${AR.body.map((p) => `<p>${arText(p)}</p>`).join('')}</div>
      <h2 class="art-h">${AR.opinionTitle}</h2>
      <div class="art-body"><p>${AR.opinion}</p></div>
      <h2 class="art-h">${AR.relatedTitle}</h2>
      <div class="art-rel">${AR.related.map((i) => `
        <button class="instr tap">${catLogo(i.logo)}
          <div class="data">
            <div class="row"><span class="name">${i.name}</span><span class="price">${i.price}</span></div>
            <div class="row"><span class="ticker">${i.ticker}</span><span class="delta${i.neg ? ' neg' : ''}">${i.delta}</span></div>
          </div></button>`).join('')}</div>
    </div>`;

  // ---------- Снекбар (Figma 104:27393) ----------
  const snackEl = $('snack');
  const SN_LEN = 2 * Math.PI * 11;
  let snackT = [], snackLeft = 5;
  snackEl.innerHTML = `
    <div class="sn-box">
      <div class="sn-body">
        <span class="sn-timer"><svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="12" fill="#2a2a2a"/><circle class="arc" cx="12" cy="12" r="11" fill="none" stroke="#db3434" stroke-width="2" stroke-dasharray="${SN_LEN.toFixed(2)}" stroke-dashoffset="0" transform="rotate(-90 12 12)"/></svg><b id="sn-num">5</b></span>
        <span class="sn-text">${window.ARTICLE.snackText}</span>
      </div>
      <button class="sn-act tap" id="sn-act">Понятно</button>
    </div>`;
  function hideSnack() { snackT.forEach(clearTimeout); snackT.forEach(clearInterval); snackT = []; snackEl.classList.remove('open'); setTimeout(() => { if (!snackEl.classList.contains('open')) snackEl.hidden = true; }, 240); }
  function showSnack() {
    snackT.forEach(clearTimeout); snackT.forEach(clearInterval); snackT = [];
    const nav = document.querySelector('.bottomnav');
    snackEl.style.bottom = ((nav && nav.offsetParent ? nav.offsetHeight : 0) + 8) + 'px';
    const arc = snackEl.querySelector('.arc'); arc.style.transition = 'none'; arc.style.strokeDashoffset = '0';
    snackLeft = 5; $('sn-num').textContent = snackLeft;
    snackEl.hidden = false; void snackEl.offsetWidth; snackEl.classList.add('open');
    requestAnimationFrame(() => requestAnimationFrame(() => { arc.style.transition = 'stroke-dashoffset 5s linear'; arc.style.strokeDashoffset = SN_LEN.toFixed(2); }));
    snackT.push(setInterval(() => { snackLeft = Math.max(1, snackLeft - 1); $('sn-num').textContent = snackLeft; }, 1000));
    snackT.push(setTimeout(hideSnack, 5000));
  }
  $('sn-act').addEventListener('click', hideSnack);

  // ---------- Купить (Figma 98:15688) ----------
  const BY = window.BUY;
  const prodLogo = (l) => typeof l === 'string' ? `<img class="logo" src="${A}${l}" alt="">`
    : `<span class="logo tile" style="background:${l.bg};padding:${l.pad}px"><img src="${A}${l.src}" alt=""></span>`;
  const prodCard = (p) => `
    <div class="pc-wrap"><button class="card pcard tap">
      <span class="pl">${prodLogo(p.logo)}</span>
      <span class="pd">
        <span class="r1"><b>${p.name}</b><b class="y">${p.yieldTxt}</b></span>
        <span class="r2"><span>${p.min}</span><span>${p.period}</span></span>
        <span class="r3"><span class="th">${p.theme}</span><span>${p.rate}</span></span>
      </span></button></div>`;
  const menuCell = (icon, label, go = '') => `<button class="card mcell tap" ${go ? `data-go="${go}"` : ''}><span class="vb"><img src="${A}buy/vbox.svg" alt=""><i style="--ic:url(${A}buy/${icon}.svg)"></i></span><b>${label}</b></button>`;
  const hero = BY.hero;
  const recentItems = BY.recentIds.map((id) => window.SEARCH.by[id]);
  let buyTab = BY.tabs[0];
  const renderBuyProducts = () => {
    $('buy-products').innerHTML = BY.sets[buyTab].map(prodCard).join('');
    document.querySelectorAll('.buy-chip').forEach((c) => c.classList.toggle('selected', c.dataset.tab === buyTab));
  };
  $('screen-buy').innerHTML = `
    <div class="search-row"><label class="search tap" data-go="search"><img src="${A}imgMagnifierM.svg" alt=""><input type="text" placeholder="Название, тикер или isin" readonly tabindex="-1"></label></div>
    <div class="menu2">${menuCell('tile', 'Каталог бумаг', 'catalog')}${menuCell('calendar', 'Календарь инвестора')}</div>
    <div class="section-pad">
      <button class="hero-prod tap">
        <img class="art" src="${A}imgFrame312121540.png" alt="">
        <span class="top"><span class="l"><b>${hero.name}</b><span>${hero.hint}</span></span><span class="r"><b>${hero.yieldTxt}</b><span>${hero.period}</span></span></span>
        <span class="bot"><span class="tg"><i style="--ic:url(${A}buy/crown.svg)"></i>${hero.tag}</span><b>${hero.rate}</b></span>
      </button>
    </div>
    ${header('Продукты N1broker', false)}
    <div class="hscroll buy-chips">${BY.tabs.map((t) => `<button class="buy-chip tap" data-tab="${t}">${t}</button>`).join('')}</div>
    <div id="buy-products"></div>
    ${header('Подборки ценных бумаг', false)}
    ${collectionsHtml()}
    ${header('Просмотрено недавно', false)}
    <div class="section-pad"><div class="card recent"><div class="list">${recentItems.map((i) => `
      <button class="instr tap">${logoHtml(i.logo)}
        <div class="data">
          <div class="row"><span class="name">${i.name}</span><span class="price">${i.price}</span></div>
          <div class="row"><span class="ticker">${i.ticker}</span><span class="delta${i.neg ? ' neg' : ''}">${i.delta}</span></div>
        </div></button>`).join('')}</div></div></div>
    <div style="height:8px"></div>`;
  renderBuyProducts();

  // ---------- Каталог бумаг (Figma 101:20766 · 101:25365) ----------
  const CT = window.CATALOG;
  let catPlat = 'ITS', catType = 'all';
  function catLogo(l) {
    return (l && l.txt)
      ? `<span class="logo tile" style="background:${l.bg || '#e8f2fe'};color:${l.color || '#2563eb'}"><b>${l.txt}</b></span>` : logoHtml(l);
  }
  const catCell = (i) => `
    <button class="instr tap">${catLogo(i.logo)}
      <div class="data">
        <div class="row"><span class="name">${i.name}</span><span class="price">${i.price}</span></div>
        <div class="row"><span class="ticker">${i.ticker}</span><span class="delta${i.neg ? ' neg' : ''}">${i.delta}</span></div>
      </div></button>`;
  $('screen-catalog').innerHTML = `
    <div class="cat-nav" id="cat-nav">
      <button class="back tap" data-go="buy" aria-label="Назад"><i></i></button>
      <b class="ttl">Каталог бумаг</b>
      <button class="rt tap" id="cat-plat-nav"><span></span><i></i></button>
    </div>
    <div class="cat-sticky" id="cat-sticky"><label class="search tap" data-go="search"><img src="${A}imgMagnifierM.svg" alt=""><input type="text" placeholder="Название, тикер или isin" readonly tabindex="-1"></label></div>
    <div class="cat-scroll" id="cat-scroll">
      <div class="cat-pad">
        <div class="cat-title" id="cat-title"><h1>Каталог бумаг</h1><button class="plat-chip tap" id="cat-plat"><span></span><i></i></button></div>
        <div class="cat-search"><label class="search tap" data-go="search"><img src="${A}imgMagnifierM.svg" alt=""><input type="text" placeholder="Название, тикер или isin" readonly tabindex="-1"></label></div>
        <div class="hscroll cat-chips" id="cat-chips"></div>
        <div class="cat-list" id="cat-list"></div>
      </div>
    </div>
    <div class="cat-float"><button class="sort tap"><i style="--ic:url(${A}catalog/list.svg)"></i><span>По алфавиту</span><i style="--ic:url(${A}catalog/chev-compact.svg)"></i></button><button class="filt tap"><i style="--ic:url(${A}catalog/filter.svg)"></i><span>Фильтры</span></button></div>`;
  const renderCatalog = () => {
    const all = CT.items.filter((i) => i.platform === catPlat);
    const shown = (catType === 'fav' ? all.filter((i) => i.fav) : catType === 'all' ? all : all.filter((i) => i.type === catType))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    $('cat-list').innerHTML = shown.map(catCell).join('');
    $('cat-chips').innerHTML = `<button class="catchip ico tap${catType === 'fav' ? ' selected' : ''}" data-ct="fav" aria-label="Избранное"><i style="--ic:url(${A}catalog/bookmark.svg)"></i></button>`
      + CT.types.map(([k, t]) => `<button class="catchip tap${catType === k ? ' selected' : ''}" data-ct="${k}">${t}</button>`).join('');
    $('cat-plat').querySelector('span').textContent = `Площадка ${catPlat}`;
    $('cat-plat-nav').querySelector('span').textContent = catPlat;
  };
  renderCatalog();
  // Модальное окно выбора площадки (Figma 102:25851), затемнение — Darker/80
  const PLATS = [['ITS', 'Площадка ITS', 'Инструменты в тенге и долларах', 'sheet/plat-its.png'], ['N1', 'N1broker', 'Международные рынки', 'sheet/plat-n1.png']];
  const sheetEl = $('sheet'), scrimEl = $('sheet-scrim');
  const renderSheet = () => {
    sheetEl.innerHTML = `
      <div class="sh-head"><h2>Торговая площадка</h2><button class="sh-x tap" data-close-sheet aria-label="Закрыть"><img src="${A}search/cross.svg" alt=""></button></div>
      ${PLATS.map(([id, name, hint, img]) => `
        <button class="sh-row tap" data-plat="${id}"><img src="${A}${img}" alt="">
          <span class="tx"><b>${name}</b><span>${hint}</span></span><i class="radio${catPlat === id ? ' on' : ''}"></i></button>`).join('')}
      <div class="sh-safe"></div>`;
  };
  function openSheet() {
    renderSheet(); sheetEl.hidden = false; scrimEl.hidden = false; sheetOpenFlag = true; syncTheme();
    requestAnimationFrame(() => requestAnimationFrame(() => { sheetEl.classList.add('open'); scrimEl.classList.add('open'); }));
  }
  function closeSheet() {
    sheetEl.classList.remove('open'); scrimEl.classList.remove('open'); sheetOpenFlag = false; syncTheme();
    setTimeout(() => { sheetEl.hidden = true; scrimEl.hidden = true; }, 300);
  }
  scrimEl.addEventListener('click', closeSheet);

  // Скролл: заголовок и чип площадки переезжают в навбар (кроссфейд + сдвиг), строка поиска выезжает сверху
  const catScroll = $('cat-scroll');
  const updateCat = () => {
    const st = Math.max(0, catScroll.scrollTop), p = st <= 1 ? 0 : Math.min(1, st / 40);
    const scr = $('screen-catalog');
    scr.style.setProperty('--p', p.toFixed(3));
    // Прямые inline-стили вместо CSS-переменных: iOS Safari иногда не перерисовывает opacity, завязанный на var() внутри clamp()
    const k = Math.max(0, Math.min(1, (p - 0.4) * 1.67)), big = Math.max(0, Math.min(1, 1 - p * 1.4));
    const ttl = scr.querySelector('.cat-nav .ttl'), rt = scr.querySelector('.cat-nav .rt'), bt = $('cat-title');
    ttl.style.opacity = k; rt.style.opacity = k; bt.style.opacity = big;
    const ty = ((1 - p) * 10).toFixed(2) + 'px';
    ttl.style.transform = rt.style.transform = 'translate3d(0,' + ty + ',0)';
    bt.style.visibility = big <= 0.01 ? 'hidden' : 'visible';
    ttl.style.visibility = k <= 0.01 ? 'hidden' : 'visible';
    $('cat-sticky').classList.toggle('show', st > 112);
    $('cat-nav').classList.toggle('on', p > 0.6);
  };
  // На телефонах (инерция, «резинка» iOS) последнее событие scroll может не прийти, поэтому — страховочное обновление после остановки
  let catTimer;
  const catSync = () => { updateCat(); clearTimeout(catTimer); catTimer = setTimeout(updateCat, 120); };
  catScroll.addEventListener('scroll', catSync, { passive: true });
  catScroll.addEventListener('scrollend', updateCat);
  ['touchend', 'touchcancel', 'pointerup'].forEach((ev) => catScroll.addEventListener(ev, () => { setTimeout(updateCat, 60); setTimeout(updateCat, 400); }, { passive: true }));
  updateCat();

  // ---------- Шапка портфеля при скролле (Figma 98:16707) ----------
  // Появляется, когда блок баланса уходит под скролл: выезжает сверху, у статус-бара появляется фон; при обратном скролле — убирается.
  $('pf-nav').innerHTML = `
    <div class="l"><span class="c">Общий баланс</span><b>${P.balance.total}</b></div>
    <div class="r"><span class="c">${P.balance.period}</span><b class="up">${P.balance.delta}</b></div>`;
  let sheetOpenFlag = false;
  // Статус-бар на телефоне красится самой страницей: фон html и верхняя безопасная зона (.phone::before) переключаются мгновенно,
  // без theme-color и без анимации (Safari сэмплирует цвет в момент перехода и может «застрять» на промежуточном).
  function syncTheme() {
    const phone = document.querySelector('.phone');
    const white = phone.classList.contains('hdr-on') || phone.classList.contains('cat-on') || phone.classList.contains('search-on') || phone.classList.contains('art-on');
    document.documentElement.classList.toggle('hdr-on', white);
  }
  ['pageshow', 'visibilitychange', 'focus', 'resize', 'orientationchange'].forEach((ev) => window.addEventListener(ev, syncTheme));
  setInterval(syncTheme, 1000);
  const PF_THRESHOLD = 60; // scrollTop, при котором карточка баланса (низ на 108 px) полностью скрыта под шапкой (48 px)
  const updatePfNav = () => {
    const on = !$('screen-portfolio').hidden && $('screen-portfolio').scrollTop > PF_THRESHOLD;
    $('pf-nav').classList.toggle('show', on);
    document.querySelector('.phone').classList.toggle('hdr-on', on);
    syncTheme();
  };
  let pfTimer;
  $('screen-portfolio').addEventListener('scroll', () => { updatePfNav(); clearTimeout(pfTimer); pfTimer = setTimeout(updatePfNav, 120); }, { passive: true });
  $('screen-portfolio').addEventListener('scrollend', updatePfNav);

  // ---------- Новости (Figma 97:14540) ----------
  const NW = window.NEWS;
  const leadHtml = (s) => s.replace(/\[([A-Z.]+)\]/g, '<b>[$1]</b>');
  const nBig = (x) => `
    <article class="card nbig tap" data-news="${x.id || ''}">
      <div class="news-hero">
        <img src="${A}${x.img}" ${x.imgStyle ? `style="${x.imgStyle}"` : ''} alt="">
        <div class="meta"><b>${x.src}</b><span>· ${x.time}</span></div>
        <div class="bottom"><b>${x.title}</b><span class="tag info">${x.tag}</span></div>
      </div>
      <div class="nlead"><div class="leadbox"><span class="t">${leadHtml(x.lead)}</span><span class="more"><i>…</i> <u>Читать дальше</u></span></div><div class="tags">${x.tags.map(tag).join('')}</div></div>
    </article>`;
  const nSmall = (x) => `
    <button class="nsmall news-item tap" data-news="${x.id || ''}">
      <div class="col">
        <div class="meta"><b>${x.src}</b><span>· ${x.time}</span></div>
        <div class="title">${x.title}</div>
        <div class="tags">${x.tags.map(tag).join('')}</div>
      </div>
      ${thumbHtml(x)}
    </button>`;
  // «Читать дальше» прижата к концу 3-й строки и не переносится; если текст короче трёх строк — идёт сразу за ним
  const fitLeads = () => document.querySelectorAll('.leadbox').forEach((b) => {
    if (!b.offsetParent) return;
    b.classList.toggle('short', b.querySelector('.t').offsetHeight <= 60);
  });
  let newsTab = NW.tabs[0];
  const renderNews = () => {
    const set = NW.sets[newsTab];
    $('news-body').innerHTML = `
      ${header(NW.mainTitle, false)}
      <div class="nlist">${set.main.map(nBig).join('')}</div>
      ${header(NW.moreTitle, false)}
      <div class="nlist">${set.more.map(nSmall).join('')}</div>`;
    document.querySelectorAll('.chip-tab').forEach((c) => c.classList.toggle('selected', c.dataset.tab === newsTab));
    fitLeads();
  };
  $('screen-news').innerHTML = `
    <div class="navbar"><button class="back tap" data-go="home" aria-label="Назад"><i></i></button><b>Новости</b><span class="sp"></span></div>
    <div class="news-scroll" id="news-scroll">
      <div class="hscroll chiprow">${NW.tabs.map((t) => `<button class="chip-tab tap" data-tab="${t}">${t}</button>`).join('')}</div>
      <div id="news-body"></div>
      <div style="height:8px"></div>
    </div>`;
  renderNews();

  // ---------- Поиск (Figma 98:17166 · 98:18787 · 98:19207) ----------
  const SR = window.SEARCH;
  const sCell = (i) => `
    <div class="scell"><button class="instr tap">${logoHtml(i.logo)}
      <div class="data">
        <div class="row"><span class="name">${i.name}</span><span class="price">${i.price}</span></div>
        <div class="row"><span class="ticker">${i.ticker}</span><span class="delta${i.neg ? ' neg' : ''}">${i.delta}</span></div>
      </div></button></div>`;
  const sHdr = (t) => `<div class="shdr">${t}</div>`;
  $('screen-search').innerHTML = `
    <div class="srch-top">
      <label class="srch-input"><img src="${A}imgMagnifierM.svg" alt="">
        <input id="srch-q" type="search" enterkeyhint="search" placeholder="" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="text">
        <button class="srch-clear" id="srch-clear" type="button" aria-label="Очистить" hidden><img src="${A}search/cross.svg" alt=""></button>
      </label>
      <button class="srch-cancel tap" data-back="search">Отмена</button>
    </div>
    <div class="srch-body" id="srch-body"></div>`;
  const renderSearch = () => {
    const q = $('srch-q').value, found = SR.find(q);
    let html;
    if (!q.trim()) html = sHdr('Вы искали') + SR.recent.map(sCell).join('') + sHdr('Популярно у инвесторов N1broker') + SR.popular.map(sCell).join('');
    else if (found.length) html = found.map(sCell).join('') + sHdr('Популярно у инвесторов N1broker') + SR.popular.map(sCell).join('');
    else html = `<div class="smsg"><div class="box"><img src="${A}search/info.svg" alt=""><span>Не нашли бумаг по вашему запросу</span></div></div>` + sHdr('Популярно у инвесторов N1broker') + SR.popular.map(sCell).join('');
    $('srch-body').innerHTML = html;
    $('srch-clear').hidden = !q;
  };
  $('srch-q').addEventListener('input', renderSearch);
  $('srch-clear').addEventListener('click', () => { $('srch-q').value = ''; renderSearch(); $('srch-q').focus(); });
  $('srch-clear').addEventListener('mousedown', (e) => e.preventDefault());
  renderSearch();

  // ---------- Нижняя навигация и переходы между экранами ----------
  // Живые вкладки: Главная и Портфель (остальных экранов в макетах пока нет)
  const tabs = [['home', 'Главная', 'imgNavigationHomeM'], ['portfolio', 'Портфель', 'imgPfmPrmM'], ['buy', 'Купить', 'imgNavigationQuotationsM'],
    [null, 'Поддержка', 'imgNavigationChatM'], [null, 'Еще', 'imgNavigationMoreM']];
  $('tabs').innerHTML = tabs.map(([id, t, i]) =>
    `<button class="tab tap" ${id ? `data-go="${id}"` : ''}><i style="--ic:url(${A}${i}.svg)"></i><span>${t}</span></button>`).join('');

  const screens = ['home', 'portfolio', 'buy', 'catalog', 'news', 'search', 'article'];
  let articleFrom = 'home';
  let searchFrom = 'home';
  let current = null;
  const show = (name) => {
    if (!screens.includes(name)) name = 'home';
    if (name === current) return;
    const prev = current; current = name;
    if (name === 'search' && prev && prev !== 'search') searchFrom = prev;
    if (name === 'article' && prev && prev !== 'article') articleFrom = prev;
    hideSnack();
    screens.forEach((s) => { $('screen-' + s).hidden = s !== name; });
    document.querySelectorAll('.tab').forEach((el) => el.classList.toggle('active', el.dataset.go === name));
    document.querySelector('.phone').classList.toggle('no-tabs', name === 'news' || name === 'catalog' || name === 'article');
    document.querySelector('.phone').classList.toggle('cat-on', name === 'catalog');
    document.querySelector('.phone').classList.toggle('search-on', name === 'search');
    document.querySelector('.phone').classList.toggle('art-on', name === 'article');
    if (name === 'search') { $('srch-q').value = ''; renderSearch(); $('screen-search').scrollTop = 0; $('srch-q').focus({ preventScroll: true }); }
    else if (prev === 'search') $('srch-q').blur();
    if (name === 'news') fitLeads();
    updatePfNav(); // на экране новостей таб-бара нет (макет: только home indicator)
  };
  const go = (name) => { show(name); if (location.hash !== '#/' + name) location.hash = '#/' + name; };
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-go]'); if (t) go(t.dataset.go);
    const ct = e.target.closest('.chip-tab');
    if (ct) { newsTab = ct.dataset.tab; renderNews(); $('news-scroll').scrollTop = 0; }
    const cc = e.target.closest('.catchip');
    if (cc) { catType = cc.dataset.ct === catType && catType === 'fav' ? 'all' : cc.dataset.ct; renderCatalog(); }
    if (e.target.closest('#cat-plat, #cat-plat-nav')) openSheet();
    if (e.target.closest('[data-close-sheet]')) closeSheet();
    const pr = e.target.closest('[data-plat]');
    if (pr) { catPlat = pr.dataset.plat; catType = 'all'; renderCatalog(); renderSheet(); setTimeout(closeSheet, 220); }
    const bc = e.target.closest('.buy-chip');
    if (bc) { buyTab = bc.dataset.tab; renderBuyProducts(); }
    if (e.target.closest('[data-back="search"]')) go(searchFrom);
    const nw = e.target.closest('[data-news]');
    if (nw) { if (nw.dataset.news === 'diesel') { go('article'); $('screen-article').querySelector('.art-scroll').scrollTop = 0; } else showSnack(); }
    if (e.target.closest('[data-back="article"]')) go(articleFrom);
    const m = e.target.closest('[data-toggle]');
    if (m) { const open = m.closest('.pf-card').classList.toggle('open'); m.textContent = open ? 'Показать меньше' : 'Показать больше'; }
  });
  window.addEventListener('hashchange', () => show(location.hash.replace('#/', '')));
  show(location.hash.replace('#/', ''));

  // Перетаскивание лент мышью (на ноутбуке нет свайпа)
  document.querySelectorAll('.hscroll').forEach((el) => {
    let down = false, sx = 0, sl = 0, moved = false;
    el.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = el.scrollLeft; });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 4) { moved = true; el.classList.add('dragging'); }
      el.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', () => { down = false; setTimeout(() => el.classList.remove('dragging'), 0); });
    el.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  });

  // Рамка телефона вписывается в окно ноутбука
  const phone = document.querySelector('.phone');
  const fit = () => {
    const k = window.innerWidth <= 500 ? 1 : Math.min(1, (window.innerHeight - 56) / 812);
    phone.style.transform = k < 1 ? `scale(${k})` : '';
  };
  window.addEventListener('resize', fit); fit();
})();
