# Шаблон для выполнения тестового задания

## Описание
Шаблон подготовлен для того, чтобы попробовать сократить трудоемкость выполнения тестового задания.

В шаблоне настоены контейнеры для `postgres`, `redis` и приложения на `nodejs`.  
Для взаимодействия с БД используется `knex.js`.  
В контейнере `app` используется `build` для приложения на `ts`, но можно использовать и `js`.

Шаблон не является обязательным!\
Можно использовать как есть или изменять на свой вкус.

Все настройки можно найти в файлах:
- compose.yaml
- compose.override.yaml
- dockerfile
- package.json
- tsconfig.json
- src/config/env/env.ts
- src/config/knex/knexfile.ts

## Команды:

Запуск инфраструктуры (Postgres + Redis):
```bash
docker compose up -d --build postgres redis
```

Для выполнения миграций не из контейнера:
```bash
npm run knex:dev migrate latest
```

Также можно использовать и остальные команды (`migrate make <name>`,`migrate up`, `migrate down` и т.д.)

Для запуска приложения в режиме разработки (локально):
```bash
npm run dev
```

Для запуска воркера в режиме разработки:
```bash
npm run dev:worker
```

Для запуска scheduler-init в режиме разработки:
```bash
npm run dev:scheduler
```

Dev‑запуск в Docker (app + worker + scheduler):
```bash
docker compose up --build
```

Проверка health‑эндпоинта:
```bash
curl -s http://localhost:${APP_PORT}/api/v1/health
```

Примечание про scheduler-init:
- `scheduler-init` — однократный запуск. При старте он регистрирует repeatable job `tariffs:hourly` с cron `0 * * * *` и завершает работу.
- Повторные запуски не дублируют расписание, оно хранится в Redis.

Запуск проверки самого приложения (prod‑режим app‑сервиса):
```bash
docker compose up -d --build app
```

Для финальной проверки рекомендую:
```bash
docker compose down --rmi local --volumes
docker compose up --build
```

PS: С наилучшими пожеланиями!
