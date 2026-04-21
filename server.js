const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.static('.'));

// === ДОБАВЛЕНО ДЛЯ РАБОТЫ С ONRENDER ===
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const STOCKS_FILE = 'stocks.json';
const LOG_FILE = 'log.json';

// Функция чтения базы остатков
function getStocks() {
    if (!fs.existsSync(STOCKS_FILE)) return {};
    try {
        return JSON.parse(fs.readFileSync(STOCKS_FILE, 'utf8'));
    } catch (e) {
        console.error('Ошибка чтения stocks.json:', e);
        return {};
    }
}

// Сохранение остатков
function saveStocks(stocks) {
    try {
        fs.writeFileSync(STOCKS_FILE, JSON.stringify(stocks, null, 2));
    } catch (e) {
        console.error('Ошибка сохранения stocks.json:', e);
    }
}

// Получить текущие остатки
app.get('/api/get-stock/:ws', (req, res) => {
    const stocks = getStocks();
    res.json(stocks[req.params.ws] || { lahm: 0, kiyma: 0, dumba: 0 });
});

// Основной обработчик (твой старый + небольшие улучшения)
app.post('/api/stock', (req, res) => {
    const data = req.body;
    const ws = data.workshop;

    if (!ws) return res.status(400).json({ error: 'Не указан workshop' });

    let stocks = getStocks();
    if (!stocks[ws]) {
        stocks[ws] = { lahm: 0, kiyma: 0, dumba: 0 };
    }

    if (data.category === 'RAW') {
        const l = parseFloat(data.lahm) || 0;
        const k = parseFloat(data.kiyma) || 0;
        const d = parseFloat(data.dumba) || 0;

        if (data.type === 'Остаток утро') {
            stocks[ws].lahm = l;
            stocks[ws].kiyma = k;
            stocks[ws].dumba = d;
        } else if (data.type === 'Приход') {
            stocks[ws].lahm += l;
            stocks[ws].kiyma += k;
            stocks[ws].dumba += d;
        } else if (data.type === 'Расход') {
            stocks[ws].lahm -= l;
            stocks[ws].kiyma -= k;
            stocks[ws].dumba -= d;
        }
    } 
    else if (data.category === 'PROD') {
        if (data.usage) {
            stocks[ws].lahm -= parseFloat(data.usage.lahm) || 0;
            stocks[ws].kiyma -= parseFloat(data.usage.kiyma) || 0;
            stocks[ws].dumba -= parseFloat(data.usage.dumba) || 0;
        }
    }

    // Защита от отрицательных остатков
    stocks[ws].lahm = Math.max(0, stocks[ws].lahm);
    stocks[ws].kiyma = Math.max(0, stocks[ws].kiyma);
    stocks[ws].dumba = Math.max(0, stocks[ws].dumba);

    // Сохраняем
    saveStocks(stocks);

    // Логируем полностью (включая workerName)
    fs.appendFileSync(LOG_FILE, JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
    }) + '\n');

    res.json({ 
        success: true, 
        currentStock: stocks[ws],
        message: 'Операция выполнена'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('=========================================');
    console.log('OQTEPA SMART SYSTEM ЗАПУЩЕН');
    console.log(`Порт: ${PORT}`);
    console.log('=========================================');
});