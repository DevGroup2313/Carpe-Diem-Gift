"""1073 · a room's window, as the owner asked: side by side with Carpe Diem, and its own window on the Dock or taskbar.

The owner: "Side by side with Carpe Diem" only split Carpe Diem's own window (pointless: the floating window was already
there), while "Open in its own window on this device" gave the true side by side, which they want to keep; and the
rooms' own windows were no longer on the Dock. In the Mac and Windows apps the menu of a room's floating window now
offers:

* "Side by side with Carpe Diem": the room in a window of its own beside Carpe Diem's (on the Mac as a tab of Carpe
  Diem's window, "Carpe Diem | Tabula" across the top; on Windows, Carpe Diem on the left half of the screen and the
  room on the right).
* "Its own window, on the Dock" (Mac) or "on the taskbar" (Windows): the room in a window of its own, apart from Carpe
  Diem's; on the Mac the room's own app (its own name and icon) goes in the Dock, and opens it from there; on Windows
  the window has its own taskbar button (its icon, its name when the pointer rests on it), which Pin to taskbar keeps.
* "Fill the screen" and "Close the window", as before.

The split inside Carpe Diem's window stays where no second window exists (a browser, the tablet, the phone)."""

OLD_OPTS = """    var OWN = T('⧉ Open in its own window on this device', '⧉ Ouvrir dans sa propre fenêtre sur cet appareil');
    var MAC = /Macintosh|Mac OS X/.test(navigator.userAgent || '') && !/iPhone|iPad/.test(navigator.userAgent || '');
    if (isMain && h === 'desktop') opt(OWN,
      MAC ? T(name + ' in a window of its own, as a tab beside Carpe Diem at the top of the window, with the same work, the side buttons, the notes and the Clepsydra.', name + ' dans sa propre fenêtre, en onglet à côté de Carpe Diem en haut de la fenêtre, avec le même travail, les boutons de côté, les notes et la Clepsydre.')
        : T(name + ' in a window of the app, with the same work, the side buttons, the notes and the Clepsydra.', name + ' dans une fenêtre de l’application, avec le même travail, les boutons de côté, les notes et la Clepsydre.'),
      function () { ownNative(which, win); }, '', 'own-window');
    else if (isMain && h === 'browser') opt(OWN,"""

NEW_OPTS = """    var OWN = T('⧉ Open in its own window on this device', '⧉ Ouvrir dans sa propre fenêtre sur cet appareil');
    var MAC = /Macintosh|Mac OS X/.test(navigator.userAgent || '') && !/iPhone|iPad/.test(navigator.userAgent || '');
    // build 1073, at the owner's word: in the Mac and Windows apps, side by side with Carpe Diem is the room in a window
    // of its own beside Carpe Diem's, and the room's own window can be kept on the Dock or the taskbar
    var native = isMain && h === 'desktop';
    if (native) {
      opt(T('◧ Side by side with Carpe Diem', '◧ Côte à côte avec Carpe Diem'),
        MAC ? T(name + ' beside Carpe Diem in a window of its own, which shares Carpe Diem’s window as a tab: “Carpe Diem | ' + name + '” across the top. The same work, the side buttons, the notes and the Clepsydra.',
                name + ' à côté de Carpe Diem dans sa propre fenêtre, qui partage la fenêtre de Carpe Diem en onglet : « Carpe Diem | ' + name + ' » en haut. Le même travail, les boutons de côté, les notes et la Clepsydre.')
          : T('Carpe Diem on the left half of the screen and ' + name + ' in a window of its own on the right half. The same work, the side buttons, the notes and the Clepsydra.',
              'Carpe Diem sur la moitié gauche de l’écran et ' + name + ' dans sa propre fenêtre sur la moitié droite. Le même travail, les boutons de côté, les notes et la Clepsydre.'),
        function () { ownNative(which, win, 'beside'); }, '', 'side-by-side');
      opt(MAC ? T('⧉ Its own window, on the Dock', '⧉ Sa propre fenêtre, dans le Dock') : T('⧉ Its own window, on the taskbar', '⧉ Sa propre fenêtre, dans la barre des tâches'),
        MAC ? T(name + ' in a window of its own, apart from Carpe Diem’s, with the same work. ' + name + '’s own icon goes in the Dock, to open it from there.',
                name + ' dans sa propre fenêtre, à part de celle de Carpe Diem, avec le même travail. L’icône de ' + name + ' va dans le Dock, pour l’ouvrir de là.')
          : T(name + ' in a window of its own, with the same work, and its own button on the taskbar: its icon, and its name when the pointer rests on it.',
              name + ' dans sa propre fenêtre, avec le même travail, et son propre bouton dans la barre des tâches : son icône, et son nom quand le pointeur s’y pose.'),
        function () { ownNative(which, win, 'own'); }, '', 'own-window');
    }
    else if (isMain && h === 'browser') opt(OWN,"""

