#!/usr/bin/env python3
"""Бэкенд аналитики прототипа N1broker.

Принимает события от analytics.js, хранит их в SQLite, отдаёт страницу просмотра (/admin)
и, если рядом лежит прототип, раздаёт его статику. Только стандартная библиотека Python 3.9+.

Переменные окружения:
  PORT             порт (по умолчанию 8787)
  DATA_DIR         папка с базой (по умолчанию том Railway или server/data)
  ADMIN_PASSWORD   пароль к /admin и /api (логин любой). Без него просмотр открыт только с этого же компьютера
  STATIC_DIR       папка прототипа (по умолчанию — родительская, если в ней есть index.html)
  ALLOWED_ORIGINS  откуда принимать события, через запятую (по умолчанию * — отовсюду)
"""
import base64
import csv
import gzip
import hmac
import io
import json
import mimetypes
import os
import re
import sqlite3
import sys
import threading
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

HERE = Path(__file__).resolve().parent
PORT = int(os.environ.get('PORT', '8787'))
DATA_DIR = Path(os.environ.get('DATA_DIR') or os.environ.get('RAILWAY_VOLUME_MOUNT_PATH') or HERE / 'data')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', '')
ALLOWED_ORIGINS = [o.strip().rstrip('/') for o in os.environ.get('ALLOWED_ORIGINS', '*').split(',') if o.strip()]
_static = os.environ.get('STATIC_DIR')
STATIC_DIR = Path(_static).resolve() if _static else (HERE.parent if (HERE.parent / 'index.html').exists() else None)
IS_HOSTED = bool(os.environ.get('RAILWAY_ENVIRONMENT') or os.environ.get('RAILWAY_PROJECT_ID'))

