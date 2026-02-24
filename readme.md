# Получение и выгрузка актуальных тарифов WB в Google Sheets

## 1. Данные для запуска проекта

### Обязательные переменные окружения
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `REDIS_HOST`
- `REDIS_PORT`
- `APP_PORT`
- `WB_TARIFFS_BOX_URL`
- `WB_TARIFFS_AUTH_TOKEN`
- `WB_TARIFFS_QUEUE_NAME`
- `WB_TARIFFS_JOB_ATTEMPTS`
- `WB_TARIFFS_BACKOFF_DELAY_MS`
- `WB_TARIFFS_WORKER_CONCURRENCY`
- `SHEETS_TARIFFS_SHEET_NAME`
- `EXPORT_TIMEZONE`
- `SHEETS_EXPORT_CRON`
- `GOOGLE_CREDENTIALS_PATH`

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
