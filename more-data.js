// Раздел «Еще» (Figma 214:22236 — Профиль, 214:22170 — Действия, 210:20026 — Информация). Данные — из макетов.
(function () {
  const nb = ' ';
  const person = [['ФИО', 'Айсултан Нурлыбеков'], ['ИИН', '910000100011'], ['Тип документа', 'Удостоверение личности'],
    ['Номер удостоверения личности', `1212${nb}3341${nb}2413${nb}4124`, 'chevron'], ['Номер телефона', `+7${nb}(777)${nb}123-45-67`, 'chevron']];
  window.MORE = {
    chips: [['profile', 'Профиль'], ['actions', 'Действия'], ['info', 'Информация']],
    defaultTab: 'actions',
    snack: 'В прототипе этот раздел недоступен',
    themes: [['light', 'Светлая'], ['dark', 'Тёмная']], themeTitle: 'Тема приложения',
    profile: {
      initials: 'АН', name: 'Айсултан Нурлыбеков',
      cells: [
        { icon: 'profile', title: 'Инвестиционный профиль', hint: 'Пройдите опрос', hintCls: 'act', right: 'chevron' },
        { icon: 'academic-cap', title: 'Квалификация инвестора', hint: 'Получена', right: 'check-circle' },
      ],
      personalTitle: 'Персональные данные', personal: person,
      accountsTitle: 'Брокерские счета', accounts: [['Номер брокерского счёта ITS', 'DHE3208.0361', 'copy'], ['Номер брокерского счёта N1', 'DHE3208.0361', 'copy']],
      logout: 'Выйти из профиля',
    },
    actions: {
      cells: [
        { icon: 'document-fill', title: 'Поручения и документы', hint: 'Проверить и подписать', badge: 4, right: 'chevron' },
        { icon: 'reports', title: 'Отчеты и выписки', hint: 'Заказать выписку или брок. отчет', right: 'chevron' },
        { icon: 'bank', title: 'Налоговый сервис', hint: 'Создание налоговых деклараций', right: 'chevron' },
        { icon: 'hammer', title: 'Форма W-8BEN', hint: 'Подписана', right: 'chevron' },
      ],
      settingsTitle: 'Настройки приложения',
      settings: [
        { title: 'Тема приложения', theme: 1 },
        { title: 'Присылать пуш-уведомления', hint: 'Присылаем только важное', toggle: 1 },
        { title: 'Вход по биометрии', hint: 'Подключен FaceID', toggle: 1 },
        { title: 'Виброотклик', hint: 'Тактильные подсказки', toggle: 1 },
        { title: 'Сменить код быстрого доступа' },
      ],
    },
    info: {
      cells: [
        { icon: 'question', title: 'Частые вопросы', hint: 'По брокерскому обслуживанию и продуктам', right: 'chevron', top: 1 },
        { icon: 'n1', title: 'N1broker', hint: 'О компании, контакты<br>и социальные сети', right: 'chevron', top: 1 },
      ],
      academyTitle: 'Академия инвестиций',
      docsTitle: 'Документы на брокерское обслуживание',
      docs: ['Ключевой информационный документ', 'Политика обработки персональных данных', 'Приказ на открытие<br>брокерского счёта', 'Заявление на присоединение', 'Договор брокерского обслуживания'],
      version: { icon: 'info', title: 'Версия приложения', hint: '2.0' },
    },
  };
})();
