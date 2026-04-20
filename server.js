const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.static('.'));

const STOCKS_FILE = 'stocks.json';
const LOG_FILE = 'log.json';

// Функция чтения базы остатков
function getStocks() {
    if (!fs.existsSync(STOCKS_FILE)) return {};
    try {
        return JSON.parse(fs.readFileSync(STOCKS_FILE));
    } catch (e) {
        return {};
    }
}

// Получить текущие остатки для табло
app.get('/api/get-stock/:ws', (req, res) => {
    const stocks = getStocks();
    res.json(stocks[req.params.ws] || { lahm: 0, kiyma: 0, dumba: 0 });
});

// Обработка всех движений (Склад + Выпуск)
app.post('/api/stock', (req, res) => {
    const data = req.body;
    const ws = data.workshop;
    let stocks = getStocks();

    if (!stocks[ws]) {
        stocks[ws] = { lahm: 0, kiyma: 0, dumba: 0 };
    }

    if (data.category === 'RAW') {
        const l = parseFloat(data.lahm) || 0;
        const k = parseFloat(data.kiyma) || 0;
        const d = parseFloat(data.dumba) || 0;

        if (data.type === 'Остаток утро') {
            // Прямая установка значения (Замена)
            stocks[ws].lahm = l;
            stocks[ws].kiyma = k;
            stocks[ws].dumba = d;
        } else if (data.type === 'Приход') {
            // Математическое сложение (Плюс)
            stocks[ws].lahm += l;
            stocks[ws].kiyma += k;
            stocks[ws].dumba += d;
        } else if (data.type === 'Расход') {
            // Вычитание (Минус)
            stocks[ws].lahm -= l;
            stocks[ws].kiyma -= k;
            stocks[ws].dumba -= d;
        }
    } else if (data.category === 'PROD') {
        // Автоматическое списание по техкарте
        stocks[ws].lahm -= parseFloat(data.usage.lahm || 0);
        stocks[ws].kiyma -= parseFloat(data.usage.kiyma || 0);
        stocks[ws].dumba -= parseFloat(data.usage.dumba || 0);
    }

    // Сохраняем в JSON и логируем операцию
    fs.writeFileSync(STOCKS_FILE, JSON.stringify(stocks, null, 2));
    fs.appendFileSync(LOG_FILE, JSON.stringify(data) + '\n');

    res.json({ success: true, currentStock: stocks[ws] });
});

app.listen(3000, () => {
    console.log('-----------------------------------------');
    console.log('OQTEPA SMART SYSTEM РАБОТАЕТ ИСПРАВНО');
    console.log('Порт: 3000');
    console.log('-----------------------------------------');
});