const http = require('http');

const data = JSON.stringify({
  workshop: 'VENDIS',
  category: 'PROD',
  workerName: 'Test VENDIS',
  workerId: 'test_vendis',
  product: 'VENDIS Product',
  caliber: '5 kg',
  count: 1,
  totalKg: 5,
  usage: {
    lahm: 2,
    kiyma: 2,
    dumba: 1
  }
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/stock',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log('=== VENDIS TEST ===');
  console.log(`statusCode: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
