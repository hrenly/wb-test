# Получение и выгрузка актуальных тарифов WB в Google Sheets

## 1. Данные для запуска проекта

### Обязательные переменные окружения
- `POSTGRES_HOST` — хост Postgres.
- `POSTGRES_PORT` — порт Postgres.
- `POSTGRES_DB` — имя базы Postgres.
- `POSTGRES_USER` — пользователь Postgres.
- `POSTGRES_PASSWORD` — пароль Postgres.
- `REDIS_HOST` — хост Redis.
- `REDIS_PORT` — порт Redis.
- `APP_PORT` — порт API приложения.
- `WB_TARIFFS_BOX_URL` — URL API тарифов WB (box).
- `WB_TARIFFS_AUTH_TOKEN` — токен авторизации WB.
- `WB_TARIFFS_QUEUE_NAME` — имя очереди для тарифов (используется только как конфиг, очередь фиксирована).
- `WB_TARIFFS_JOB_ATTEMPTS` — кол-во попыток для job.
- `WB_TARIFFS_BACKOFF_DELAY_MS` — задержка backoff между попытками.
- `WB_TARIFFS_WORKER_CONCURRENCY` — параллелизм worker для тарифов.
- `SHEETS_TARIFFS_SHEET_NAME` — имя листа в Google Sheets (по умолчанию `stocks_coefs`).
- `EXPORT_TIMEZONE` — IANA‑таймзона для расчёта business date.
- `SHEETS_EXPORT_CRON` — cron‑строка расписания экспорта.
- `GOOGLE_CREDENTIALS_PATH` — абсолютный путь к JSON ключу сервисного аккаунта.

### Google credentials
- Укажи абсолютный путь к файлу JSON сервисного аккаунта в `GOOGLE_CREDENTIALS_PATH`.
- В контейнере файл будет доступен по пути `/run/secrets/google-sa.json` (см. `compose.yaml`).

Пример:
```
GOOGLE_CREDENTIALS_PATH=/absolute/path/to/google-sa.json
```

## 2. Назначение контейнеров в Docker

- `postgres` — база данных.
- `redis` — очередь BullMQ и хранение расписаний.
- `app` — HTTP API (endpoint для постановки jobs).
- `tariffs-worker` — обработчик job по загрузке тарифов.
- `tariffs-scheduler-init` — одноразовая регистрация repeatable job `tariffs:hourly`.
- `sheets-worker` — обработчик export jobs в Google Sheets.
- `sheets-scheduler-init` — одноразовая регистрация repeatable job `sheets:export:tick`.

## 3. Запуск проекта в Docker

### Полный запуск
```bash
docker compose up --build
```

### Проверка health
```bash
curl -s http://localhost:${APP_PORT}/api/v1/health
```

### Перезапуск конкретных сервисов
```bash
docker compose up -d app tariffs-worker sheets-worker
```

## 4. Запуск локально

### Инфраструктура (Postgres + Redis)
```bash
docker compose up -d --build postgres redis
```

### Миграции
```bash
npm run knex:dev migrate latest
```

### Приложение (API)
```bash
npm run dev
```

### Воркеры
```bash
npm run dev:worker
npm run dev:sheets-worker
```

### Scheduler-init
```bash
npm run dev:scheduler
npm run dev:sheets-scheduler
```
