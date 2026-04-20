const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.static('.'));

const STOCKS_FILE = 'stocks.json';
const LOG_FILE = 'log.json';

// База рецептов: % содержания Лахма (l), Кийма (k) и Думбы (d)
const RECIPES = {
    "DONER 50/50": { l: 0.50, k: 0.50, d: 0 },
    "DONER 30/70": { l: 0.30, k: 0.70, d: 0 },
    "DONER 60/40": { l: 0.60, k: 0.40, d: 0 },
    "DONER 70/30": { l: 0.70, k: 0.30, d: 0 },
    "TURK DONER": { l: 0.70, k: 0.20, d: 0.10 }, // Добавил Turk
    "CITY 50/50": { l: 0.50, k: 0.50, d: 0 },
    "DONER 50/50 CITY": { l: 0.50, k: 0.50, d: 0 },
    "DONER 50/50 DUAS": { l: 0.50, k: 0.50, d: 0 },
    "DONER 50/50 SEVIMLI": { l: 0.50, k: 0.50, d: 0 },
    "DONER 50/50 YUMA": { l: 0.50, k: 0.50, d: 0 },
    "BURGER XOJAKBAR": { l: 0, k: 0.90, d: 0.10 },
    "MISSIONFOODS": { l: 0, k: 1.0, d: 0 }
};

if (!fs.existsSync(STOCKS_FILE)) fs.writeFileSync(STOCKS_FILE, JSON.stringify({}));

app.get('/api/get-stock/:ws', (req, res) => {
    const data = JSON.parse(fs.readFileSync(STOCKS_FILE));
    res.json(data[req.params.ws] || { lahm: 0, kiyma: 0, dumba: 0 });
});

app.post('/api/stock', (req, res) => {
    const entry = req.body;
    const ws = entry.workshop;
    let stocks = JSON.parse(fs.readFileSync(STOCKS_FILE));

    if (!stocks[ws]) stocks[ws] = { lahm: 0, kiyma: 0, dumba: 0 };

    if (entry.category === 'RAW') {
        const l = parseFloat(entry.lahm) || 0;
        const k = parseFloat(entry.kiyma) || 0;
        const d = parseFloat(entry.dumba) || 0;

        if (entry.type === 'Остаток утро') {
            stocks[ws] = { lahm: l, kiyma: k, dumba: d };
        } else if (entry.type === 'Приход') {
            stocks[ws].lahm += l; stocks[ws].kiyma += k; stocks[ws].dumba += d;
        } else if (entry.type === 'Расход') {
            stocks[ws].lahm -= l; stocks[ws].kiyma -= k; stocks[ws].dumba -= d;
        }
    } else if (entry.category === 'PROD') {
        const recipe = RECIPES[entry.product];
        const weight = parseFloat(entry.totalKg) || 0;
        if (recipe) {
            stocks[ws].lahm -= (recipe.l * weight);
            stocks[ws].kiyma -= (recipe.k * weight);
            stocks[ws].dumba -= (recipe.d * weight);
        }
    }

    fs.writeFileSync(STOCKS_FILE, JSON.stringify(stocks, null, 2));
    fs.appendFileSync(LOG_FILE, JSON.stringify({ date: new Date(), ...entry }) + '\n');
    res.json({ success: true, newStock: stocks[ws] });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on ${PORT}`));