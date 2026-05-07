require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const STOCKS_FILE = path.join(__dirname, 'stocks.json');
const LOG_FILE = path.join(__dirname, 'log.json');
const LOGS_DIR = path.join(__dirname, 'logs');
const EMPLOYEES_FILE = path.join(__dirname, 'employees.json');

const app = express();
const asyncRoute = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

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

function ensureDataDirs() {
  try {
    console.log(' Working directory:', __dirname);
    console.log(' STOCKS_FILE:', STOCKS_FILE);
    console.log(' LOG_FILE:', LOG_FILE);
    console.log(' LOGS_DIR:', LOGS_DIR);
    
    if (!fs.existsSync(LOGS_DIR)) {
      console.log(' Creating LOGS_DIR...');
      fs.mkdirSync(LOGS_DIR, { recursive: true });
      console.log(' LOGS_DIR created');
    } else {
      console.log(' LOGS_DIR exists');
    }
  } catch (error) {
    console.error(' Failed to create data directories:', error);
  }
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

const USE_POSTGRES = Boolean(process.env.DATABASE_URL);
let pgPool = null;

function getPgPool() {
  if (!USE_POSTGRES) return null;
  if (pgPool) return pgPool;

  try {
    const { Pool } = require('pg');
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false }
    });
    return pgPool;
  } catch (error) {
    console.error('PostgreSQL is enabled but package "pg" is not installed:', error.message);
    throw error;
  }
}

function readJsonFile(filePath, fallback) {
  ensureDataDirs();
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Failed to read ${path.basename(filePath)}:`, error);
    return fallback;
  }
}

function writeJsonFile(filePath, value) {
  ensureDataDirs();
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function getStocksFromFiles() {
  return readJsonFile(STOCKS_FILE, {});
}

function saveStocksToFiles(stocks) {
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

function getEmployeesFromFiles() {
  const stored = readJsonFile(EMPLOYEES_FILE, []);
  const merged = [...DEFAULT_EMPLOYEES];

  stored.forEach((employee) => {
    if (!merged.some((item) => String(item.id) === String(employee.id))) {
      merged.push({ id: String(employee.id), name: employee.name });
    }
  });

  return merged;
}

function saveEmployeesToFiles(employees) {
  writeJsonFile(EMPLOYEES_FILE, employees);
}

function readCurrentLogFileEntries() {
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

function readArchiveEntriesFromFiles(date) {
  ensureDataDirs();
  const archivePath = path.join(LOGS_DIR, `${date}.json`);
  if (!fs.existsSync(archivePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(archivePath, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeLogEntriesToFiles(entries) {
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

function readAllLogEntriesFromFiles() {
  const entriesById = new Map();

  readCurrentLogFileEntries().forEach((entry) => {
    if (entry.id) entriesById.set(entry.id, entry);
  });

  ensureDataDirs();
  if (fs.existsSync(LOGS_DIR)) {
    fs.readdirSync(LOGS_DIR)
      .filter((fileName) => fileName.endsWith('.json'))
      .forEach((fileName) => {
        const archiveDate = path.basename(fileName, '.json');
        readArchiveEntriesFromFiles(archiveDate).forEach((entry) => {
          if (entry.id) entriesById.set(entry.id, entry);
        });
      });
  }

  return [...entriesById.values()];
}

async function initPostgresStorage() {
  if (!USE_POSTGRES) return;

  const pool = getPgPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_balances (
      workshop TEXT PRIMARY KEY,
      lahm NUMERIC NOT NULL DEFAULT 0,
      kiyma NUMERIC NOT NULL DEFAULT 0,
      dumba NUMERIC NOT NULL DEFAULT 0,
      shortage_lahm NUMERIC NOT NULL DEFAULT 0,
      shortage_kiyma NUMERIC NOT NULL DEFAULT 0,
      shortage_dumba NUMERIC NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS stock_entries (
      id TEXT PRIMARY KEY,
      workshop TEXT NOT NULL,
      category TEXT NOT NULL,
      entry_timestamp TIMESTAMPTZ NOT NULL,
      is_undone BOOLEAN NOT NULL DEFAULT false,
      undone_at TIMESTAMPTZ,
      payload JSONB NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_stock_entries_workshop_date
      ON stock_entries (workshop, entry_timestamp DESC);
  `);

  await seedPostgresFromFiles();
}

