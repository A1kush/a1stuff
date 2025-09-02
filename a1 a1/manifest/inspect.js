const fs = require('fs');
const c = fs.readFileSync('a1 12.html','utf8');
let count = 0; for(const ch of c){ if(ch.charCodeAt(0)===96) count++; }
console.log('backticks', count);
let i=0; c.split('\n').forEach((line,idx)=>{ if(line.includes('`') && i<40){ console.log((idx+1)+':'+line); i++; } });
