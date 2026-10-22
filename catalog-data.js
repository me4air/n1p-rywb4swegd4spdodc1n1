// Каталог бумаг (Figma 101:20766 / 101:25365). Список и цифры — демо; площадки ITS (KASE, ₸) и N1 (США, $).
// type: stock | bond | fund; fav — «Избранное» (закладка). Логотипы облигаций и фондов — нейтральные плитки с тикером.
(function () {
  const nb = ' ';
  const t = (txt) => ({ txt, bg: '#e8f2fe', color: '#2563eb' }); // плитка с тикером
  const L = {
    kaspi: 'imgVisualContainer.png', halyk: 'imgVisualContainer1.png',
    apple: { src: 'logos/apple.svg', bg: '#000', pad: 11, invert: true },
    tesla: { src: 'pf/logo-tesla.png', cls: 'zoom' }, msft: { src: 'pf/logo-microsoft.png' }, google: { src: 'pf/logo-google.png' },
    nvidia: { src: 'logos/nvidia.svg', bg: '#fff', pad: 4, crop: 'nvidia' },
    kap: { src: 'logos/kap.svg', bg: '#fff', pad: 3, crop: 'kap' }, aira: { src: 'logos/airastana.png', bg: '#fff', pad: 3, crop: 'aira' },
    kcell: { src: 'logos/kcell.svg', bg: '#fff', pad: 3 }, coca: { src: 'logos/coca.svg', bg: '#fff', pad: 3 },
    jnj: { src: 'logos/jnj.svg', bg: '#fff', pad: 3 }, pg: { src: 'logos/pg.svg', bg: '#fff', pad: 4 },
  };
  const I = (platform, type, name, ticker, price, delta, logo, extra) => Object.assign({ platform, type, name, ticker, price, delta, logo, neg: /^↓/.test(delta) }, extra);
  const items = [
    // ITS (KASE, ₸)
    I('ITS', 'stock', 'Kaspi.kz', 'KSPI', `19${nb}840${nb}₸`, `↑${nb}598${nb}₸${nb}(+3,1${nb}%)`, L.kaspi, { fav: true }),
    I('ITS', 'stock', 'Halyk Bank', 'HSBK', `312${nb}₸`, `↑${nb}9${nb}₸${nb}(+3,0${nb}%)`, L.halyk, { fav: true }),
    I('ITS', 'stock', 'Казатомпром', 'KZAP', `21${nb}450${nb}₸`, `↑${nb}255${nb}₸${nb}(+1,2${nb}%)`, L.kap, { fav: true }),
    I('ITS', 'stock', 'Air Astana', 'AIRA', `1${nb}320${nb}₸`, `↑${nb}12${nb}₸${nb}(+0,9${nb}%)`, L.aira),
    I('ITS', 'stock', 'Kcell', 'KCEL', `3${nb}180${nb}₸`, `↓${nb}19${nb}₸${nb}(−0,6${nb}%)`, L.kcell),
    I('ITS', 'bond', 'МЕУКАМ-120, Минфин РК', 'MUM120', `98,6${nb}%`, `↑${nb}0,2${nb}%`, t('МЕУ')),
    I('ITS', 'bond', 'Облигации ЕАБР', 'EABRb2', `101,2${nb}%`, `↑${nb}0,1${nb}%`, t('ЕАБР')),
    I('ITS', 'bond', 'Облигации Halyk Bank', 'HSBKb5', `99,4${nb}%`, `↓${nb}0,1${nb}%`, t('HSB')),
    I('ITS', 'fund', 'Фонд индекса KASE', 'KASEF', `1${nb}048${nb}₸`, `↑${nb}7${nb}₸${nb}(+0,7${nb}%)`, t('KASE')),
    I('ITS', 'fund', 'Фонд казахстанских акций', 'KZEQF', `862${nb}₸`, `↑${nb}4${nb}₸${nb}(+0,5${nb}%)`, t('KZEQ')),
    // N1 (США, $)
    I('N1', 'stock', 'Apple', 'AAPL', `262${nb}$`, `↑${nb}5,6${nb}$${nb}(+2,2${nb}%)`, L.apple, { fav: true }),
    I('N1', 'stock', 'Tesla', 'TSLA', `452${nb}$`, `↑${nb}11,9${nb}$${nb}(+2,7${nb}%)`, L.tesla, { fav: true }),
    I('N1', 'stock', 'Microsoft', 'MSFT', `521${nb}$`, `↑${nb}4,1${nb}$${nb}(+0,8${nb}%)`, L.msft),
    I('N1', 'stock', 'NVIDIA', 'NVDA', `188${nb}$`, `↑${nb}3,5${nb}$${nb}(+1,9${nb}%)`, L.nvidia),
    I('N1', 'stock', 'Alphabet', 'GOOGL', `287${nb}$`, `↓${nb}1,7${nb}$${nb}(−0,6${nb}%)`, L.google),
    I('N1', 'stock', 'Coca-Cola', 'KO', `71${nb}$`, `↑${nb}0,3${nb}$${nb}(+0,4${nb}%)`, L.coca),
    I('N1', 'stock', 'Johnson & Johnson', 'JNJ', `196${nb}$`, `↑${nb}1,0${nb}$${nb}(+0,5${nb}%)`, L.jnj),
    I('N1', 'stock', 'Procter & Gamble', 'PG', `156${nb}$`, `↓${nb}0,5${nb}$${nb}(−0,3${nb}%)`, L.pg),
    I('N1', 'bond', 'Казначейские облигации США, 10 лет', 'UST10Y', `98,1${nb}%`, `↓${nb}0,2${nb}%`, t('UST')),
    I('N1', 'bond', 'Корпоративные облигации Apple, 2030', 'AAPL30', `97,8${nb}%`, `↑${nb}0,1${nb}%`, t('AAPL')),
    I('N1', 'fund', 'SPDR S&P 500 ETF', 'SPY', `682${nb}$`, `↓${nb}2,0${nb}$${nb}(−0,3${nb}%)`, t('SPY'), { fav: true }),
    I('N1', 'fund', 'Invesco QQQ Trust', 'QQQ', `611${nb}$`, `↑${nb}4,9${nb}$${nb}(+0,8${nb}%)`, t('QQQ')),
    I('N1', 'fund', 'SPDR Gold Shares', 'GLD', `398${nb}$`, `↓${nb}1,6${nb}$${nb}(−0,4${nb}%)`, t('GLD')),
    I('N1', 'fund', 'iShares 20+ Year Treasury Bond ETF', 'TLT', `88${nb}$`, `↓${nb}0,2${nb}$${nb}(−0,2${nb}%)`, t('TLT')),
  ];
  window.CATALOG = {
    items,
    platforms: ['ITS', 'N1'],
    types: [['all', 'Все'], ['stock', 'Акции'], ['bond', 'Облигации'], ['fund', 'Фонды']],
  };
})();
