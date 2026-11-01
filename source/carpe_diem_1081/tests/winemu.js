// winemu.js: shared helpers. Windows 10 / 11 emulation as pass 1060 detects it (userAgent, userAgentData.platformVersion).
const { chromium } = require('playwright');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0';
const MACUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
function initFor(os) {
  if (os !== 'win10' && os !== 'win11') return '';
  const pv = os === 'win10' ? '10.0.0' : '15.0.0';
  return `(function(){try{var d={brands:[{brand:'Chromium',version:'130'}],mobile:false,platform:'Windows',
    getHighEntropyValues:function(h){return Promise.resolve({platform:'Windows',platformVersion:'${pv}',architecture:'x86',bitness:'64'});},
    toJSON:function(){return {platform:'Windows'};}};
    Object.defineProperty(Navigator.prototype,'userAgentData',{get:function(){return d;},configurable:true});}catch(e){}})();`;
}
async function ctxFor(b, os, opts) {
  opts = opts || {};
  const o = { viewport: { width: opts.w || 1400, height: opts.h || 900 }, deviceScaleFactor: opts.scale || 1 };
  if (os === 'win10' || os === 'win11') o.userAgent = UA; else if (os === 'mac') o.userAgent = MACUA;
  if (opts.dark) o.colorScheme = 'dark';
  const c = await b.newContext(o);
  const s = initFor(os); if (s) await c.addInitScript(s);
  return c;
}
async function boot(p, url, demo) {
  const errs = [];
  p.on('pageerror', e => errs.push(String(e && e.message || e)));
  await p.goto(url, { waitUntil: 'load', timeout: 240000 });
  await p.waitForTimeout(3000);
  await p.evaluate(() => { try { cdCloseDoor(); } catch (e) {} try { var d = document.getElementById('demo-entry'); if (d) d.remove(); } catch (e) {} });
  await p.waitForTimeout(800);
  return errs;
}
module.exports = { chromium, ctxFor, boot, UA };
