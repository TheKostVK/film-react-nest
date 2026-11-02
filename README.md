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
npm run dev
```

Откройте адрес, который напечатает Vite. Фронтенд обращается к локальному API
на порту `3000`; при смене порта обновите `VITE_API_URL` и `VITE_CDN_URL` в `.env`.

API описан в `film.yml`, коллекция запросов — в `film.postman.json`.
Афиши доступны по адресу `http://localhost:3000/content/afisha/` с именем файла.

### Проверки

В каждом из каталогов `backend` и `frontend` доступны `npm run build` и
`npm run lint`.
