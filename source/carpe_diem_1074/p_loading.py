"""1074 · the loading page: the Forge's and Ingenium's own, the seal in its turning circle, in Carpe Diem's colours.

The owner's words (30 October 2026): "I want full and exact replica with the Forge's and Ingenium's loading circle page
when I first open the app but under Carpe Diem's colours and seal logo so that it is customised to Carpe Diem."

The Forge's loading page (#forge-boot, pass 643) and Ingenium's (#ing-boot) are one design: the app's seal, 104 points
across, in a ring that turns once every 1.15 seconds; the app's name below it; "Getting ready. The page is still being
painted; nothing has crashed."; a bar with how much of the page is painted, and the share in figures; after fifteen
seconds a word that it is taking longer than usual, and when nothing has moved for a while, Refresh and Keep waiting.
Carpe Diem's own loading page (passes 1047 to 1060) is made that page, element for element and rule for rule:

* the seal is Carpe Diem's own, the day seal or the night seal as Carpe Diem will open (drawn at 208 pixels from the
  seal of the page itself, so it stays sharp on a double-density screen), in place of the Forge's anvil or Ingenium's
  star;
* the ring and the bar are Carpe Diem's blue (#1B6B93; by night #5BAEDB) where the Forge's are gold and Ingenium's
  violet; Refresh is Carpe Diem's blue key with the seal's gold edge; the focus ring is the seal's gold;
* the name is Carpe Diem's, in Carpe Diem's serif;
* the page's ground stays Carpe Diem's (the folio paper in the folio look, by day or by night), which the Mac and
  Windows apps also give their windows while the page loads;
* Carpe Diem's words stay, in English and in French: the bar's phases (the page painted, the desk set out, almost
  ready), the share painted, the word after Refresh, the word when the page is painted but has not opened.

What the old loading page did, the new one does: it is the same element (#cd-splash), which the app takes away once it
has opened, which a room's own window never shows, and which the mini Forge colours when Carpe Diem runs in its
preview; the same ids for the words and the bar; the same map of where each script begins, for the bar. The swaying
seal in three dimensions it replaces (208 KB of drawing) goes, so the page is lighter and the loading page shows sooner.
With motion kept calm, or a system that asks for less motion, the ring turns slowly (four seconds) and still turns."""
import base64, os, re

HERE = os.path.dirname(os.path.abspath(__file__))


def png(name):
    return base64.b64encode(open(os.path.join(HERE, name), "rb").read()).decode("ascii")


