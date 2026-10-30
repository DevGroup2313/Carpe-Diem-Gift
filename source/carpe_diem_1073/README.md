# Carpe Diem 1073: how this build was made

Rooms in windows of their own, as the owner asked: side by side with Carpe Diem, and each room its own on the Dock and
the taskbar, under its own name and icon. Word and PDF files offer Tabula under Open With.

* **Page** (`p_rooms.py`, the menu of a room's floating window, block `cd-windows-1059`): in the Mac and Windows apps,
  "Side by side with Carpe Diem" asks the app for the room's own window beside Carpe Diem's (`open_app(room, address,
  "beside")`), and "Its own window, on the Dock" (Mac) or "on the taskbar" (Windows) for a window of its own
  (`"own"`), then `room_to_dock(room)`. The split inside Carpe Diem's window stays where no second window exists (a
  browser, the tablet, the phone) and is offered on the desktop only to leave a split already on. An app older than
  1073 is asked without the mode. The Dock's and taskbar's notices have a box of their own for 12 s (closing the
  floating window says "Saved" a moment later in the page's own notice).
* **Mac** (`carpe_diem_app.py`): `open_app(..., "beside")` tabs the room's window into Carpe Diem's ("Carpe Diem |
  Tabula" across the top; the owner's "true side by side"); `"own"` gives it a tabbing name of its own with tabbing
  disallowed, and takes it out of Carpe Diem's tabs if it was there. Carpe Diem makes the rooms' own apps in
  `~/Applications/Carpe Diem Rooms` eight seconds after it starts (`make_room_apps`): each an AppleScript applet made by
  the Mac's `osacompile`, with its own name, identifier (`com.yannieforest.carpediem.room.<room>`), icon
  (`rooms/<room>.icns`, also set as the app's custom icon so macOS 26 shows it as drawn), `LSUIElement`, signed ad hoc and
  registered with Launch Services. It asks Carpe Diem for `carpediem://room/<room>` (the copy that made it, by its path,
  else any by its identifier). Tabula's declares Word and PDF (`Alternate`) and hands each file on after the room; Carpe
  Diem itself no longer declares them, so Open With says Tabula. The apps are remade, in place, only when they change
  (`CDRoomApp`: their kind, Carpe Diem's place, the icon), so the Dock keeps them. Carpe Diem declares the `carpediem`
  scheme (`CFBundleURLTypes`); a room asked for at start (argv) or later (the delegate's `application:openURLs:`) opens
  in a window of its own once Carpe Diem's page has its address, and when Carpe Diem was started for the room alone its
  own window is minimised. `room_to_dock` adds the room's app to `com.apple.dock persistent-apps` once and restarts the
  Dock. With no window of its own this run (the safety rule, one window only), the room opens in Carpe Diem's window.
  `--make-room-apps` and `--room-to-dock <room>` do the same from the command line and end (GitHub's check).
* **Windows** (`carpe_diem_app.py`, `build/carpe_diem.iss`): every room's window gets the room's own taskbar identity
  through `SHGetPropertyStoreForWindow` (`System.AppUserModel.ID` `com.yannieforest.carpediem.<room>`, set last, after
  `RelaunchCommand` `"Carpe Diem.exe" --room <room>`, `RelaunchDisplayNameResource` and `RelaunchIconResource`), so it has
  its own button, with its own icon and its name when the pointer rests on it, and Pin to taskbar keeps it; and the room's
  icon (`Form.Icon`, up to 40 px, so the taskbar shows the plain key). `"beside"` sets Carpe Diem on the left half of
  the screen's work area and the room on the right (the frames' invisible edges allowed for). The installer gives each
  room's shortcuts its own icon (`{app}\rooms\<room>.ico`) and identity, and Open With "Tabula" with Tabula's icon,
  opening the file in Tabula's own window (`--room tabula "%1"`). A room's shortcut used while Carpe Diem was closed
  opened the room only after two minutes (from 1063 on, it waited for an address the Windows window never has); it now
  opens as soon as the page has loaded, and Carpe Diem's own window is minimised.
* **Both**: a file that comes with a request for Tabula's own window waits for that window (90 s at most), and the
  record says which window took it.
* **Icons** (`icons/render.js`, `icons/make_icons.py`): drawn by Chromium from each room's own key (stone colours, gold
  rim, glitter, serif name; Scriba's and Fontes's glyphs). At 16 to 40 px (the taskbar, title bars, lists, Open With)
  the key's colours with no letter, at the owner's word, and Scriba's and Fontes's symbols, at the owner's word too.
  Windows frames under 64 px are 32-bit bitmaps, larger ones PNG; the Mac's go up to 256 px (the Dock's largest). The
  kits carry them (`p_builders.py`).

Tests here: `tests/t_rooms_menu.js <page>` (the menu with a stand-in for the Mac and Windows apps' API, English and
French, and in a browser); `tests/t_mac_rooms.py <Mac program>` (room links, the launcher's script, rooms asked before
and after Carpe Diem's window shows, one window only); `tests/t_mac_apps.py <Mac program>` (the room apps made with
stand-ins for `osacompile`, `codesign`, `lsregister` and `defaults`: five apps, their Info.plist, nothing remade on a
second start, remade in place when Carpe Diem moves, no hidden App Translocation path, the Dock once, a file waiting for
Tabula's own window). 1072's `t_host_pull.js` passes with both programs. On GitHub: the Mac build makes the room apps,
checks that Open With offers Tabula and not Carpe Diem for a Word file and a PDF, opens Abacus from its own app while
Carpe Diem is closed, opens a Word file with Tabula while it is open (Tabula's own window must take it), and keeps
Fontes in the Dock once; the Windows build checks each room shortcut's icon, Tabula's taskbar identity, Open With's name
and command (a PDF must reach Tabula's own window), and a room's shortcut while Carpe Diem is closed (within 75 s).
