const http = require('http');

const PORT = process.env.PORT || 5001;

const server = http.createServer((req, res) => {
  console.log(`Received request: ${req.url}`);
  
  if (req.url === '/api/health' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
        status: 'MINIMAL_SERVER_OK', 
        time: new Date().toISOString(),
        port: PORT,
        node_version: process.version
    }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<h1>Minimal Test Server is Running</h1><p>Visit <a href="/api/health">/api/health</a></p>');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Minimal server running on port ${PORT}`);
});