async function seedPostgresFromFiles() {
  const pool = getPgPool();
  const { rows } = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM stock_balances) AS stocks_count,
      (SELECT COUNT(*)::int FROM employees) AS employees_count,
      (SELECT COUNT(*)::int FROM stock_entries) AS entries_count
  `);
  const counts = rows[0] || {};

  if (!counts.stocks_count) {
    const stocks = getStocksFromFiles();
    for (const [workshop, stock] of Object.entries(stocks)) {
      await saveOneStockToPostgres(workshop, stock);
    }
  }

  if (!counts.employees_count) {
    for (const employee of getEmployeesFromFiles()) {
      await pool.query(
        `INSERT INTO employees (id, name) VALUES ($1, $2)
         ON CONFLICT (id) DO NOTHING`,
        [String(employee.id), employee.name]
      );
    }
  }

  if (!counts.entries_count) {
    for (const entry of readAllLogEntriesFromFiles()) {
      await saveEntryToPostgres(entry);
    }
  }
}

async function getStocks() {
  if (!USE_POSTGRES) return getStocksFromFiles();

  const { rows } = await getPgPool().query('SELECT * FROM stock_balances');
  const stocks = {};
  rows.forEach((row) => {
    stocks[row.workshop] = normalizeStock({
      lahm: row.lahm,
      kiyma: row.kiyma,
      dumba: row.dumba,
      shortageLahm: row.shortage_lahm,
      shortageKiyma: row.shortage_kiyma,
      shortageDumba: row.shortage_dumba
    });
  });
  return stocks;
}

async function saveOneStockToPostgres(workshop, stock) {
  const normalized = normalizeStock(stock);
  await getPgPool().query(
    `INSERT INTO stock_balances
      (workshop, lahm, kiyma, dumba, shortage_lahm, shortage_kiyma, shortage_dumba, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now())
     ON CONFLICT (workshop) DO UPDATE SET
      lahm = EXCLUDED.lahm,
      kiyma = EXCLUDED.kiyma,
      dumba = EXCLUDED.dumba,
      shortage_lahm = EXCLUDED.shortage_lahm,
      shortage_kiyma = EXCLUDED.shortage_kiyma,
      shortage_dumba = EXCLUDED.shortage_dumba,
      updated_at = now()`,
    [
      workshop,
      normalized.lahm,
      normalized.kiyma,
      normalized.dumba,
      normalized.shortageLahm,
      normalized.shortageKiyma,
      normalized.shortageDumba
    ]
  );
}

async function saveStocks(stocks) {
  if (!USE_POSTGRES) {
    saveStocksToFiles(stocks);
    return;
  }

  for (const [workshop, stock] of Object.entries(stocks)) {
    await saveOneStockToPostgres(workshop, stock);
  }
}

async function getEmployees() {
  if (!USE_POSTGRES) return getEmployeesFromFiles();

  const { rows } = await getPgPool().query('SELECT id, name FROM employees ORDER BY name');
  const merged = [...DEFAULT_EMPLOYEES];
  rows.forEach((employee) => {
    if (!merged.some((item) => String(item.id) === String(employee.id))) {
      merged.push({ id: String(employee.id), name: employee.name });
    }
  });
  return merged;
}

async function saveEmployee(employee) {
  if (!USE_POSTGRES) {
    const storedOnly = readJsonFile(EMPLOYEES_FILE, []);
    storedOnly.push(employee);
    saveEmployeesToFiles(storedOnly);
    return;
  }

  await getPgPool().query(
    `INSERT INTO employees (id, name) VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
    [String(employee.id), employee.name]
  );
}

function normalizeDbEntry(row) {
  const payload = row.payload || {};
  return {
    ...payload,
    id: row.id,
    workshop: row.workshop,
    category: row.category,
    timestamp: row.entry_timestamp ? new Date(row.entry_timestamp).toISOString() : payload.timestamp,
    isUndone: Boolean(row.is_undone),
    undoneAt: row.undone_at ? new Date(row.undone_at).toISOString() : payload.undoneAt
  };
}

async function readLogEntries() {
  if (!USE_POSTGRES) return readCurrentLogFileEntries();

  const todayStr = getLocalDateKey(new Date());
  return readEntriesByDate(todayStr);
}

async function readEntriesByDate(date) {
  if (!USE_POSTGRES) {
    const todayStr = getLocalDateKey(new Date());
    return date && date !== todayStr ? readArchiveEntriesFromFiles(date) : readCurrentLogFileEntries();
  }

  const { rows } = await getPgPool().query(
    `SELECT * FROM stock_entries
     WHERE entry_timestamp >= $1::date
       AND entry_timestamp < ($1::date + interval '1 day')
     ORDER BY entry_timestamp ASC`,
    [date || getLocalDateKey(new Date())]
  );
  return rows.map(normalizeDbEntry);
}

