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
```

## Данные

В репозиторий не должны попадать рабочие файлы:

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
