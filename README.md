# Oqtepa Smart Production

Prototype web app for tracking raw material stock and production output by workshop.

## What's Included

- `server.js` - Express server and API for stock, employees, history, daily reset, and daily stats.
- `index.html` - operator interface.
- `.env.example` - example environment variables.
- `render.yaml` - Render Blueprint for the web service and PostgreSQL database.

## Local Run

```bash
npm install
npm start
```

The app runs at `http://localhost:3000` by default.

## Checks

```bash
npm run check
```

This validates the Node server syntax before deployment.

## Environment Variables

Copy `.env.example` to `.env` for local development and change values if needed.

```env
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/oqtepa
```

If `DATABASE_URL` is empty, the app uses local JSON files. For production, set `DATABASE_URL` so the app uses PostgreSQL.

On Render, `render.yaml` creates a PostgreSQL database and injects `DATABASE_URL` automatically.

## Data Storage

In production, PostgreSQL is initialized on server startup. If the database is empty, the app imports existing local data from:

- `stocks.json`
- `employees.json`
- `log.json`
- `logs/*.json`

Runtime data files should not be committed to the repository:

- `.env`
- `stocks.json`
- `employees.json`
- `log.json`
- `logs/*.json`

## Deploy To Render

1. Push the repository to GitHub.
2. In Render, create a new Blueprint from this repository.
3. Render will run `npm ci && npm run check`, start with `npm start`, and use `/health` for health checks.
