# Carpe Diem 1065: how this build was made

The owner, 30 October 2026: "The app refresh button is in the wrong location, it needs to be in inside of the Display
panel like it is on Ingenium and the Forge and the introduction door lost its sound for when I click open the app."

`p_regress.py`, applied to each edition by `cd1065.py`:

* Refresh: the ↻ key 1060 put in the top bar is gone. As in Ingenium and The Forge, Refresh is the first row of the
  Display panel, inside its title block (the panel's sorting leaves it first), drawn as the panel's rows are: label,
  one `cd-seg` key ("Refresh the app"), tip. It refreshes at once, the work of every open room saved first, and asks
  only while the Clepsydra runs. F5 and Ctrl+Shift+R (Command+Shift+R) still refresh.
* The door's chime: the sound module (`cd-sound-675`) rings the day's chime once a page, when the door opens or, on a
  day without the door, at the first touch. A touch while the loading page was still up was taken for that first touch,
  so the chime rang under the loading page and the door then opened in silence. `doorAhead()` now leaves the chime to
  the door while the loading page is up and until the door has been decided (`cd-1065-door` marks the moment
  `cdMaybeShowDoor` has run). Test: `node tests/t_door_chime.js cd1065.html 2500` (a click 2.5 s into the start, then
  the door's seal: four tones; 1064 gave none).
* `window.cdNewBuildInstalled(build)`: the card the Mac app asks for when a newer Carpe Diem has been put in its place.

The Mac program (`carpe_diem_app.py`):

* `_older_copies_step_aside`: a Carpe Diem left open keeps the app's address, so a new one starting beside it would show
  the open one's page (the owner saw 1059 after installing 1062 and 1063). Every other running Carpe Diem is asked to
  quit, as Quit in its Dock menu asks (NSRunningApplication terminate), and the start waits for the address; one that
  will not quit is named in a message and this start ends rather than show another build's page.
* `_watch_for_newer_build` / `_restart_into_new_build`: a copy that is open when a newer one is put in its place (where
  macOS may simply bring the open copy forward) offers a restart into it.
* `_clean_quit_ends_session`: Quit ended the app without returning to `main()`, so it was never marked a clean ending;
  two Quits in a row looked like two crashes and the next start opened in the browser.

The Windows program: a newer copy started while another build is open asks it to close (WM_CLOSE) and takes its place
(`_open_copy_is_another_build`, `_close_the_open_copy`). On Windows the window reads its page from the installed file,
not from an address, so the 1064 workflow check that asked the address could never pass; it now checks the installed
page and the build the program noted. Both workflows prove the new rules on GitHub's computers.
