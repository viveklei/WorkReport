const http = require('http');

// Phusion Passenger will pass the port it wants the app to listen on
const PORT = process.env.PORT || 5001;

console.log('--- MINIMAL TEST STARTING ---');
console.log('Node Version:', process.version);
console.log('Port from environment:', process.env.PORT);

const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    status: 'ALIVE', 
    timestamp: new Date().toISOString(),
    port_used: PORT,
    nodejs: process.version
  }));
});

server.listen(PORT, () => {
  console.log(`Minimal server is listening on port ${PORT}`);
});
