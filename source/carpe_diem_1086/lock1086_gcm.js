/* AES-256-GCM done in the page itself, for the moments the browser's own cryptography cannot wait for (a value read
   while the page starts, a last save as the window closes). The block cipher is Ingenium's (pass r197); GCM's
   authentication tag is checked before a single byte is given back. */
function cdGcm(keyBytes) {
  var rk = expandKey(keyBytes), Hb = new Uint8Array(16), Z = new Uint8Array(16); encBlock(rk, Z, 0, Hb, 0);
  function words(b) { return [((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0, ((b[4] << 24) | (b[5] << 16) | (b[6] << 8) | b[7]) >>> 0, ((b[8] << 24) | (b[9] << 16) | (b[10] << 8) | b[11]) >>> 0, ((b[12] << 24) | (b[13] << 16) | (b[14] << 8) | b[15]) >>> 0]; }
  function shr1(v) { var lsb = v[3] & 1; v[3] = ((v[3] >>> 1) | (v[2] << 31)) >>> 0; v[2] = ((v[2] >>> 1) | (v[1] << 31)) >>> 0; v[1] = ((v[1] >>> 1) | (v[0] << 31)) >>> 0; v[0] = v[0] >>> 1; if (lsb) v[0] = (v[0] ^ 0xE1000000) >>> 0; return v; }
  var M = [], R = new Uint32Array(16), i; M[0] = [0, 0, 0, 0]; M[8] = words(Hb); M[4] = shr1(M[8].slice()); M[2] = shr1(M[4].slice()); M[1] = shr1(M[2].slice());
  for (i = 3; i < 16; i++) { if (M[i]) continue; var lb = i & -i, a = M[i ^ lb], b = M[lb]; M[i] = [(a[0] ^ b[0]) >>> 0, (a[1] ^ b[1]) >>> 0, (a[2] ^ b[2]) >>> 0, (a[3] ^ b[3]) >>> 0]; }
  for (i = 0; i < 16; i++) { var v = [0, 0, 0, i]; shr1(v); shr1(v); shr1(v); shr1(v); R[i] = v[0]; }
  function mulH(y) {
    var z0 = 0, z1 = 0, z2 = 0, z3 = 0, j, m, rem, bt;
    for (j = 15; j >= 0; j--) {
      bt = (y[j >> 2] >>> ((3 - (j & 3)) * 8)) & 255;
      rem = z3 & 15; z3 = ((z3 >>> 4) | (z2 << 28)) >>> 0; z2 = ((z2 >>> 4) | (z1 << 28)) >>> 0; z1 = ((z1 >>> 4) | (z0 << 28)) >>> 0; z0 = ((z0 >>> 4) ^ R[rem]) >>> 0; m = M[bt & 15]; z0 = (z0 ^ m[0]) >>> 0; z1 = (z1 ^ m[1]) >>> 0; z2 = (z2 ^ m[2]) >>> 0; z3 = (z3 ^ m[3]) >>> 0;
      rem = z3 & 15; z3 = ((z3 >>> 4) | (z2 << 28)) >>> 0; z2 = ((z2 >>> 4) | (z1 << 28)) >>> 0; z1 = ((z1 >>> 4) | (z0 << 28)) >>> 0; z0 = ((z0 >>> 4) ^ R[rem]) >>> 0; m = M[bt >>> 4]; z0 = (z0 ^ m[0]) >>> 0; z1 = (z1 ^ m[1]) >>> 0; z2 = (z2 ^ m[2]) >>> 0; z3 = (z3 ^ m[3]) >>> 0;
    }
    y[0] = z0; y[1] = z1; y[2] = z2; y[3] = z3;
  }
  function ghashAdd(y, buf) {
    var n = buf.length, full = n - (n % 16), k = 0;
    for (; k < full; k += 16) {
      y[0] = (y[0] ^ (((buf[k] << 24) | (buf[k + 1] << 16) | (buf[k + 2] << 8) | buf[k + 3]) >>> 0)) >>> 0; y[1] = (y[1] ^ (((buf[k + 4] << 24) | (buf[k + 5] << 16) | (buf[k + 6] << 8) | buf[k + 7]) >>> 0)) >>> 0;
      y[2] = (y[2] ^ (((buf[k + 8] << 24) | (buf[k + 9] << 16) | (buf[k + 10] << 8) | buf[k + 11]) >>> 0)) >>> 0; y[3] = (y[3] ^ (((buf[k + 12] << 24) | (buf[k + 13] << 16) | (buf[k + 14] << 8) | buf[k + 15]) >>> 0)) >>> 0; mulH(y);
    }
    if (k < n) { var last = new Uint8Array(16); last.set(buf.subarray(k)); var w = words(last); y[0] = (y[0] ^ w[0]) >>> 0; y[1] = (y[1] ^ w[1]) >>> 0; y[2] = (y[2] ^ w[2]) >>> 0; y[3] = (y[3] ^ w[3]) >>> 0; mulH(y); }
  }
  function ctr(iv, n) { var j = new Uint8Array(16); j.set(iv); j[12] = (n >>> 24) & 255; j[13] = (n >>> 16) & 255; j[14] = (n >>> 8) & 255; j[15] = n & 255; return j; }
  function crypt(iv, src, n, out) { var ks = new Uint8Array(16), c = 2, k = 0, i; for (; k < n; k += 16) { encBlock(rk, ctr(iv, c++), 0, ks, 0); var e = Math.min(16, n - k); for (i = 0; i < e; i++) out[k + i] = src[k + i] ^ ks[i]; } }
  function tag(iv, aad, ct) {
    var y = [0, 0, 0, 0]; ghashAdd(y, aad); ghashAdd(y, ct);
    var la = aad.length * 8, lc = ct.length * 8; y[0] = (y[0] ^ Math.floor(la / 4294967296)) >>> 0; y[1] = (y[1] ^ (la >>> 0)) >>> 0; y[2] = (y[2] ^ Math.floor(lc / 4294967296)) >>> 0; y[3] = (y[3] ^ (lc >>> 0)) >>> 0; mulH(y);
    var ks = new Uint8Array(16); encBlock(rk, ctr(iv, 1), 0, ks, 0); var t = new Uint8Array(16);
    for (var i = 0; i < 4; i++) { var v = (y[i] ^ (((ks[4 * i] << 24) | (ks[4 * i + 1] << 16) | (ks[4 * i + 2] << 8) | ks[4 * i + 3]) >>> 0)) >>> 0; t[4 * i] = v >>> 24; t[4 * i + 1] = (v >>> 16) & 255; t[4 * i + 2] = (v >>> 8) & 255; t[4 * i + 3] = v & 255; }
    return t;
  }
  function seal(iv, aad, pt) { var n = pt.length, out = new Uint8Array(n + 16); crypt(iv, pt, n, out); out.set(tag(iv, aad, out.subarray(0, n)), n); return out; }
  function open(iv, aad, sealed) {
    if (sealed.length < 16) throw new Error('short');
    var n = sealed.length - 16, ct = sealed.subarray(0, n), want = sealed.subarray(n), got = tag(iv, aad, ct), d = 0;
    for (var i = 0; i < 16; i++) d |= want[i] ^ got[i];
    if (d) throw new Error('tag');
    var out = new Uint8Array(n); crypt(iv, ct, n, out); return out;
  }
  return { seal: seal, open: open };
}
