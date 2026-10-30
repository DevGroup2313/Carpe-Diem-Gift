// lock_page.js IN.html OUT.html CODE SEAL.png "Recipient" COPY [UNTIL]: an evaluation copy sealed under an access code.
// The page is compressed (gzip) and sealed (AES-256-GCM, its key made from the code by PBKDF2-SHA-256, 600,000 rounds);
// what is sent holds only the seal, a small door that asks for the code, and the sealed page. With the code the page
// opens in place, as if opened itself; without it nothing of the page can be read. The code is remembered on the device
// once given, so Refresh and a room's own window open without asking again.
const fs = require('fs'), zlib = require('zlib');
const { webcrypto } = require('crypto');
const [IN, OUT, CODE, SEAL, WHO, COPY, UNTIL] = process.argv.slice(2);
const norm = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const js = t => JSON.stringify(String(t)).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
(async () => {
  const page = fs.readFileSync(IN);
  const packed = zlib.gzipSync(page, { level: 9 });
  const salt = webcrypto.getRandomValues(new Uint8Array(16)), iv = webcrypto.getRandomValues(new Uint8Array(12)), iter = 600000;
  const head = new Uint8Array(37);
  head.set([67, 68, 76, 75], 0); head[4] = 1; head[5] = iter >>> 24 & 255; head[6] = iter >>> 16 & 255; head[7] = iter >>> 8 & 255; head[8] = iter & 255;
  head.set(salt, 9); head.set(iv, 25);
  const base = await webcrypto.subtle.importKey('raw', new TextEncoder().encode(norm(CODE)), 'PBKDF2', false, ['deriveKey']);
  const key = await webcrypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const ct = new Uint8Array(await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: head }, key, packed));
  const all = Buffer.concat([Buffer.from(head), Buffer.from(ct)]);
  const seal = fs.readFileSync(SEAL).toString('base64');
  const door = fs.readFileSync(__dirname + '/lock_door.html', 'utf8')
    .split('%SEAL%').join(seal)
    .split('%WHO_JS%').join(js(WHO || ''))
    .split('%COPY_JS%').join(js(COPY || ''))
    .split('%UNTIL_JS%').join(js(UNTIL || ''))
    .split('%PAYLOAD%').join(all.toString('base64'));
  fs.writeFileSync(OUT, door);
  console.log(JSON.stringify({ page: page.length, packed: packed.length, out: door.length }));
})();
