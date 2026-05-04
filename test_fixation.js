const http = require('http');

// Test data for fixation
const testData = {
  workshop: 'ALLMAKON',
  category: 'PROD',
  workerName: 'Test Employee',
  workerId: 'TEST001',
  product: 'DONER 50/50',
  firm: 'Test Firm',
  caliber: 10,
  count: 1,
  totalKg: 10
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/stock',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing fixation with data:', testData);

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    try {
      const response = JSON.parse(data);
      console.log('Parsed response:', response);
    } catch (e) {
      console.error('Error parsing response:', e);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

// Write data to request body
req.write(postData);
req.end();

console.log('Request sent!');
