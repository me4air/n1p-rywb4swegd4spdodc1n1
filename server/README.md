# Аналитика прототипа N1broker

Записывает всё, что клиент делает в прототипе, и показывает это на странице просмотра.

- `analytics.js` (в корне) — трекер. Наблюдает за интерфейсом снаружи и не требует правок `app.js`, поэтому обновления прототипа подтягиваются без конфликтов.
- `server/server.py` — приём событий, база SQLite, API, раздача прототипа. Только стандартная библиотека Python.
- `server/viewer.html` — страница просмотра (`/admin`).

## Запуск на своём компьютере

```bash
python3 server/server.py
```

- прототип: <http://localhost:8787>
- события: <http://localhost:8787/admin>
- база: `server/data/events.db` (чтобы начать с чистого листа, удалите папку `server/data`)

## Ссылки для клиентов и отладка

| Параметр | Что делает |
|---|---|
| `?c=K7F2` | Код клиента. Все события этого устройства, включая прошлые анонимные, привязываются к коду. Только латиница, цифры, `_` и `-`; не используйте в коде имя или телефон. |
| `?debug=1` | Панель с событиями прямо в прототипе: видно, что уходит на сервер, можно скачать JSON. Выключить — `?debug=0`. |

Без кода клиент различается по устройству («Устройство a1b2c3d4»).

## Размещение на Railway

Railway сам соберёт контейнер по `Dockerfile` из корня: внутри и бэкенд, и прототип.

1. Создать **новый** проект и сервис из этой папки.
2. Подключить том (Volume) к сервису — в нём живёт база. Путь монтирования любой, например `/data`.
3. Задать переменную `ADMIN_PASSWORD` — пароль к `/admin` (логин любой).
4. Выдать сервису публичный домен.

Клиентам отправляется ссылка вида `https://<домен>/?c=K7F2`, события смотрятся на `https://<домен>/admin`.

| Переменная | Назначение |
|---|---|
| `ADMIN_PASSWORD` | Пароль к `/admin` и `/api`. На хостинге без него просмотр выключен. |
| `PORT` | Порт. Railway задаёт сам; локально 8787. |
| `DATA_DIR` | Папка с базой. По умолчанию — том Railway, локально `server/data`. |
| `STATIC_DIR` | Папка прототипа. В контейнере `/app/site`. |
| `ALLOWED_ORIGINS` | С каких доменов принимать события, через запятую. По умолчанию `*`. |

### Если прототип остаётся на GitHub Pages

GitHub Pages отдаёт только файлы и принимать события не умеет. В этом случае бэкенд всё равно живёт на Railway, а в `index.html` прототипа указывается его адрес:

```html
<script src="analytics.js" data-endpoint="https://<домен-railway>/collect"></script>
```

На сервере стоит ограничить приём: `ALLOWED_ORIGINS=https://me4air.github.io`.

## Что не записывается

- Номер телефона на экране входа: ни значение поля, ни нажатые цифры, ни их позиция и координаты.
- IP-адрес.

## События

Каждое событие несёт: `event_id`, `event_type`, `layer`, `time`, `seq` (порядок внутри сессии), `session_id`, `device_id`, `user_id` (код клиента), `screen`, `screen_tab`, `entity_type` + `entity_id` (например `option:NVDA`), `overlay` (открытая шторка или экран результата) и `props`.

Сессия — непрерывная работа; новая начинается после 30 минут без событий.

### Слой 1 — сырые взаимодействия

| Событие | Когда | Главные свойства |
|---|---|---|
| `element_tapped` | любой тап внутри телефона | `element_id`, `element_text`, `block`, `section`, `position`, `x`, `y`, `outcome` |
| `input_focused` / `input_changed` / `input_blurred` / `input_cleared` | работа с полем | `field_id`, `value`, `method`, `validation` |
| `scroll_depth_reached` | вертикальная прокрутка | `depth_pct` (25/50/75/100), `container` |
| `carousel_scrolled` | горизонтальная лента | `carousel_id`, `max_position`, `items_total` |
| `chart_scrubbed` / `chart_panned` | график | `chart`, `duration_ms`, `max_offset_pct` |

`outcome`: `navigate` — переход, `state` — что-то изменилось, `stub` — заглушка «недоступно в прототипе», `none` — ничего не произошло. Тап, которым остановили прокрутку, помечен `during_scroll`.

Поля ввода (`field_id`): `search.query`, `pfbuy.amount`, `pfbuy.qty`, `xfer.amount`.

### Слой 2 — навигация и интерфейс

