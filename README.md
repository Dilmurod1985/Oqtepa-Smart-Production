Oqtepa Smart Production — prototype

Коротко
Проект — прототип веб-приложения для управления остатками сырья на 6 складах.
Backend: Node.js + Express. Frontend: Vanilla JS (статический `index.html`).

Файлы
- `server.js` — Express сервер, статическая раздача и маршрут `POST /api/stock` (логирует тело запроса).
- `index.html` — мобильный UI: 6 плиток, форма склада, кнопки ПРИХОД/РАСХОД.
- `package.json` — скрипт `start`.
- `.gitignore` — исключает `node_modules`, `.env`, `.vs`, `.git` и вложенные `.git`.

Запуск локально
1. Установить зависимости:
   npm install
2. Запустить сервер:
   npm start
3. Открыть в браузере:
   http://localhost:3000

Переменные окружения
- Файл `.env` не должен попадать в репозиторий.
- Пример переменных доступен в `.env.example`.

Подготовка к пушу (обычные команды)
1. Инициализация репозитория (если ещё не инициализирован):
   git init
2. Добавить файлы и закоммитить:
   git add .
   git commit -m "Initial prototype: server + frontend"
3. Добавить удалённый репозиторий и запушить (пример для GitHub):
   git remote add origin git@github.com:USERNAME/REPO.git
   git branch -M main
   git push -u origin main

Замечания
- Не включайте секреты в репозиторий. Используйте `.env` и не коммитьте его.
- Для дальнейшей интеграции с Google Sheets создайте сервисный аккаунт и добавьте ключ в `.env` (см. `.env.example`).
