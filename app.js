(function () {
  const D = window.DATA, A = 'assets/';
  const $ = (id) => document.getElementById(id);
  // Картинки не грузим «про запас»: каждая новая <img> — ленивая (грузится, когда её экран/лента подошли к экрану),
  // а после показа первого экрана остальное тихо догружается в фоне, чтобы переходы были мгновенными.
  const innerDesc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  Object.defineProperty(Element.prototype, 'innerHTML', { configurable: true, get() { return innerDesc.get.call(this); },
    set(v) { innerDesc.set.call(this, typeof v === 'string' ? v.replace(/<img\b/g, '<img loading="lazy" decoding="async"') : v); } });
  window.addEventListener('load', () => setTimeout(() => {
    const queue = [...new Set([...document.images].filter((i) => !i.complete).map((i) => i.currentSrc || i.src))];
    const next = () => { const s = queue.shift(); if (!s) return; const im = new Image(); im.decoding = 'async'; im.onload = im.onerror = () => setTimeout(next, 80); im.src = s; };
    next(); next();
  }, 1200));
  const tag = ([kind, text]) => `<span class="tag ${kind}">${text}</span>`;
  const header = (text, chevron = true, go = '') => `
    <${chevron ? 'button' : 'div'} class="header ${chevron ? 'tap' : ''}" ${go ? `data-go="${go}"` : ''}>
      <h2>${text}</h2>${chevron ? `<img src="${A}imgChevronForwardM.svg" alt="">` : ''}
    </${chevron ? 'button' : 'div'}>`;

  const mainBanner = (b, snack) => `
    <a class="main-banner tap"${b.note ? ' data-note="1"' : snack ? ' data-snack="1"' : ''}>
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
    <a class="product tap" ${p.note ? 'data-note="1"' : 'data-snack="1"'}>
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
        : i.logo.txt ? `<span class="logo tile txt" style="background:${i.logo.bg};color:${i.logo.color}"><b>${i.logo.txt}</b></span>`
        : !i.logo.bg ? `<span class="logo sq"><img src="${A}${i.logo.src}" alt=""></span>`
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

  // карточка подборки: заголовок, 3 бумаги, «Показать все N»
  const collCard = (c) => { const ex = c.extra || []; return `
      <div class="card collection"><h3>${c.title}</h3>
        <div class="list">${c.items.map(instr).join('')}
          <div class="coll-more"><button class="more-btn tap">Показать все ${c.all || c.items.length + ex.length}</button></div>
        </div></div>`; };
  const collRow = (list) => `<div class="hscroll collections">${list.map(collCard).join('')}</div>`;
  const CL = window.COLL;
  const themeLogo = (l) => typeof l === 'string' ? `<span><img src="${A}${l}" alt=""></span>`
    : l.bg ? `<span style="background:${l.bg};padding:${Math.round(l.pad / 2)}px"><img src="${A}${l.src}" alt="" class="${l.invert ? 'inv' : ''} ${l.crop || ''}"></span>` : `<span><img src="${A}${l.src}" alt=""></span>`;
  const ART = { // иллюстрации баннеров подборок (упрощённые, вместо 3D-картинок макета)
    arrow: '<path d="M60 8 100 58H76v38H44V58H20z" fill="#2f7bf5" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>',
    sun: '<circle cx="60" cy="52" r="22" fill="#fcd34d"/><g stroke="#fcd34d" stroke-width="4" stroke-linecap="round">' + [0,1,2,3,4,5,6,7].map((k) => { const a = k * Math.PI / 4; return `<path d="M${60 + 30 * Math.cos(a)} ${52 + 30 * Math.sin(a)}L${60 + 40 * Math.cos(a)} ${52 + 40 * Math.sin(a)}"/>`; }).join('') + '</g>',
    coins: '<g fill="#fcd34d" stroke="#b45309" stroke-width="3"><ellipse cx="46" cy="78" rx="28" ry="9"/><path d="M18 78v-12c0 5 12 9 28 9s28-4 28-9v12"/><ellipse cx="46" cy="66" rx="28" ry="9"/><ellipse cx="76" cy="46" rx="22" ry="7"/><path d="M54 46v-9c0 4 10 7 22 7s22-3 22-7v9"/><ellipse cx="76" cy="37" rx="22" ry="7"/></g>',
    shield: '<path d="M60 10 98 24v30c0 22-16 36-38 44C38 90 22 76 22 54V24z" fill="#60a5fa" stroke="#fff" stroke-width="4" stroke-linejoin="round"/><path d="M42 54l12 12 26-28" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>',
    chip: '<g fill="#a5b4fc" stroke="#fff" stroke-width="3"><rect x="34" y="26" width="52" height="52" rx="8"/></g><rect x="46" y="38" width="28" height="28" rx="4" fill="#4338ca"/><g stroke="#fff" stroke-width="4" stroke-linecap="round">' + [44,56,68,76].map((v) => `<path d="M${v} 14v10M${v} 80v10M24 ${v - 2}h8M88 ${v - 2}h8"/>`).join('') + '</g>',
    rocket: '<path d="M60 8c16 14 22 34 16 58H44C38 42 44 22 60 8z" fill="#fff" stroke="#fde68a" stroke-width="3"/><circle cx="60" cy="38" r="8" fill="#38bdf8"/><path d="M44 66 30 82l16-4zM76 66l14 16-16-4z" fill="#fde68a"/><path d="M52 70h16l-8 22z" fill="#fbbf24"/>',
  };
  const themeBanner = (t) => `
    <a class="promo tap" data-snack="1" style="background:${t.color || t.bg}">
      ${t.img ? `<img class="p-img" src="${A}${t.img}" style="${t.imgStyle}" alt="">` : `<svg class="p-svg" viewBox="0 0 120 100" aria-hidden="true">${ART[t.art]}</svg>`}
      <div class="p-top"><span class="p-cnt">${t.count} бумаг</span>
        <span class="p-logos">${t.logos.slice(0, 5).map(themeLogo).join('')}${t.count > 5 ? `<span class="more">${t.count - 5}+</span>` : ''}</span></div>
      <div class="p-txt"><b>${t.title}</b></div>
    </a>`;
  const themesHtml = () => `<div class="hscroll promos">${CL.themes.map(themeBanner).join('')}</div>`;
  const greatCard = (g) => `
    <a class="great tap" data-snack="1">
      <div class="g-bg" style="background:${g.bg}"></div>
      ${g.img ? `<img class="g-img" src="${A}${g.img}" style="${g.imgStyle}" alt="">` : ''}
      <div class="g-txt"><div><b>${g.name}</b><span>${g.count} бумаг</span></div><p>${g.sub}</p></div>
    </a>`;

  const n = D.news;
  $('screen-home').innerHTML = `
    <div class="profile-bar">
      <div class="profile-info tap" data-go="more" data-more="profile">
        <div class="avatar"><span>${D.user.initials}</span></div>
        <div><div class="profile-name">${D.user.name}</div><div class="profile-role">${D.user.status}</div></div>
      </div>
      <button class="bell tap"><img src="${A}imgBellM.svg" alt=""><span class="badge">${D.user.unread}</span></button>
    </div>

    <div class="search-row"><label class="search tap" data-go="search"><img src="${A}imgMagnifierM.svg" alt=""><input type="text" placeholder="Название, тикер или isin" readonly tabindex="-1"></label></div>

    <div class="hscroll banners">${D.mainBanners.map((b) => mainBanner(b, true)).join('')}</div>

    <div class="section-pad">
      <button class="card balance tap" data-go="portfolio">
        <div class="l1"><span>${D.balance.label}</span></div>
        <div class="l2"><span class="t-h-l">${D.balance.total}</span><img src="${A}imgChevronForwardM.svg" alt=""></div>
        <div class="l3"><span class="tag success">${D.balance.delta}</span><span class="t-b-s">${D.balance.period}</span></div>
      </button>
    </div>

    <div class="hscroll events">${D.events.map(event).join('')}</div>

    ${header('Новости об инвестициях', true, 'news')}
    ${newsBlock(n)}

    ${header('Новое от N1broker', true, 'buy')}
    <div class="hscroll products">${D.products.map(product).join('')}</div>

    ${header('Взлеты и падения дня', false)}
    ${collRow(CL.movers)}

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
    <div class="hscroll banners">${P.banners.map((b) => mainBanner(b)).join('')}</div>
    ${P.platforms.map(platform).join('')}
    <div class="pf-news">
      ${header('Новости о ваших инструментах', false)}
      ${newsBlock(PN)}
    </div>
    <div style="height:8px"></div>`;

  // ---------- Детальная новость (Figma 104:26920) ----------
  const arText = (s) => s.replace(/\[([A-Z.]+)\]/g, '<b>[$1]</b>');
  const relCell = (i) => `
        <button class="instr tap">${catLogo(i.logo)}
          <div class="data">
            <div class="row"><span class="name">${i.name}</span><span class="price">${i.price}</span></div>
            <div class="row"><span class="ticker">${i.ticker}</span><span class="delta${i.neg ? ' neg' : ''}">${i.delta}</span></div>
          </div></button>`;
  $('screen-article').innerHTML = `
    <div class="art-nav"><button class="back tap" data-back="article" aria-label="Назад"><i></i></button><button class="share tap" aria-label="Поделиться"><i></i></button></div>
    <div class="art-scroll" id="art-scroll"></div>
    <div class="art-promo" id="art-promo" role="status"></div>`;
  function renderArticle(id) {
    const AR = window.ARTICLE[id];
    const related = AR.relatedFrom === 'etf' ? window.NOTE.etf.map((e) => ({ logo: 'note/' + e.logo, name: e.name, price: e.price, ticker: e.t, delta: e.delta })) : AR.related;
    const idea = AR.ideas && `
      <h2 class="art-h art-idea-h">${AR.ideas.title}</h2>
      <div class="art-pad"><div class="art-idea tap" data-note="1">
        <div class="ai-img"><img src="${A}${AR.ideas.banner}" alt=""></div>
        <div class="ai-body"><div class="ai-stats">${AR.ideas.stats.map(([l, v]) => `<div><span>${l}</span><b>${v}</b></div>`).join('')}</div>
        <p>${AR.ideas.text}</p></div>
        <button class="art-btn tap" data-note="1">${AR.ideas.button}</button>
      </div></div>`;
    $('art-scroll').innerHTML = `
      <div class="art-hero"><img src="${A}${AR.hero}" alt=""></div>
      <div class="art-src"><span class="logo tile" style="background:${(AR.logo || {}).bg || '#ff1a2d'}"><b style="color:#fff;font:600 ${AR.logo ? 20 : 28}px/32px Roboto">${(AR.logo || {}).text || 'K'}</b></span>
        <div><b>${AR.source}</b><span>${AR.time}</span></div></div>
      <div class="art-tags">${AR.tags.map((t, i) => `<span class="art-tag${i === 0 ? ' info' : ''}">${t}</span>`).join('')}</div>
      <h1 class="art-title">${AR.title}</h1>
      <div class="art-body">${AR.body.map((p) => `<p>${arText(p)}</p>`).join('')}</div>
      ${AR.sections.map((x) => `<h2 class="art-h">${x.title}</h2><div class="art-body"><p>${x.text}</p></div>`).join('')}
      ${idea || ''}
      <h2 class="art-h">${AR.relatedTitle}</h2>
      <div class="art-rel">${related.map(relCell).join('')}</div>`;
    $('art-scroll').scrollTop = 0;
    // снекбар «Есть связанная идея»: только если у новости есть идея
    const pr = $('art-promo'); pr.classList.remove('show'); promoOn = !!(AR.ideas && AR.promo);
    pr.innerHTML = promoOn ? `<div class="ap-box"><img src="${A}article/lightning.svg" alt=""><div class="ap-t"><b>${AR.promo.title}</b><span>${AR.promo.text}</span></div><button class="ap-act tap" data-promo>${AR.promo.action}</button></div>` : '';
    clearTimeout(promoT); promoT = setTimeout(updatePromo, 700);
  }
  // Показ/скрытие снекбара: скрыт, пока заголовок идеи в зоне экрана (появился снизу или уже выше), виден, когда заголовок ещё ниже экрана
  let promoOn = false, promoT = 0, promoTick = false;
  function updatePromo() {
    const pr = $('art-promo'), sc = $('art-scroll'), h = sc.querySelector('.art-idea-h');
    if (!promoOn || !h || $('screen-article').hidden) { pr.classList.remove('show'); return; }
    pr.classList.toggle('show', h.getBoundingClientRect().top >= sc.getBoundingClientRect().bottom);
  }
  $('art-scroll').addEventListener('scroll', () => { if (promoTick) return; promoTick = true; requestAnimationFrame(() => { promoTick = false; updatePromo(); }); }, { passive: true });
  renderArticle('diesel');

  // ---------- Страница структурной ноты (Figma 106:27505 · 130:31357 · 130:31714) ----------
  const NT = window.NOTE;
  let noteTab = 'overview';
  $('screen-note').innerHTML = `
    <div class="note-nav"><button class="back tap" data-back="note" aria-label="Назад"><i></i></button><b>${NT.title}</b><span class="sp"></span></div>
    <div class="note-scroll" id="note-scroll">
      <div class="note-hero"><div><img src="${A}note/hero3.png" alt=""></div></div>
      <div class="note-chips" id="note-chips"></div>
      <div id="note-body"></div>
    </div>
    <div class="note-buy" id="note-buy"><button class="tap" data-buy>${NT.buyLabel}</button></div>`;
  const noteList = (icon, items) => items.map((t) => `<div class="nl-item"><span class="ic"><img src="${A}note/${icon}.svg" alt=""></span><p>${t}</p></div>`).join('');
  // график сценария: ось Y — % от начальной цены (100 % → y=50, барьер 60 % → y=117), ось X — месяцы (0 → x=42, 24 → x=267)
  const chartSvg = (s, O) => {
    const X = (m) => 42 + m / 24 * 225, Y = (p) => 50 + (100 - p) * 67 / 40, end = X(s.months);
    const path = (arr) => arr.map((p, i) => `${i ? 'L' : 'M'}${X(i * s.months / (arr.length - 1)).toFixed(1)} ${Y(p).toFixed(1)}`).join('');
    return `<svg viewBox="0 0 267 150" width="100%" role="img" aria-label="График базовых активов">
      <line x1="3" y1="50" x2="267" y2="50" class="gr" stroke-dasharray="3 3"/><line x1="42" y1="0" x2="42" y2="117" class="gr" stroke-dasharray="3 3"/><line x1="${end}" y1="0" x2="${end}" y2="117" class="gr" stroke-dasharray="3 3"/>
      <line x1="0" y1="117" x2="267" y2="117" class="gn" stroke-dasharray="5 3"/>
      <text x="48" y="8" class="ct">Дата покупки</text><text x="${end < 200 ? end + 6 : 162}" y="8" class="ct">Дата завершения</text><text x="0" y="70" class="ct">100 %</text><text x="0" y="134" class="ct r">Барьер 60 %</text>
      ${s.lines.map((l, i) => `<path d="${path(l)}" fill="none" style="stroke:${O.legend[i][1]}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>`).join('')}</svg>`;
  };
  const scenCard = (s, O) => `<div class="note-card pc scen">
    <div class="sc-h"><h3>${s.name}</h3><span class="tag-xs ${s.tag[0]}">${s.tag[1]}</span></div>
    <p class="sc-t">${s.text}</p>
    <div class="sc-chart">${chartSvg(s, O)}<div class="sc-leg">${O.legend.map(([n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join('')}</div></div>
    <div class="sc-sum"><div><span>Вы вложили</span><b>${s.invested}</b></div><div><span>Срок</span><b>${s.term}</b></div><div class="r"><span>Вы получили</span><b class="${s.gotColor}">${s.got}</b></div></div>
  </div>`;
  const accHtml = ([q, a]) => `<div class="note-card note-acc"><button class="na-head tap" data-acc aria-expanded="false"><b>${q}</b><i></i></button><div class="na-body"><p>${a}</p></div></div>`;
  const noteTabHtml = {
    overview: () => {
      const O = NT.overview, info = '<i class="ci"></i>';
      const cc = (c) => `<div class="cond${c.hint ? ' hintable' : ''}"${c.hint ? ` data-hint="${c.hint}"` : ''}><div><div class="lb"><span>${c.label}</span>${c.hint ? info : ''}</div><b>${c.value}</b></div></div>`;
      return `
      <div class="note-pad note-media">${O.media.map((m) => `<button class="note-fact tap" data-media><img src="${A}note/${m.icon}.svg" alt=""><div><b>${m.title}</b><span>${m.hint}</span></div></button>`).join('')}</div>
      <h2 class="note-h2">${O.condTitle}</h2>
      <div class="cond-grid" id="cond-grid">
        <div class="cond-r1">
          <div class="cond y"><div><div class="lb"><span>${O.yield.label}</span></div><b>${O.yield.value}</b></div><div class="fl"><img src="${A}note/flag-us.png" alt=""><span>${O.yield.hint}</span></div></div>
          <div class="cond hintable" data-hint="risk"><div><div class="lb"><span>${O.risk.label}</span>${info}</div><b>${O.risk.value}</b></div><div class="bars">${[1, 2, 3].map((n) => `<i class="${n <= O.risk.level ? 'on' : ''}"></i>`).join('')}</div></div>
        </div>
        <div class="cond-r">${cc(O.cond[0])}${cc(O.cond[1])}</div>
        <div class="cond-r">${cc(O.cond[2])}${cc(O.cond[3])}</div>
      </div>
      <h2 class="note-h2">${O.ideaTitle}</h2>
      <div class="note-pad"><div class="note-card idea-s">
        <h3>${O.idea.title.join('<br>')}</h3>
        <p>${O.idea.text}</p>
        <button class="txt-btn tap" data-nt-go="idea">${O.idea.button}</button>
      </div></div>
      <h2 class="note-h2">${O.howTitle}</h2>
      <div class="note-pad"><div class="note-card how">${O.how.map(([t, h]) => `<div class="how-row"><b>${t}</b><span>${h}</span></div>`).join('')}<p class="how-note">${O.howNote[0]}<a data-doc>${O.howNote[1]}</a></p></div></div>`;
    },
    idea: () => `
      <div class="note-pad"><div class="note-author"><img src="${A}note/author-n1.png" alt=""><div><span>${NT.author.label}</span><b>${NT.author.name}</b></div></div></div>
      <h2 class="note-h2">${NT.moreTitle}</h2>
      <div class="note-pad"><div class="note-card"><div class="nc-text nc-long">${NT.more.map(([k, t], n) => (k === 'h' ? (n ? `<h4>${t}</h4>` : `<h3>${t}</h3>`) : `<p>${t}</p>`)).join('')}</div></div></div>
      <h2 class="note-h2">${NT.argsTitle}</h2>
      <div class="note-hs hscroll">
        <div class="note-card pc"><h3 class="ok">${NT.pros.title}</h3>${noteList('check', NT.pros.items)}</div>
        <div class="note-card pc"><h3>${NT.cons.title}</h3>${noteList('info-s', NT.cons.items)}</div>
      </div>
      <div class="note-pad"><div class="note-msg"><img src="${A}note/info.svg" alt=""><p>${NT.disclaimer}</p></div></div>`,
    terms: () => `
      <h2 class="note-h2">${NT.paramsTitle}</h2>
      <div class="note-pad"><div class="note-card prm">${NT.params.map(([k, v]) => `<div class="prm-row"><span>${k}</span><b>${v}</b></div>`).join('')}</div></div>
      <h2 class="note-h2">${NT.docsTitle}</h2>
      ${NT.docs.map((d) => `<div class="note-pad"><button class="note-doc tap" data-doc><img src="${A}note/document.svg" alt=""><b>${d}</b><img src="${A}note/chev-fwd.svg" alt=""></button></div>`).join('')}
      <h2 class="note-h2">${NT.faqTitle}</h2>
      <div class="note-pad accs">${NT.faq.map(accHtml).join('')}</div>
      <h2 class="note-h2">${NT.risksTitle}</h2>
      <div class="note-pad accs">${NT.risks.map(accHtml).join('')}</div>`,
    assets: () => {
      const O = NT.overview;
      return `
      <h2 class="note-h2">${NT.payTitle}</h2>
      <div class="note-pad"><div class="note-card pay">${NT.pay.map(([l, dt, v], n) => `<div class="pay-row${n === NT.pay.length - 1 ? ' last' : ''}${n ? '' : ' first'}"><div class="pay-tr"><i></i></div><div class="pay-c"><span>${l}</span><div><b>${dt}</b><em>${v}</em></div></div></div>`).join('')}</div></div>
      <h2 class="note-h2">${O.scenTitle}</h2>
      <div class="note-hs hscroll">${O.scen.map((s) => scenCard(s, O)).join('')}</div>
      <p class="scen-note">${O.scenNote}</p>
      <h2 class="note-h2">${NT.compTitle}</h2>
      <div class="note-pad"><div class="note-card sum">
        <div class="sum-tbl">
          <div class="sum-row hd">${NT.summaryHead.map((h) => `<span>${h}</span>`).join('')}</div>
          ${NT.etf.map((e) => `<div class="sum-row"><span class="tk"><img src="${A}note/${e.logo}" alt="">${e.t}</span><span>${e.share}</span><span class="pr">${e.price}</span></div>`).join('')}
        </div>
      </div></div>
      <h2 class="note-h2">${NT.descTitle}</h2>
      ${NT.etf.map((e) => `<div class="note-pad"><div class="note-card etf">
        <button class="instr tap"><img class="logo" src="${A}note/${e.logo}" alt="">
          <div class="data">
            <div class="row"><span class="name">${e.name}</span><span class="price">${e.price}</span></div>
            <div class="row"><span class="ticker">${e.t}</span><span class="delta">${e.delta}</span></div>
          </div></button>
        <p>${e.text}</p>
      </div></div>`).join('')}
      `;
    },
  };
  // Подсказка по условиям (Figma 169:19350): тап по карточке открывает, любой следующий тап закрывает
  function closeHint() {
    const h = document.getElementById('note-hint');
    if (h) h.remove();
    document.querySelectorAll('.cond.open').forEach((c) => c.classList.remove('open'));
  }
  function openHint(card) {
    closeHint();
    const grid = $('cond-grid'), ic = card.querySelector('.ci');
    const h = document.createElement('div');
    h.id = 'note-hint'; h.className = 'note-hint';
    h.innerHTML = `<div class="nh-box">${NT.overview.hints[card.dataset.hint]}</div><svg class="nh-tail" width="16" height="10" viewBox="0 0 16 10" aria-hidden="true"><path d="M0 0H16L8 10Z" fill="rgba(18,18,18,.8)"/></svg>`;
    grid.appendChild(h);
    h.style.top = (card.offsetTop - h.offsetHeight - 4) + 'px';
    h.querySelector('.nh-tail').style.left = (ic.offsetLeft - 16) + 'px';
    card.classList.add('open');
    const sc = $('note-scroll'), k = sc.getBoundingClientRect().height / sc.clientHeight; // экран может быть масштабирован
    const need = (h.getBoundingClientRect().top - sc.getBoundingClientRect().top - sc.querySelector('.note-chips').getBoundingClientRect().height) / k;
    if (need < 8) sc.scrollBy({ top: need - 8, behavior: 'smooth' }); // балун не должен прятаться под вкладками
  }
  document.addEventListener('click', (e) => {
    if (document.getElementById('note-hint')) { closeHint(); e.stopPropagation(); e.preventDefault(); return; }
    const hc = e.target.closest('.cond[data-hint]');
    if (hc) { e.stopPropagation(); openHint(hc); }
  }, true);
  function renderNote() {
    closeHint();
    const chips = $('note-chips'), sl = chips.scrollLeft;
    chips.innerHTML = NT.tabs.map(([id, t]) => `<button class="note-chip tap${id === noteTab ? ' selected' : ''}" data-nt="${id}">${t}</button>`).join('');
    chips.scrollLeft = sl;
    const sel = chips.querySelector('.selected'); // выбранная вкладка всегда в зоне видимости
    if (sel.offsetLeft + sel.offsetWidth + 16 > chips.scrollLeft + chips.clientWidth) chips.scrollLeft = sel.offsetLeft + sel.offsetWidth + 16 - chips.clientWidth;
    else if (sel.offsetLeft - 16 < chips.scrollLeft) chips.scrollLeft = Math.max(0, sel.offsetLeft - 16);
    $('note-body').innerHTML = (noteTabHtml[noteTab] || noteTabHtml.overview)();
    $('note-body').querySelectorAll('.hscroll').forEach(enableDrag);
  }
  renderNote();


  // ---------- Страница инструмента (Figma 179:15855) ----------
  const ST = window.STOCK, NBS = ' ';
  const stockFav = {}; let stockId = 'AAPL', stockTab = 'overview', stockRange = 'day', stockFrom = 'home';
  const stockMore = {};
  const stNum = (n, d) => { const [i, f] = Math.abs(n).toFixed(d).split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g, NBS) + (f ? ',' + f : ''); };
  const stMoney = (n, it) => `${stNum(n, it.decimals)}${NBS}${it.cur}`;
  // детерминированный «рынок»: случайное блуждание с памятью и всплесками волатильности, привязанное к началу и концу периода
  const stRng = (str) => { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } let a = h >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const ST_GEN = { // видимых точек, точек «до окна», размах шума в % от цены
    day: [84, 24, 2.4], week: [65, 18, 3.4], month: [66, 18, 6], m6: [130, 36, 12], year: [150, 42, 22], all: [140, 40, 55],
  };
  function stSeries(it, range, S, E) {
    const [n, pre, amp] = ST_GEN[range], N = n + pre, r = stRng(it.ticker + range);
    let prev = 0, burst = .5; const w = [0];
    for (let i = 1; i < N; i++) { burst = .92 * burst + .08 * r() * 2; prev = .3 * prev + (r() + r() + r() - 1.5) * (.5 + 1.5 * burst); w.push(w[i - 1] + prev); }
    const p0 = pre, L = N - 1 - p0, noise = [];
    for (let i = 0; i < N; i++) noise.push(i >= p0 ? w[i] - w[p0] - (w[N - 1] - w[p0]) * (i - p0) / L : w[i] - w[p0]);
    const vis = noise.slice(p0), rg = Math.max(...vis) - Math.min(...vis) || 1, k = E * amp / 100 / rg;
    return noise.map((nz, i) => i >= p0 ? S + (E - S) * (i - p0) / L + nz * k : S + nz * k);
  }
  let stV = [], stY = (y) => y;
  const ST_XW = 985, ST_TOP = 12, ST_BOT = 214; // верхний/нижний пунктир; средний — текущая цена
  function stDraw() { // масштаб подбирается под видимое окно: линия всегда упирается в верхний и нижний пунктир
    const box = $('st-chart'); if (!box || !stV.length) return;
    const N = stV.length, f0 = box.scrollLeft / box.scrollWidth, f1 = (box.scrollLeft + box.clientWidth) / box.scrollWidth;
    const i0 = Math.max(0, Math.floor(f0 * 1000 / ST_XW * (N - 1)) - 1), i1 = Math.min(N - 1, Math.ceil(f1 * 1000 / ST_XW * (N - 1)) + 1);
    const win = stV.slice(i0, i1 + 1), mn = Math.min(...win), mx = Math.max(...win) || 1, sp = (mx - mn) || 1;
    const Y = (y) => ST_BOT - (y - mn) / sp * (ST_BOT - ST_TOP), E = stV[N - 1]; stY = Y;
    $('st-path').setAttribute('d', 'M' + stV.map((y, i) => `${(i / (N - 1) * ST_XW).toFixed(1)} ${Y(y).toFixed(1)}`).join('L'));
    $('st-dot').style.top = Y(E).toFixed(1) + 'px';
    $('st-gm').style.top = Math.min(ST_BOT, Math.max(ST_TOP, Y(E))).toFixed(1) + 'px';
  }

  // ---- зажатие на графике: полоска и точка под пальцем, цена и дата на тот момент; отпустил — всё возвращается ----
  const ST_MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const ST_PPD = { week: 13, month: 3 }; // точек за торговую сессию (09:00–16:00)
  function stWhen(i) { // «сегодня» — 5 ноября 2026, закрытие в 16:00
    const rg = stockRange, N = stV.length, [n, pre] = ST_GEN[rg], d = new Date(2026, 10, 5, 16, 0), pad = (x) => String(x).padStart(2, '0');
    const back = (k) => { while (k > 0) { d.setDate(d.getDate() - 1); if (d.getDay() % 6) k--; } };
    const at = (h) => { d.setHours(Math.floor(h), Math.round((h % 1) * 60)); };
    let time = true;
    if (rg === 'day') {
      if (i < pre) { back(1); at(14 + i * 2 / (pre - 1)); } else at(9 + (i - pre) * 7 / (n - 1));
    } else if (ST_PPD[rg]) {
      const ppd = ST_PPD[rg], m = N - 1 - i; back(Math.floor(m / ppd)); at(9 + (ppd - 1 - m % ppd) * 7 / (ppd - 1));
    } else {
      time = false; const days = { m6: 182, year: 365, all: 365 * 7 }[rg] * N / n;
      d.setTime(d.getTime() - (N - 1 - i) / (N - 1) * days * 864e5);
    }
    return `${d.getDate()}${NBS}${ST_MON[d.getMonth()]}${NBS}${d.getFullYear() === 2026 && time ? '' : d.getFullYear() + NBS}${time ? `в${NBS}${pad(d.getHours())}:${pad(d.getMinutes())}` : ''}`.replace(/ $/, '');
  }
  function stScrub(clientX) {
    const box = $('st-chart'), it = ST.items[stockId], N = stV.length, rc = box.getBoundingClientRect();
    const fr = Math.min(1, Math.max(0, (clientX - rc.left) / rc.width));
    const f = (box.scrollLeft + fr * box.clientWidth) / box.scrollWidth * 1000 / ST_XW;
    const i = Math.min(N - 1, Math.max(0, Math.round(f * (N - 1)))), y = stV[i];
    const cur = $('st-cur'), dot = $('st-cdot'), left = (i / (N - 1) * ST_XW / 10) + '%';
    cur.style.left = dot.style.left = left; dot.style.top = stY(y) + 'px'; cur.style.display = dot.style.display = 'block';
    $('st-p').textContent = stMoney(y, it); $('st-when').textContent = stWhen(i);
    $('st-p').closest('.st-ph').classList.add('scrub');
  }
  function stScrubEnd() {
    const c = $('st-cur'); if (!c) return;
    c.style.display = $('st-cdot').style.display = 'none';
    $('st-p').textContent = stMoney(ST.items[stockId].price, ST.items[stockId]);
    $('st-p').closest('.st-ph').classList.remove('scrub');
  }
  function stChartPointer(el) {
    if (el._sp) return; el._sp = true;
    let timer = 0, on = false, down = false, sx = 0, sl = 0, kind = '';
    const end = () => { clearTimeout(timer); if (on) stScrubEnd(); on = down = false; el.classList.remove('dragging'); };
    el.addEventListener('pointerdown', (e) => {
      down = true; on = false; sx = e.clientX; sl = el.scrollLeft; kind = e.pointerType;
      clearTimeout(timer); timer = setTimeout(() => { on = true; stScrub(sx); }, 220);
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      if (on) { stScrub(e.clientX); return; }
      if (Math.abs(e.clientX - sx) > (kind === 'mouse' ? 4 : 8)) { clearTimeout(timer); if (kind === 'mouse') { el.classList.add('dragging'); el.scrollLeft = sl - (e.clientX - sx); } }
    });
    window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
    el.addEventListener('touchmove', (e) => { if (on) e.preventDefault(); }, { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  function stChartHtml(it) {
    const rg = stockRange, day = rg === 'day';
    const S = day ? it.price - it.dayChange : it.price / (1 + ST.rangePct[rg] / 100), E = it.price;
    stV = stSeries(it, rg, S, E);
    const ax = ST.axisPre[rg].map((t) => `<p class="pre">${t}</p>`).join('') + ST.axis[rg].map((t) => `<p>${t}</p>`).join('');
    const d = day ? it.dayChange : E - S, pct = day ? it.dayPct : (E / S - 1) * 100;
    return { delta: `↑${NBS}${stNum(d, it.decimals)}${NBS}${it.cur}${NBS}(+${stNum(pct, 1)}${NBS}%)`, label: ST.rangeLabel[rg],
      html: `<div class="st-in" style="width:${((ST_GEN[rg][0] + ST_GEN[rg][1]) / ST_GEN[rg][0] * 100).toFixed(1)}%"><div class="st-plot">
        <svg viewBox="0 0 1000 230" preserveAspectRatio="none" aria-hidden="true"><path id="st-path" d="" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>
        <b class="st-dot" id="st-dot" style="left:98.5%"></b><i class="st-cur" id="st-cur"></i><b class="st-cdot" id="st-cdot"></b></div><div class="st-axis">${ax}</div></div>` };
  }
  function renderStockChart(keepScroll) {
    const it = ST.items[stockId], c = stChartHtml(it), box = $('st-chart');
    $('st-delta').textContent = c.delta; $('st-dlabel').textContent = c.label;
    stScrubEnd(); box.innerHTML = c.html;
    box.scrollLeft = box.scrollWidth; stDraw(); box.onscroll = () => requestAnimationFrame(stDraw); // открывается «сегодня» — конец графика, историю можно подтянуть влево
    document.querySelectorAll('.st-range').forEach((b) => b.classList.toggle('selected', b.dataset.rg === stockRange));
  }
  const stNewsCard = (n) => newsCardHtml(n).replace(' data-news=""', '');
  function stockOverview(it) {
    const rows = it.metrics.map(([a, b]) => `<div class="st-row"><span>${a}</span><b>${b}</b></div>`).join('');
    const news = it.news.concat(stockMore[stockId] ? it.moreNews : []);
    return `
      <div class="st-card st-price">
        <div class="st-ph"><div class="st-p" id="st-p">${stMoney(it.price, it)}</div>
          <div class="st-pm"><span class="tag success" id="st-delta"></span><span id="st-dlabel"></span><span id="st-when"></span></div></div>
        <div class="st-cw"><i class="gl" style="top:12px"></i><i class="gl" id="st-gm"></i><i class="gl" style="top:214px"></i><div class="st-chart" id="st-chart"></div></div>
        <div class="st-ranges"><div>${ST.ranges.map(([id, t]) => `<button class="st-range tap" data-rg="${id}">${t}</button>`).join('')}</div></div>
      </div>
      <div class="st-pos"><div class="card"><div><span>${ST.portfolioTitle[0]}</span><b>${it.qty}${NBS}шт.</b></div><div class="r"><span>${ST.portfolioTitle[1]}</span><b class="n">${stMoney(it.qty * it.price, it)}</b></div></div></div>
      <button class="header tap" data-st-go="about"><h2>${ST.aboutTitle}</h2><img src="${A}imgChevronForwardM.svg" alt=""></button>
      <div class="section-pad"><div class="card st-about">
        <div class="st-ah"><div class="instr st-logo">${logoHtml(it.logo)}</div><b>${it.title}</b></div>
        <p class="st-desc">${it.about}</p>
        <button class="txt-btn st-read tap" data-st-go="about">${ST.readMore}</button>
        <h3 class="st-h3">${ST.metricsTitle}</h3>${rows}
        <div class="st-allm"><button class="more-btn tap" data-st-go="about">${ST.allMetrics}</button></div>
      </div></div>
      <button class="header tap" data-st-go="divs"><h2>${ST.divTitle}</h2><img src="${A}imgChevronForwardM.svg" alt=""></button>
      <div class="section-pad"><div class="card st-div">
        <div class="st-dc"><div><span>${ST.divLabels[0]}</span><b>${it.div.next}</b></div><div class="r"><span>${ST.divLabels[1]}</span><b>${it.div.yield}</b></div></div>
        <div class="st-row"><span>${ST.divLabels[2]}</span><b>${it.div.buyBy}</b></div>
        <div class="st-row"><span>${ST.divLabels[3]}</span><b>${it.div.amount}</b></div>
        <div class="st-allm"><button class="more-btn tap" data-st-go="divs">${ST.divMore}</button></div>
      </div></div>
      <div class="header"><h2>${ST.newsTitle}</h2></div>
      <div class="news-cards" id="st-news">${news.map(stNewsCard).join('')}</div>
      ${stockMore[stockId] ? '' : `<div class="st-more"><button class="ghost-btn tap" id="st-more">${ST.loadMore}</button></div>`}`;
  }
  function stockAbout(it) {
    const L = ST.aboutLabels, row = ([a, b]) => `<div class="st-row"><span>${a}</span><b>${b}</b></div>`;
    const row2 = ([a, d, v]) => `<div class="st-row st-row2"><span>${a}<small>${d}</small></span><b>${v}</b></div>`;
    const block = (title, rows) => `<div class="header"><h2>${title}</h2></div><div class="section-pad"><div class="card st-about">${rows}</div></div>`;
    return `<div class="section-pad"><div class="card st-about">
        <div class="st-ah"><div class="instr st-logo">${logoHtml(it.logo)}</div><b>${it.title}</b></div>
        <p class="st-desc full">${it.aboutFull}</p>
        ${row([L[0], it.country])}${row([L[1], it.industry])}
      </div></div>
      ${block(ST.metricsTitle, it.metricsFull.map(row).join(''))}
      ${block(ST.valTitle, it.valuation.map(row2).join(''))}
      ${block(ST.profTitle, it.profit.map(row2).join(''))}`;
  }
  function stockDivs(it) {
    const hist = ([d, y, p, amt]) => `<div class="dv-cell"><div class="dv-hd"><b>${d}</b><span>${y}</span></div><div class="dv-hs"><span>${p}</span><span>${amt} ${ST.divsPer}</span></div></div>`;
    return `<div class="header"><h2>${ST.divsNextTitle}</h2></div>
      <div class="section-pad"><div class="card dv-card">
        <div class="dv-cell"><div class="dv-r1"><span>${ST.divsBuyBy}</span><span>${ST.divsYield} ${it.div.yield}</span></div><div class="dv-r2"><b>${it.divBuyBy}</b><span>${it.div.amount} ${ST.divsPer}</span></div></div>
        <div class="dv-note"><i></i><p>${ST.divsNote}</p></div>
      </div></div>
      <div class="header"><h2>${ST.divsHistTitle}</h2></div>
      <div class="section-pad"><div class="card dv-card">${it.divHist.map(hist).join('')}</div></div>`;
  }
  function stockHist(it) {
    const m = (n) => `${stNum(n, it.decimals)}${NBS}${it.cur}`, sign = (n) => (n < 0 ? '-' : '+') + m(n);
    const op = ([k, amt, x, p]) => {
      const det = k === 'div' ? `${m(x)} ${ST.histPer}` : k === 'tax' ? `${ST.histOf} ${m(x)}` : `${x}${NBS}${ST.histPcs}/${m(p)}`;
      return `<div class="hs-cell"><div class="instr st-logo">${logoHtml(it.logo)}</div><div class="hs-d"><div class="hs-1"><b>${it.title}</b><span class="${amt < 0 ? 'neg' : 'pos'}">${sign(amt)}</span></div><div class="hs-2"><span>${ST.histKinds[k]}</span><span>${det}</span></div></div></div>`;
    };
    return it.hist.map(([d, ops]) => `<div class="header"><h2>${d}</h2></div><div class="section-pad"><div class="card hs-card">${ops.map(op).join('')}</div></div>`).join('');
  }
  // ---------- Стакан: демо-данные, детерминированные по тикеру ----------
  const BK_N = 25; // уровней цен в каждую сторону
  function stockBook(it) {
    const r = stRng(it.ticker + 'book'), t = it.tick, L = ST.bookLabels, vol = [];
    for (let i = 0; i < BK_N * 2; i++) vol.push(Math.max(1, Math.round(r() * r() * 600)));
    const asks = vol.slice(0, BK_N), bids = vol.slice(BK_N), max = Math.max(...vol);
    const row = (cls, price, v) => `<div class="bk-row ${cls}"><i style="width:${Math.max(3, v / max * 55).toFixed(1)}%"></i><span class="bk-b">${cls === 'bid' ? stNum(v, 0) : ''}</span><span class="bk-p">${stNum(price, it.decimals)}</span><span class="bk-s">${cls === 'ask' ? stNum(v, 0) : ''}</span></div>`;
    let h = '';
    for (let i = BK_N; i >= 1; i--) h += row('ask', it.price + t * i, asks[i - 1]);
    h += '<div class="bk-mid" id="bk-mid"></div>'; // граница покупки и продажи
    for (let i = 1; i <= BK_N; i++) h += row('bid', it.price - t * i, bids[i - 1]);
    return `<div class="bk"><div class="bk-head"><span>${L[0]}</span><span>${L[1]} ${it.cur}</span><span>${L[2]}</span></div><div class="bk-list" id="bk-list">${h}</div></div>`;
  }
  function stBookCenter() { // граница покупки и продажи — по центру видимой области
    const l = $('bk-list'), m = $('bk-mid'); if (!l || !m) return;
    l.scrollTop = m.offsetTop + m.offsetHeight / 2 - l.clientHeight / 2;
  }
  function renderStock() {
    const it = ST.items[stockId], chips = $('st-chips');
    chips.innerHTML = ST.tabs.map(([id, t]) => `<button class="st-chip tap${id === stockTab ? ' selected' : ''}" data-st="${id}">${t}</button>`).join('');
    const sel = chips.querySelector('.selected'); // выбранная вкладка всегда в зоне видимости
    if (sel.offsetLeft + sel.offsetWidth + 16 > chips.scrollLeft + chips.clientWidth) chips.scrollLeft = sel.offsetLeft + sel.offsetWidth + 16 - chips.clientWidth;
    else if (sel.offsetLeft - 16 < chips.scrollLeft) chips.scrollLeft = Math.max(0, sel.offsetLeft - 16);
    $('st-fav').classList.toggle('on', !!stockFav[stockId]); $('st-fav').setAttribute('aria-pressed', !!stockFav[stockId]);
    $('st-title').textContent = it.navTitle; $('st-sub').textContent = it.ticker;
    $('screen-stock').classList.toggle('book', stockTab === 'book'); $('screen-stock').classList.toggle('wbar', stockTab === 'book' || stockTab === 'divs' || stockTab === 'hist');
    $('st-body').innerHTML = stockTab === 'overview' ? stockOverview(it) : stockTab === 'book' ? stockBook(it) : stockTab === 'about' ? stockAbout(it) : stockTab === 'divs' ? stockDivs(it) : stockTab === 'hist' ? stockHist(it) : `<div class="st-empty">${ST.empty}</div>`;
    if (stockTab === 'book') { stBookCenter(); requestAnimationFrame(stBookCenter); }
    if (stockTab === 'overview') { renderStockChart(); stChartPointer($('st-chart')); }
  }
  $('screen-stock').innerHTML = `
    <div class="note-nav st-nav"><button class="back tap" data-back="stock" aria-label="Назад"><i></i></button><span class="st-t"><b id="st-title"></b><span id="st-sub"></span></span><span class="sp st-r"><button class="st-fav tap" id="st-fav" aria-label="В избранное" aria-pressed="false"></button></span></div>
    <div class="note-scroll" id="st-scroll">
      <div class="note-chips" id="st-chips"></div>
      <div id="st-body"></div>
    </div>
    <div class="st-trade" id="st-trade"><button class="sell tap" data-st-trade>${ST.sell}</button><button class="buy tap" data-st-trade>${ST.buy}</button></div>`;
  const openStock = (id) => { stockId = id; stockTab = 'overview'; stockRange = 'day'; renderStock(); go('stock'); $('st-scroll').scrollTop = 0; const ch = $('st-chart'); ch.scrollLeft = ch.scrollWidth; stDraw(); };
  // тап по бумаге в любом списке: Apple и Kaspi.kz открывают страницу, остальные — предупреждение
  document.addEventListener('click', (e) => {
    const row = e.target.closest('.instr'); if (!row || row.closest('#screen-note, #screen-stock') || row.classList.contains('st-logo')) return;
    const nm = row.querySelector('.name'), id = nm && ST.byName[nm.textContent.trim()];
    if (id) openStock(id); else showSnack(ST.warnSnack);
  });
  document.addEventListener('click', (e) => {
    if (e.target.closest('#screen-stock') === null) return;
    const sg = e.target.closest('[data-st-go]'), sc = $('st-scroll');
    if (sg) { stockTab = sg.dataset.stGo; renderStock(); sc.scrollTop = 0; return; }
    const tb = e.target.closest('.st-chip');
    if (tb) { stockTab = tb.dataset.st; renderStock(); sc.scrollTop = 0; return; } // вкладка всегда прилипла сверху — скролл ровно до неё
    const rb = e.target.closest('.st-range'); if (rb) { stockRange = rb.dataset.rg; renderStockChart(); return; }
    if (e.target.closest('#st-more')) { stockMore[stockId] = true; const mb = e.target.closest('.st-more'); $('st-news').insertAdjacentHTML('beforeend', ST.items[stockId].moreNews.map(stNewsCard).join('')); mb.remove(); return; }
    if (e.target.closest('#st-fav')) { stockFav[stockId] = !stockFav[stockId]; $('st-fav').classList.toggle('on', stockFav[stockId]); $('st-fav').setAttribute('aria-pressed', stockFav[stockId]); showSnack(`${ST.items[stockId].navTitle} ${stockFav[stockId] ? ST.favOn : ST.favOff}`, 'success'); return; }
    if (e.target.closest('[data-st-trade]')) showSnack(ST.tradeSnack);
  });

  // ---------- Снекбар (Figma 104:27393) ----------
  const snackEl = $('snack');
  const SN_LEN = 2 * Math.PI * 11;
  let snackT = [], snackLeft = 5;
  snackEl.innerHTML = `
    <div class="sn-box">
      <div class="sn-body">
        <span class="sn-timer"><svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="12" class="tm-bg"/><circle class="arc" cx="12" cy="12" r="11" fill="none" stroke="#db3434" stroke-width="2" stroke-dasharray="${SN_LEN.toFixed(2)}" stroke-dashoffset="0" transform="rotate(-90 12 12)"/></svg><b id="sn-num">5</b></span>
        <span class="sn-text">${window.ARTICLE.snackText}</span>
      </div>
      <button class="sn-act tap" id="sn-act">Понятно</button>
    </div>`;
  function hideSnack() { snackT.forEach(clearTimeout); snackT.forEach(clearInterval); snackT = []; snackEl.classList.remove('open'); setTimeout(() => { if (!snackEl.classList.contains('open')) snackEl.hidden = true; }, 240); }
  function showSnack(text, tone) {
    snackEl.querySelector('.sn-text').textContent = text || window.ARTICLE.snackText;
    snackT.forEach(clearTimeout); snackT.forEach(clearInterval); snackT = [];
    const nav = document.querySelector('.bottomnav');
    const buyBar = !$('screen-note').hidden ? $('note-buy') : !$('screen-stock').hidden ? $('st-trade') : null; // на странице ноты снекбар встаёт над кнопкой «Купить»
    snackEl.style.bottom = ((buyBar ? buyBar.offsetHeight : nav && nav.offsetParent ? nav.offsetHeight : 0) + 8) + 'px';
    const arc = snackEl.querySelector('.arc'); snackEl.classList.toggle('ok', tone === 'success'); arc.style.stroke = tone === 'success' ? 'var(--content-success)' : 'var(--content-negative)'; arc.style.transition = 'none'; arc.style.strokeDashoffset = '0';
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
    <div class="pc-wrap"><button class="card pcard tap" ${p.name === 'Жолбарыс электро' ? 'data-note="1"' : 'data-snack="1"'}>
      <span class="pl">${prodLogo(p.logo)}</span>
      <span class="pd">
        <span class="r1"><b>${p.name}</b><b class="y">${p.yieldTxt}</b></span>
        <span class="r2"><span>${p.min}</span><span>${p.period}</span></span>
        <span class="r3"><span class="th">${p.theme}</span><span>${p.rate}</span></span>
      </span></button></div>`;
  const menuCell = (icon, label, go = '') => `<button class="card mcell tap" ${go ? `data-go="${go}"` : ''}><span class="vb"><b class="vbg"></b><i style="--ic:url(${A}buy/${icon}.svg)"></i></span><b>${label}</b></button>`;
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
      <button class="hero-prod tap" data-note="1">
        <img class="art" src="${A}imgFrame312121540.png" alt="">
        <span class="top"><span class="l"><b>${hero.name}</b><span>${hero.hint}</span></span><span class="r"><b>${hero.yieldTxt}</b><span>${hero.period}</span></span></span>
        <span class="bot"><span class="tg"><i style="--ic:url(${A}buy/crown.svg)"></i>${hero.tag}</span><b>${hero.rate}</b></span>
      </button>
    </div>
    ${header('Продукты N1broker', false)}
    <div class="hscroll buy-chips">${BY.tabs.map((t) => `<button class="buy-chip tap" data-tab="${t}">${t}</button>`).join('')}</div>
    <div id="buy-products"></div>
    <div class="header sub-h"><h2>${CL.roi.title}</h2><p>${CL.roi.sub}</p></div>
    ${collRow(CL.roi.sectors)}
    ${header('Подборки ценных бумаг', false)}
    ${themesHtml()}
    ${header('Компании и дивиденды', false)}
    ${collRow(CL.dividends)}
    ${header('Портфели великих', false)}
    <div class="hscroll greats">${CL.greats.map(greatCard).join('')}</div>
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
  const renderThemeSheet = () => {
    sheetEl.innerHTML = `
      <div class="sh-head"><h2>${MR.themeTitle}</h2><button class="sh-x tap" data-close-sheet aria-label="Закрыть"><img src="${A}search/cross.svg" alt=""></button></div>
      ${MR.themes.map(([id, name]) => `<button class="sh-row tap" data-theme-opt="${id}"><span class="tx"><b>${name}</b></span><i class="radio${appTheme === id ? ' on' : ''}"></i></button>`).join('')}
      <div class="sh-safe"></div>`;
  };
  function openSheet(fn) {
    (fn || renderSheet)(); sheetEl.hidden = false; scrimEl.hidden = false; sheetOpenFlag = true; syncTheme();
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
    setBars(getComputedStyle(document.documentElement).getPropertyValue(white ? '--bg-main' : '--bg-primary').trim()); // и на экране входа тоже светлые (по просьбе)
  }
  // Цвет статус-бара и нижней панели Safari на iPhone: theme-color + фон страницы. После чёрного экрана входа Safari «залипает» на чёрном,
  // поэтому при смене цвета тег пересоздаётся — так iOS заново считывает цвет.
  let barColor = '';
  function setBars() {} // theme-color не задаём: Safari сам берёт цвет полос из страницы (видео на входе, фон экрана после) — полосы «прозрачные»
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
    <div class="scell"><button class="instr tap"${i.id === 'zlbrs' ? ' data-note="1"' : ''}>${logoHtml(i.logo)}
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

  // ---------- Раздел «Еще» (Figma 214:22236 / 214:22170 / 210:20026) ----------
  const MR = window.MORE;
  let moreTab = MR.defaultTab;
  // Тема приложения: токены Ultima (Light / Dark) переключаются атрибутом data-theme на <html>; выбор запоминается в браузере
  let appTheme = 'light';
  try { appTheme = localStorage.getItem('n1p-theme') === 'dark' ? 'dark' : 'light'; } catch (e) {}
  const applyTheme = (t) => { appTheme = t; document.documentElement.dataset.theme = t; try { localStorage.setItem('n1p-theme', t); } catch (e) {} };
  document.documentElement.dataset.theme = appTheme;
  const themeName = () => MR.themes.find(([id]) => id === appTheme)[1];
  const swState = [true, true, true];
  const mi = (f) => `<img src="assets/more/${f}.svg" alt="">`;
  const mrRight = (c) => `${c.badge ? `<span class="mr-badge">${c.badge}</span>` : ''}${c.right ? `<span class="mr-ic">${mi(c.right)}</span>` : ''}`;
  const mrCell = (c) => `<div class="mr-m"><button class="mr-mc tap${c.top ? ' top' : ''}" data-mr-na><span class="mr-ic big">${mi(c.icon)}</span>
      <span class="mr-t"><b>${c.title}</b><small${c.hintCls ? ` class="${c.hintCls}"` : ''}>${c.hint}</small></span><span class="mr-r">${mrRight(c)}</span></button></div>`;
  const mrRows = (rows) => `<div class="section-pad"><div class="card mr-list">${rows.map(([l, v, r]) => `<div class="mr-row"><div class="mr-t"><small>${l}</small><b>${v}</b></div><span class="mr-ic tall">${r ? `<button class="tap" data-mr-na aria-label="${l}">${mi(r)}</button>` : ''}</span></div>`).join('')}</div></div>`;
  const mrHead = (t) => `<div class="header"><h2>${t}</h2></div>`;
  function moreBody() {
    if (moreTab === 'profile') { const p = MR.profile; return `
      <div class="mr-hero"><div class="card"></div><div class="mr-av">${p.initials}</div><div class="mr-name">${p.name}</div></div>
      ${p.cells.map(mrCell).join('')}
      ${mrHead(p.personalTitle)}${mrRows(p.personal)}${mrHead(p.accountsTitle)}${mrRows(p.accounts)}
      <div class="mr-btnw"><button class="mr-btn tap" data-logout>${p.logout}</button></div>`; }
    if (moreTab === 'actions') { const a = MR.actions; let k = -1; return `${a.cells.map(mrCell).join('')}${mrHead(a.settingsTitle)}
      <div class="section-pad"><div class="card mr-list">${a.settings.map((r) => {
        const hint = r.theme ? themeName() : r.hint, sw = r.toggle ? ++k : -1;
        const right = r.toggle ? `<button class="mr-sw tap" role="switch" aria-checked="${swState[sw]}" data-mr-sw="${sw}"><i></i></button>` : `<span class="mr-ic">${mi('chevron')}</span>`;
        return `<${r.toggle ? 'div' : 'button'} class="mr-row set${r.toggle ? '' : ' tap'}"${r.theme ? ' data-theme-open' : r.toggle ? '' : ' data-mr-na'}><div class="mr-t"><b>${r.title}</b>${hint ? `<small class="s14">${hint}</small>` : ''}</div><span class="mr-rt">${right}</span></${r.toggle ? 'div' : 'button'}>`; }).join('')}</div></div>`; }
    const i = MR.info;
    return `${i.cells.map(mrCell).join('')}
      ${header(i.academyTitle)}<div class="hscroll academy">${D.lessons.map(lesson).join('')}</div>
      ${mrHead(i.docsTitle)}<div class="section-pad"><div class="card mr-docs">${i.docs.map((d) => `<button class="mr-doc tap" data-mr-na><span class="mr-ic big">${mi('document')}</span><span class="mr-t"><b>${d}</b></span><span class="mr-ic">${mi('chevron')}</span></button>`).join('')}</div></div>
      <div class="mr-m"><div class="mr-mc top"><span class="mr-ic big">${mi(i.version.icon)}</span><span class="mr-t"><b>${i.version.title}</b><small>${i.version.hint}</small></span></div></div>`;
  }
  function renderMore() {
    $('screen-more').innerHTML = `<div class="mr-chips">${MR.chips.map(([id, t]) => `<button class="st-chip tap${id === moreTab ? ' selected' : ''}" data-mt="${id}">${t}</button>`).join('')}</div><div class="mr-body">${moreBody()}</div>`;
    $('screen-more').querySelectorAll('.hscroll').forEach(enableDrag);
  }
  renderMore();
  document.addEventListener('click', (e) => {
    if (e.target.closest('#screen-more') === null) return;
    const mt = e.target.closest('[data-mt]'); if (mt) { moreTab = mt.dataset.mt; renderMore(); $('screen-more').scrollTop = 0; return; } // чипсы всегда прилипли сверху — скролл в начало
    const sw = e.target.closest('[data-mr-sw]');
    if (sw) { const k = +sw.dataset.mrSw; swState[k] = !swState[k]; sw.setAttribute('aria-checked', swState[k]); return; }
    if (e.target.closest('[data-theme-open]')) { openSheet(renderThemeSheet); return; }
    if (e.target.closest('[data-logout]')) { lgOpen(); return; }
    if (e.target.closest('[data-mr-na]')) showSnack(MR.snack);
  });

  // ---------- Вход (Figma 217:27140 / 217:27810 ошибка / 217:27909 клавиатура) ----------
  // Видео играет один раз и остаётся на последнем кадре; когда оно загрузилось, снизу выезжает шторка с вводом номера.
  const LG = window.LOGIN, loginEl = $('screen-login'), phoneEl = document.querySelector('.phone');
  const lgImg = (f, c) => `<img src="assets/login/${f}.svg" alt=""${c ? ` class="${c}"` : ''}>`;
  const lgKeys = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ']];
  loginEl.innerHTML = `
    <video class="lg-video" src="assets/login/bg.mp4?v=3" muted playsinline webkit-playsinline preload="auto" aria-hidden="true"></video>
    <div class="lg-sb"><span class="time">9:41</span>${lgImg('statusbar-white')}</div>
    <div class="lg-sheet" id="lg-sheet">
      <h1>${LG.title}</h1>
      <div class="lg-fw">
        <label class="lg-in" id="lg-in">${lgImg('phone')}<input id="lg-input" type="tel" inputmode="numeric" pattern="[0-9]*" autocomplete="off" enterkeyhint="go" placeholder="${LG.placeholder}" aria-label="${LG.placeholder}"><button class="lg-x" id="lg-x" type="button" aria-label="Очистить" hidden>${lgImg('cross')}</button></label>
        <button class="lg-btn tap" id="lg-go" type="button">${LG.button}</button>
      </div>
      <p class="lg-cons">${LG.consent}</p>
      <button class="lg-docs tap" type="button" id="lg-docs"><b>${LG.docs}</b><img src="${A}imgChevronForwardM.svg" alt=""></button>
      <div class="lg-hi"></div>
    </div>
    <div class="lg-kb" id="lg-kb" hidden>${lgKeys.map(([n, l]) => `<button class="k" data-k="${n}" tabindex="-1"><b>${n}</b><small>${l}</small></button>`).join('')}<img class="k-img" src="assets/login/key-sym.svg" alt=""><button class="k" data-k="0" tabindex="-1"><b>0</b></button><button class="k-img" data-k="del" tabindex="-1" aria-label="Удалить"><img src="assets/login/key-del.svg" alt=""></button></div>`;
  const lgInput = $('lg-input'), lgIn = $('lg-in'), lgSheet = $('lg-sheet'), lgVideo = loginEl.querySelector('.lg-video'), lgKb = $('lg-kb');
  lgVideo.muted = true; lgVideo.defaultMuted = true; lgVideo.setAttribute('muted', ''); // без звука: свойство muted из innerHTML не всегда применяется, и автоплей блокируется
  const lgTouch = matchMedia('(hover: none) and (pointer: coarse)').matches;
  let lgDigits = '', lgDone = false, lgShown = false;
  // маска +7 (XXX) XXX-XX-XX: 10 цифр после кода страны, больше ввести нельзя
  const lgFmt = (d) => d ? `+7 (${d.slice(0, 3)}${d.length > 3 ? ') ' + d.slice(3, 6) : ''}${d.length > 6 ? '-' + d.slice(6, 8) : ''}${d.length > 8 ? '-' + d.slice(8, 10) : ''}` : '';
  const lgRender = () => {
    lgInput.value = lgFmt(lgDigits); $('lg-x').hidden = !lgDigits; lgIn.classList.remove('err');
    const n = lgInput.value.length; try { lgInput.setSelectionRange(n, n); } catch (e) {}
  };
  const lgSet = (raw, hadPrefix) => {
    let d = raw.replace(/\D/g, '');
    if (hadPrefix) d = d.slice(1); // первая «7» в «+7» — код страны
    else if (d.length > 10 && /^[78]/.test(d)) d = d.slice(1); // вставили номер целиком: 8… / 7…
    lgDigits = d.slice(0, 10); lgRender();
  };
  lgInput.addEventListener('input', () => lgSet(lgInput.value, lgInput.value.startsWith('+7')));
  lgInput.addEventListener('beforeinput', (e) => { if (e.inputType === 'deleteContentBackward') { e.preventDefault(); lgDigits = lgDigits.slice(0, -1); lgRender(); } });
  lgInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); lgSubmit(); } });
  const lgCaret = () => requestAnimationFrame(() => { const n = lgInput.value.length; try { lgInput.setSelectionRange(n, n); } catch (e) {} });
  lgInput.addEventListener('click', lgCaret);
  $('lg-x').addEventListener('click', () => { lgDigits = ''; lgRender(); lgInput.focus(); });
  // поле и кнопка подъезжают вверх над клавиатурой; под клавиатурой остаются текст согласия и «Ознакомиться с документами»
  let lgBelow = 0;
  const lgShift = (kb) => {
    if (!lgBelow) lgBelow = lgSheet.offsetHeight - (loginEl.querySelector('.lg-fw').offsetTop + $('lg-go').offsetTop + $('lg-go').offsetHeight); // offset-размеры не зависят от масштаба рамки телефона на ноутбуке
    lgSheet.style.transform = kb > 0 ? `translateY(${-Math.max(0, kb + 17 - lgBelow)}px)` : '';
  };
  const lgKbMeasure = () => { // реальная клавиатура телефона: высота = разница между окном и видимой областью
    const vv = window.visualViewport; if (!vv || !lgTouch) return;
    lgShift(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
  };
  if (window.visualViewport) { visualViewport.addEventListener('resize', lgKbMeasure); visualViewport.addEventListener('scroll', lgKbMeasure); }
  lgInput.addEventListener('focus', () => { lgIn.classList.remove('err'); lgCaret(); if (!lgTouch) { lgKb.hidden = false; requestAnimationFrame(() => { lgKb.classList.add('on'); lgShift(291); }); } else setTimeout(lgKbMeasure, 300); });
  lgInput.addEventListener('blur', () => { if (!lgTouch) { lgKb.classList.remove('on'); lgShift(0); setTimeout(() => { if (!lgKb.classList.contains('on')) lgKb.hidden = true; }, 260); } else lgShift(0); });
  // экранная цифровая клавиатура для ноутбука (Figma 217:27909); на телефоне — настоящая
  lgKb.addEventListener('mousedown', (e) => e.preventDefault());
  lgKb.addEventListener('click', (e) => {
    const k = e.target.closest('[data-k]'); if (!k) return;
    if (k.dataset.k === 'del') lgDigits = lgDigits.slice(0, -1); else lgDigits = (lgDigits + k.dataset.k).slice(0, 10);
    lgRender();
  });
  function lgSubmit() {
    if (lgDone) return;
    if (!lgDigits) { lgIn.classList.add('err'); return; } // пусто — состояние ошибки
    lgDone = true; lgInput.blur(); lgVideo.pause();
    // iPhone/Safari: после чёрного экрана входа верхняя и нижняя полосы браузера «залипают» на чёрном до перезагрузки,
    // поэтому на телефоне после входа страница перезагружается сразу на «Главную» (вход не показывается: в адресе есть #/home)
    if (lgTouch) { try { sessionStorage.setItem('n1p-after-login', '1'); } catch (e) {} location.hash = '#/home'; location.reload(); return; }
    go('home'); loginEl.classList.add('out'); phoneEl.classList.remove('login-on'); syncTheme(); setBars(getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim(), true); setTimeout(syncTheme, 350);
    setTimeout(() => { loginEl.hidden = true; }, 320);
  }
  $('lg-go').addEventListener('click', lgSubmit);
  function lgOpen() { // «Выйти из профиля»: снова экран входа, видео и шторка — с начала
    lgDone = false; lgShown = false; lgDigits = ''; lgRender(); lgIn.classList.remove('err');
    lgSheet.classList.remove('in'); lgSheet.style.transform = ''; lgKb.classList.remove('on'); lgKb.hidden = true;
    loginEl.hidden = false; loginEl.classList.remove('out'); phoneEl.classList.add('login-on'); hideSnack(); syncTheme();
    const go1 = () => { const p = lgVideo.play(); if (p && p.catch) p.catch(() => lgReveal()); };
    lgVideo.addEventListener('seeked', go1, { once: true }); lgVideo.currentTime = 0; if (lgVideo.readyState < 2) go1(); // после перемотки в начало запускаем заново
    setTimeout(lgReveal, 2200);
    if (location.hash !== '#/login') location.hash = '#/login';
  }
  window.addEventListener('hashchange', () => { if (location.hash === '#/login' && lgDone) lgOpen(); });
  $('lg-docs').addEventListener('click', () => { showSnack(window.MORE.snack); snackEl.style.bottom = '46px'; });
  const lgReveal = () => { if (lgShown) return; lgShown = true; requestAnimationFrame(() => lgSheet.classList.add('in')); };
  lgVideo.addEventListener('playing', () => setTimeout(lgReveal, 350));
  setTimeout(lgReveal, 2200); // если видео не загрузилось или автоплей запрещён — шторка всё равно выезжает
  lgVideo.play && lgVideo.play().catch(() => lgReveal());
  try { if (sessionStorage.getItem('n1p-after-login')) { sessionStorage.removeItem('n1p-after-login'); phoneEl.classList.add('enter'); setTimeout(() => phoneEl.classList.remove('enter'), 500); } } catch (e) {}
  const lgNeeded = !location.hash || location.hash === '#/' || location.hash === '#/login';
  if (lgNeeded) { loginEl.hidden = false; phoneEl.classList.add('login-on'); } else { lgDone = true; }

  // ---------- Нижняя навигация и переходы между экранами ----------
  // Живые вкладки: Главная и Портфель (остальных экранов в макетах пока нет)
  const tabs = [['home', 'Главная', 'imgNavigationHomeM'], ['portfolio', 'Портфель', 'imgPfmPrmM'], ['buy', 'Купить', 'imgNavigationQuotationsM'],
    ['support', 'Поддержка', 'imgNavigationChatM'], ['more', 'Еще', 'imgNavigationMoreM']];
  $('tabs').innerHTML = tabs.map(([id, t, i]) =>
    `<button class="tab tap" ${id === 'support' ? 'data-support' : id ? `data-go="${id}"` : ''}><i style="--ic:url(${A}${i}.svg)"></i><span>${t}</span></button>`).join('');

  const screens = ['home', 'portfolio', 'buy', 'catalog', 'news', 'search', 'article', 'note', 'stock', 'more'];
  let articleFrom = 'home';
  let noteFrom = 'home';
  let stockPrev = 'home';
  let searchFrom = 'home';
  let current = null;
  const show = (name) => {
    if (!screens.includes(name)) name = 'home';
    if (name === current) return;
    const prev = current; current = name;
    if (name === 'search' && prev && prev !== 'search' && prev !== 'note' && prev !== 'stock') searchFrom = prev; // поиск — поверх экрана-источника; возврат с ноты его не меняет
    if (name === 'article' && prev && prev !== 'article' && prev !== 'note') articleFrom = prev; // возврат с ноты не меняет источник статьи
    if (name === 'note' && prev && prev !== 'note') noteFrom = prev;
    if (name === 'stock' && prev && prev !== 'stock') stockFrom = prev;
    hideSnack(); $('art-promo').classList.remove('show');
    screens.forEach((s) => { $('screen-' + s).hidden = s !== name; });
    document.querySelectorAll('.tab').forEach((el) => el.classList.toggle('active', el.dataset.go === name));
    document.querySelector('.phone').classList.toggle('no-tabs', name === 'news' || name === 'catalog' || name === 'article' || name === 'note' || name === 'stock');
    document.querySelector('.phone').classList.toggle('cat-on', name === 'catalog');
    document.querySelector('.phone').classList.toggle('search-on', name === 'search');
    document.querySelector('.phone').classList.toggle('art-on', name === 'article');
    if (name === 'search') { if (prev !== 'note' && prev !== 'stock') { $('srch-q').value = ''; renderSearch(); $('screen-search').scrollTop = 0; $('srch-q').focus({ preventScroll: true }); } }
    else if (prev === 'search') $('srch-q').blur();
    if (name === 'news') fitLeads();
    updatePfNav(); // на экране новостей таб-бара нет (макет: только home indicator)
  };
  const go = (name) => { show(name); if (location.hash !== '#/' + name) location.hash = '#/' + name; };
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-support]')) { showSnack('В прототипе поддержка недоступна'); return; }
    const t = e.target.closest('[data-go]');
    if (t) { if (t.dataset.go === 'more') { moreTab = t.dataset.more || MR.defaultTab; renderMore(); $('screen-more').scrollTop = 0; } go(t.dataset.go); }
    const ct = e.target.closest('.chip-tab');
    if (ct) { newsTab = ct.dataset.tab; renderNews(); $('news-scroll').scrollTop = 0; }
    const cc = e.target.closest('.catchip');
    if (cc) { catType = cc.dataset.ct === catType && catType === 'fav' ? 'all' : cc.dataset.ct; renderCatalog(); }
    if (e.target.closest('#cat-plat, #cat-plat-nav')) openSheet();
    if (e.target.closest('[data-close-sheet]')) closeSheet();
    const to = e.target.closest('[data-theme-opt]');
    if (to) {
      applyTheme(to.dataset.themeOpt);
      // iPhone/Safari: полосы вверху и внизу не перекрашиваются без перезагрузки — на телефоне перезагружаем страницу на этом же экране
      if (lgTouch) { try { sessionStorage.setItem('n1p-after-login', '1'); } catch (e) {} location.hash = '#/more'; location.reload(); return; }
      renderThemeSheet(); renderMore(); setTimeout(closeSheet, 220);
    }
    const pr = e.target.closest('[data-plat]');
    if (pr) { catPlat = pr.dataset.plat; catType = 'all'; renderCatalog(); renderSheet(); setTimeout(closeSheet, 220); }
    const bc = e.target.closest('.buy-chip');
    if (bc) { buyTab = bc.dataset.tab; renderBuyProducts(); }
    if (e.target.closest('[data-back="search"]')) go(searchFrom);
    const nw = e.target.closest('[data-news]');
    if (nw) { if (window.ARTICLE[nw.dataset.news]) { renderArticle(nw.dataset.news); go('article'); } else showSnack(); }
    if (e.target.closest('[data-back="article"]')) go(articleFrom);
    if (e.target.closest('[data-note]')) { noteTab = 'overview'; renderNote(); go('note'); $('note-scroll').scrollTop = 0; }
    else if (e.target.closest('[data-snack]')) showSnack(window.NOTE.bannerSnack);
    if (e.target.closest('[data-back="note"]')) { closeHint(); go(noteFrom); }
    if (e.target.closest('[data-back="stock"]')) go(stockFrom);
    const ng = e.target.closest('[data-nt-go]');
    if (ng) { noteTab = ng.dataset.ntGo; renderNote(); const sc = $('note-scroll'); sc.scrollTop = Math.min(sc.scrollTop, sc.querySelector('.note-hero').offsetHeight); return; }
    const nc = e.target.closest('.note-chip');
    if (nc) {
      const top = $('note-scroll').scrollTop, stuck = $('note-scroll').querySelector('.note-hero').offsetHeight; noteTab = nc.dataset.nt; renderNote(); $('note-scroll').scrollTop = Math.min(top, stuck); // вкладка уже прилипла — подскроллить ровно до момента фиксации, иначе не трогать
    }
    if (e.target.closest('[data-doc]')) showSnack(window.NOTE.docSnack);
    if (e.target.closest('[data-promo]')) { // тап по снекбару: прокрутить к идее и убрать его
      const sc = $('art-scroll'), h = sc.querySelector('.art-idea-h'); $('art-promo').classList.remove('show');
      sc.scrollTo({ top: sc.scrollTop + h.getBoundingClientRect().top - sc.getBoundingClientRect().top - 8, behavior: 'smooth' });
    }
    if (e.target.closest('[data-buy]')) showSnack(window.NOTE.buySnack);
    if (e.target.closest('[data-media]')) showSnack(window.NOTE.overview.mediaSnack);
    const na = e.target.closest('[data-acc]');
    if (na) { const open = na.closest('.note-acc').classList.toggle('open'); na.setAttribute('aria-expanded', open); }
    const nm = e.target.closest('[data-note-more]');
    if (nm) { const open = nm.closest('.note-more').classList.toggle('open'); nm.setAttribute('aria-expanded', open); }
    const m = e.target.closest('[data-toggle]');
    if (m) { const open = m.closest('.pf-card').classList.toggle('open'); m.textContent = open ? 'Показать меньше' : 'Показать больше'; }
  });
  window.addEventListener('hashchange', () => show(location.hash.replace('#/', '')));
  show(location.hash.replace('#/', ''));

  // Перетаскивание лент мышью (на ноутбуке нет свайпа)
  function enableDrag(el) {
    if (el._drag) return; el._drag = true;
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
  }
  document.querySelectorAll('.hscroll').forEach(enableDrag);

  // Рамка телефона вписывается в окно ноутбука
  const phone = document.querySelector('.phone');
  const fit = () => {
    const k = window.innerWidth <= 500 ? 1 : Math.min(1, (window.innerHeight - 56) / 812);
    phone.style.transform = k < 1 ? `scale(${k})` : '';
  };
  window.addEventListener('resize', fit); fit();
})();