| Событие | Когда | Главные свойства |
|---|---|---|
| `session_started`, `app_loaded` | начало сессии, загрузка страницы | `entry_screen`, `is_reload`, `reload_reason` |
| `app_backgrounded` / `app_foregrounded` | вкладка скрыта / показана | `visible_ms`, `hidden_ms` |
| `screen_viewed` | смена экрана | `prev_screen`, `prev_screen_ms`, `trigger`, `source_element`, `mode`, `state` |
| `tab_selected` | вкладка внутри экрана | `tab_id`, `tab_name`, `prev_tab`, `trigger` |
| `sheet_opened` / `sheet_closed` | шторка | `sheet_id`, `close_method`, `selected_option` |
| `snackbar_shown` / `snackbar_dismissed` | снекбар | `kind`, `text`, `source_element`, `method` |
| `hint_opened`, `accordion_toggled` | подсказка, вопрос FAQ | `hint_key`, `question`, `state` |
| `js_error` | ошибка скрипта | `message`, `source`, `line` |

`state` в `screen_viewed` — состояние клиента: тема, валюта портфеля, свободные средства, купленные портфели и опционы, избранное.

### Слой 3 — бизнес-события

| Событие | Когда | Главные свойства |
|---|---|---|
| `search_query_entered`, `search_closed` | поиск | `query`, `results_count`, `had_result_tap` |
| `catalog_filter_changed`, `catalog_platform_changed` | каталог | `filter`, `platform` |
| `instrument_tapped` | тап по бумаге в любом списке | `name`, `ticker`, `list_id`, `section`, `position`, `is_available` |
| `news_tapped`, `article_read` | новости | `article_id`, `title`, `max_scroll_pct`, `read_ms` |
| `article_promo_shown` / `article_promo_tapped` | снекбар «Есть связанная идея» | `article_id` |
| `banner_tapped` | баннер, карточка продукта, подборки | `placement`, `title`, `position`, `target` |
| `stock_chart_range_changed`, `stock_chart_mode_changed` | график бумаги | `ticker`, `range`, `mode` |
| `favorite_toggled`, `stock_news_expanded`, `trade_tapped` | страница бумаги | `entity_id`, `state`, `side` |
| `orderbook_direction_changed`, `document_tapped` | стакан опциона, документы | `direction`, `doc_title` |
| `product_opened` | открыта нота, портфель, опцион, Advisory | `product_type`, `product_id`, `source_screen`, `source_block`, `position` |
| `product_buy_tapped`, `product_sell_tapped` | основная кнопка продукта | `product_type`, `product_id`, `direction`, `result` |
| `purchase_started` → `purchase_amount_changed` → `purchase_submitted` → `purchase_completed` | воронка покупки | `product_type`, `product_id`, `direction`, `qty`, `amount`, `fee`, `total`, `balance_after` |
| `purchase_direction_changed`, `purchase_validation_failed`, `purchase_abandoned` | покупка: побочные ветки | `direction`, `error` (empty/min/max), `last_value` |
| `option_settled`, `option_push_shown`, `option_push_expired` | системные: срабатывание опциона | `result`, `amount`, `option_id` |
| `option_push_tapped`, `option_result_viewed`, `option_result_closed` | реакция клиента на результат | `source`, `result`, `action` |
| `portfolio_currency_changed`, `platform_list_toggled`, `balance_action_tapped` | вкладка «Портфель» | `currency`, `platform`, `action`, `is_available` |
| `transfer_started` → `transfer_amount_changed` → `transfer_submitted` → `transfer_completed` | воронка перевода | `from`, `to`, `amount_from`, `amount_to`, `rate` |
| `transfer_accounts_swapped`, `transfer_validation_failed`, `transfer_abandoned` | перевод: побочные ветки | `error`, `last_value` |
| `setting_toggled`, `theme_changed`, `logout_completed` | настройки | `setting`, `value`, `theme` |

## Формат приёма

`POST /collect`, тело — JSON (тип содержимого `text/plain`, чтобы браузер не делал предварительный запрос):

```json
{
  "sent_at": 1795717000000,
  "context": { "platform": "ios", "viewport": "390x844", "user_agent": "…" },
  "events": [
    { "event_id": "…", "event_type": "screen_viewed", "layer": 2, "time": 1795717000000, "seq": 5,
      "session_id": "…", "device_id": "…", "user_id": "K7F2", "screen": "home", "props": { "trigger": "initial" } }
  ]
}
```

Повторно присланное событие с тем же `event_id` не дублируется.

## Выгрузка

- вся база: `/api/export?format=csv` (или `ndjson`);
- один клиент или сессия: `&client=K7F2`, `&session=<id>`.

Те же кнопки есть на странице просмотра.
