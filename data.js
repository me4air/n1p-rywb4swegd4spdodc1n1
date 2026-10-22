// Данные стартового экрана. Всё, что помечено DESIGN, взято из макета Figma 95:10583 дословно;
// CHANGED — отличается от макета (см. «Решения» в отчёте); ADDED — добавлено по аналогии.
const nb = ' '; // неразрывный пробел

window.DATA = {
  user: { initials: 'АС', name: 'Айсултан', status: 'Квал. инвестор', unread: 8 }, // DESIGN

  mainBanners: [ // 1–2 DESIGN (Figma 95:10592); 3–5 ADDED по аналогии
    { title: ['Узнайте свой', 'риск-профиль'], sub: '8 вопросов ~5 минут', bg: 'linear-gradient(180deg,#2a42ab,#01117c)',
      img: 'imgTigerGlodBlack1.png', imgStyle: 'left:3.13%;top:3.96%;width:92.08%;height:92.08%' },
    { title: ['Барыс'], sub: 'Надежные облигации<br>в долларах США', bg: 'linear-gradient(-13.28deg,#d64c01 37.9%,#ffc830 180.8%)',
      img: 'imgTigerPlatinumBlue1.png', imgStyle: 'left:-36.2%;top:-2.72%;width:158%;height:105.35%' },
    { title: ['Тулпар'], sub: 'Защита капитала<br>при росте рынка', bg: 'linear-gradient(105.7deg,#5732bd 30.4%,#0b146c 105%)',
      img: 'imgFrame312121541.png', imgStyle: 'left:0;top:0;width:96px;height:96px;object-fit:contain' },
    { title: ['Арыстан'], sub: 'Доход в тенге<br>до 22 % годовых', bg: 'linear-gradient(118.7deg,#1e243a 30.4%,#323775 105%)',
      img: 'imgFrame312121542.png', imgStyle: 'left:0;top:0;width:96px;height:96px;object-fit:contain' },
    { title: ['Академия', 'инвестиций'], sub: 'Первый урок — 10 минут', bg: 'linear-gradient(113.35deg,#2d1128 30.4%,#4a0028 105%)',
      img: 'imgBannersBackgrounds.png', imgStyle: 'left:-71px;top:0;width:238px;height:96px' },
  ],

  balance: { // CHANGED: валюта дельты приведена к валюте баланса ($), см. отчёт
    label: 'Общий баланс', venues: '2 площадки', total: `150${nb}000,34${nb}$`,
    delta: `↑${nb}1${nb}501,33${nb}$${nb}(1,01${nb}%)`, period: 'За все время',
  },

  events: [ // DESIGN
    { top: 'Сегодня', title: 'Календарь инвестора', value: `25${nb}событий`, color: 'action' },
    { top: '10 октября', topRight: 'Жолбарыс электро', title: 'Выплата купона', value: `2${nb}250${nb}$`, color: 'success' },
  ],

  news: { // DESIGN
    hero: { id: 'diesel', src: 'Kapital.kz', time: '2 ч. назад', title: 'Цены на дизельное топливо продолжают расти', tag: 'Главное', img: 'imgFrame1321316070.png' },
    lead: [
      ['t', 'Акции нефтяной компании BP '], ['b', '[BP]'], ['t', ' продолжают расти на фоне увеличения добычи. Exxon '],
      ['b', '[XOM]'], ['t', ' и Chevron '], ['b', '[CVX]'], ['t', ', также частично укр...'],
    ],
    leadTags: [['success', `BP ↑${nb}1,54${nb}%`], ['success', `XOM ↑${nb}22,01${nb}%`], ['negative', `CVX ↓${nb}0,54${nb}%`]],
    items: [
      { src: 'Kapital.kz', time: '2 ч. назад', title: `Kaspi.kz: выручка за девять месяцев выросла на 21${nb}%`,
        tags: [['success', `KSPI ↑${nb}1,54${nb}%`], ['negative', `ALTB ↓${nb}21,54${nb}%`]], img: 'imgThumb.png' },
      { src: 'N1broker', time: 'Вчера', title: 'N1broker запустил продажу нового структурного продукта',
        tags: [['info', `ZLBRS · 18%${nb}годовых`]], img: 'imgThumb1.png' },
    ],
  },

  products: [ // DESIGN (тексты, цвета, чипы)
    { title: ['Жолбарыс', 'USD премиум'], promo: '+23%', chips: [`От${nb}100${nb}000${nb}$`, `2,5${nb}года`],
      bg: 'linear-gradient(105deg,#1e243a 30.4%,#323775 105%)',
      art: 'imgFrame312121540.png', artStyle: 'left:296px;top:-70.4px;width:253.7px;height:359px;transform:scaleX(-1)' },
    { title: ['Тулпар с защитой капитала'], promo: '+16%', chips: [`От${nb}10${nb}000${nb}$`, `5${nb}лет`],
      bg: 'linear-gradient(105.7deg,#5732bd 30.4%,#0b146c 105%)',
      art: 'imgFrame312121541.png', artStyle: 'left:215.6px;top:-6.7px;width:198px;height:217.4px;transform:scaleX(-1)' },
    { title: ['Арыстан электро доход в тенге'], promo: '+22%', chips: [`От${nb}1${nb}000${nb}000${nb}₸`, `3${nb}года`],
      bg: 'linear-gradient(105.7deg,#1e243a 30.4%,#323775 105%)',
      art: 'imgFrame312121542.png', artStyle: 'left:202.9px;top:-0.3px;width:227.7px;height:238.3px;transform:scaleX(-1)' },
  ],

  collections: [ // CHANGED: реальные тикеры, демо-котировки; подборки 2–4 ADDED (в макете 2-я — копия 1-й)
    { title: 'Лидеры роста за сегодня', items: [
      { logo: 'imgVisualContainer.png',  name: 'Kaspi.kz',   ticker: 'KSPI', price: `19${nb}840${nb}₸`, delta: `↑${nb}598${nb}₸${nb}(+3,1${nb}%)` },
      { logo: 'imgVisualContainer1.png', name: 'Halyk Bank', ticker: 'HSBK', price: `312${nb}₸`,       delta: `↑${nb}9${nb}₸${nb}(+3,0${nb}%)` },
      { logo: { src: 'logos/apple.svg', bg: '#000', pad: 11, invert: true }, name: 'Apple', ticker: 'AAPL', price: `262${nb}$`, delta: `↑${nb}5,6${nb}$${nb}(+2,2${nb}%)` },
    ]},
    { title: 'Популярное у клиентов N1broker', items: [
      { logo: { src: 'logos/nvidia.svg', bg: '#fff', pad: 4, crop: 'nvidia' }, name: 'NVIDIA', ticker: 'NVDA', price: `188${nb}$`, delta: `↑${nb}3,5${nb}$${nb}(+1,9${nb}%)` },
      { logo: { src: 'logos/tesla.svg', bg: '#e31937', pad: 11 }, name: 'Tesla', ticker: 'TSLA', price: `452${nb}$`, delta: `↑${nb}11,9${nb}$${nb}(+2,7${nb}%)` },
      { logo: { src: 'logos/microsoft.svg', bg: '#fff', pad: 8 }, name: 'Microsoft', ticker: 'MSFT', price: `521${nb}$`, delta: `↑${nb}4,1${nb}$${nb}(+0,8${nb}%)` },
    ]},
    { title: 'Голубые фишки Казахстана', items: [
      { logo: { src: 'logos/kap.svg', bg: '#fff', pad: 3, crop: 'kap' }, name: 'Казатомпром', ticker: 'KZAP', price: `21${nb}450${nb}₸`, delta: `↑${nb}255${nb}₸${nb}(+1,2${nb}%)` },
      { logo: { src: 'logos/airastana.png', bg: '#fff', pad: 3, crop: 'aira' }, name: 'Air Astana', ticker: 'AIRA', price: `1${nb}320${nb}₸`, delta: `↑${nb}12${nb}₸${nb}(+0,9${nb}%)` },
      { logo: { src: 'logos/kcell.svg', bg: '#fff', pad: 3 }, name: 'Kcell', ticker: 'KCEL', price: `3${nb}180${nb}₸`, delta: `↓${nb}19${nb}₸${nb}(−0,6${nb}%)`, neg: true },
    ]},
    { title: 'Защитные бумаги США', items: [
      { logo: { src: 'logos/coca.svg', bg: '#fff', pad: 3 }, name: 'Coca-Cola', ticker: 'KO', price: `71${nb}$`, delta: `↑${nb}0,3${nb}$${nb}(+0,4${nb}%)` },
      { logo: { src: 'logos/jnj.svg', bg: '#fff', pad: 3 }, name: 'Johnson & Johnson', ticker: 'JNJ', price: `196${nb}$`, delta: `↑${nb}1,0${nb}$${nb}(+0,5${nb}%)` },
      { logo: { src: 'logos/pg.svg', bg: '#fff', pad: 4 }, name: 'Procter & Gamble', ticker: 'PG', price: `156${nb}$`, delta: `↓${nb}0,5${nb}$${nb}(−0,3${nb}%)`, neg: true },
    ]},
  ],

  advisory: [ // DESIGN (Figma 97:13951, обновлён 2026-10-21)
    { name: 'Олег Нейрозайцев 20 лет опыта', title: 'Личный финансовый помощник', sub: 'Поможет собрать идеальный портфель',
      bg: 'linear-gradient(113.35deg,#2d1128 30.4%,#4a0028 105%)', img: 'imgFrame312121543.png', imgStyle: 'left:135.8px;top:-10.2px;width:215.5px;height:215.5px' },
    { name: 'Андрей Инвесторов 18 лет опыта', title: 'Профессиональный аудит портфеля', sub: `Бесплатно при балансе<br>от 100${nb}000${nb}$`,
      bg: 'linear-gradient(113.35deg,#1e243a 30.4%,#323775 105%)', img: 'imgAdvisory2.png', imgStyle: 'left:134.7px;top:-11.1px;width:214.1px;height:214.1px' },
  ],

  lessons: [ // DESIGN
    { dur: '10 минут', title: 'Как сохранить свои инвестиции?', bg: 'var(--purple-light)',
      img: 'imgBannersBackgrounds.png', imgStyle: 'left:-31.5px;top:6.5px;width:303px;height:122px' },
    { dur: '15 минут', title: 'Диверсифицируйте ваш портфель', bg: 'var(--magenta-light)',
      img: 'imgBannersBackgrounds1.png', imgStyle: 'left:30.9px;top:-9.8px;width:171.5px;height:171.5px' },
  ],

  // Портфель — Figma 97:13990 (Section 2). Числа и тексты из макета; знаки/цвета приведены в соответствие (см. отчёт).
  portfolio: {
    balance: { total: `150${nb}000,34${nb}$`, currency: '$', delta: `↑${nb}1${nb}501,33${nb}$${nb}(1,01${nb}%)`, period: 'За все время' },
    actions: [
      { label: 'Пополнить', icon: 'add.svg', primary: true },
      { label: 'Вывести', icon: 'arrow-forward.svg' },
      { label: 'История', icon: 'clock.svg' },
    ],
    banners: [
      { title: ['Жолбарыс электро'], sub: 'Молниеносный рост инвестиций в долларах',
        bg: 'linear-gradient(183.88deg,#00030b 77.5%,#16326b 96.8%)',
        bgImg: { src: 'imgFrame312121540.png', style: 'left:393px;top:-58.4px;width:200.7px;height:284.1px;transform:scaleX(-1);transform-origin:left top' } },
      { title: ['Самрук в тенге'], sub: 'Высокая доходность<br>с защитой капитала',
        bg: 'linear-gradient(180deg,#121f56,#030931)',
        img: 'imgFrame312121541.png', imgStyle: 'left:96.1px;top:-1.1px;width:93.4px;height:98.2px;transform:scaleX(-1);transform-origin:left top' },
    ],
    platforms: [
      { amount: `52${nb}632${nb}808${nb}₸`, delta: `↑${nb}902${nb}202${nb}₸${nb}(1,74${nb}%)`, kind: 'success', name: 'Площадка ITS',
        items: [
          { logo: 'imgVisualContainer.png', name: 'Kaspi.kz', price: `7${nb}936${nb}000${nb}₸`, qty: `400${nb}шт.`, delta: `↓${nb}347${nb}925${nb}₸${nb}(−4,2${nb}%)`, neg: true },
          { logo: 'imgVisualContainer1.png', name: 'Halyk Bank', price: `6${nb}240${nb}000${nb}₸`, qty: `20${nb}000${nb}шт.`, delta: `↑${nb}693${nb}333${nb}₸${nb}(+12,5${nb}%)` },
          { logo: { src: 'pf/logo-zholbarys.png', cls: 'pad' }, name: 'Жолбарыс', price: `50${nb}000${nb}$`, qty: `5${nb}лотов`, delta: `↑${nb}749${nb}$${nb}(+1,52${nb}%)` },
          { extra: true, logo: { src: 'logos/kap.svg', bg: '#fff', pad: 3, crop: 'kap' }, name: 'Казатомпром', price: `2${nb}145${nb}000${nb}₸`, qty: `100${nb}шт.`, delta: `↑${nb}136${nb}573${nb}₸${nb}(+6,8${nb}%)` },
          { extra: true, logo: { src: 'logos/airastana.png', bg: '#fff', pad: 3, crop: 'aira' }, name: 'Air Astana', price: `1${nb}320${nb}000${nb}₸`, qty: `1${nb}000${nb}шт.`, delta: `↑${nb}30${nb}938${nb}₸${nb}(+2,4${nb}%)` },
        ],
        currencies: [
          { flag: 'pf/flag-kzt.png', name: 'KZT', amount: `2${nb}450${nb}000${nb}₸` },
          { flag: 'pf/flag-usd.png', name: 'USD', amount: `12${nb}580,40${nb}$` },
        ] },
      { amount: `25${nb}367${nb}369${nb}₸`, delta: `↓${nb}121${nb}509${nb}₸${nb}(0,48${nb}%)`, kind: 'negative', name: 'Площадка N1',
        items: [
          { logo: { src: 'pf/logo-tesla.png', cls: 'zoom' }, name: 'Tesla Inc.', price: `13${nb}560${nb}$`, qty: `30${nb}шт.`, delta: `↓${nb}1${nb}259,67${nb}$${nb}(−8,5${nb}%)`, neg: true },
          { logo: { src: 'pf/logo-microsoft.png' }, name: 'Microsoft', price: `10${nb}420${nb}$`, qty: `20${nb}шт.`, delta: `↑${nb}133,72${nb}$${nb}(+1,30${nb}%)` },
          { logo: { src: 'pf/logo-google.png' }, name: 'Alphabet', price: `7${nb}175${nb}$`, qty: `25${nb}шт.`, delta: `↑${nb}88,58${nb}$${nb}(+1,25${nb}%)` },
          { extra: true, logo: { src: 'logos/nvidia.svg', bg: '#fff', pad: 4, crop: 'nvidia' }, name: 'NVIDIA', price: `7${nb}520${nb}$`, qty: `40${nb}шт.`, delta: `↑${nb}646,14${nb}$${nb}(+9,4${nb}%)` },
          { extra: true, logo: { src: 'logos/apple.svg', bg: '#000', pad: 11, invert: true }, name: 'Apple', price: `5${nb}240${nb}$`, qty: `20${nb}шт.`, delta: `↑${nb}157,56${nb}$${nb}(+3,1${nb}%)` },
        ],
        currencies: [ { flag: 'pf/flag-usd.png', name: 'USD', amount: `4${nb}868,40${nb}$` } ] },
    ],
    // Новости по инструментам клиента (ADDED, тексты демо)
    news: {
      hero: { src: 'N1broker', time: 'Сегодня', title: 'Жолбарыс USD премиум: ближайшая выплата купона — 30 октября', tag: 'Ваш продукт', img: 'imgThumb1.png' },
      lead: [['t', 'По структурной ноте '], ['b', '[Жолбарыс]'], ['t', ' начисляется купон: деньги поступят на счёт площадки ITS в день выплаты. Подробности — в карточке продукта.']],
      leadTags: [['info', `ZLBRS · 18%${nb}годовых`]],
      items: [
        { src: 'Kapital.kz', time: '2 ч. назад', title: `Kaspi.kz: выручка за девять месяцев выросла на 21${nb}%`,
          tags: [['success', `KSPI ↑${nb}3,1${nb}%`]], img: 'imgThumb.png' },
        { src: 'Kapital.kz', time: '4 ч. назад', title: 'Halyk Bank опубликовал промежуточные результаты за девять месяцев',
          tags: [['success', `HSBK ↑${nb}3,0${nb}%`]], logo: 'imgVisualContainer1.png' },
        { src: 'Kapital.kz', time: '6 ч. назад', title: 'Казатомпром подтвердил производственный план на текущий год',
          tags: [['success', `KZAP ↑${nb}1,2${nb}%`]], thumb: { src: 'logos/kap.svg', bg: '#fff', pad: 3, crop: 'kap' } },
        { src: 'N1broker', time: 'Вчера', title: 'Tesla раскроет итоги третьего квартала на этой неделе',
          tags: [['success', `TSLA ↑${nb}2,7${nb}%`]], thumb: { src: 'pf/logo-tesla.png', cls: 'zoom' } },
        { src: 'N1broker', time: 'Вчера', title: 'Microsoft: аналитики ждут ускорения роста облачного бизнеса',
          tags: [['success', `MSFT ↑${nb}0,8${nb}%`]], thumb: { src: 'pf/logo-microsoft.png' } },
        { src: 'N1broker', time: '2 дня назад', title: 'NVIDIA обновила максимумы на фоне спроса на чипы для ИИ',
          tags: [['success', `NVDA ↑${nb}1,9${nb}%`]], thumb: { src: 'logos/nvidia.svg', bg: '#fff', pad: 4, crop: 'nvidia' } },
      ],
    },
  },
};
