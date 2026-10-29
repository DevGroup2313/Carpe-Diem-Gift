# Carpe Diem 1063: how this build was made

`cd1063.py` applies build 1063 to each edition's 1062 page:

* `p_speed.py`: the timer governor (pass 4xx) also rests while the page is only being read: after twenty seconds with no
  key, pointer or touch, or while the window is not in front, the governed background checks run one tick in three; the
  first touch brings them back. A running Clepsydra (`pomo.running`) or a two-minute start is never slowed. Measured:
  621 ms of interval work in twenty idle seconds before, 259 ms after (`../carpe_diem_1060/tests/idle.js`).
* `p_builders.py`: the kits say 1063 and carry the repository's new Windows program and installer.
* `p_minforge.trust`: the mini Forge knows this build as the owner's own.

Outside the page, in this repository:

* `Windows project/carpe_diem_app.py`: its own AppUserModelID (`com.yannieforest.carpediem`), one copy at a time (a named
  mutex; a second start brings the window forward), `--room tabula|abacus|slides|scriba|fontes` (a second start leaves
  the room in `%LOCALAPPDATA%\CarpeDiem\open-room.txt` for the open copy), and the page loaded again when its process
  stops (WebView2 ProcessFailed), all on the pattern of The Forge's Windows program.
* `Windows project/build/carpe_diem.iss`: The Forge's installer pattern (clean updates, graceful uninstall, WebView2 page,
  mended old shortcuts, the antivirus check, three backups kept) and the five rooms in the Start menu.
* `.github/workflows/build-windows-app.yml`: also checks the five shortcuts, one copy at a time and Tabula's shortcut,
  and publishes the installer as `carpe-diem-windows-setup.exe` too.
* `.github/workflows/build-kits.yml` with `.github/kits/make_kits.js`: the six install kits and the standalone page, made
  by the page itself (`cdBuild.make`) in a headless browser, on the Releases page as "Carpe Diem install kits".

`release.py` with `notes.json` writes the build's record into the four repositories (from 1063 on).
