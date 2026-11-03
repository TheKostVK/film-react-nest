# FILM!

## Установка

### Бэкенд и MongoDB

Установите и запустите MongoDB. Затем в каталоге `backend` выполните:

```sh
npm ci
cp .env.example .env
```

В `.env` задаются `PORT` (порт API), `DATABASE_DRIVER` (`mongodb`) и
`DATABASE_URL` (адрес базы). По умолчанию используются порт `3000` и база `prac`.

Импортируйте `backend/test/mongodb_initial_stub.json` в коллекцию `films`
через MongoDB Compass или выполните из каталога `backend` команду MongoDB Database Tools:

```sh
mongoimport --uri="mongodb://127.0.0.1:27017/prac" --collection=films --jsonArray --file=test/mongodb_initial_stub.json
npm run start:dev
```

Если адрес базы изменён в `.env`, укажите тот же адрес при импорте.

### Фронтенд

В другом терминале перейдите в каталог `frontend` и выполните:

```sh
npm ci
cp .env.example .env
```

В локальном `.env` замените адреса учебной заглушки на адреса своего бэкенда:

```dotenv
VITE_API_URL=http://localhost:3000/api/afisha
VITE_CDN_URL=http://localhost:3000/content/afisha
```

Файл `.env` игнорируется Git; исходный `.env.example` сохранён.
При смене порта бэкенда обновите оба адреса. Запустите `npm run dev`
и откройте адрес, который напечатает Vite.

API описан в `film.yml`, коллекция запросов — в `film.postman.json`.
Афиши доступны по адресу `http://localhost:3000/content/afisha/` с именем файла.
Поле `hall` в ответе расписания передаётся строкой согласно исходному OpenAPI.
В MongoDB номер зала остаётся числом; репозиторий преобразует его для ответа API.

### Проверки

В каждом из каталогов `backend` и `frontend` доступны `npm run build` и
`npm run lint`.

В `backend` команда `npm run test:e2e` проверяет HTTP API и валидацию без внешней БД.