OLD_SPLIT = """    if (window.cdSplit) {
      if (window.cdSplit.isOn(win)) opt("""
NEW_SPLIT = """    if (window.cdSplit && (!native || window.cdSplit.isOn(win))) {
      if (window.cdSplit.isOn(win)) opt("""

OLD_OWN = """  function ownNative(which, win) {
    var a = api(), name = NAMES[which] || which;
    if (!a || typeof a.open_app !== 'function') { ownBrowser(which, win); return; }"""
NEW_OWN = """  function ownNative(which, win, mode) {
    var a = api(), name = NAMES[which] || which;
    mode = mode === 'own' ? 'own' : 'beside';
    if (!a || typeof a.open_app !== 'function') { ownBrowser(which, win); return; }"""

OLD_DONE = """        try { if (typeof __cdClearMainFrame === 'function') __cdClearMainFrame(which); } catch (e) {}
        keepTab(which); return; }"""
NEW_DONE = """        try { if (typeof __cdClearMainFrame === 'function') __cdClearMainFrame(which); } catch (e) {}
        keepTab(which);
        if (mode === 'own') toDock(which);
        return; }"""

OLD_CALL = """    var call; try { call = a.open_app(which, base()); } catch (e) { call = Promise.reject(e); }

    Promise.resolve(call).then(done, function () { var c2; try { c2 = a.open_app(which); } catch (e) { no(); return; } Promise.resolve(c2).then(done, no); });
  }
"""
NEW_CALL = """    // the mode, then (an app older than 1073) without it, then without the address
    var call; try { call = a.open_app(which, base(), mode); } catch (e) { call = Promise.reject(e); }
    Promise.resolve(call).then(done, function () {
      var c2; try { c2 = a.open_app(which, base()); } catch (e) { c2 = Promise.reject(e); }
      Promise.resolve(c2).then(done, function () { var c3; try { c3 = a.open_app(which); } catch (e) { no(); return; } Promise.resolve(c3).then(done, no); });
    });
  }

  // build 1073: a notice of its own, long enough to read and above the page's short ones (closing the floating window
  // says "Saved" a moment later, in the same place)
  function note(en, f, once) {
    if (once) { if (said[once]) return; said[once] = 1; }
    try { var o = document.getElementById('cd-windows-say-1059'); if (o) o.remove();
      var d = document.createElement('div'); d.id = 'cd-windows-say-1059'; d.className = 'cd-win1059-say'; d.setAttribute('role', 'status');
      d.textContent = T(en, f); document.body.appendChild(d); setTimeout(function () { try { d.remove(); } catch (e) {} }, 12000); } catch (e) {}
  }

  // build 1073: the room's own window kept on the Dock (its own app, made by the Mac app) or, on Windows, how to pin its
  // own taskbar button (Windows lets no program pin itself)
  function toDock(which) {
    var a = api(), name = NAMES[which] || which;
    if (!a || typeof a.room_to_dock !== 'function') return;
    var r; try { r = a.room_to_dock(which); } catch (e) { return; }
    Promise.resolve(r).then(function (r) {
      if (!r) return;
      if (r.pin === 'by hand') {
        note('To keep ' + name + ' on the taskbar, right-click its button there and choose Pin to taskbar. From there it opens in its own window.',
          'Pour garder ' + name + ' dans la barre des tâches, faites un clic droit sur son bouton et choisissez Épingler à la barre des tâches. De là, il s’ouvre dans sa propre fenêtre.', 'pin-' + which);
        return; }
      if (r.ok && r.added) { note(name + ' is in the Dock now, with its own icon: it opens ' + name + ' in its own window. It is also in your Applications folder, in Carpe Diem Rooms.',
        name + ' est maintenant dans le Dock, avec sa propre icône : elle ouvre ' + name + ' dans sa propre fenêtre. Il est aussi dans votre dossier Applications, dans Carpe Diem Rooms.'); return; }
      if (!r.ok) note(name + ' is open in its own window, but its icon could not be put in the Dock' + (r.why ? ' (' + r.why + ').' : '.'),
        name + ' est ouvert dans sa propre fenêtre, mais son icône n’a pas pu être mise dans le Dock' + (r.why ? ' (' + r.why + ').' : '.'));
    }, function () {});
  }
"""


def apply(p, full):
    i = p.s.find('id="cd-windows-1059"')
    if i < 0 or p.s.count('id="cd-windows-1059"') != 1:
        raise SystemExit("the windows block was not found once")
    j = p.s.index("</script>", i)
    blk = p.s[i:j]
    for old, new in ((OLD_OPTS, NEW_OPTS), (OLD_SPLIT, NEW_SPLIT), (OLD_OWN, NEW_OWN), (OLD_DONE, NEW_DONE), (OLD_CALL, NEW_CALL)):
        if blk.count(old) != 1:
            raise SystemExit("rooms: %r not found once" % old[:60])
        blk = blk.replace(old, new)
    p.s = p.s[:i] + blk + p.s[j:]
