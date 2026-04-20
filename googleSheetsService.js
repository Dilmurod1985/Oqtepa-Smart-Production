const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID; // must be set in .env

let authClient;
async function authorize() {
  if (authClient) return authClient;
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON || '{}');
  const jwt = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    SCOPES
  );
  await jwt.authorize();
  authClient = jwt;
  return authClient;
}

async function appendStockRow(workshopName, type, lahm, kiyma, dumba) {
  const auth = await authorize();
  const sheets = google.sheets({ version: 'v4', auth });
  const now = new Date().toISOString();
  const values = [[now, workshopName, type, lahm, kiyma, dumba]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Stock!A:F',
    valueInputOption: 'USER_ENTERED',
    resource: { values }
  });
}

module.exports = { appendStockRow };