MAX_BODY = 1_000_000   # байт в одном запросе /collect
MAX_EVENTS = 500       # событий в одной пачке
MAX_PROPS = 16_000     # символов JSON со свойствами одного события
STATIC_EXT = {'.html', '.css', '.js', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico', '.mp4', '.webm', '.woff', '.woff2', '.ttf', '.txt', '.json'}
TEXT_EXT = {'.html', '.css', '.js', '.svg', '.txt', '.json'}
TAG = b'<script src="analytics.js"></script>'

SCHEMA = """
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  received_at INTEGER NOT NULL,
  time INTEGER NOT NULL,
  seq INTEGER,
  event_type TEXT NOT NULL,
  layer INTEGER,
  client TEXT NOT NULL,
  user_id TEXT,
  device_id TEXT,
  session_id TEXT,
  screen TEXT,
  screen_tab TEXT,
  entity_type TEXT,
  entity_id TEXT,
  overlay TEXT,
  props TEXT
);
CREATE INDEX IF NOT EXISTS ev_client ON events(client, time);
CREATE INDEX IF NOT EXISTS ev_session ON events(session_id, time, seq);
CREATE INDEX IF NOT EXISTS ev_type ON events(event_type);
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  client TEXT,
  user_id TEXT,
  device_id TEXT,
  first_seen INTEGER,
  context TEXT
);
"""
EVENT_COLS = ('id', 'event_id', 'received_at', 'time', 'seq', 'event_type', 'layer', 'client', 'user_id', 'device_id',
              'session_id', 'screen', 'screen_tab', 'entity_type', 'entity_id', 'overlay', 'props')

_lock = threading.Lock()
_db = None


def db():
    global _db
    if _db is None:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        _db = sqlite3.connect(str(DATA_DIR / 'events.db'), check_same_thread=False, isolation_level=None)
        _db.row_factory = sqlite3.Row
        _db.execute('PRAGMA journal_mode=WAL')
        _db.execute('PRAGMA synchronous=NORMAL')
        _db.executescript(SCHEMA)
    return _db


def query(sql, args=()):
    with _lock:
        return [dict(r) for r in db().execute(sql, args).fetchall()]


def text(v, limit):
    """Строка ограниченной длины или None."""
    if v is None or isinstance(v, (dict, list)):
        return None
    s = str(v).strip()
    return s[:limit] if s else None


def ident(v):
    """Идентификатор (устройство, клиент, сессия): только буквы, цифры и . : _ -"""
    s = text(v, 64)
    return s if s and re.fullmatch(r'[\w.:-]+', s) else None


def integer(v):
    try:
        n = int(v)
    except (TypeError, ValueError):
        return None
    return n if -2**53 < n < 2**53 else None


def store_batch(payload):
    events = payload.get('events')
    if not isinstance(events, list):
        raise ValueError('events must be a list')
    ctx = payload.get('context') if isinstance(payload.get('context'), dict) else {}
    ctx_json = json.dumps(ctx, ensure_ascii=False)[:8000]
    now = int(time.time() * 1000)
    rows, sessions, known = [], {}, set()
    for e in events[:MAX_EVENTS]:
        if not isinstance(e, dict):
            continue
        event_id, event_type = ident(e.get('event_id')), text(e.get('event_type'), 64)
        device_id, user_id = ident(e.get('device_id')), ident(e.get('user_id'))
        if not event_id or not event_type or not re.fullmatch(r'[a-z0-9_]+', event_type) or not (device_id or user_id):
            continue
        props = e.get('props') if isinstance(e.get('props'), dict) else {}
        props_json = json.dumps(props, ensure_ascii=False, separators=(',', ':'))
        if len(props_json) > MAX_PROPS:
            props_json = json.dumps({'_truncated': True})
        client, session_id, t = user_id or device_id, ident(e.get('session_id')), integer(e.get('time')) or now
        rows.append((event_id, now, t, integer(e.get('seq')), event_type, integer(e.get('layer')), client, user_id, device_id, session_id,
                     text(e.get('screen'), 40), text(e.get('screen_tab'), 60), text(e.get('entity_type'), 40), text(e.get('entity_id'), 80),
                     text(e.get('overlay'), 60), props_json))
        if user_id and device_id:
            known.add((user_id, device_id))
        if session_id and (session_id not in sessions or t < sessions[session_id][4]):
            sessions[session_id] = (session_id, client, user_id, device_id, t, ctx_json)
    if not rows:
        return 0
    with _lock:
        conn = db()
        conn.execute('BEGIN')
        try:
            before = conn.total_changes
            conn.executemany('INSERT OR IGNORE INTO events (event_id, received_at, time, seq, event_type, layer, client, user_id, device_id, session_id,'
                             ' screen, screen_tab, entity_type, entity_id, overlay, props) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', rows)
            stored = conn.total_changes - before
            conn.executemany('INSERT INTO sessions (session_id, client, user_id, device_id, first_seen, context) VALUES (?,?,?,?,?,?)'
                             ' ON CONFLICT(session_id) DO UPDATE SET context = excluded.context, client = excluded.client,'
                             ' user_id = COALESCE(excluded.user_id, sessions.user_id), first_seen = MIN(sessions.first_seen, excluded.first_seen)',
                             list(sessions.values()))
            for user_id, device_id in known:  # устройство получило код клиента — его прежние анонимные события становятся событиями этого клиента
                conn.execute('UPDATE events SET client = ? WHERE device_id = ? AND user_id IS NULL AND client != ?', (user_id, device_id, user_id))
                conn.execute('UPDATE sessions SET client = ? WHERE device_id = ? AND user_id IS NULL AND client != ?', (user_id, device_id, user_id))
            conn.execute('COMMIT')
        except Exception:
            conn.execute('ROLLBACK')
            raise
    return stored


def event_filter(params):
    """Условия отбора событий из параметров запроса: client, session, types, layer, q."""
    where, args = [], []
    one = lambda k: (params.get(k) or [''])[0]
    if one('client'):
        where.append('client = ?'); args.append(one('client'))
    if one('session'):
        where.append('session_id = ?'); args.append(one('session'))
    types = [t for t in one('types').split(',') if re.fullmatch(r'[a-z0-9_]+', t)]
    if types:
        where.append('event_type IN (%s)' % ','.join('?' * len(types))); args += types
    if one('layer').isdigit():
        where.append('layer >= ?'); args.append(int(one('layer')))
    if one('q'):
        like = '%' + one('q').replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_') + '%'
        where.append("(event_type LIKE ? ESCAPE '\\' OR props LIKE ? ESCAPE '\\' OR screen LIKE ? ESCAPE '\\')"); args += [like, like, like]
    if one('after').isdigit():
        where.append('id > ?'); args.append(int(one('after')))
    return (' WHERE ' + ' AND '.join(where)) if where else '', args


def with_props(rows):
    for r in rows:
        try:
            r['props'] = json.loads(r['props']) if r.get('props') else {}
        except ValueError:
            r['props'] = {}
    return rows


def api(path, params):
    if path == '/api/clients':
        return query('SELECT client, MAX(user_id) AS user_id, COUNT(DISTINCT device_id) AS devices, COUNT(DISTINCT session_id) AS sessions,'
                     ' COUNT(*) AS events, SUM(layer = 3) AS business, MIN(time) AS first_seen, MAX(time) AS last_seen'
                     ' FROM events GROUP BY client ORDER BY last_seen DESC LIMIT 2000')
    if path == '/api/sessions':
        client = (params.get('client') or [''])[0]
        rows = query('SELECT e.session_id, MIN(e.time) AS started, MAX(e.time) AS ended, COUNT(*) AS events,'
                     ' SUM(e.event_type = \'screen_viewed\') AS screens, SUM(e.layer = 3) AS business,'
                     ' SUM(e.event_type = \'purchase_completed\') AS purchases, s.context'
                     ' FROM events e LEFT JOIN sessions s ON s.session_id = e.session_id WHERE e.client = ?'
                     ' GROUP BY e.session_id ORDER BY started DESC LIMIT 500', (client,))
        for r in rows:
            try:
                r['context'] = json.loads(r['context']) if r['context'] else {}
            except ValueError:
                r['context'] = {}
        return rows
    if path == '/api/events':
        where, args = event_filter(params)
        limit = min(integer((params.get('limit') or ['5000'])[0]) or 5000, 20000)
        return with_props(query('SELECT * FROM events%s ORDER BY time, seq, id LIMIT ?' % where, args + [limit]))
    if path == '/api/summary':
        total = query('SELECT COUNT(*) AS events, COUNT(DISTINCT client) AS clients, COUNT(DISTINCT session_id) AS sessions,'
                      ' MIN(time) AS first_seen, MAX(time) AS last_seen FROM events')[0]
        by_type = query('SELECT event_type, layer, COUNT(*) AS events, COUNT(DISTINCT client) AS clients FROM events'
                        ' GROUP BY event_type ORDER BY layer DESC, events DESC')
        screens = query('SELECT screen, COUNT(*) AS views, COUNT(DISTINCT client) AS clients FROM events'
                        ' WHERE event_type = \'screen_viewed\' GROUP BY screen ORDER BY clients DESC, views DESC')
        dead = query('SELECT json_extract(props, \'$.element_id\') AS element_id, json_extract(props, \'$.outcome\') AS outcome,'
                     ' MAX(json_extract(props, \'$.element_text\')) AS text, COUNT(*) AS taps, COUNT(DISTINCT client) AS clients FROM events'
                     ' WHERE event_type = \'element_tapped\' AND json_extract(props, \'$.outcome\') IN (\'stub\', \'none\')'
                     ' AND json_extract(props, \'$.element_type\') != \'none\' AND json_extract(props, \'$.during_scroll\') IS NULL'
                     ' GROUP BY 1, 2 ORDER BY clients DESC, taps DESC LIMIT 200')
        return {'total': total, 'by_type': by_type, 'screens': screens, 'dead_taps': dead}
    return None


def export(params):
    where, args = event_filter(params)
    rows = query('SELECT * FROM events%s ORDER BY client, time, seq, id LIMIT 500000' % where, args)
    fmt = (params.get('format') or ['csv'])[0]
    stamp = datetime.now().strftime('%Y%m%d-%H%M')
    if fmt == 'ndjson':
        body = '\n'.join(json.dumps(r, ensure_ascii=False) for r in with_props(rows)).encode('utf-8')
        return body, 'application/x-ndjson; charset=utf-8', 'n1a-events-%s.ndjson' % stamp
    out = io.StringIO()
    w = csv.writer(out)
    w.writerow(('time_utc',) + EVENT_COLS[3:])
    for r in rows:
        iso = datetime.fromtimestamp(r['time'] / 1000, tz=timezone.utc).strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
        w.writerow([iso] + [csv_cell(r[c]) for c in EVENT_COLS[3:]])
    return out.getvalue().encode('utf-8-sig'), 'text/csv; charset=utf-8', 'n1a-events-%s.csv' % stamp  # BOM — чтобы Excel открыл кириллицу


def csv_cell(v):
    """Текст, который табличный редактор принял бы за формулу, экранируется апострофом."""
    return "'" + v if isinstance(v, str) and v[:1] in ('=', '+', '-', '@') else v


_gz_cache = {}


def static_file(url_path):
    """Файл прототипа по пути запроса или None. Отдаются только типы из STATIC_EXT, без скрытых файлов и папки server."""
    if STATIC_DIR is None:
        return None
    rel = unquote(url_path).lstrip('/') or 'index.html'
    parts = rel.split('/')
    if any(p in ('', '..') or p.startswith('.') for p in parts) or parts[0] == 'server':
        return None
    full = (STATIC_DIR / rel).resolve()
    if STATIC_DIR not in full.parents or full.suffix.lower() not in STATIC_EXT or not full.is_file():
        return None
    return full


class Handler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    server_version = 'n1a'
    sys_version = ''
    timeout = 30

    def log_message(self, fmt, *args):
        pass

    # ----- ответы -----
    def reply(self, status, body=b'', ctype='text/plain; charset=utf-8', headers=None):
        if isinstance(body, str):
            body = body.encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('X-Content-Type-Options', 'nosniff')
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(body)

    def reply_json(self, status, data, headers=None):
        h = {'Cache-Control': 'no-store'}
        h.update(headers or {})
        self.reply(status, json.dumps(data, ensure_ascii=False), 'application/json; charset=utf-8', h)

    def cors(self):
        origin = (self.headers.get('Origin') or '').rstrip('/')
        if '*' in ALLOWED_ORIGINS:
            return {'Access-Control-Allow-Origin': '*'}
        if origin and origin in ALLOWED_ORIGINS:
            return {'Access-Control-Allow-Origin': origin, 'Vary': 'Origin'}
        if origin and urlparse(origin).netloc == self.headers.get('Host'):
            return {}
        return None if origin else {}  # без Origin — запрос с того же домена

    def authed(self):
        if not ADMIN_PASSWORD:
            if IS_HOSTED or self.client_address[0] not in ('127.0.0.1', '::1'):
                self.reply(503, 'Просмотр событий выключен: задайте переменную окружения ADMIN_PASSWORD.')
                return False
            return True
        header = self.headers.get('Authorization', '')
        if header.startswith('Basic '):
            try:
                password = base64.b64decode(header[6:]).decode('utf-8').partition(':')[2]
            except ValueError:
                password = ''
            if hmac.compare_digest(password.encode('utf-8'), ADMIN_PASSWORD.encode('utf-8')):
                return True
            time.sleep(0.7)  # замедляем перебор пароля
        self.reply(401, 'Нужен пароль.', headers={'WWW-Authenticate': 'Basic realm="N1broker analytics", charset="UTF-8"'})
        return False

    # ----- маршруты -----
    def do_OPTIONS(self):
        cors = self.cors()
        if cors is None:
            return self.reply(403, 'origin not allowed')
        cors.update({'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'})
        self.reply(204, headers=cors)

    def do_POST(self):
        self.close_connection = True  # при раннем отказе тело запроса остаётся непрочитанным
        if urlparse(self.path).path != '/collect':
            return self.reply(404, 'not found')
        cors = self.cors()
        if cors is None:
            return self.reply(403, 'origin not allowed')
        length = integer(self.headers.get('Content-Length')) or 0
        if length <= 0 or length > MAX_BODY:
            return self.reply_json(413 if length > MAX_BODY else 400, {'ok': False, 'error': 'bad length'}, cors)
        raw = self.rfile.read(length)
        self.close_connection = False
        try:
            payload = json.loads(raw.decode('utf-8'))
            if not isinstance(payload, dict):
                raise ValueError('payload must be an object')
            stored = store_batch(payload)
        except (ValueError, UnicodeDecodeError) as err:
            return self.reply_json(400, {'ok': False, 'error': str(err)[:200]}, cors)
        except sqlite3.Error as err:
            print('db error:', err, file=sys.stderr, flush=True)
            return self.reply_json(500, {'ok': False, 'error': 'storage'}, cors)
        self.reply_json(200, {'ok': True, 'stored': stored}, cors)

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        url = urlparse(self.path)
        path, params = url.path, parse_qs(url.query)
        if path == '/health':
            return self.reply(200, 'ok')
        if path in ('/admin', '/admin/'):
            if self.authed():
                nonce = base64.urlsafe_b64encode(os.urandom(16)).decode('ascii').rstrip('=')
                page = (HERE / 'viewer.html').read_text(encoding='utf-8').replace('__NONCE__', nonce)
                csp = "default-src 'none'; script-src 'nonce-%s'; style-src 'nonce-%s'; connect-src 'self'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" % (nonce, nonce)
                self.reply(200, page, 'text/html; charset=utf-8', {'Cache-Control': 'no-store', 'Content-Security-Policy': csp, 'Referrer-Policy': 'no-referrer'})
            return
        if path.startswith('/api/'):
            if not self.authed():
                return
            try:
                if path == '/api/export':
                    body, ctype, name = export(params)
                    return self.reply(200, body, ctype, {'Content-Disposition': 'attachment; filename="%s"' % name, 'Cache-Control': 'no-store'})
                data = api(path, params)
            except sqlite3.Error as err:
                print('db error:', err, file=sys.stderr, flush=True)
                return self.reply_json(500, {'error': 'storage'})
            return self.reply_json(200, data) if data is not None else self.reply(404, 'not found')
        if path == '/collect':
            return self.reply(405, 'POST only', headers={'Allow': 'POST, OPTIONS'})
        full = static_file(path)
        if full is None:
            if path == '/' and STATIC_DIR is None:
                return self.reply(302, headers={'Location': '/admin'})
            return self.reply(404, 'not found')
        self.send_static(full)

    def send_static(self, full):
        stat = full.stat()
        ext = full.suffix.lower()
        ctype = mimetypes.guess_type(full.name)[0] or 'application/octet-stream'
        if ext in TEXT_EXT:
            ctype += '; charset=utf-8'
        etag = '"%x-%x"' % (int(stat.st_mtime), stat.st_size)
        headers = {'ETag': etag, 'Cache-Control': 'no-cache' if ext in TEXT_EXT else 'public, max-age=3600', 'Accept-Ranges': 'bytes'}
        if self.headers.get('If-None-Match') == etag:
            return self.reply(304, headers=headers)
        rng = re.fullmatch(r'bytes=(\d*)-(\d*)', self.headers.get('Range') or '')
        if rng and ext not in TEXT_EXT and (rng.group(1) or rng.group(2)):  # видео в Safari запрашивается кусками
            size = stat.st_size
            start = int(rng.group(1)) if rng.group(1) else max(0, size - int(rng.group(2)))
            end = min(int(rng.group(2)), size - 1) if rng.group(1) and rng.group(2) else size - 1
            if start > end or start >= size:
                return self.reply(416, headers={'Content-Range': 'bytes */%d' % size})
            with open(full, 'rb') as f:
                f.seek(start)
                chunk = f.read(end - start + 1)
            headers['Content-Range'] = 'bytes %d-%d/%d' % (start, end, size)
            return self.reply(206, chunk, ctype, headers)
        body = full.read_bytes()
        if full.name == 'index.html' and b'analytics.js' not in body:  # прототип без тега — подключаем трекер на лету
            body = body.replace(b'</body>', TAG + b'\n</body>', 1) if b'</body>' in body else body + TAG
        if ext in TEXT_EXT and 'gzip' in (self.headers.get('Accept-Encoding') or ''):
            key = (str(full), etag)
            if key not in _gz_cache:
                if len(_gz_cache) > 200:
                    _gz_cache.clear()
                _gz_cache[key] = gzip.compress(body, 6)
            body = _gz_cache[key]
            headers.update({'Content-Encoding': 'gzip', 'Vary': 'Accept-Encoding'})
        self.reply(200, body, ctype, headers)


def main():
    db()
    server = ThreadingHTTPServer(('0.0.0.0', PORT), Handler)
    server.daemon_threads = True
    print('n1a: порт %d · база %s · прототип %s · пароль %s' % (
        PORT, DATA_DIR / 'events.db', STATIC_DIR or 'не раздаётся', 'задан' if ADMIN_PASSWORD else 'НЕ ЗАДАН'), flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