CSS = """#cd-splash{position:fixed;top:0;right:0;bottom:0;left:0;z-index:99999;display:flex;align-items:center;justify-content:center;
  padding:16px;box-sizing:border-box;background:var(--cd-splash-bg,#f5f5f7);color:var(--cd-splash-fg,#28303a);
  font:15px/1.5 -apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",Helvetica,Arial,sans-serif;transition:opacity .3s ease,visibility .3s}
#cd-splash .cdb-card{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;max-width:440px;text-align:center;opacity:0;animation:cdbIn .45s ease .3s forwards}
@keyframes cdbIn{to{opacity:1}}
#cd-splash .cdb-seal{position:relative;width:104px;height:104px;margin-bottom:6px}
#cd-splash .cdb-seal img{display:block;width:104px;height:104px;border-radius:50%;filter:drop-shadow(0 2px 2px rgba(16,42,58,.22)) drop-shadow(0 8px 18px rgba(16,42,58,.18))}
#cd-splash .cdb-seal img.cdb-night,html[data-cd-splash="night"] #cd-splash .cdb-seal img.cdb-day{display:none}
html[data-cd-splash="night"] #cd-splash .cdb-seal img.cdb-night{display:block;filter:drop-shadow(0 2px 3px rgba(0,0,0,.6)) drop-shadow(0 8px 20px rgba(0,0,0,.5))}
#cd-splash .cdb-ring{position:absolute;top:-10px;right:-10px;bottom:-10px;left:-10px;border-radius:50%;border:3px solid rgba(27,107,147,.15);border-top-color:#1B6B93;
  animation:cdbSpin 1.15s linear infinite;will-change:transform}
html[data-cd-splash="night"] #cd-splash .cdb-ring{border-color:rgba(91,174,219,.16);border-top-color:#5BAEDB}
@keyframes cdbSpin{to{transform:rotate(360deg)}}
#cd-splash .cdb-name{margin:0;font:700 24px/1.15 var(--cd-serif,Georgia,"Iowan Old Style","Times New Roman",serif);letter-spacing:.04em;color:inherit}
#cd-splash .cdb-ed{margin:-6px 0 0;font:italic 400 13px/1.3 var(--cd-serif,Georgia,"Iowan Old Style","Times New Roman",serif);color:#1B6B93}
html[data-cd-splash="night"] #cd-splash .cdb-ed{color:#5BAEDB}
#cd-splash .cdb-say{margin:0;font-size:15px;color:#46545f}
html[data-cd-splash="night"] #cd-splash .cdb-say{color:#c6d4dd}
#cd-splash .cdb-bar{width:100%;max-width:280px;height:7px;border-radius:99px;background:rgba(27,107,147,.14);overflow:hidden;margin-top:4px}
html[data-cd-splash="night"] #cd-splash .cdb-bar{background:rgba(91,174,219,.15)}
#cd-splash .cdb-bar i{display:block;height:100%;width:3%;border-radius:inherit;background:linear-gradient(90deg,#3f8fb8,#1B6B93);transition:width .35s ease}
html[data-cd-splash="night"] #cd-splash .cdb-bar i{background:linear-gradient(90deg,#a6d8f0,#5BAEDB)}
#cd-splash .cdb-pct{font-size:12.5px;color:#6e7e8a;font-variant-numeric:tabular-nums;min-height:1.5em}
html[data-cd-splash="night"] #cd-splash .cdb-pct{color:#9fb2bf}
#cd-splash .cdb-more{margin:4px 0 0;font-size:14px;line-height:1.55;color:#46545f}
html[data-cd-splash="night"] #cd-splash .cdb-more{color:#c6d4dd}
#cd-splash .cdb-keys{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:6px}
#cd-splash .cdb-keys[hidden],#cd-splash .cdb-more[hidden]{display:none}
#cd-splash .cdb-key{font:600 14px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;padding:11px 18px;border-radius:12px;cursor:pointer;
  border:1px solid rgba(40,48,58,.14);background:linear-gradient(180deg,#ffffff,#eceef0);color:#28303a;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.95),0 2px 0 rgba(40,48,58,.18),0 4px 10px rgba(16,24,32,.12);transition:transform .25s cubic-bezier(.34,1.35,.64,1),box-shadow .25s}
#cd-splash .cdb-key.cdb-main{border-color:#124c69;color:#fff;background:linear-gradient(180deg,#2a7fa9 0%,#1B6B93 60%,#155777 100%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 2px 0 #0f4560,0 5px 12px rgba(16,42,58,.3),0 0 0 1px rgba(201,162,74,.3)}
#cd-splash .cdb-key:hover{transform:translateY(-1px)}
#cd-splash .cdb-key:active{transform:translateY(1px);box-shadow:inset 0 1px 2px rgba(0,0,0,.14),0 1px 0 rgba(0,0,0,.2)}
#cd-splash .cdb-key:focus-visible{outline:3px solid #c9a24a;outline-offset:2px}
html[data-cd-splash="night"] #cd-splash .cdb-key:not(.cdb-main){background:linear-gradient(180deg,#1f2a36,#141c25);color:#e8eef5;border-color:rgba(255,255,255,.1);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 2px 0 rgba(0,0,0,.5),0 4px 10px rgba(0,0,0,.35)}
html[data-cd-splash-still] #cd-splash .cdb-ring{animation-duration:4s}
@media (prefers-reduced-motion:reduce){#cd-splash .cdb-card{animation:none;opacity:1}#cd-splash .cdb-ring{animation-duration:4s}#cd-splash{transition:none}}
@media print{#cd-splash{display:none}}"""

HTML = """<div id="cd-splash" aria-busy="true" style="position:fixed;inset:0;z-index:99999;background:var(--cd-splash-bg,#f5f5f7);">
<style id="cd-boot-1074">
%(css)s
</style>
<div class="cdb-card">
  <div class="cdb-seal"><img class="cdb-day" alt="" width="104" height="104" src="data:image/png;base64,%(day)s"><img class="cdb-night" alt="" width="104" height="104" src="data:image/png;base64,%(night)s"><span class="cdb-ring" aria-hidden="true"></span></div>
  <h1 class="cdb-name">Carpe Diem</h1>
  <p class="cdb-say" id="cds-say">Getting ready. The page is still being painted; nothing has crashed.</p>
  <div class="cdb-bar" role="progressbar" aria-label="How much of the page is painted" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="cds-bar"></i></div>
  <div class="cdb-pct" id="cds-pct" aria-hidden="true"></div>
  <p class="cdb-more" id="cds-more" role="status" hidden></p>
  <div class="cdb-keys" id="cds-keys" hidden><button type="button" class="cdb-key cdb-main" id="cds-refresh">Refresh</button><button type="button" class="cdb-key" id="cds-wait">Keep waiting</button></div>
</div>
</div>
"""

