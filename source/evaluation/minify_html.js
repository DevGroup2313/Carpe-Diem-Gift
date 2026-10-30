// minify_html.js IN OUT: a page of Carpe Diem with its comments taken out and its scripts made compact (local names
// shortened, white space gone), its behaviour unchanged. Scripts that are data (a type other than JavaScript) and the
// seal's stamp are left as they are; a script that cannot be read as JavaScript is left as it is and named.
const fs = require('fs');
const { minify } = require('terser');
const [IN, OUT] = process.argv.slice(2);
const KEEP_IDS = new Set(['cd-seal-stamp-1059']);
const JS_TYPES = new Set(['', 'text/javascript', 'application/javascript', 'module']);

function attr(tag, name) {
  const m = tag.match(new RegExp('\\b' + name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i'));
  return m ? (m[2] ?? m[3] ?? m[4] ?? '') : null;
}
function stripCss(css) { return css.replace(/\/\*[\s\S]*?\*\//g, ''); }

(async () => {
  const src = fs.readFileSync(IN, 'utf8');
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>|<style\b([^>]*)>([\s\S]*?)<\/style>|<!--[\s\S]*?-->/gi;
  let out = '', last = 0, n = 0, kept = [], before = 0, after = 0, m;
  const jobs = [];
  while ((m = re.exec(src))) {
    out += src.slice(last, m.index); last = re.lastIndex;
    if (m[0].startsWith('<!--')) continue;
    if (m[3] !== undefined) { out += '<style' + m[3] + '>' + stripCss(m[4]) + '</style>'; continue; }
    const open = '<script' + m[1] + '>', body = m[2];
    const type = (attr(open, 'type') || '').trim().toLowerCase(), id = attr(open, 'id') || '';
    if (!JS_TYPES.has(type) || KEEP_IDS.has(id) || !body.trim()) { out += m[0]; continue; }
    const slot = out.length; out += '\u0000' + jobs.length + '\u0000';
    jobs.push({ open, body, id, slot });
  }
  out += src.slice(last);
  const done = [];
  for (const j of jobs) {
    try {
      const r = await minify(j.body, {
        compress: false,
        mangle: { toplevel: false },
        module: false,
        format: { comments: false, inline_script: true },
      });
      if (typeof r.code !== 'string') throw new Error('nothing came back');
      done.push(j.open + r.code + '</script>');
      before += j.body.length; after += r.code.length; n++;
    } catch (e) {
      done.push(j.open + j.body + '</script>');
      kept.push((j.id || '(no id)') + ': ' + String(e.message || e).slice(0, 120));
    }
  }
  out = out.replace(/\u0000(\d+)\u0000/g, (_, k) => done[+k]);
  fs.writeFileSync(OUT, out);
  console.log(JSON.stringify({ scripts: n, from: before, to: after, page: [src.length, out.length], kept }));
})();
