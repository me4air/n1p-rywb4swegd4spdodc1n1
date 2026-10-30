// Подборки (Figma: Главная 95:10583 · Купить 98:15688, обновлено 2026-10-30).
// Структура из макета: «Взлеты и падения дня» (2 карточки по 3 бумаги + «Показать все»), «Подборки ценных бумаг» (промо-баннеры),
// «Лидеры по ROI» по секторам, «Портфели великих». Состав, цены и тексты подборок — демо (ADDED); котировки совпадают с каталогом.
(function () {
  const nb = ' ';
  const t = (txt, bg, color) => ({ txt, bg: bg || '#e8f2fe', color: color || '#2563eb' }); // плитка с тикером
  const L = {
    kaspi: 'imgVisualContainer.png', halyk: 'imgVisualContainer1.png',
    apple: { src: 'logos/apple.svg', bg: '#000', pad: 11, invert: true },
    tesla: { src: 'logos/tesla.svg', bg: '#e31937', pad: 11 },
    msft: { src: 'logos/microsoft.svg', bg: '#fff', pad: 8 },
    google: { src: 'pf/logo-google.png' },
    nvidia: { src: 'logos/nvidia.svg', bg: '#fff', pad: 4, crop: 'nvidia' },
    kap: { src: 'logos/kap.svg', bg: '#fff', pad: 3, crop: 'kap' },
    aira: { src: 'logos/airastana.png', bg: '#fff', pad: 3, crop: 'aira' },
    kcell: { src: 'logos/kcell.svg', bg: '#fff', pad: 3 },
    coca: { src: 'logos/coca.svg', bg: '#fff', pad: 3 },
    jnj: { src: 'logos/jnj.svg', bg: '#fff', pad: 3 },
    pg: { src: 'logos/pg.svg', bg: '#fff', pad: 4 },
  };
  const up = (d, p) => `↑${nb}${d}${nb}(+${p}${nb}%)`;
  const dn = (d, p) => `↓${nb}${d}${nb}(−${p}${nb}%)`;
  const S = (name, ticker, price, delta, logo, neg) => ({ name, ticker, price, delta, logo, neg: !!neg });

  window.COLL = {
    // «Взлеты и падения дня» — считаются по каталогу бумаг (те же цены и изменения, что в поиске и каталоге)
    movers: (() => {
      const pct = (i) => { const m = /\(([+−])([\d,]+)/.exec(i.delta); return m ? (m[1] === '−' ? -1 : 1) * parseFloat(m[2].replace(',', '.')) : null; };
      const pick = (sign) => window.CATALOG.items.filter((i) => pct(i) !== null && Math.sign(pct(i)) === sign)
        .sort((x, y) => sign * (pct(y) - pct(x))).slice(0, 10)
        .map((i) => S(i.name, i.ticker, i.price, i.delta, i.logo, sign < 0));
      const split = (title, list) => ({ title, items: list.slice(0, 3), extra: list.slice(3) });
      return [split('Лидеры роста за сегодня', pick(1)), split('Главные падения дня', pick(-1))];
    })(),

    // «Компании и дивиденды» — только в «Купить»; бумаги и котировки берутся из каталога
    dividends: (() => {
      const by = (tk) => window.CATALOG.items.find((i) => i.ticker === tk);
      const card = (title, tickers, all) => ({ title, all, items: tickers.map((tk) => { const i = by(tk); return S(i.name, i.ticker, i.price, i.delta, i.logo, i.neg); }) });
      return [card('Выплаты в этом месяце', ['KSPI', 'HSBK', 'AAPL'], 8), card('Высокая дивидендная доходность', ['KZAP', 'KO', 'JNJ'], 10), card('Стабильные дивиденды', ['PG', 'MSFT', 'KCEL'], 12)];
    })(),

    // «Подборки ценных бумаг» — промо-баннеры. art — иллюстрация (SVG-глиф на цветном фоне), logos — стопка логотипов (до 5); если бумаг больше 5, в кружке «N+» (count − 5), иначе кружка нет
    themes: [
      { title: 'Высокий потенциал роста', sub: 'Лучшие по рентабельности собственного капитала', count: 15, color: '#8e5aff', img: 'coll/promo-roi.png', imgStyle: 'height:101.47%;left:10.54%;top:-7.5%;width:78.92%',
        logos: [L.nvidia, L.apple, L.msft, L.coca, L.google] },
      { title: 'Голубые фишки Казахстана', sub: 'Крупнейшие и самые ликвидные компании KASE', count: 12, color: '#ffb300', img: 'coll/promo-kz.png', imgStyle: 'height:111.7%;left:8.59%;top:-8%;width:86.88%',
        logos: [L.kaspi, L.halyk, L.kap, L.aira, L.kcell] },
      { title: 'Дивидендные аристократы', sub: 'Повышают выплаты более 25 лет подряд', count: 20, img: 'coll/promo-div.png', imgStyle: 'height:101.47%;left:10.54%;top:-7.5%;width:78.92%', bg: 'linear-gradient(160deg,#34d399,#059669)',
        logos: [L.coca, L.pg, L.jnj, L.msft, L.apple] },
      { title: 'Защитные бумаги США', sub: 'Устойчивы, когда рынок падает', count: 14, img: 'coll/promo-def.png', imgStyle: 'height:101.47%;left:10.54%;top:-7.5%;width:78.92%', bg: 'linear-gradient(160deg,#334155,#0f172a)',
        logos: [L.jnj, L.pg, L.coca, L.apple, L.msft] },
      { title: 'ИИ и полупроводники', sub: 'Компании, которые строят инфраструктуру ИИ', count: 18, img: 'coll/promo-ai.png', imgStyle: 'height:101.47%;left:10.54%;top:-7.5%;width:78.92%', bg: 'linear-gradient(160deg,#6366f1,#1e1b4b)',
        logos: [L.nvidia, L.msft, L.google, L.apple, L.tesla] },
      { title: 'Растущие компании', sub: 'Быстрее всех растут по выручке', count: 16, img: 'coll/promo-grow.png', imgStyle: 'height:101.47%;left:10.54%;top:-7.5%;width:78.92%', bg: 'linear-gradient(160deg,#fb923c,#e11d48)',
        logos: [L.tesla, L.nvidia, L.kaspi, L.google, L.apple] },
      { title: 'Технологические гиганты', sub: 'Пять крупнейших технологических компаний', count: 5, color: '#4f46e5', img: 'coll/promo-ai.png', imgStyle: 'height:101.47%;left:10.54%;top:-7.5%;width:78.92%',
        logos: [L.apple, L.msft, L.google, L.nvidia, L.tesla] },
    ],

    // «Лидеры по ROI» по секторам — только в «Купить»
    roi: {
      title: 'Лидеры по ROI',
      sub: 'Лучшие по рентабельности собственного капитала',
      sectors: [
        { title: 'Энергетика', items: [
          S('Constellation Energy', 'CEG', `318${nb}$`, up(`5,4${nb}$`, '1,7'), 'coll/ic-ceg.svg'),
          S('NextEra Energy', 'NEE', `82${nb}$`, up(`0,6${nb}$`, '0,7'), 'coll/ic-nee.svg'),
          S('Cameco', 'CCJ', `71${nb}$`, up(`1,2${nb}$`, '1,7'), 'coll/ic-ccj.svg'),
        ],
          extra: [
          S('Vistra', 'VST', '168 $', '↑ 3,1 $ (+1,9 %)', t('VST', '#e8f2fe', '#2563eb')),
          S('Duke Energy', 'DUK', '121 $', '↑ 0,5 $ (+0,4 %)', t('DUK', '#e8f2fe', '#2563eb')),
          S('Southern Company', 'SO', '92 $', '↓ 0,3 $ (−0,3 %)', t('SO', '#e8f2fe', '#2563eb'), true),
          S('Oklo', 'OKLO', '74 $', '↑ 2,8 $ (+3,9 %)', t('OKLO', '#e6f7ee', '#15803d')),
        ]},
        { title: 'Топливо', items: [
          S('Exxon', 'XOM', `118${nb}$`, up(`21,3${nb}$`, '22,01'), 'coll/ic-xom.svg'),
          S('Chevron', 'CVX', `154${nb}$`, dn(`0,8${nb}$`, '0,54'), 'coll/ic-cvx.svg', true),
          S('Brit Petroleum', 'BP', `35,2${nb}$`, up(`0,54${nb}$`, '1,54'), 'coll/ic-bp.svg'),
        ],
          extra: [
          S('Shell', 'SHEL', '73 $', '↑ 0,4 $ (+0,6 %)', t('SHEL', '#fff7e0', '#b45309')),
          S('ConocoPhillips', 'COP', '96 $', '↓ 0,7 $ (−0,7 %)', t('COP', '#fff0f0', '#d92d20'), true),
          S('Occidental', 'OXY', '47 $', '↑ 0,6 $ (+1,3 %)', t('OXY', '#fff0f0', '#d92d20')),
          S('Schlumberger', 'SLB', '38 $', '↑ 0,2 $ (+0,5 %)', t('SLB', '#e8f2fe', '#2563eb')),
        ]},
        { title: 'Технологии', items: [
          S('NVIDIA', 'NVDA', `188${nb}$`, up(`3,5${nb}$`, '1,9'), L.nvidia),
          S('Microsoft', 'MSFT', `521${nb}$`, up(`4,1${nb}$`, '0,8'), L.msft),
          S('Apple', 'AAPL', `262${nb}$`, up(`5,6${nb}$`, '2,2'), L.apple),
        ],
          extra: [
          S('Broadcom', 'AVGO', '342 $', '↑ 6,2 $ (+1,8 %)', t('AVGO', '#fff0f0', '#d92d20')),
          S('Oracle', 'ORCL', '224 $', '↑ 2,3 $ (+1,0 %)', t('ORCL', '#fff0f0', '#d92d20')),
          S('Adobe', 'ADBE', '351 $', '↓ 1,9 $ (−0,5 %)', t('ADBE', '#fff0f0', '#d92d20'), true),
          S('Salesforce', 'CRM', '262 $', '↑ 1,1 $ (+0,4 %)', t('CRM', '#e8f2fe', '#2563eb')),
        ]},
        { title: 'Финансы', items: [
          S('Kaspi.kz', 'KSPI', `19${nb}840${nb}₸`, up(`598${nb}₸`, '3,1'), L.kaspi),
          S('Halyk Bank', 'HSBK', `312${nb}₸`, up(`9${nb}₸`, '3,0'), L.halyk),
          S('JPMorgan Chase', 'JPM', `312${nb}$`, up(`2,1${nb}$`, '0,7'), t('JPM', '#f1f5f9', '#0f172a')),
        ],
          extra: [
          S('Visa', 'V', '347 $', '↑ 1,8 $ (+0,5 %)', t('V', '#e8f2fe', '#2563eb')),
          S('Mastercard', 'MA', '583 $', '↑ 3,4 $ (+0,6 %)', t('MA', '#fff7e0', '#b45309')),
          S('Goldman Sachs', 'GS', '742 $', '↑ 5,6 $ (+0,8 %)', t('GS', '#e8f2fe', '#2563eb')),
          S('Berkshire Hathaway', 'BRK.B', '498 $', '↓ 0,9 $ (−0,2 %)', t('BRK.B', '#f1f5f9', '#0f172a'), true),
        ]},
        { title: 'Потребительский сектор', items: [
          S('Coca-Cola', 'KO', `71${nb}$`, up(`0,3${nb}$`, '0,4'), L.coca),
          S('Procter & Gamble', 'PG', `156${nb}$`, dn(`0,5${nb}$`, '0,3'), L.pg, true),
          S('Walmart', 'WMT', `108${nb}$`, up(`0,4${nb}$`, '0,4'), t('WMT', '#e8f2fe', '#2563eb')),
        ],
          extra: [
          S('PepsiCo', 'PEP', '148 $', '↑ 0,5 $ (+0,3 %)', t('PEP', '#e8f2fe', '#2563eb')),
          S("McDonald's", 'MCD', '304 $', '↑ 1,2 $ (+0,4 %)', t('MCD', '#fff7e0', '#b45309')),
          S('Costco', 'COST', '934 $', '↓ 4,1 $ (−0,4 %)', t('COST', '#fff0f0', '#d92d20'), true),
          S('Nike', 'NKE', '71 $', '↑ 0,9 $ (+1,3 %)', t('NKE', '#f1f5f9', '#0f172a')),
        ]},
        { title: 'Здравоохранение', items: [
          S('Eli Lilly', 'LLY', `842${nb}$`, up(`6,5${nb}$`, '0,8'), t('LLY', '#fff0f0', '#d92d20')),
          S('Johnson & Johnson', 'JNJ', `196${nb}$`, up(`1,0${nb}$`, '0,5'), L.jnj),
          S('Pfizer', 'PFE', `26${nb}$`, dn(`0,2${nb}$`, '0,8'), t('PFE', '#e8f2fe', '#2563eb'), true),
        ],
          extra: [
          S('AbbVie', 'ABBV', '214 $', '↑ 1,6 $ (+0,8 %)', t('ABBV', '#e8f2fe', '#2563eb')),
          S('Merck', 'MRK', '86 $', '↓ 0,4 $ (−0,5 %)', t('MRK', '#e6f7ee', '#15803d'), true),
          S('Abbott', 'ABT', '131 $', '↑ 0,7 $ (+0,5 %)', t('ABT', '#e8f2fe', '#2563eb')),
          S('Novo Nordisk', 'NVO', '58 $', '↑ 1,1 $ (+1,9 %)', t('NVO', '#e8f2fe', '#2563eb')),
        ]},
      ],
    },

    // «Портфели великих» — только в «Купить» (имена и фото в макете вымышленные «Нейро…»)
    greats: [
      { name: 'Уоррен Нейробаффет', count: 25, sub: 'Инвестиции в IT, технологии и аграрный сектор', bg: 'linear-gradient(113.35deg,#1b0a9a 30.39%,#222 104.95%)', img: 'coll/great1.png', imgStyle: 'height:143.01%;left:39.05%;top:-6.68%;width:76.27%' },
      { name: 'Джордж Нейросорос', count: 25, sub: 'Инвестиции в финансы, энергетику и золото', bg: 'linear-gradient(113.35deg,#0a9a6f 30.39%,#00574a 104.95%)', img: 'coll/great2.png', imgStyle: 'height:147.78%;left:33.94%;top:-8.31%;width:78.82%' },
      { name: 'Рэй Нейродалио', count: 18, sub: 'Всепогодный портфель: акции, облигации и золото', bg: 'linear-gradient(113.35deg,#9a4a0a 30.39%,#222 104.95%)', img: 'coll/great3.png', imgStyle: 'height:147.78%;left:33.94%;top:-3.5%;width:78.82%' },
    ],
  };
})();