JS = """<script id="cd-boot-1074-js">
(function () {
  'use strict';
  var sp = document.getElementById('cd-splash'); if (!sp) return;
  function $(id) { return document.getElementById(id); }
  var MAP = /*CD_BOOT_MAP*/[], T0 = Date.now(), last = -1, lastMove = Date.now(), stage = 0, seg = -1, segAt = Date.now(), done = false, loadAt = 0, fr = false;
  try { var st = JSON.parse(localStorage.getItem('carpe_diem_offline_v1') || 'null') || {}; fr = st.lang === 'fr' || document.documentElement.lang === 'fr'; } catch (e) {}
  function T(en, f) { return fr ? f : en; }
  var again = false; try { again = !!sessionStorage.getItem('cd_refresh_at'); sessionStorage.removeItem('cd_refresh_at'); } catch (e) {}
  $('cds-say').textContent = again ? T('Starting again after Refresh. Your work is saved; the page is being painted.', 'Nouveau départ après Actualiser. Votre travail est enregistré ; la page se dessine.')
                                   : T('Getting ready. The page is still being painted; nothing has crashed.', 'Préparation en cours. La page se dessine encore ; rien ne s’est arrêté.');
  $('cds-refresh').textContent = T('Refresh', 'Actualiser'); $('cds-wait').textContent = T('Keep waiting', 'Patienter encore');
  var track = sp.querySelector('.cdb-bar');
  try { track.setAttribute('aria-label', T('How much of the page is painted', 'Part de la page déjà dessinée')); } catch (e) {}
  try { window.addEventListener('load', function () { loadAt = Date.now(); to(2, 'Almost ready.', 'Presque prête.'); }); } catch (e) {}
  var phase = 0, phaseAt = Date.now();
  function parsed() {
    var n = document.scripts.length, k = Math.max(0, Math.min(MAP.length - 1, n - 1));
    if (!MAP.length) return Math.min(.9, n / 300);
    if (k !== seg) { seg = k; segAt = Date.now(); }
    var a = MAP[k] / 1000, z = (k + 1 < MAP.length ? MAP[k + 1] : 1000) / 1000, s = (Date.now() - segAt) / 1000;
    return a + (z - a) * 0.85 * (1 - Math.exp(-s / 4));
  }
  function frac() {
    if (phase === 0) return 0.7 * parsed();
    var a = phase === 1 ? 0.7 : 0.86, z = phase === 1 ? 0.86 : 0.97, s = (Date.now() - phaseAt) / 1000;
    return a + (z - a) * (1 - Math.exp(-s / 2.5));
  }
  function to(n, en, f) { if (phase >= n) return; phase = n; phaseAt = Date.now(); if (!again || n > 1) { var e = $('cds-say'); if (e) e.textContent = T(en, f); } }
  window.__cdSplashTo = to;
  try { document.addEventListener('DOMContentLoaded', function () { to(1, 'Setting out your desk: the rooms, your work and today’s plan.', 'Mise en place du bureau : les pièces, votre travail et le programme du jour.'); }); } catch (e) {}
  function show(pc) {
    var b = $('cds-bar'); if (b) b.style.width = pc + '%';
    try { track.setAttribute('aria-valuenow', String(pc)); } catch (e) {}
    var t = $('cds-pct'); if (t) t.textContent = pc >= 100 ? T('Ready', 'Prête') : T(pc + '% painted', pc + ' % dessinée');
  }
  function say(t, keys) { var m = $('cds-more'); if (m) { m.hidden = false; m.textContent = t; } var k = $('cds-keys'); if (k) k.hidden = !keys; }
  function gone() { return !sp.parentNode || sp.style.opacity === '0'; }
  function tick() {
    if (done) return;
    if (gone()) { done = true; show(100); try { sp.setAttribute('aria-busy', 'false'); } catch (e) {} return; }
    var pc = Math.max(3, Math.min(97, Math.round(frac() * 100)));
    if (pc > last) { last = pc; lastMove = Date.now(); show(pc); }
    var s = (Date.now() - T0) / 1000;
    if (stage < 1 && s > 15) { stage = 1; say(T('This is taking longer than usual. A large page paints slowly on a tablet or a phone, and the first start after an update is the slowest. It is still working.', 'Cela prend plus de temps que d’habitude. Une grande page se dessine lentement sur une tablette ou un téléphone, et le premier démarrage après une mise à jour est le plus lent. Elle travaille toujours.'), false); }
    if (stage < 2 && s > 45 && Date.now() - lastMove > 20000) { stage = 2; say(T('Nothing has moved for a while. You can keep waiting, or press Refresh to start Carpe Diem again. Your saved work stays where it is.', 'Rien n’a bougé depuis un moment. Vous pouvez patienter encore, ou appuyer sur Actualiser pour relancer Carpe Diem. Votre travail enregistré reste où il est.'), true); }
    if (loadAt && Date.now() - loadAt > 20000 && !gone()) { stage = 2; say(T('The page is painted, but it has not opened. Press Refresh to start Carpe Diem again; your saved work stays where it is.', 'La page est dessinée, mais ne s’est pas ouverte. Appuyez sur Actualiser pour relancer Carpe Diem ; votre travail enregistré reste où il est.'), true); loadAt = 0; }
    setTimeout(tick, 250);
  }
  $('cds-refresh').onclick = function () { try { sessionStorage.setItem('cd_refresh_at', String(Date.now())); } catch (e) {} try { location.reload(); } catch (e) { location.href = location.href; } };
  $('cds-wait').onclick = function () { stage = 1; lastMove = Date.now(); say(T('Still working. Thank you for waiting.', 'Toujours au travail. Merci de patienter.'), false); };
  tick();
})();
</script>"""