async function saveEntryToPostgres(entry) {
  await getPgPool().query(
    `INSERT INTO stock_entries
      (id, workshop, category, entry_timestamp, is_undone, undone_at, payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
     ON CONFLICT (id) DO UPDATE SET
      workshop = EXCLUDED.workshop,
      category = EXCLUDED.category,
      entry_timestamp = EXCLUDED.entry_timestamp,
      is_undone = EXCLUDED.is_undone,
      undone_at = EXCLUDED.undone_at,
      payload = EXCLUDED.payload`,
    [
      entry.id,
      entry.workshop,
      entry.category,
      entry.timestamp || new Date().toISOString(),
      Boolean(entry.isUndone),
      entry.undoneAt || null,
      JSON.stringify(entry)
    ]
  );
}

async function writeLogEntries(entries) {
  if (!USE_POSTGRES) {
    writeLogEntriesToFiles(entries);
    return;
  }

  for (const entry of entries) {
    await saveEntryToPostgres(entry);
  }
}

async function findEntryById(entryId) {
  if (!USE_POSTGRES) {
    return (await readLogEntries()).find((item) => item.id === entryId);
  }

  const { rows } = await getPgPool().query('SELECT * FROM stock_entries WHERE id = $1', [entryId]);
  return rows[0] ? normalizeDbEntry(rows[0]) : null;
}

function calculateUsageByProduct(product, totalKg) {
  // Calculate ingredient usage based on product type and total kg
  const usageRatios = {
    'DONER 50/50': { lahm: 0.5, kiyma: 0.5, dumba: 0 },
    'DONER 30/70': { lahm: 0.3, kiyma: 0.7, dumba: 0 },
    'DONER 60/40': { lahm: 0.6, kiyma: 0.4, dumba: 0 },
    'DONER 70/30': { lahm: 0.7, kiyma: 0.3, dumba: 0 },
    'TURK 70/30': { lahm: 0.7, kiyma: 0.3, dumba: 0 },
    'CITY 50/50': { lahm: 0.5, kiyma: 0.5, dumba: 0 },
    "WENDY'S 50/50": { lahm: 0.5, kiyma: 0.5, dumba: 0 },
    'MISSION 100% QIYMA': { lahm: 0, kiyma: 1.0, dumba: 0 }
  };
  
  const ratios = usageRatios[product] || { lahm: 0.5, kiyma: 0.5, dumba: 0 };
  
  return {
    lahm: totalKg * ratios.lahm,
    kiyma: totalKg * ratios.kiyma,
    dumba: totalKg * ratios.dumba
  };
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
    
    // Special logic for workshops that use ingredients from OQTEPA
    const workshopsUsingOqtepa = ['MISSION', 'TURK', 'CITY', 'WENDYS'];
    
    if (workshopsUsingOqtepa.includes(entry.workshop)) {
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
      // Normal logic for other workshops (ALLMAKON)
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

app.get('/api/get-stock/:ws', asyncRoute(async (req, res) => {
  const stocks = await getStocks();
  res.json(toClientStock(stocks[req.params.ws] || DEFAULT_STOCK));
}));

app.get('/api/employees', asyncRoute(async (_req, res) => {
  res.json(await getEmployees());
}));

app.post('/api/employees', asyncRoute(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const id = String(req.body.id || '').trim();

  if (!name || !id) {
    return res.status(400).json({ error: 'РЈРєР°Р¶РёС‚Рµ РёРјСЏ Рё ID СЃРѕС‚СЂСѓРґРЅРёРєР°' });
  }

  const employees = await getEmployees();
  if (employees.some((employee) => String(employee.id) === id)) {
    return res.status(400).json({ error: 'РЎРѕС‚СЂСѓРґРЅРёРє СЃ С‚Р°РєРёРј ID СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓРµС‚' });
  }

  const newEmployee = { id, name };
  await saveEmployee(newEmployee);

  res.json({ success: true, employee: newEmployee, employees: await getEmployees() });
}));

app.get('/api/history/:ws', asyncRoute(async (req, res) => {
  const workshop = req.params.ws;
  const limit = Number(req.query.limit || 0);
  const today = req.query.today === 'true';
  const date = req.query.date; // YYYY-MM-DD
  const todayStr = getLocalDateKey(new Date());

  let allEntries = [];
  if (date) {
    allEntries = await readEntriesByDate(date);
  } else {
    allEntries = await readLogEntries();
  }

  let entries = allEntries
    .filter((entry) => entry.workshop === workshop)
    .filter((entry) => !entry.isUndone);

  // Filter by today's date if requested (redundant but safe)
  if (today && !date) {
    console.log('🔵 Today filter - todayStr:', todayStr);
    console.log('🔵 Today filter - entries before:', entries.length);
    entries = entries.filter((entry) => {
      const entryDate = getLocalDateKey(entry.timestamp);
      const matches = entryDate === todayStr;
      if (!matches) {
        console.log('🔴 Filtered out entry:', {
          entryDate,
          timestamp: entry.timestamp,
          todayStr
        });
      }
      return matches;
    });
    console.log('🔵 Today filter - entries after:', entries.length);
  }

  if (Number.isFinite(limit) && limit > 0) {
    entries = entries.slice(-limit);
  }

  const result = entries
    .reverse()
    .map(buildHistoryItem);

  res.json(result);
}));

app.post('/api/stock', asyncRoute(async (req, res) => {
  const data = req.body;
  const workshop = data.workshop;

  if (!workshop) {
    return res.status(400).json({ error: 'РќРµ СѓРєР°Р·Р°РЅ workshop' });
  }

  const stocks = await getStocks();
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
    
    // Calculate usage automatically if not provided
    if (!entry.usage || (entry.usage.lahm === 0 && entry.usage.kiyma === 0 && entry.usage.dumba === 0)) {
      entry.usage = calculateUsageByProduct(entry.product, entry.totalKg);
    } else {
      entry.usage = {
        lahm: Number(entry.usage?.lahm || 0),
        kiyma: Number(entry.usage?.kiyma || 0),
        dumba: Number(entry.usage?.dumba || 0)
      };
    }
  }

  const applyResult = applyEntryToStocks(stocks, entry, 'apply');
  await saveStocks(stocks);

  const entries = await readLogEntries();
  entries.push(entry);
  await writeLogEntries(entries);

  res.json({
    success: true,
    currentStock: toClientStock(stocks[workshop]),
    shortage: applyResult.shortage || null,
    entry: buildHistoryItem(entry),
    message: 'РћРїРµСЂР°С†РёСЏ РІС‹РїРѕР»РЅРµРЅР°'
  });
}));

