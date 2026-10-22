// Поиск (Figma 98:17166 / 98:18787 / 98:19207). Ищет по части инструментов прототипа; остальные → «Не нашли бумаг…».
(function () {
  const nb = ' ';
  const L = {
    kaspi: 'imgVisualContainer.png', halyk: 'imgVisualContainer1.png',
    apple: { src: 'logos/apple.svg', bg: '#000', pad: 11, invert: true },
    tesla: { src: 'pf/logo-tesla.png', cls: 'zoom' }, msft: { src: 'pf/logo-microsoft.png' }, google: { src: 'pf/logo-google.png' },
    nvidia: { src: 'logos/nvidia.svg', bg: '#fff', pad: 4, crop: 'nvidia' }, zhol: { src: 'pf/logo-zholbarys.png', cls: 'pad' },
  };
  // Только эти бумаги находятся поиском (aliases — ручной ввод по-русски и по тикеру)
  const items = [
    { id: 'kspi', name: 'Kaspi.kz', ticker: 'KSPI', price: `19${nb}840${nb}₸`, delta: `↑${nb}598${nb}₸${nb}(+3,1${nb}%)`, logo: L.kaspi, aliases: ['каспи', 'kaspi'] },
    { id: 'hsbk', name: 'Halyk Bank', ticker: 'HSBK', price: `312${nb}₸`, delta: `↑${nb}9${nb}₸${nb}(+3,0${nb}%)`, logo: L.halyk, aliases: ['халык', 'halyk', 'народный'] },
    { id: 'aapl', name: 'Apple', ticker: 'AAPL', price: `262${nb}$`, delta: `↑${nb}5,6${nb}$${nb}(+2,2${nb}%)`, logo: L.apple, aliases: ['эппл', 'эпл', 'apple'] },
    { id: 'tsla', name: 'Tesla', ticker: 'TSLA', price: `452${nb}$`, delta: `↑${nb}11,9${nb}$${nb}(+2,7${nb}%)`, logo: L.tesla, aliases: ['тесла', 'tesla'] },
    { id: 'msft', name: 'Microsoft', ticker: 'MSFT', price: `521${nb}$`, delta: `↑${nb}4,1${nb}$${nb}(+0,8${nb}%)`, logo: L.msft, aliases: ['майкрософт', 'microsoft'] },
    { id: 'nvda', name: 'NVIDIA', ticker: 'NVDA', price: `188${nb}$`, delta: `↑${nb}3,5${nb}$${nb}(+1,9${nb}%)`, logo: L.nvidia, aliases: ['нвидиа', 'энвидиа', 'nvidia'] },
    { id: 'googl', name: 'Alphabet', ticker: 'GOOGL', price: `287${nb}$`, delta: `↓${nb}1,7${nb}$${nb}(−0,6${nb}%)`, neg: true, logo: L.google, aliases: ['альфабет', 'гугл', 'google', 'alphabet'] },
    { id: 'zlbrs', name: 'Жолбарыс', ticker: 'ZLBRS', price: `от${nb}10${nb}000${nb}$`, delta: `22%${nb}годовых`, logo: L.zhol, aliases: ['жолбарыс', 'zholbarys'] },
  ];
  const by = Object.fromEntries(items.map((i) => [i.id, i]));
  window.SEARCH = {
    items, by,
    recent: [by.kspi, by.hsbk],           // «Вы искали недавно» (макет)
    popular: [by.zlbrs, by.hsbk, by.kspi], // «Популярно у инвесторов N1broker» (макет)
    find(q) {
      q = q.trim().toLowerCase();
      if (!q) return [];
      return items.filter((i) => i.name.toLowerCase().includes(q) || i.ticker.toLowerCase().includes(q) || i.aliases.some((a) => a.includes(q)));
    },
  };
})();
