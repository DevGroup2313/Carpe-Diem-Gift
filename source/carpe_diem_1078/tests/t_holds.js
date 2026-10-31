// t_holds.js PAGE.html: the backup sheet's "This file holds" list, taken from the page itself and run on three files:
// a demonstration's study, Tabula's large store alone, and the owner's study (as before).
const fs = require('fs');
const s = fs.readFileSync(process.argv[2], 'utf8');
const key = (s.match(/const STORAGE_KEY = "([^"]+)"/) || [])[1];
const a = s.indexOf('function holds(obj, fr) {');
let i = s.indexOf('{', a), d = 0, j = i;
for (; j < s.length; j++) { if (s[j] === '{') d++; else if (s[j] === '}') { d--; if (!d) break; } }
const holds = new Function('STORAGE_KEY', s.slice(a, j + 1) + '\nreturn holds;')(key);
let fails = 0;
const t = (obj, re, what) => { const out = holds(obj, false).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); const ok = re.test(out); if (!ok) fails++; console.log((ok ? 'ok   ' : 'FAIL ') + what + '  ' + out.slice(0, 160)); };
t({ data: { [key]: '{}' } }, /your study/, 'the study, under this edition\'s own key (' + key + ')');
t({ data: {}, idb: { 'tabula-big': { stores: { docs: { rows: [1, 2] } } } } }, /Tabula/, 'Tabula, from its large store alone');
t({ data: { carpe_diem_offline_v1: '{}' } }, /your study/, 'the study, under the owner\'s key');
process.exit(fails ? 1 : 0);
