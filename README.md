# Oqtepa Smart Production

Прототип веб-приложения для учета остатков сырья и фиксации выпуска продукции по цехам.

## Что внутри

- `server.js` — Express-сервер и API для остатков и выпуска
- `index.html` — интерфейс оператора
- `stocks.example.json` — пример структуры остатков
- `.env.example` — пример переменных окружения

## Запуск локально

```bash
npm install
npm start
```

После запуска приложение будет доступно по адресу `http://localhost:3000`.

## Переменные окружения

Скопируйте `.env.example` в `.env` и при необходимости измените значения.

```env
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/oqtepa
```

## Данные

В продакшене задайте `DATABASE_URL`, тогда приложение использует PostgreSQL. При первом запуске сервер создаст таблицы и импортирует текущие данные из `stocks.json`, `employees.json`, `log.json` и файлов в `logs/`, если база ещё пустая.

Если `DATABASE_URL` не задан, приложение продолжит работать через локальные JSON-файлы. В репозиторий не должны попадать рабочие файлы:

- `.env`
- `log.json`
- `stocks.json`

Если нужен стартовый шаблон остатков, используйте `stocks.example.json`.

## Публикация на GitHub

```bash
git init
git add .
git commit -m "Prepare project for GitHub"
git branch -M main
git remote add origin https://github.com/<USERNAME>/<REPOSITORY>.git
git push -u origin main
```
