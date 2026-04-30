require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(express.json());

// Explicitly serve index.html for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Middleware for CORS and headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const STOCKS_FILE = path.join(__dirname, 'stocks.json');
const LOG_FILE = path.join(__dirname, 'log.json');
const LOGS_DIR = path.join(__dirname, 'logs');
const EMPLOYEES_FILE = path.join(__dirname, 'employees.json');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const DEFAULT_STOCK = {
  lahm: 0,
  kiyma: 0,
  dumba: 0,
  shortageLahm: 0,
  shortageKiyma: 0,
  shortageDumba: 0
};
const DEFAULT_EMPLOYEES = [
  { id: '57', name: 'Alimov Murod' }, { id: '85', name: 'Aliqulov Diyor' }, { id: '0.7', name: 'Balqiboev Asadbek' },
  { id: '5', name: 'Balqiboev Temur' }, { id: '76', name: "Boboqulov Ma'rufjon" }, { id: '77', name: 'Botiraliyev Iskandar' },
  { id: '86', name: "Botirov Ulug'bek" }, { id: '74', name: 'Hakimov Islom' }, { id: '41', name: 'Ibragimov Ozodbek' },
  { id: '67', name: 'Jonizaqov Xasanjon' }, { id: '3', name: 'Jonizaqov Xusanjon' }, { id: '43', name: 'Abdulxamidov Xasan' },
  { id: '11', name: 'Adullo brigadir' }, { id: '44', name: 'Ergashev Davronbek' }, { id: '71', name: "Ahmedov Ulug'bek" },
  { id: '8', name: 'Aminov Shahboz' }, { id: '55', name: 'Habibullayev Doniyor' }, { id: '64', name: 'Keldibekov Muxammadkodir' },
  { id: '46', name: 'Kuchkinov Abdulaziz' }, { id: '84', name: 'Lapasov Javohir' }, { id: '88', name: 'Miraliev Mirxasan' },
  { id: '14', name: 'Miraliev Mirxusan' }, { id: '53', name: 'Muxammadiev Abbos' }, { id: '52', name: 'Nazarov Abdukodir' },
  { id: '49', name: 'Nishonov Maxmudjon' }, { id: '6', name: 'Normatov Avazbek' }, { id: '36', name: "O'ktamov Sardor" },
  { id: '24', name: "Ortiqboev Ma'rufjon" }, { id: '2', name: "Qo'chqorov Sardor" }, { id: '10', name: "Qo'shbokov Inomjon" },
  { id: '30', name: 'Raimberdiyev Dilshod' }, { id: '37', name: 'Rustamjonov Aziz' }, { id: '58', name: "Sattorov Ulug'bek" },
  { id: '35', name: 'Shermatov Javlon' }, { id: '26', name: "To'xtamurodov Izzatilla" }, { id: '51', name: 'Tugalov Sherzod' },
  { id: '73', name: 'Vaxobjonov Avazbek' }, { id: '1', name: 'Xalilov Nodirbek' }, { id: '27', name: 'Xapizov Ozodbek' },
  { id: '39', name: 'Xayrullaev Jasurbek' }, { id: '4', name: 'Xoliqov Jumanazarbek' }, { id: '61', name: 'Obidov Ziyodulla' },
  { id: '0.5', name: 'Qayumova Dilnoza' }, { id: 'staj-1', name: 'Maxkamov Jahongir' }, { id: 'staj-2', name: "Turg'unboyev Asadbek" }
];

function readJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Failed to read ${path.basename(filePath)}:`, error);
    return fallback;
  }
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function getStocks() {
  return readJsonFile(STOCKS_FILE, {});
}

function saveStocks(stocks) {
  writeJsonFile(STOCKS_FILE, stocks);
}

function ensureWorkshopStock(stocks, workshop) {
  stocks[workshop] = normalizeStock(stocks[workshop] || DEFAULT_STOCK);
}

function normalizeStock(stock) {
  const asNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  };

  return {
    lahm: asNumber(stock.lahm),
    kiyma: asNumber(stock.kiyma),
    dumba: asNumber(stock.dumba),
    shortageLahm: asNumber(stock.shortageLahm),
    shortageKiyma: asNumber(stock.shortageKiyma),
    shortageDumba: asNumber(stock.shortageDumba)
  };
}

function toClientStock(stock) {
  const normalized = normalizeStock(stock);
  return {
    lahm: normalized.lahm,
    kiyma: normalized.kiyma,
    dumba: normalized.dumba,
    shortage: {
      lahm: normalized.shortageLahm,
      kiyma: normalized.shortageKiyma,
      dumba: normalized.shortageDumba
    }
  };
}

function applyDeltaWithShortage(target, stockKey, shortageKey, delta) {
  const amount = Number(delta || 0);
  if (!amount) return { shortageAdded: 0 };

  if (amount > 0) {
    const covered = Math.min(target[shortageKey], amount);
    target[shortageKey] -= covered;
    target[stockKey] += (amount - covered);
    return { shortageAdded: -covered };
  }

  const need = Math.abs(amount);
  const used = Math.min(target[stockKey], need);
  target[stockKey] -= used;
  const missing = need - used;
  target[shortageKey] += missing;
  return { shortageAdded: missing };
}

function getEmployees() {
  const stored = readJsonFile(EMPLOYEES_FILE, []);
  const merged = [...DEFAULT_EMPLOYEES];

  stored.forEach((employee) => {
    if (!merged.some((item) => String(item.id) === String(employee.id))) {
      merged.push({ id: String(employee.id), name: employee.name });
    }
  });

  return merged;
}

function saveEmployees(employees) {
  writeJsonFile(EMPLOYEES_FILE, employees);
}

function readLogEntries() {
  if (!fs.existsSync(LOG_FILE)) return [];

  const raw = fs.readFileSync(LOG_FILE, 'utf8').trim();
  if (!raw) return [];

  let entries = [];
  try {
    const parsed = JSON.parse(raw);
    entries = Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    entries = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch (error) {
          return null;
        }
      })
      .filter(Boolean);
  }

  // Fix entries missing id or timestamp
  let modified = false;
  entries.forEach((entry, index) => {
    if (!entry.id) {
      entry.id = `migrated_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 5)}`;
      modified = true;
    }
    if (!entry.timestamp) {
      if (entry.time) {
        try {
          const today = new Date();
          const [h, m, s] = entry.time.split(':');
          today.setHours(parseInt(h) || 0, parseInt(m) || 0, parseInt(s) || 0, 0);
          entry.timestamp = today.toISOString();
        } catch (e) {
          entry.timestamp = new Date().toISOString();
        }
      } else {
        entry.timestamp = new Date().toISOString();
      }
      modified = true;
    }
  });

  // Archive entries from previous days
  const todayStr = getLocalDateKey(new Date());
  const todayEntries = [];
  const archivedByDate = {};

  entries.forEach((entry) => {
    const entryDate = getLocalDateKey(entry.timestamp);
    if (entryDate === todayStr) {
      todayEntries.push(entry);
    } else {
      if (!archivedByDate[entryDate]) archivedByDate[entryDate] = [];
      archivedByDate[entryDate].push(entry);
    }
  });

  // Write archived entries to their respective files
  for (const [date, archivedEntries] of Object.entries(archivedByDate)) {
    const archivePath = path.join(LOGS_DIR, `${date}.json`);
    let existingArchive = [];
    if (fs.existsSync(archivePath)) {
      try {
        existingArchive = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
      } catch (e) {
        existingArchive = [];
      }
    }
    
    // Merge and remove duplicates by ID
    const merged = [...existingArchive];
    archivedEntries.forEach(ae => {
      if (!merged.some(me => me.id === ae.id)) {
        merged.push(ae);
      }
    });
    
    fs.writeFileSync(archivePath, JSON.stringify(merged, null, 2));
    modified = true;
  }

  if (modified) {
    writeJsonFile(LOG_FILE, todayEntries);
  }

  return todayEntries;
}

function readArchiveEntries(date) {
  const archivePath = path.join(LOGS_DIR, `${date}.json`);
  if (!fs.existsSync(archivePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(archivePath, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeLogEntries(entries) {
  writeJsonFile(LOG_FILE, entries);
}

function makeEntryId() {
  return `entry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getLocalDateKey(value) {
  // If value is missing, return empty string to avoid matching current date by accident
  if (!value) return '';
  
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function applyEntryToStocks(stocks, entry, direction) {
  ensureWorkshopStock(stocks, entry.workshop);
  const factor = direction === 'undo' ? -1 : 1;
  const target = normalizeStock(stocks[entry.workshop]);
  const result = {};

  if (entry.category === 'RAW') {
    const typeValue = String(entry.type || '');
    const isMorningBalance = typeValue.includes('Остаток утро') || typeValue.includes('РћСЃС‚Р°С‚РѕРє СѓС‚СЂРѕ');

    if (isMorningBalance) {
      const nextStock = direction === 'undo'
        ? (entry.previousStock || DEFAULT_STOCK)
        : {
            lahm: Number(entry.lahm || 0),
            kiyma: Number(entry.kiyma || 0),
            dumba: Number(entry.dumba || 0),
            shortageLahm: 0,
            shortageKiyma: 0,
            shortageDumba: 0
          };
      stocks[entry.workshop] = normalizeStock(nextStock);
      return result;
    }

    const delta = {
      lahm: Number(entry.lahm || 0),
      kiyma: Number(entry.kiyma || 0),
      dumba: Number(entry.dumba || 0)
    };

    const isExpense = typeValue.includes('Расход') || typeValue.includes('Р Р°СЃС…РѕРґ');
    const rawFactor = isExpense ? -1 : 1;
    applyDeltaWithShortage(target, 'lahm', 'shortageLahm', delta.lahm * rawFactor * factor);
    applyDeltaWithShortage(target, 'kiyma', 'shortageKiyma', delta.kiyma * rawFactor * factor);
    applyDeltaWithShortage(target, 'dumba', 'shortageDumba', delta.dumba * rawFactor * factor);
  }

  if (entry.category === 'PROD') {
    const usage = entry.usage || {};
    
    // Special logic for MISSION - use ingredients from OQTEPA
    if (entry.workshop === 'MISSION') {
      ensureWorkshopStock(stocks, 'OQTEPA');
      const oqtepaTarget = normalizeStock(stocks['OQTEPA']);
      
      const lahmResult = applyDeltaWithShortage(oqtepaTarget, 'lahm', 'shortageLahm', -Number(usage.lahm || 0) * factor);
      const kiymaResult = applyDeltaWithShortage(oqtepaTarget, 'kiyma', 'shortageKiyma', -Number(usage.kiyma || 0) * factor);
      const dumbaResult = applyDeltaWithShortage(oqtepaTarget, 'dumba', 'shortageDumba', -Number(usage.dumba || 0) * factor);
      
      stocks['OQTEPA'] = normalizeStock(oqtepaTarget);
      
      // Add used ingredients to workshop stock (as produced goods)
      applyDeltaWithShortage(target, 'lahm', 'shortageLahm', Number(usage.lahm || 0) * factor);
      applyDeltaWithShortage(target, 'kiyma', 'shortageKiyma', Number(usage.kiyma || 0) * factor);
      applyDeltaWithShortage(target, 'dumba', 'shortageDumba', Number(usage.dumba || 0) * factor);
      
      if (direction === 'apply') {
        const shortage = {
          lahm: Number(Math.max(0, lahmResult.shortageAdded).toFixed(2)),
          kiyma: Number(Math.max(0, kiymaResult.shortageAdded).toFixed(2)),
          dumba: Number(Math.max(0, dumbaResult.shortageAdded).toFixed(2))
        };
        entry.shortage = shortage;
        entry.sourceWorkshop = 'OQTEPA'; // Track that ingredients came from OQTEPA
        result.shortage = shortage;
      }
    } else {
      // Normal logic for other workshops
      const lahmResult = applyDeltaWithShortage(target, 'lahm', 'shortageLahm', -Number(usage.lahm || 0) * factor);
      const kiymaResult = applyDeltaWithShortage(target, 'kiyma', 'shortageKiyma', -Number(usage.kiyma || 0) * factor);
      const dumbaResult = applyDeltaWithShortage(target, 'dumba', 'shortageDumba', -Number(usage.dumba || 0) * factor);

      if (direction === 'apply') {
        const shortage = {
          lahm: Number(Math.max(0, lahmResult.shortageAdded).toFixed(2)),
          kiyma: Number(Math.max(0, kiymaResult.shortageAdded).toFixed(2)),
          dumba: Number(Math.max(0, dumbaResult.shortageAdded).toFixed(2))
        };
        entry.shortage = shortage;
        result.shortage = shortage;
      }
    }
  }

  stocks[entry.workshop] = normalizeStock(target);
  return result;
}

function buildHistoryItem(entry) {
  return {
    id: entry.id,
    category: entry.category,
    workshop: entry.workshop,
    timestamp: entry.timestamp,
    workerName: entry.workerName || '',
    workerId: entry.workerId || '',
    product: entry.product || '',
    caliber: entry.caliber || '',
    count: entry.count || '',
    totalKg: entry.totalKg || '',
    shortage: entry.shortage || { lahm: 0, kiyma: 0, dumba: 0 },
    type: entry.type || '',
    lahm: entry.lahm || 0,
    kiyma: entry.kiyma || 0,
    dumba: entry.dumba || 0,
    isUndone: Boolean(entry.isUndone)
  };
}

app.get('/api/get-stock/:ws', (req, res) => {
  const stocks = getStocks();
  res.json(toClientStock(stocks[req.params.ws] || DEFAULT_STOCK));
});

app.get('/api/employees', (_req, res) => {
  res.json(getEmployees());
});

app.post('/api/employees', (req, res) => {
  const name = String(req.body.name || '').trim();
  const id = String(req.body.id || '').trim();

  if (!name || !id) {
    return res.status(400).json({ error: 'РЈРєР°Р¶РёС‚Рµ РёРјСЏ Рё ID СЃРѕС‚СЂСѓРґРЅРёРєР°' });
  }

  const employees = getEmployees();
  if (employees.some((employee) => String(employee.id) === id)) {
    return res.status(400).json({ error: 'РЎРѕС‚СЂСѓРґРЅРёРє СЃ С‚Р°РєРёРј ID СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓРµС‚' });
  }

  const storedOnly = readJsonFile(EMPLOYEES_FILE, []);
  const newEmployee = { id, name };
  storedOnly.push(newEmployee);
  saveEmployees(storedOnly);

  res.json({ success: true, employee: newEmployee, employees: getEmployees() });
});

app.get('/api/history/:ws', (req, res) => {
  const workshop = req.params.ws;
  const limit = Number(req.query.limit || 0);
  const today = req.query.today === 'true';
  const date = req.query.date; // YYYY-MM-DD

  let allEntries = [];
  if (date) {
    // Read from archive
    allEntries = readArchiveEntries(date);
  } else {
    // Read from current log (which only has today's data after readLogEntries)
    allEntries = readLogEntries();
  }

  let entries = allEntries
    .filter((entry) => entry.workshop === workshop)
    .filter((entry) => !entry.isUndone);

  // Filter by today's date if requested (redundant but safe)
  if (today && !date) {
    const todayStr = getLocalDateKey(new Date());
    entries = entries.filter((entry) => {
      return getLocalDateKey(entry.timestamp) === todayStr;
    });
  }

  if (Number.isFinite(limit) && limit > 0) {
    entries = entries.slice(-limit);
  }

  const result = entries
    .reverse()
    .map(buildHistoryItem);

  res.json(result);
});

app.post('/api/stock', (req, res) => {
  const data = req.body;
  const workshop = data.workshop;

  if (!workshop) {
    return res.status(400).json({ error: 'РќРµ СѓРєР°Р·Р°РЅ workshop' });
  }

  const stocks = getStocks();
  ensureWorkshopStock(stocks, workshop);

  const entry = {
    ...data,
    id: makeEntryId(),
    timestamp: new Date().toISOString(),
    previousStock: { ...stocks[workshop] },
    isUndone: false
  };

  if (entry.category === 'RAW') {
    entry.lahm = Number(entry.lahm || 0);
    entry.kiyma = Number(entry.kiyma || 0);
    entry.dumba = Number(entry.dumba || 0);
  }

  if (entry.category === 'PROD') {
    entry.count = Number(entry.count || 0);
    entry.totalKg = Number(entry.totalKg || 0);
    entry.usage = {
      lahm: Number(entry.usage?.lahm || 0),
      kiyma: Number(entry.usage?.kiyma || 0),
      dumba: Number(entry.usage?.dumba || 0)
    };
  }

  const applyResult = applyEntryToStocks(stocks, entry, 'apply');
  saveStocks(stocks);

  const entries = readLogEntries();
  entries.push(entry);
  writeLogEntries(entries);

  res.json({
    success: true,
    currentStock: toClientStock(stocks[workshop]),
    shortage: applyResult.shortage || null,
    entry: buildHistoryItem(entry),
    message: 'РћРїРµСЂР°С†РёСЏ РІС‹РїРѕР»РЅРµРЅР°'
  });
});

app.post('/api/undo', (req, res) => {
  const entryId = String(req.body.entryId || '').trim();

  if (!entryId) {
    return res.status(400).json({ error: 'РќРµ СѓРєР°Р·Р°РЅ entryId' });
  }

  const entries = readLogEntries();
  const entry = entries.find((item) => item.id === entryId);

  if (!entry) {
    return res.status(404).json({ error: 'РћРїРµСЂР°С†РёСЏ РЅРµ РЅР°Р№РґРµРЅР°' });
  }

  if (entry.isUndone) {
    return res.status(400).json({ error: 'РћРїРµСЂР°С†РёСЏ СѓР¶Рµ РѕС‚РјРµРЅРµРЅР°' });
  }

  const stocks = getStocks();
  applyEntryToStocks(stocks, entry, 'undo');
  saveStocks(stocks);

  entry.isUndone = true;
  entry.undoneAt = new Date().toISOString();
  writeLogEntries(entries);

  res.json({
    success: true,
    currentStock: toClientStock(stocks[entry.workshop]),
    message: 'РћРїРµСЂР°С†РёСЏ РѕС‚РјРµРЅРµРЅР°'
  });
});

// Daily reset endpoint
app.post('/api/daily-reset', (req, res) => {
  const { workshop } = req.body;
  
  if (!workshop) {
    return res.status(400).json({ error: 'Укажите цех' });
  }

  const stocks = getStocks();
  
  if (!stocks[workshop]) {
    return res.status(404).json({ error: 'Цех не найден' });
  }

  // Сохраняем текущие остатки (только для склада)
  const currentStock = { ...stocks[workshop] };
  
  // Сбрасываем только производство (lahm, kiyma, dumba до 0, но сохраняем shortage)
  stocks[workshop] = {
    lahm: 0,
    kiyma: 0, 
    dumba: 0,
    shortageLahm: currentStock.shortageLahm || 0,
    shortageKiyma: currentStock.shortageKiyma || 0,
    shortageDumba: currentStock.shortageDumba || 0
  };

  // Добавляем запись о сбросе в лог
  const entries = readLogEntries();
  const resetEntry = {
    id: `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    category: 'RESET',
    workshop: workshop,
    timestamp: new Date().toISOString(),
    type: 'Ежедневный сброс производства',
    previousStock: {
      lahm: currentStock.lahm || 0,
      kiyma: currentStock.kiyma || 0,
      dumba: currentStock.dumba || 0
    },
    isUndone: false
  };

  entries.unshift(resetEntry);
  writeLogEntries(entries);
  saveStocks(stocks);

  res.json({
    success: true,
    message: `Производство в цеху ${workshop} сброшено. Остатки сохранены.`,
    previousStock: currentStock,
    newStock: toClientStock(stocks[workshop])
  });
});

// Daily statistics endpoint
app.get('/api/daily-stats/:workshop', (req, res) => {
  const { workshop } = req.params;
  
  if (!workshop) {
    return res.status(400).json({ error: 'Укажите цех' });
  }

  const entries = readLogEntries();
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Начало сегодняшнего дня
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1); // Начало вчерашнего дня

  // Фильтруем записи за сегодня и вчера
  const todayEntries = entries.filter(entry => 
    entry.workshop === workshop && 
    new Date(entry.timestamp) >= today &&
    !entry.isUndone
  );

  const yesterdayEntries = entries.filter(entry => 
    entry.workshop === workshop && 
    new Date(entry.timestamp) >= yesterday &&
    new Date(entry.timestamp) < today &&
    !entry.isUndone
  );

  // Считаем статистику
  const calculateStats = (dayEntries) => {
    let stockIn = { lahm: 0, kiyma: 0, dumba: 0 };
    let stockOut = { lahm: 0, kiyma: 0, dumba: 0 };
    let production = 0;
    let productionCount = 0;

    dayEntries.forEach(entry => {
      if (entry.category === 'RAW') {
        if (entry.type.includes('Приход')) {
          stockIn.lahm += Number(entry.lahm || 0);
          stockIn.kiyma += Number(entry.kiyma || 0);
          stockIn.dumba += Number(entry.dumba || 0);
        } else if (entry.type.includes('Расход') || entry.type.includes('Расход')) {
          stockOut.lahm += Number(entry.lahm || 0);
          stockOut.kiyma += Number(entry.kiyma || 0);
          stockOut.dumba += Number(entry.dumba || 0);
        }
      } else if (entry.category === 'PROD') {
        production += Number(entry.totalKg || 0);
        productionCount += Number(entry.count || 0);
        
        // Add raw material consumption from production
        if (entry.usage) {
          stockOut.lahm += Number(entry.usage.lahm || 0);
          stockOut.kiyma += Number(entry.usage.kiyma || 0);
          stockOut.dumba += Number(entry.usage.dumba || 0);
        }
      }
    });

    return {
      stockIn,
      stockOut,
      production,
      productionCount,
      netStock: {
        lahm: stockIn.lahm - stockOut.lahm,
        kiyma: stockIn.kiyma - stockOut.kiyma,
        dumba: stockIn.dumba - stockOut.dumba
      }
    };
  };

  const todayStats = calculateStats(todayEntries);
  const yesterdayStats = calculateStats(yesterdayEntries);

  res.json({
    success: true,
    today: {
      date: getLocalDateKey(today),
      ...todayStats,
      entriesCount: todayEntries.length
    },
    yesterday: {
      date: getLocalDateKey(yesterday),
      ...yesterdayStats,
      entriesCount: yesterdayEntries.length
    }
  });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('=========================================');
    console.log('OQTEPA SMART SYSTEM STARTED');
    console.log(`Port: ${PORT}`);
    console.log('=========================================');
  });
}

module.exports = { app, getLocalDateKey };