app.post('/api/undo', asyncRoute(async (req, res) => {
  const entryId = String(req.body.entryId || '').trim();

  if (!entryId) {
    return res.status(400).json({ error: 'РќРµ СѓРєР°Р·Р°РЅ entryId' });
  }

  const entries = await readLogEntries();
  const entry = USE_POSTGRES ? await findEntryById(entryId) : entries.find((item) => item.id === entryId);

  if (!entry) {
    return res.status(404).json({ error: 'РћРїРµСЂР°С†РёСЏ РЅРµ РЅР°Р№РґРµРЅР°' });
  }

  if (entry.isUndone) {
    return res.status(400).json({ error: 'РћРїРµСЂР°С†РёСЏ СѓР¶Рµ РѕС‚РјРµРЅРµРЅР°' });
  }

  const stocks = await getStocks();
  applyEntryToStocks(stocks, entry, 'undo');
  await saveStocks(stocks);

  entry.isUndone = true;
  entry.undoneAt = new Date().toISOString();
  if (USE_POSTGRES) {
    await saveEntryToPostgres(entry);
  } else {
    await writeLogEntries(entries);
  }

  res.json({
    success: true,
    currentStock: toClientStock(stocks[entry.workshop]),
    message: 'РћРїРµСЂР°С†РёСЏ РѕС‚РјРµРЅРµРЅР°'
  });
}));

// Daily reset endpoint
app.post('/api/daily-reset', asyncRoute(async (req, res) => {
  const { workshop } = req.body;
  
  if (!workshop) {
    return res.status(400).json({ error: 'Укажите цех' });
  }

  const stocks = await getStocks();
  
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
  const entries = await readLogEntries();
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
  await writeLogEntries(entries);
  await saveStocks(stocks);

  res.json({
    success: true,
    message: `Производство в цеху ${workshop} сброшено. Остатки сохранены.`,
    previousStock: currentStock,
    newStock: toClientStock(stocks[workshop])
  });
}));

// Daily statistics endpoint
app.get('/api/daily-stats/:workshop', asyncRoute(async (req, res) => {
  const { workshop } = req.params;
  
  if (!workshop) {
    return res.status(400).json({ error: 'Укажите цех' });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Начало сегодняшнего дня
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1); // Начало вчерашнего дня

  const entries = [
    ...await readEntriesByDate(getLocalDateKey(today)),
    ...await readEntriesByDate(getLocalDateKey(yesterday))
  ];

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
}));

app.use((error, _req, res, _next) => {
  console.error('API error:', error);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  initPostgresStorage()
    .then(() => {
      app.listen(PORT, () => {
        console.log('=========================================');
        console.log('OQTEPA SMART SYSTEM STARTED');
        console.log(`Port: ${PORT}`);
        console.log(`Storage: ${USE_POSTGRES ? 'PostgreSQL' : 'JSON files'}`);
        console.log('=========================================');
      });
    })
    .catch((error) => {
      console.error('Failed to initialize storage:', error);
      process.exit(1);
    });
}

module.exports = { app, getLocalDateKey, initPostgresStorage };
