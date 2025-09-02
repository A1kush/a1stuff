const fs = require('fs');
const p = 'a1 12.html';
let s = fs.readFileSync(p, 'utf8');
s = s.replace(/`ntry\{ updateCurrencies\(\); \}catch\{\}/g, '\ntry{ updateCurrencies(); }catch{}');
s = s.replace(/recalcStats\(\);`n/g, 'recalcStats();\n');
s = s.replace(/recalcStats && recalcStats\(\);`n/g, 'recalcStats && recalcStats();\n');
fs.writeFileSync(p, s);
console.log('Fixed backtick-newline sequences.');
