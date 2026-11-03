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

### PostgreSQL

Базу данных можно переключить через `.env`, без изменения контроллеров и сервисов.
Для PostgreSQL установите и запустите сервер, затем из каталога `backend`
создайте отдельного пользователя и загрузите SQL-заготовки:

```sh
createuser -h 127.0.0.1 -U postgres --pwprompt prac
psql -h 127.0.0.1 -U postgres -v ON_ERROR_STOP=1 -f test/prac.init.sql
psql -h 127.0.0.1 -U prac -d prac -v ON_ERROR_STOP=1 -f test/prac.films.sql
psql -h 127.0.0.1 -U prac -d prac -v ON_ERROR_STOP=1 -f test/prac.shedules.sql
```

SQL-файлы взяты из [заготовки второй части](https://github.com/yandex-praktikum/film-react-nest/tree/feat/postgres/backend/test).
Они выполняются один раз для новой базы `prac`. Скрипт `prac.init.sql` создаёт базу,
подключается к ней и создаёт таблицы `films` и `schedules` со связью по `filmId`.
Автоматическая синхронизация схемы TypeORM отключена.

В `backend/.env` укажите:

```dotenv
DATABASE_DRIVER=postgres
DATABASE_URL=postgresql://127.0.0.1:5432/prac
DATABASE_USERNAME=prac
DATABASE_PASSWORD=<пароль, заданный при создании пользователя prac>
```

После изменения `.env` перезапустите бэкенд. Для возврата к MongoDB задайте
`DATABASE_DRIVER=mongodb` и соответствующий `DATABASE_URL`; логин и пароль
PostgreSQL в этом режиме не используются.

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

### Проверки

В каждом из каталогов `backend` и `frontend` доступны `npm run build` и
`npm run lint`.
