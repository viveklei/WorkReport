// Namecheap Phusion Passenger Entry Point (CommonJS)
console.log('--- Passenger Entry Point (app.js) Active ---');

try {
  console.log('Loading server module...');
  require('./server/index.cjs');
  console.log('Server module loaded successfully');
} catch (err) {
  console.error('CRITICAL STARTUP ERROR:');
  console.error(err);
  if (err.stack) console.error(err.stack);
}