def apply(p, full):
    s, out = p.s, 0
    # the old page's own rules in the head (the seal by day and by night, and its layers in three dimensions)
    for bid in ("cd-splash-1047", "cd-splash-layered"):
        a, b = p.block(bid)
        if "cdspl3" not in s[a:b] and "cd-splash-day" not in s[a:b]:
            raise SystemExit("%s is not the old loading page's" % bid)
        s = s[:a] + s[b:]
        p.s = s
        out += b - a
    # the old loading page itself, and its script
    i = s.find('<div id="cd-splash" ')
    if i < 0 or s.count('<div id="cd-splash" ') != 1:
        raise SystemExit("the loading page was not found once")
    j = s.find('<script id="cd-1060-splash">', i)
    if j < 0 or s.count('<script id="cd-1060-splash">') != 1:
        raise SystemExit("the loading page's script was not found once")
    # the old page ends with its pulse's rule; in the two demonstrations a script that puts "The Demo" in French
    # stands between it and the page's own script, and stays
    endmark = "<style>@keyframes cdpulse{0%,100%{opacity:.25;transform:scaleX(.45)}50%{opacity:.75;transform:scaleX(1)}}</style></div>"
    e = s.find(endmark, i)
    if e < 0 or e > j or s.count(endmark) != 1:
        raise SystemExit("the old loading page does not end where expected")
    e += len(endmark)
    old, between = s[i:e], s[e:j]
    for must, times in (('id="cds-say"', 1), ('id="cds-keys"', 1), ('id="cd-splash-bar"', 1), ('class="cdspl3"', 2), ('CARPE DIEM</div>', 1)):
        if old.count(must) != times:
            raise SystemExit("the old loading page: %s found %d times" % (must, old.count(must)))
    if between.strip() and not re.fullmatch(r'\s*<script id="cd-splash-lang-973">.*?</script>\s*', between, re.S):
        raise SystemExit("something unexpected stands between the loading page and its script")
    k = s.find("</script>", j) + len("</script>")
    if s[j:k].count("/*CD_BOOT_MAP*/") != 1:
        raise SystemExit("the boot map is not in the old script")
    # the edition's own store holds its language (the demonstrations keep theirs apart from the owner's edition)
    m = re.search(r'STORAGE_KEY = "([a-z0-9_]+)"', s)
    if not m:
        raise SystemExit("the page's store was not found")
    html = HTML % {"css": CSS, "day": png("boot_seal_day.png"), "night": png("boot_seal_night.png")}
    if 'id="cd-splash-demo"' in old:
        # the demonstrations say so under the name, as before (in French by the script that follows)
        html = html.replace('<h1 class="cdb-name">Carpe Diem</h1>', '<h1 class="cdb-name">Carpe Diem</h1>\n  <p class="cdb-ed" id="cd-splash-demo">The Demo</p>')
    js = JS.replace("localStorage.getItem('carpe_diem_offline_v1')", "localStorage.getItem('%s')" % m.group(1))
    new = html + between.strip("\n") + ("\n" if between.strip() else "") + js
    p.s = s[:i] + new + s[k:]
    left = [w for w in ("cdspl3", "cd-splash-day", "cd-splash-night", "cd-1060-splash-css", "cd-splash-bar", "cdpulse")
            if w in p.s]
    if left:
        raise SystemExit("left of the old loading page: %s" % left)
    if p.s.count("/*CD_BOOT_MAP*/") != 1:
        raise SystemExit("the boot map mark must be in the page once")
    print("    loading page: the seal in its turning circle; %d bytes of the old page out, %d in" % (out + k - i, len(new)))
