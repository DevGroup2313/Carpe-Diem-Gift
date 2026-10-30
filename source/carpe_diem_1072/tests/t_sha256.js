const fs = require('fs'), crypto = require('crypto');
eval(fs.readFileSync(__dirname + '/../sha256.js', 'utf8'));
const V = (process.env.CD_TEST_DIR || (__dirname + '/')) + 'vendor_pdfjs/x/package/legacy/build/';
let bad = 0;
const cases = [Buffer.alloc(0), Buffer.from('abc'), Buffer.alloc(55, 1), Buffer.alloc(56, 2), Buffer.alloc(63, 3), Buffer.alloc(64, 4), Buffer.alloc(119, 5), crypto.randomBytes(1000), fs.readFileSync(V + 'pdf.min.js'), fs.readFileSync(V + 'pdf.worker.min.js')];
for (const c of cases) { const a = sha256(c), e = crypto.createHash('sha256').update(c).digest('hex'); if (a !== e) { bad++; console.log('MISMATCH', c.length, a, e); } }
const t0 = Date.now(); const w = sha256(fs.readFileSync(V + 'pdf.worker.min.js'));
console.log(bad ? bad + ' wrong' : 'all ' + cases.length + ' match', '| worker', w.slice(0, 12), 'in', Date.now() - t0, 'ms');
