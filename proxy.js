const http = require('http');
const https = require('https');

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const PORT = process.env.PORT || 3001;

console.log('Chave presente:', ANTHROPIC_KEY ? 'SIM (' + ANTHROPIC_KEY.substring(0,10) + '...)' : 'NÃO');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'GET') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({ status: 'ok', key: ANTHROPIC_KEY ? 'presente' : 'ausente' }));
    return;
  }

  if (req.method !== 'POST' || req.url !== '/v1/messages') {
    res.writeHead(404); res.end('Not found'); return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      }
    };
    const proxyReq = https.request(options, proxyRes => {
      res.writeHead(proxyRes.statusCode, {'Content-Type': 'application/json'});
      proxyRes.pipe(res);
    });
    proxyReq.on('error', e => {
      res.writeHead(500);
      res.end(JSON.stringify({error: e.message}));
    });
    proxyReq.write(body);
    proxyReq.end();
  });
});

server.listen(PORT, () => console.log('Proxy na porta ' + PORT));
