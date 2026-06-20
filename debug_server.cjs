const { spawn } = require('child_process');
const fs = require('fs');

const child = spawn('node', ['server/index.js'], {
    env: process.env,
    cwd: process.cwd()
});

let errorLog = '';

child.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

child.stderr.on('data', (data) => {
    errorLog += data;
    console.error(`stderr: ${data}`);
});

child.on('close', (code) => {
    fs.writeFileSync('error_full.log', errorLog);
    console.log(`child process exited with code ${code}`);
});
