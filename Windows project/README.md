CARPE DIEM  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
The sole original work of Yannie D. Forest. NO LICENCE IS GRANTED: no
right of use, access, copying, adaptation or distribution without the
author's written, revocable permission. See LICENCE.txt. Every
distributed copy carries a build marker.
--------------------------------------------------------------------------

# Carpe Diem for Windows — standalone app

**Build 1062, 29 October 2026.** The About panel in the app ends with
"Build 1062 · 528171062".

## New in build 1062

Ingenium's Quiet Screen is in Carpe Diem. The leaf 🌿 in the side column (under
the bell, above the 💭) opens it: a still, dim page with one line of words and a slow
circle to breathe with, cream by day and a soft night blue by night, in English or
French. Reminders and the thought bubble wait while it is open; "I am ready to come
back" or Esc closes it. Focus has the same way in, beside the clock of Now, and its
"I need quiet" opens it too. The leaf is in a floating window's column as well.

The mini Forge in the Author Studio is now The Forge 656 (it was The Forge 641), with
every fix the Forge has had since: among them the Editor's live preview, which holds
still while the room scrolls, and the loading page. That loading page now speaks
French when Carpe Diem does, and follows its day or night. "Edit this app" still opens
this very build in it: in your own edition, the full Carpe Diem.

## Earlier, in build 1061

Carpe Diem and a room can now share the screen. The ↗ key of a floating window
(Tabula, Abacus, Imago, Scriba or Fontes) offers, second, "Side by side with Carpe
Diem": the room fills the right of the window and Carpe Diem the left, divided by a
line you can drag (or move with the arrow keys); the width is remembered, and the
same place then offers "Float again". It works on every device, the Fire tablet and
the iPad included. On a Mac, the first choice, the room's own window, now joins Carpe
Diem's window as a tab ("Carpe Diem | Tabula" across the top), as it did when Carpe
Diem filled the screen. The copy of a room as a page in the browser (which opened
Safari) is no longer offered there. The small notes at the foot of the screen take
the reminders' pastel card too.

## Earlier, in build 1060

The proposal no longer carries a date of its own. Earlier builds set a target date
42 days after the first start, and three lines wrote "16 September 2026" whatever
was chosen. Your desk's proposal date is cleared once, as you asked, and no edition
ever chooses one for you: choose one if and when it suits you, in Candidatus,
Proposal, "Rename the proposal". That key now opens the proposal's own details: its
working title, its target date (with a key to clear it) and its sections' names. The
curriculum's names have their own panel, "Rename the curriculum". The first-draft
milestone follows the proposal's date, and a passed date is said calmly, once.

The side buttons inside a floating window are drawn as the main window's are,
without the stacked dark shadows, which were slow and showed as dark squares on a
Mac; they keep their lift, the bell's ring and the hourglass's turn. The 💭 there
shows the number of thoughts too, and that number is one flat colour, as the bell's.

Timed reminders ("In five minutes: ...", the two-minute clock, a thought asking to
come back, and Custodia's pause) come in Carpe Diem's own blue card with a fine gold
rim, by day and by night. Custodia's card and its keys are styled again.

On Windows 10 the side buttons show Microsoft's flat emoji drawings, as on Windows
11, without the heavy black outline.

While Carpe Diem starts, the loading page says that the page is still being painted
and how far it has got, in English or French; after a long wait it offers to start
again. Refresh (the ↻ key beside Display, the first row of the Display menu, F5, or
Ctrl+Shift+R, Command+Shift+R on a Mac) saves the work of every open room, then
starts Carpe Diem again.

The About panel is shorter. The workflows that build the apps on GitHub use actions
that run on Node.js 24, so the Node.js 20 notice no longer appears.

## Earlier, in build 1059

A room can open in its own window on the laptop again, at Carpe Diem's own
address. If Carpe Diem ended badly while a room window was open, the next
start keeps rooms in floating windows once, to be safe. The work on Windows
start-up speed, installing and uninstalling and the zip kits was still in
progress then.

The floating windows and their dock are back. Tabula, Abacus, Imago, Scriba
and Fontes open again in a floating window inside Carpe Diem, and a folded
window waits in the dock. The ↗ key on a window now asks where it should go:
its own window on this device, its own page (a file), or nowhere (close). A
room in its own window is a whole Carpe Diem, with the same side buttons at
full size, the same solid notes panel, and right-click copy and paste in the
notes and in Tabula. The light window of builds 1051 to 1058, which caused the
odd layout, is gone.

The licence now says plainly that Carpe Diem is the sole original work of
Yannie D. Forest, that no one else has any right to it or any access to it,
and that any permission is limited, personal and revocable at any time
(LICENCE.txt; a French translation is in LICENCE-FR.txt). The open-source
parts the apps use are named in THIRD_PARTY_NOTICES.txt.

The page carries a security policy that limits where it may load code from and
where it may send data. It also carries an integrity seal: if a copy has been
altered since it was built, the About panel says so. Old comments and stale
instructions are removed from the code; the copyright and licence lines stay.

## Earlier, in build 1048

**The book spines, mended.** On Home's Current readings and on every shelf of
the Library, each spine had white panels over its leather by day, and navy
panels by night. The cause was a rule from build 1047 that gives the panels
which open over the page a solid surface. It named a class, by mistake, that
the spines' label panels also carry, so it painted them too. The spines are
not part of that rule any more; they are leather and gilt again, in every
mode.

**The side buttons, without the dark shadow.** Each emoji in the side column
(the bell, the 💭, the moon or sun, the hourglass, the notepad) carried three
or four stacked shadows, black and heavy by night. Shadows of this kind are
redrawn on every frame while a button moves, which made the column slow. They
are gone, by day and by night. The blue dot beside the 💭 is gone too; the
number of thoughts in the Inbox is in the 💭's name when the pointer rests
on it.

**The introduction door moves and resizes again.** The old fault was found:
the door's size was set up only while the app was loading, during about the
first two seconds. A door built after that (reopened from the seal, rebuilt
by the language button, or built late on a slower device) kept a width rule
that overruled every pull on its edges, so it could not be resized. Each door
is now set up as it is built. The door can also be moved: press any empty part
of it, or with a finger its top (the seal, the name and the row of buttons),
and drag it anywhere on the screen. A pulled edge now follows the pointer,
while the opposite edge stays where it is, and the edges are easier to catch
with a finger. Moved down, the door keeps its foot on the screen. It
remembers its place and its size. A double-click on an empty part of the door
puts it back in the middle, at its first size. Nothing shows on the door for
any of this.

**Support moves to the Overview, and folds away.** The supports for an
AuDHD mind no longer sit on Home, where they crowded its layout. They live
together in one section, Support, at the top of the Overview page: your next
step with Smaller steps, Just start and the Focus room; the time you can see;
the routines, the Inbox, Low energy today and Calm. Press the section's
heading, or Fold away, and it folds to a single line; press Show and it comes
back. It stays as you left it. Home keeps its own look.

**The 💭 beside the bell, and the quill line.** The 💭 has left the top bar
for the side column, under the bell and above the moon, where it looks and
moves like its neighbours. Its
panel is now the quill line you chose: one quiet line with a gold rule that
grows under the words as you write, Keep, Inbox, and a close button, "Close
the thought panel". The panel and its buttons are raised like the rest of the
app: the panel springs open, and each button lifts when the pointer rests on
it and presses down when clicked. Kept, the words drift letter by letter to the 💭. The
keyboard hints are gone.

The panel now wears a quiet Folio look in every look of the app: near-white
paper with a fine gold edge in Light, and the night navy with a fine gold edge
in Dark. Its buttons stay raised: each rises a little when the pointer rests
on it and sinks when pressed. The panel now works like a sticky note: it
grows as you write, a line at a time, up to about two thirds of the screen,
and then scrolls with no scroll bar in view. Enter starts a new line; press
Keep to keep the thought. It can be moved: press any part of it that is not the line or a button, and drag it
anywhere on the screen, with a mouse or a finger; it opens there the next
time. A new button beside the close button, "Minimise the thought panel",
folds it into the 💭 and keeps what you were writing. Press the 💭 and it
comes back with your words, ready to go on. The close button still closes it
without keeping the words.

**Folio by day, quieter.** In Folio with Light, every raised button, key
and tab, and the side menu's cards, stood on four layers of strong brown
shadow, and the cards and notices were a deep cream. Together they made the
page heavy and warm. The buttons keep their raised look on a lighter, nearly
neutral shadow, the side menu's cards keep a fine edge, and the creams are
paler.

**A little gold in Classic.** In Classic, by day and by night, gold now
appears in four quiet places: the two hairlines beside the Latin date under
the title (and on the door) fade in from gold; each section heading, such as
Current readings, has a short gold rule beneath it; the chosen tab of Home
and Overview has a gold line at its foot; and the main blue buttons, such as
Open Magister, carry a fine gilt line just inside their edge.

**The seal, renewed.** The seal you chose now stands everywhere in the app.
The five books in the fleur wear the Library's leather: blood red, sapphire,
ochre, forest and amethyst, with gilt bands and a gilt mark, as on the
shelves. The outer ring is blue and the inner ring gold, by day and by night.
CARPE DIEM and the Latin date are chunky block letters with deep blue sides,
standing off the seal; they rise and settle in time with its sway. The fleur
keeps its first blue, and the title and the date take the same blue; by
night they are a lighter blue. The rays are bevelled spikes, each with a lit
face and a shaded face. The gold stars are cut like jewels: the two beside
the lettering, and the six small ones between the rays, by day as by night.
In Light the face of the seal is white.

The seal is a real button. It stands on a domed porcelain face with a soft
bevel and a light that follows the pointer. It rises when the pointer rests
on it and sinks when pressed. A faint blue glow is held close to its rim, and
its shadows are short, so they lift the button without spreading over the
page. Calm and Minimal motion still the seal, as before.

The seal at the top of Home is larger (96 pixels), and so is the door's (100
pixels). The floating seal is back in the lower left corner of your edition
and the gift edition; pressing it opens the door. The two demonstrations
leave it out, as their own DEMO button already opens the door. In About, the seal moves and answers the pointer like the
others, but pressing it does nothing. The loading screen shows the layered
seal too.

**The app's icons.** The Mac, Windows, Fire tablet, iPhone and iPad apps, and
the Home Screen web app, take the same seal on its domed face, drawn still.
Where the system needs a square, the square is white. The title and the
Latin date stand on every size, the dock, the taskbar and the browser tab
included; at 32 and 16 pixels the letters are only a pixel or two tall, so
there they read as a fine ring rather than as words.
In a web browser, the website icon takes the night face whenever the app or
the device is in Dark, in every edition, the demonstrations and the gift
edition included; this now also covers the older icon file that some
browsers read first.

**The mini Forge, three pages.** The Forge inside the Author Studio is now a
small Forge made for Carpe Diem. Its side menu keeps three pages: the Editor,
Files and Settings. The Editor keeps its Bakery and Compose, where a new build
of the app, a demonstration or a gift edition is baked from your edits or from
the Studio's export. The Workshop, Agenda, Projects, Magister, the Reckoner
and the five apps' stones have left its menu. It opens straight onto the
Editor, with no introduction door. "At the desk", Alerts and the bell are
gone. It edits Carpe Diem only. Edit this app now hands this very build to the
Bakery as well, as its file to bake from, unless you have already chosen one
there. It now has the Forge's new look (see "The Forge 9s58 in the mini Forge",
below).

**Learn, out of the corner.** While the Forge is open, the Learn button sat in
the lower right corner, over the Forge's notes button and the 💭. It now sits
in the Forge window's title bar, beside Edit this app.

**Scriba: record, then transcribe it yourself.** Scriba can now be used with
no AI at all, as the About page promises. Open a recording and press
✍️ Transcribe it yourself: a typing line sits under the player. Type what
you hear, and Enter keeps each line with the moment you began it and the
speaker you chose. Beside it are play and pause, five seconds back and
forward, speeds from half to double, the speaker for the next line, and
small buttons that write [inaudible] with its time, [pause], [laughs] and
[crosstalk]. "Pause while I type" stops the sound as you type and picks it
up a second earlier when you stop. Take back the last line returns it to the
box. The keys, for hands that stay on the keyboard: Enter keeps the line,
Esc plays or pauses, Alt , and Alt . step back and forward five seconds,
Alt [ and Alt ] slow down and speed up, Tab moves to the next speaker, and
Alt 1 to Alt 9 choose a speaker by number (on a Mac, Alt is the Option key).
Ctrl and full stop still catches a thought, as everywhere in the app. How
transcripts are written, under the typing line, sets out the few conventions
that make a transcript trustworthy. The lines join the transcript like any
other, to search, annotate and export, and stay on this device. The speech
model stays, as you wished, and Transcribe still writes a transcript for you.
In the committee demonstration and the public sample, Scriba opens on its
recordings, with a card that puts this way of working first; a recording
made from that card opens at once, ready to be written out.

**Two new tour cards.** "Transcribe it yourself" follows Scriba's room at
work, and "Online look-up in Fontes" follows Support in Display, ringing the
switch that lets Fontes ask Crossref or Open Library about a DOI or an
ISBN. Edits you have made to the tour in the Author Studio move with the
cards, once, so each stays on the card you wrote it for.

**Your voice stays on this device, unless you choose otherwise.** A
browser's own dictation may send your voice to the browser's maker to be
turned into text. Tabula's Scriba button and every dictation button in the
app now ask once where your voice should become text. The first choice is
"On this device (private)": Scriba's speech model listens on the device and
writes each phrase after a short pause, and nothing you say leaves it. The
first time, the model is downloaded once; after that it works offline. The
second is the browser's dictation, with a plain warning. Your choice is
kept, and Display shows it under Online, beside the look-up switch, where
it can be changed at any time. Scriba itself turns to the browser's
dictation only if you have chosen it. Words read aloud, in a lecture or in
Tabula, now use only voices that live on this device; some of Chrome's
voices are made on Google's servers, and those are no longer used or
listed.

**The About page, brought up to date.** "The seal" now describes the seal
as it is, in the words you approved: the books in the Library's leather,
the white face by day, the two gold stars and the small ones between the
rays, the layers on a domed button, and the app icon as the same seal on
its domed face. Under "What runs on your device", the sentence on the
browser's dictation now says it is used only if you choose it, in Display
under Online. The French follows the English. The tour's card on the seal
no longer counts three layers. In French, the tour, the Support section
and the new texts now name Display as the app does, Affichage; Aspect is
kept only for the Look and feel section.

**The brown shadow in Dark, fixed at its root.** In Folio by night the
introduction door was brown, and in Classic by night it had a brown edge. Two
causes, both found and fixed: the solid panels of build 1047 drew a brass
outline around every panel in every mode and gave Folio by night brown panel
colours; and an older Folio rule gave every raised button, the side menu
included, brown daylight shadows even by night. The door is now navy in both,
each mode draws its panels' edges in its own colour, and by night the buttons
take the night shadows. Folio keeps its gold for the chosen tab and day.

**One right-click menu, everywhere.** The sticky notes now have Tabula's full
right-click menu: Cut, Copy, Paste and Paste as plain text; Bold, Italic,
Underline and Strikethrough; Format painter, Insert link and Select all. The
same panel opens in Tabula, in the other rooms, in every text box in the app,
and in each room's own window. Where an item cannot act, such as Bold in a
plain text box, it is shown greyed, so the panel keeps one shape. Only one
menu is open at a time: opening it closes a note's own menu and any panel
open in another window. Inside Tabula's page, a right-click straight on a
word still opens the browser's own menu, because its spelling suggestions
are there.

**Paste from anywhere, without the keyboard.** Paste now takes what you
copied in another program, such as a link from a web browser. In the Mac and
Windows apps, on the Fire tablet, and on the iPhone and iPad, the app reads
the clipboard itself when you press Paste. Nothing is kept or sent anywhere.
A link pasted on its own becomes a working link. In a web browser, the
browser may ask once whether the page may see the clipboard. If a browser
refuses, a small box opens instead: right-click inside it, or press and hold,
and choose Paste, and the text goes where you were. The message about the
keyboard is gone. Tabula's Paste button and its Paste Options read the
clipboard in the same way, and Keep Source Formatting and Merge Formatting
now receive the formatting.

On the iPhone and iPad, iOS may ask "Allow Paste?" when you paste something
copied in another app. That question comes from iOS itself. Recent versions
of iOS have a setting for each app, Paste from Other Apps, in the app's page
in Settings; you may want to check it there.

On a touch screen, the system shows its own Cut, Copy and Paste bar when a
finger rests on text, and its Paste reads the clipboard too. The app's panel
no longer opens on top of that bar. With a mouse or a trackpad, a right-click
opens the panel.

**Sticky notes.** A new note now opens in the first shade, Foolscap (the
cream), instead of the yellow.

**Names on hover.** Each sticky note colour, each colour in Tabula's text
colour and highlight palettes and in Imago's ribbon, and every emoji or
symbol button in the app now shows a small label with its name as soon as the
pointer rests on it. The label appears the way a book's title appears on the
shelves, just above the thing it names and pointing to it, but it takes the
colours and lettering of its own page or button, by day and by night. A
second line says a little more where it helps: what a note colour looks like
("cream" by day, "graphite" by night), how much lighter or darker a palette
colour is, or what a button does. The note colours are Foolscap, Primrose,
Inkwell, Claret, Laurel and Vespers. Tabula's theme colours are Oxford blue,
Cambridge blue, Oxblood, Forest, Ochre, Walnut, Charcoal, Parchment, Dusty
mauve and Slate; the pastels and the highlights have plain names, such as
Pastel sage, Linen or Wheat. The few symbol buttons that had no name now have
one: Bold, Italic and Underline in Tabula and Abacus, the cross that closes
Tabula's File menu, the arrows of the reading agenda, and the ticks beside
the Ascensus labours. On a tablet, tap a colour to see its name.

**The gift and demonstration builds change their own app, and no other.**
In the gift edition, in each gift made from it, and in both demonstrations,
the Author Studio and the mini Forge can change Carpe Diem on the device where
they are used, and nothing more. The Studio offers neither Installers nor the
Bakery there. The copy maker and the package maker make nothing. The mini
Forge puts away its device packages, its one-file download and its Bakery;
a press on any of them is refused, and nothing the size of the app can be
downloaded or saved from it. The Forge's edits themselves (Export and Import
as JSON) stay. In those builds a floating window (Tabula, Abacus, Imago,
Scriba or Fontes) opens in its own window where the browser allows one, or
fills the screen in an app; its page is not saved as a file. A copy you make
for someone else (Share or Fresh, in your own Studio) is locked in the same
way. Your own edition, and a copy you make for your own devices (Mine), keep
every builder. Those builds also no longer carry the Forge's packed projects.
A file can still be copied by hand, as any file can; what is gone is every
tool inside the app that made a new version of it.

**Apply, in the mini Forge.** In every edition, the mini Forge's Download
fold now begins with "Apply these edits to Carpe Diem on this device". The
Forge's edits join the app's own, kept on the device as the Studio's are, and
the app shows them. In your edition and the gift edition the app reloads with
them; the demonstrations show them at once and keep them for the visit, as
they keep the rest of a visit's work. Nothing is written to a file and
nothing leaves the device. The app now also carries the Forge's wider list of
the surfaces it can change (the side rail, the dock, the day shapes, the
seals and the section titles), so every surface edit is applied in the app
itself and not only in a baked copy.

**Gift editions for Tonton Males, Mishamma and Noel.** Each opens on the
letter you approved, in English, with a French version. GitHub builds one
app for each: a Mac app for Tonton Males and for Mishamma
(Carpe-Diem-Mac-Gift-males.zip and Carpe-Diem-Mac-Gift-mishamma.zip, on the
Mac repository's Releases page, tag carpe-diem-mac-gifts), an app for iPad
and iPhone for each of them (CarpeDiem-Gift-males.ipa and
CarpeDiem-Gift-mishamma.ipa, tag carpe-diem-ios-gifts, each with its own
identity so the two never replace each other or your own), and a Windows
installer for Noel (Carpe-Diem-1048-Windows-Setup-noel.exe, tag
carpe-diem-windows-gifts). The files live in the folder "Gift editions" of
each repository; a change there builds the gifts again, and leaves your own
app as it is.

**The builders in the Author Studio and the mini Forge.** In your own edition,
both now make the same packages, one per device: iPhone and iPad, Mac, Mac
mini, Windows, the Fire tablet and the web. A web page cannot compile a Mac,
Windows or Android program, so each package carries the very project GitHub
builds your app from: your four repositories, file for file at this build,
icons included, with the edited app where each project expects it, and a READ
ME FIRST.txt with every step for that device. Replace carpe_diem.html in the
repository (or upload the whole project to a new one) and GitHub builds the
finished app onto the Releases page. The iPhone and iPad package also holds
CarpeDiem.ipa, finished in the page from the app's own compiled part, ready
for Sideloadly. The Windows package carries the Windows file, and the others
the file with the Fire tablet's own style block, as your repositories do. Mine,
in the Studio, is now the whole app for your own devices, so the app it
becomes keeps every builder; Share and Fresh make locked copies for someone
else. Your edition grows by about 5.5 MB, to approximately 30 MB, for the
projects, their icons and the iPhone app's compiled part. The gift and
demonstration builds carry none of it.

**Into an app you downloaded.** In Installers, "Choose the downloaded app"
takes an app from your Releases page (CarpeDiem.ipa, Carpe-Diem-Mac.zip,
Carpe-Diem-Windows.zip or carpe-diem.apk) and hands it back with the edited app
inside, ready to install, with no GitHub step. The iPhone and iPad app stays
unsigned for Sideloadly, as before. The Mac app's seal of contents is brought
up to date, so macOS treats it as the same app. The Windows app stays one file,
Carpe Diem.exe, that opens with a double-click. The Fire tablet's app is signed
again with its own key, which only your edition carries, so it installs over
the app on your tablet and keeps your work.

**The mini Forge's device buttons** now send the app it holds (the Editor's, or
the Bakery's latest bake) to the same builder. Its identity row is gone, since
Carpe Diem's projects carry their own.

**The Forge 9s58 in the mini Forge.** The mini Forge inside the Author Studio,
in every edition (yours, the two demonstrations and the gift editions), is now
the Forge 9s58: its new seal, Carpe Diem 1048's layered seal made the Forge's own
(THE FORGE round the ring, the anvil with its spark at its heart, the same domed
button and slow sway). It comes from the Forge's own branch; the mini Forge's
three pages, Apply, the lock and the saves ride on it as before.

**The Forge's compact header, and its new icons.** At your word, the mini
Forge has the compact header you approved in the Forge's seal preview, in
Inkwell's and Ingenium's way: the Forge's seal at the left (48 pixels), The
Forge beside it, and the Latin date under the title with one gold hairline
after it. From 700 pixels wide it is a band that stays at the top while the
rooms scroll under it, the top controls sit at the right of the same band,
and the rooms and the side menu begin higher; on a narrower screen it keeps
its place in the page, in the same compact form. By day and by night, in
Classic and in Folio, the band takes the page's own colour. The Forge's old
seal is gone from its icons too: its address-bar icons by day and by night,
Apple's icon, and the seal its device packages are made from are the new
Forge icons you approved, each checked against the Forge's own list.

**The mini Forge's buttons keep their own lane.** Its night, timer and notes
buttons now stand in a lane at the right, so on a tablet held upright they no
longer cover the Editor's surfaces, its search or its list; where its side menu
becomes a row, the fold button no longer sits on the Editor button.

**The 💭 out of view while the Forge is open.** With the Forge open in the
Author Studio, the 💭 and the side column's fold arrow are put away with the
other side buttons.

**The mini Forge saves through the app.** The Forge opens inside the app in a
sealed frame. There a browser shows no file picker, so its "Save as a file"
failed, and the Mac, Windows and Fire apps' own save windows could not hear
it. Each file the Forge saves (its edits, the edited app, a bake, a file from
its Files) is now handed to Carpe Diem, which keeps it as it keeps its own
files: the Keep sheet, with Save as a file, Download and Copy, or the device's
own save window. In the gift and demonstration builds the app also refuses
anything the size of the app that comes from inside the Forge, by this way or
by the five apps' older one.

**What was checked for build 1048.** These checks ran in Chromium on a Linux
test machine, not on a Mac, a PC, a tablet or a phone.

- Your edition and both demonstrations: a new note opened in Foolscap and
  its menu marked Foolscap; each of the six colours showed its name, by day
  and by night, in the colours of the note's menu. Every emoji or symbol
  button found on the seven pages, in Display, in the notes and in the five
  rooms (276 of them) had a name to show. The panel opened with the same eleven items in a note, in a
  text box (formatting greyed) and inside Tabula, in English and in French.
- A link copied outside the page and pasted with the panel became a working
  link, in a note and in Tabula. Formatted text kept its bold and its safe
  links, and lost its colours, its scripts and an unsafe link. Paste as plain
  text, Bold, the Format painter and Insert link did their work. A stand-in
  for the apps' own clipboard reader was used before the browser's. Escape
  closed the panel, and opening a panel in Tabula closed the one on the page.
  No alert appeared at any point.
- With the clipboard refused, the small Paste box opened, and what was pasted
  into it reached the note.
- Support: Home showed none of the supports; the Overview began with
  Support, which folded to one line, stayed folded after the page was
  redrawn, and opened again. The tour's support cards opened the Overview,
  ringed each help, and gave Home back for the next card, and the section was
  still folded afterwards as it had been left.
- The 💭 stood under the bell and above the moon, the same size and in the
  same styles as the moon, by day and by night, in the main edition, the demos
  and the gift edition. Its panel opened, closed with its close button, and a
  kept thought drifted to it. The column's fold arrow
  sits clear of the bell, which in the demos it had not.
- By night, in Classic and in Folio, the door and the side menu carried no
  brown.
- The thought panel, in Classic and Folio, by day and by night: it showed
  the Folio dress in all four. It was dragged with a mouse and with a
  simulated finger, minimised with its words kept, brought back by the 💭
  with the cursor in the line, closed, and reopened where it had been left.
  A kept thought reached the Inbox. This was checked in your edition and in
  the public demonstration. Written in, it grew from one line to two after
  Enter and to six as a long line wrapped; forty lines stopped growing at
  about 60% of the window and scrolled, with no scroll bar taking any
  width, and all forty lines were kept. Its buttons rose by two pixels under
  the pointer and sank by two when pressed, by day and by night.
- Folio by day and Classic by day and by night were photographed on Home:
  the lighter shadows and paler creams in Folio, and in Classic the gold
  hairlines, the rule under the headings, the line under the chosen tab and
  the gilt line in Open Magister, each read back from the page.
- The spines on Home and on the Library's shelves (119 of them) showed their
  leather with no white or navy panel, by day and by night. The side
  buttons' glyphs carried no shadow in either mode, and the 💭 had no dot.
- The door, in your edition and in the public demonstration: dragged by its
  masthead with a mouse and with a finger (a simulated touch), it moved and
  stayed whole on the screen; a pulled right edge left the left edge in place,
  and a pulled foot left the top in place. After the language button rebuilt
  it, and after it was closed and opened again, it still resized, which in
  builds 1043 to 1047 it did not. Reopened, it kept its place and size; a
  double-click put it back in the middle. Its Display button still opened
  Display.
- The seal, in your edition, the public demonstration and the gift
  edition: the seal at the top of Home measured 96 pixels, and the door's
  100 where the edition has the door. In your edition and the gift edition
  the floating seal stood at the lower left, 56 pixels, above the page, and
  opened the door. About's seal
  measured 88 pixels, and pressing it opened nothing. The website icons
  carried the new seal, and took the night face when the app or the device
  was dark, the older icon file included.
- Measured on the seal's own scale, every block of the title and of the
  date stands clear of both rings.
- The app icons were drawn by the app's own seal code and looked at by day
  and by night. On the light icons, the title and the date show the full
  blue; they had been pale, because the old lettering's highlight was drawn
  over them, and it is now drawn beneath, as in the live seal. The icons were
  written into each project at the sizes it already used; the iPhone and
  iPad icon has a white square, with no transparency, as Apple requires.
- The mini Forge, in your edition and in the public demonstration: it opened
  on the Editor with no door; its menu showed Editor, Files and Settings only;
  the top bar showed no "At the desk" or Alerts, and the side column no bell.
  The Editor's Bakery and Compose, Files and Settings each opened. Each of the
  five removed pages, opened by force from code, gave way to the Editor. Edit
  this app opened the build in the Editor and filled the Bakery's file. Learn
  stood in the Forge's title bar, opened and closed its lessons, and the
  corner was empty; it was gone with the Forge when the Forge was closed.
- Scriba, in your edition: a test recording was brought in and opened; the
  typing line kept two lines at 0:02 and 0:07 with their speakers, in time
  order; Tab changed the speaker; Alt . and Alt , moved the sound forward
  and back by five seconds; Alt [ slowed it to half speed; Esc played and
  paused; none of these keys opened the thought panel; Take back the last
  line returned it to the box; the lines were read back from the device's
  store, and the typing line came back open when the recording was opened
  again. In the public demonstration, Scriba opened on its recordings with
  the new card first; a recording made from the card (with a simulated
  microphone) opened at once with the typing line ready.
- The tour: both new cards ring their control, the card in Scriba's room and
  the look-up switch in Display. With three hidden cards saved in the Studio
  as 1047 knew them, each stayed hidden on the same card after the move, and
  again after a reload; the Studio held the same 198 cards as the tour.
- The floating seal: present in your edition and the gift edition, absent
  from both demonstrations.
- Your voice, in your edition and in the public demonstration, with a
  simulated microphone: Tabula's Scriba button asked once; "On this device"
  started Scriba's engine, and words it wrote reached Tabula's page at the
  caret, with spoken commas and full stops; the second press asked nothing.
  The browser's own engine was never created until "The browser's" was
  chosen in Display. Scriba's own Record used the device's model. With a
  stand-in list of one online voice and one on the device, both requests to
  speak were given the device's voice, and the list showed only that one.
  The requests that left the page were the one-time download of the speech
  model's library, which Scriba announces, and a check of a local address
  on this device.
- The About page was opened in English and in French and its seal
  paragraph and dictation sentence read back as approved; no French text
  names Display as Aspect any more.
- All five editions opened at build 1048 without an error.
- The lock, in a browser, in your edition, the public demonstration and the
  gift edition: in the two locked builds the Studio showed no Installers and
  no Bakery, the copy maker and the package maker made nothing, a room's own
  page made nothing, and every device button of the mini Forge was put away;
  pressed anyway, they downloaded nothing. In your edition each of them
  downloaded as before. A copy made with Share opened locked.
- Apply: edits imported into the mini Forge were applied with its new
  button; the renamed Home button showed in your edition and the gift edition
  after the reload, and at once in the public demonstration.
- The builders, in your edition, in a browser: the Studio made all six
  packages and the one file; every project file in them was byte for byte the
  one in your repository (the Mac icon set, rebuilt in the page, included),
  and the app file in each was the whole app (the Windows variant in the
  Windows package). CarpeDiem.ipa made in the page was the last GitHub IPA,
  file for file and mode for mode, with the edited app inside. The mini
  Forge's device buttons made the same packages. The Fire package's project
  was built here into an APK, signed with your key (the same certificate as
  GitHub's) and holding the edited app and the writing model's engine.
- Into an app you downloaded, with the apps from your Releases pages: the
  edited Fire app passed Android's own apksigner on both signatures, with the
  same certificate, and zipalign; the Mac app's seal and both code
  directories of its program list the new file, and nothing else changed but
  64 bytes of fingerprints; the Windows program kept its own code and every
  other part, with the edited file in its archive; the iPhone and iPad app
  was the same IPA with the edited file. GitHub then checks the Mac and
  Windows results on real machines (codesign, and opening each app), and the
  iPad package's project in the simulator: see the check-builders runs.
- The mini Forge's saves, in a browser: its one-file download opened the
  app's own Keep sheet (no sheet in the Forge's frame), which offered Save as
  a file, and its Download gave the whole edited app; a package or bake
  leaving by a link, and a file from Files, each arrived as a download from
  the app. In the public demonstration the edits' JSON was kept the same way,
  and an app-sized file sent from inside the Forge by any of its paths
  (a link, a link never put in the page, a direct message, the five apps'
  older message) was refused; the same file sent by the app itself was kept.
  This was found while checking: before this, the Forge's one-file download
  waited behind its own sheet, whose Save as a file failed in the frame.
- The Forge's compact header and new icons: in the Forge page alone and in the
  mini Forge of your edition, at 1218, 1176, 734 and 357 pixels wide, by day
  and by night, Classic and Folio: the seal 48 pixels at the left, the title
  23 pixels, the date with one gold hairline, the top controls on the same
  band; the band stays when the rooms scroll; the side menu starts under it;
  the Display, Guide and About panels and the Editor's full page open over
  it; the menu set at the top sits under it as before. This was found while
  checking: the first version moved the top menu onto the Editor's heading,
  and that rule was taken out. Every edition and gift carries the header and
  none carries the old seal's picture. In every edition the six icon links
  match the Forge's approved icons byte for byte; in your two editions the
  packages' seal does too (the locked editions keep no projects).
- The Forge 9s58: every edition carries it, its seal and its header show in
  the mini Forge at desktop and tablet sizes, and the locked editions still
  leave out the Forge's projects. With the Forge open, no side button of the
  app shows, the 💭 included. The two demonstrations were served over http:
  their service workers cached all eighteen files, they reloaded offline,
  and the public sample hides Backup while the committee demo shows it.
- The apps, made here when GitHub could not build: the Fire tablet's app was
  built from its project (version 1048, its own key, the new seal as its icon);
  the Mac, Windows and iPhone and iPad apps are GitHub's own 1048 builds with
  the newest page put in, each checked file by file. The gift apps were made
  the same way from GitHub's 1048 gift builds; a start-up note the Mac gift
  apps had written inside themselves while GitHub opened them was left out,
  so their seals hold.
- The three new gifts: each letter opened in English with its approved
  wording, and the desk followed it. GitHub built each one: the two Mac apps
  carried their own file, opened, and answered; the two iPad apps were
  built and opened in the iPad simulator; Noel's installer was made.
- GitHub's Mac and Windows builds put a line on the system clipboard and the app read it back, as its Paste does. GitHub also built the Fire tablet and iPhone and iPad apps with their own clipboard readers.
- Not checked: the app on your own devices, Safari and Firefox, a real
  touch screen, and a real microphone with the speech model loaded. The
  Forge inside the Author Studio keeps its own dictation buttons for now;
  they will follow when the Forge takes its new look.

## Earlier, in build 1047

**The seal.** The fleur's tall middle petal is now a shelf of five books of
uneven heights, standing on the band. Its two lower curls are gone, and its
middle foot stays. The books take the fleur's own colours, blue by day and
champagne by night, and the rays behind them are stronger by day and by night.

**The seal in layered depth.** Inside the app the seal no longer sits in a
gold rim. It is built in three layers: the lettering at the back, the rays in
the middle, and the fleur with its books in front. It sways slowly so the
layers slide past one another, turns to follow a mouse, sinks when pressed,
and knocks before it opens the door. This is the seal at the top of the page,
on the introduction door, on the gift edition's letter and first door, on the
loading screen, and the small seals in the About and Guidebook titles and at
the foot of Home. In Calm mode, and with Motion set to Minimal, it rests
facing forward. The app's icons on every device, and the website icons, keep
the gold-rimmed medallion. The letterheads, the seal tiles of Tabula, Abacus
and Imago, and the watermark behind Home are drawn in one ink, as before.

**Support for an AuDHD mind.** Seven helps are built into the pages where they
help. Each one has its own switch in Display, under Support, and all of them
except Calm mode start switched on.

- **Calm mode**: one press for sensory comfort. Nothing moves, nothing sounds,
  the colours soften, and fewer things show at once. It starts switched off,
  so the animations stay until you want quiet; the Calm button on Home turns
  it on and off.
- **Smaller steps**: under the next task on Home, break the task into steps in
  your own words, and Home shows only two of them, Now and Then. Just start
  runs a two-minute clock. In the Agenda, Show only Now and Next hides the
  rest of the day.
- **Time you can see**: a bar on Home and at the top of the Agenda shows the
  time left in the current block and how far off the next item is. A quiet
  note appears five minutes before each Agenda item.
- **Low-energy days**: one press on Home keeps only what is essential for the
  day, and offers to make it a Gentle Day. The next day starts afresh.
- **The Inbox**: catch a thought from anywhere with Ctrl and the full stop, or
  with the 💭 button on the top bar, and later send it to a Schedae note or to
  Tabula, or let it go.
- **Routines**: a routine for starting the study day, offered before noon, and
  one for ending it, offered after five, one step at a time. Every step can be
  rewritten.
- **Focus room**: a quiet full-screen room with one task, the Clepsydra timer
  drawn large, and a soft sound made on the device itself (a low hum or soft
  rain), so it works offline.

**Solid panels.** Display, the Guidebook, About and the other panels now open
as solid raised panels, and the page no longer shows through them. Inside
Magister's chat, the conversation is raised like the rest of the app.

**The guided tour.** The tour now follows the order in which the app is met:
the Agenda's week, then its calendar, then This week; the Quiz and marks
button before the lesson room's tabs; adding and filing a programme beside the
programme list; the corner buttons from the bottom up, with the bell after the
Clepsydra; the Display panel from top to bottom, with new cards for Depth,
Sound and Support; the Author Studio cards together, after the Guidebook that
opens it; and the seal at the top of the page in place of the old badge. Nine
new cards present the supports. Wording that no longer matched the app was
corrected in English and in French. Demonstrations now wait for what they
show: the Clepsydra really runs, Tabula's File menu stays open, and the dock,
the Sky row and the seal are ringed where you can see them. On Home, the card
stands clear of the app buttons it describes. The whole tour takes about three
quarters of an hour; Chapters lets you take it one room at a time.

**The Author Studio and the tour agree.** The Studio used to copy the tour
before the tour was arranged, so it listed 174 cards while the tour showed
185, and saving anything in the Studio dropped 11 cards from the tour until
the app was reloaded. Both now hold the same cards in the same order. Tour
edits you saved in the Studio under build 1046 move with their cards.

**Fontes.** A saved source can now be corrected: press ✎ Edit on it, change
what you need, and press Save changes, or Cancel. It keeps its place in the
list, its DOI or ISBN, and the record a DOI or BibTeX import brought in, and
its formatted reference changes with it. Tabula sees the correction at once.

**Backup.** Backup now carries the work of all five apps (Tabula's documents,
Abacus's workbooks, Imago's deck, Fontes's sources, Scriba's notes and
recordings) and the Forge's files and settings, as well as Carpe Diem's own.
Importing a backup offers Replace or Merge.

**The Forge.** The Forge inside the Author Studio is now The Forge 9s57
(8 October 2026).

**About.** About now describes the seal as it is and what each part means,
says plainly what runs on your device (no accounts, no connection needed, and
no AI except Scriba, which uses a model only when you ask, and your browser's
own dictation only if you choose it), and gives the line the app is built on:
"Tell me and I forget. Teach me and I remember. Involve me and I learn."

**Auto, and the website icon by night.** Display, Theme, now has Auto beside
Light and Dark: the app follows your device's own light or dark setting. The
icon in the browser's tab, and the large and Home Screen icons, turn navy and
gold whenever the app or the device is dark.

**Fontes's online look-up has a switch.** Looking up a source by its DOI or
ISBN is the one thing in Fontes that reaches the internet. Display now has a
switch for it, under Online look-up in Fontes. Switched off, nothing leaves the
device and Fontes says so. It starts switched on.

**Smaller things.** After the guided tour had passed through Tabula, Tabula's
File menu stayed hidden when pressed until the app was reloaded. It now opens.
Three lines in the Display panel are now in French. In the gift edition, Dia's
letter now says to take the tour a chapter at a time, since it is no longer a
few minutes long.

**Installing on Windows, as Inkwell installs.** Carpe Diem now comes with an
installer of the same kind Inkwell uses: Carpe-Diem-1047-Windows-Setup.exe.
It installs Carpe Diem for you only, with no administrator password, into
%LOCALAPPDATA%\Programs\Carpe Diem, adds it to the Start menu (and to the
Desktop if you tick the box), and adds an uninstaller to Settings, Apps. The
installed app is a folder that is already unpacked, so it does not unpack
itself at every start as the single Carpe Diem.exe does. That unpacking is
most of the wait before the single exe's window appears; how much quicker the
installed app is on your laptops was not measured. The portable Carpe Diem.exe
is still made, for a USB stick. See "The quick way: the installer" below.

**What was checked for build 1047.** These checks ran in Chromium on a Linux
test machine, not on a Mac, a PC, a tablet or a phone.

- All five editions (yours, the Windows one, the committee and public sample
  demonstrations, and the gift edition) opened at build 1047 without a single
  error, with the new seal and icons and the supports, and with the tour and
  the Author Studio holding the same cards in the same order.
- The layered seal was checked on the introduction door, the top bar and the
  gift edition's letter and first door, by day and by night, and on the
  loading screen: it turns toward the mouse, stays sharp while it sways,
  knocks and opens the door, and rests facing forward in Calm mode. The app's
  icons and the website icons were checked to be the gold-rimmed medallion.
- The whole tour was walked card by card, with a picture of each card.
  Every card ringed what it describes, and no card covered what it ringed.
  The only flags were twelve rooms taller than the screen, whose rings run
  past its edge. The walk found three faults, which were fixed and the whole
  tour walked again: Tabula's File menu did not open on its card; the dock
  card ringed an old dock the app keeps hidden; and on the cards about the
  Apps row on Home, the card could cover the Scriba and Fontes buttons. The
  Apps row cards were also checked on a 1280 by 720 screen and a phone-sized
  screen.
- Every support was used from start to finish, by day, by night and in
  French, with the clock set to fixed hours: steps were kept and shown as Now
  and Then; the two-minute clock ran out and said so; a thought caught with
  Ctrl and the full stop became a Schedae note; a low-energy day hid the rest
  of Home and brought it back; Calm mode stilled and quieted the app and let
  it go again; the start-of-day routine ran to its end; the Focus room ran the
  Clepsydra with its low hum; Display showed the seven switches; the Agenda
  showed only Now and Next; and the five-minute note appeared at 10:25 before
  an item at 10:30.
- Fontes: a typo in a saved source was corrected; a source brought in from a
  DOI was corrected and kept its DOI, and its reference changed; Escape left a
  source as it was.
- Backup: a file holding all five apps' work and the Forge's was imported with
  Replace and with Merge, and everything came back, a Scriba recording
  included.
- The Forge 9s57 opened in the Studio, and kept its settings and a file
  across closing and reopening.
- Tour edits saved under build 1046 (a hidden card, a reworded card, a card of
  your own, and an order of your own) moved to the right cards.
- About carries the new seal paragraph, What runs on your device and How
  Carpe Diem teaches, in English and French. Auto followed the test machine's
  light and dark setting both ways, and pressing Light ended Auto. The icons
  turned dark with the device and with the app.
- With the online look-up switched off, neither Fontes's button nor the
  shared look-up sent any request to Crossref or Open Library.
- Not checked: the app on your own devices.

## Earlier, in build 1046

**The Forge, whole.** The Forge inside the Author Studio is now The Forge
9s56 (4 October 2026), the newest, exactly as it is on its own: its door, its
masthead with its new anvil seal, its lessons (Workshop, Magister, Reckoner),
its Agenda and Projects, and its own rooms. Until now the built-in Forge was a
reduced copy without its seal. It now keeps its work as well: its files and
settings are kept by Carpe Diem in a store of their own, never among Carpe
Diem's own keys, so they are still there the next time it opens. It follows
Carpe Diem's day or night theme. "Edit this app" still opens this very build
in it.

**Scriba's summaries.** Scriba is Inkwell's newest room. Its summaries,
chapters, action items, minutes and revision notes now work in Carpe Diem, as
in Inkwell, through a writing model on your own devices. In Scriba, press
Summarise; the first time, Carpe Diem's ✍ Writing model panel opens. Every
answer passes the fact guard: a summary that adds a name or a number, or drops
one, says so. Fontes is unchanged: Inkwell's newest Fontes is the one build
1045 already carried.

**Where the summaries' model comes from on a PC.** Two ways, chosen in the
✍ Writing model panel:

- **The writing model in the window**: LFM2.5 1.2B Instruct (Liquid AI),
  about 850 MB, fetched once and then kept, so it works offline. It runs on
  the graphics processor through WebGPU, which the app's window (Microsoft
  Edge WebView2) offers on most recent PCs with a current graphics driver. If
  this PC lacks it, the panel says so plainly.
- **Inkwell's companion server**, when Inkwell's server runs on this PC (or
  on a laptop on your Wi-Fi, with its six-digit pairing code). The address
  on the same PC is http://127.0.0.1:8317. Carpe Diem looks for that
  server only once you have connected it in the panel, or while the panel
  is open; until then it sends nothing to it.

**What was checked for build 1046.** These checks ran on a Linux test
machine in Chromium, not on a Mac or a PC.

- The built-in Forge opened at its door and showed The Forge 9s56's masthead
  with the anvil seal, its lessons, its stones and its rooms, as The Forge
  does on its own. It took on Carpe Diem's night theme. "Edit this app"
  loaded this build. No errors were reported.
- The Forge's own settings (23 keys) and a file made in its Files room were
  still there after the panel was closed and opened again. They were kept in
  the Forge's own store, and none of them reached Carpe Diem's keys.
- Scriba with no model: pressing Summarise opened the ✍ Writing model panel.
  With a stand-in for Inkwell's companion server, a summary came back, was
  kept, and the fact guard flagged nothing.
- The writing model in the window was installed from the panel (its engine,
  then the model, about 850 MB) and was ready in about a minute. Its own test
  asked it to correct "The results of the study shows that participants was
  more likely to recall items." It answered "The results of the study show
  that participants were more likely to recall items." The test machine has
  no graphics processor, only a slow software stand-in, so that answer took
  about 16 minutes. A real graphics processor should be far quicker, but
  that was not measured.
- The seal, the guided visit and Dia's letter were checked again on 1046
  and behaved as in 1045.
- On GitHub's Windows computer, the built app opened at its door, and the
  app file inside Carpe Diem.exe is exactly this build's.
- Not checked: the app on your own PC, and whether its window offers
  WebGPU there.


## Earlier, in build 1045

**The seal, redrawn and pressable.** The seal at the top of the page is now a
raised button. Press it and the introduction door opens. The seal on the door
is a button as well: press it to enter. The small floating seal in the corner
is gone. At night the seal wears a darker night face, and by day a light one.

**Scriba and Fontes, as in Inkwell.** Both rooms are now copies of Inkwell's
newest versions (Inkwell 7.36). Scriba writes out speech on this computer. The
first time, while online, it downloads its speech models once and keeps them,
and after that it works with no connection. It can tell speakers apart and
show the slides of a PDF beside a recording. Fontes formats references with
the official citation styles (APA, Harvard, Chicago, OSCOLA, MHRA, MLA, IEEE
and Nature), looks sources up by DOI or ISBN when online, and reads and writes
BibTeX, RIS and CSL-JSON. One thing build 1044 had is not in Inkwell's
Fontes, so it is not here either: changing a saved source in place. To correct
a source, add it again and remove the old one with Remove.

**Each room on a page of its own.** In Tabula, Abacus, Imago, Scriba or
Fontes, lift the room into its floating window, press Export this window, then
"Its own page". The room is saved as a page of its own and opens in your
browser: the same room, with the same look, the same side buttons and the
work you had open. The page is a copy. What you write there stays in that
page and does not come back into the app. Scriba's recordings stay in the app.
The page is kept in Documents, in the folder Carpe Diem, then Exports, and
opens in your default browser. If Documents cannot be written to, it is kept
in AppData, Local, CarpeDiem, Exports instead.

**What was checked, and what was not.** Every change above was tested in
Chromium on Linux, with the app's own bridge imitated: each of the five rooms
opened on its own page, in the right theme, with its side buttons and the
work carried over. Nothing was tried on a Windows PC. If anything behaves
differently on yours, a note of what you saw is enough for it to be fixed.


## Earlier, in build 1044

*This section is kept as a record. Scriba has since been replaced by
Inkwell's (above), so the Scriba controls named here, such as "More
accurate" and "Interview: two speakers", are no longer there. The
microphone advice still applies.*

**Scriba writes with Whisper, on this PC.** The first time you dictate, or
write out a recording, while the PC is online, Scriba fetches Whisper once:
about 100 MB for "More accurate" (the default on a PC) or about 65 MB for
"Faster". It keeps the files inside Carpe Diem, and after that it works with
no connection. A line under Scriba's buttons always says where Whisper stands.

**Interviews with two speakers.** Tick "Interview: two speakers". Live, press
the name of whoever is speaking. From a recording, or from an audio file added
with "Add audio files", press Interview: Scriba writes it out with times and
tells the two voices apart by their sound. That can be wrong when two voices
are alike, so each line's name changes with one press. A transcript saves as
text or as subtitles (.srt, .vtt).

**The microphone.** The first time Scriba listens, Carpe Diem should ask
whether it may use the microphone: choose Allow. If Windows refuses it, open
Settings, then Privacy & security, then Microphone, and switch on both
"Microphone access" and "Let desktop apps access your microphone".

**Fontes** looks sources up by DOI or ISBN, has eight citation styles, sorts
and filters by tag, edits a source in place, and reads and writes BibTeX and
RIS (the formats Zotero, Mendeley and EndNote use).

## The quick way: the installer

Nothing is built on your PC, and Python is not needed. GitHub builds Carpe
Diem on its own Windows computer and makes the installer.

1. **Back up first, if you already use Carpe Diem.** In your current Carpe
   Diem choose Backup, then Export to file, and keep the file. The installer
   also makes its own copy (see below), but a file of your own is the surest.
2. **Get the installer.** Take **Carpe-Diem-1047-Windows-Setup.exe** from this
   package, or from the repository's Releases page, release "Carpe Diem for
   Windows".
3. **Open it.** Windows SmartScreen may say it protected your PC, because the
   installer is not signed with a paid certificate: click **More info**, then
   **Run anyway**. Tick "Put Carpe Diem on the Desktop" if you want it there,
   then click Next, then Install. No administrator password is asked.
4. **Open Carpe Diem** from the installer's last page, the Start menu, or the
   Desktop.

**Your work is not kept with the program.** It lives in
%LOCALAPPDATA%\CarpeDiem\storage, the same folder the single Carpe Diem.exe
has always used, so the installed Carpe Diem opens on the work you already
have. Before it changes anything, the installer closes Carpe Diem if it is
open and copies that folder to %LOCALAPPDATA%\CarpeDiem\backups\setup- followed
by the date and time. It only copies; it never moves or deletes your work.

**To update** to a later build, open the later installer the same way.
**To remove Carpe Diem**: Settings, Apps, Carpe Diem, Uninstall. Your work
stays in its own folder.

**The portable app, for a USB stick.** Carpe-Diem-Windows.zip still holds the
single Carpe Diem.exe, which runs from any folder with nothing installed and
uses the same work folder. Once Carpe Diem is installed, you may delete an old
Carpe Diem.exe from your Desktop: your work is not inside it.

Before it is published, GitHub's Windows computer builds both, opens each
once, installs the installer silently, opens the installed copy, uninstalls
it, and checks that the work folder was not touched. If any of that fails,
nothing is published.

**What GitHub's build of 1047 showed** (9 October 2026, on a Windows Server
2025 computer, not one of your laptops). The installer, about 27 MB, ran
silently without administrator rights and ended without an error. Carpe
Diem.exe, the Start menu shortcut and the Desktop shortcut were all in place,
and one safety copy of the work folder had been made first. The installed
Carpe Diem was still running 25 seconds after it was opened. Uninstalling
removed the program and left the work folder untouched. The portable Carpe
Diem.exe and the folder version were each opened once and ran without a
recorded fault.

## Rebuilding the app yourself on GitHub

1. Upload the CONTENTS of the "Windows project" folder to a GitHub repository
   (or use carpe-this-diem).
2. The recipe lives in a folder named `.github`, which can be left behind when
   uploading. If it is: on GitHub click Add file, Create new file, type the
   name `.github/workflows/build-windows-app.yml`, paste the whole of
   **GITHUB_WORKFLOW_paste_this.txt**, and commit. If GitHub says the file
   exists already, it uploaded; skip this.
3. Open the Actions tab. "Build Carpe Diem for Windows" runs for a few minutes.
   A green tick means it worked.
4. The installer is on the Releases page as
   Carpe-Diem-<build>-Windows-Setup.exe, beside the portable
   Carpe-Diem-Windows.zip, and both are under Artifacts on the run's page.

To update the app with a newer carpe_diem.html, upload the new file in place of
the old one (same name) and change the Pass line in BUILD_INFO.txt to the new
build number. GitHub builds again by itself.

Note on cost: for a private repository GitHub counts each minute on its Windows
computers as more than one minute of your monthly allowance (twice, as far as I
know). One build takes a few minutes. Please check GitHub's current figures on
its billing pages.

## Building it on your own PC instead

Two ways in. The first needs nothing at all.

---

### 1. Just open it

Double-click **carpe_diem.html**.

That single file is the entire application. It opens in your browser and runs
completely offline: no account, no connection, nothing uploaded, nothing
installed. If you never do anything else in this folder, you still have the whole
of Carpe Diem.

### 2. Build it as a proper Windows app

This gives you **Carpe Diem.exe**: its own window, its own icon, no browser
around it. You build it once on a PC that has Python 3 and an internet
connection. The finished exe then runs on any Windows PC with nothing installed.

1. Install Python 3 from <https://www.python.org/downloads/> if you do not have
   it. **On the first screen, tick "Add Python to PATH".**
2. Double-click **Build Carpe Diem (Windows).bat**.
3. Wait. It takes a few minutes and the window will look idle while it works.
4. When it finishes it opens the `dist` folder. Your app is
   **dist\Carpe Diem.exe**.

**It is one single file.** Move it to the Desktop, copy it to a USB stick, send
it to another PC. Nothing needs to travel beside it.

> This is deliberate. The previous recipe produced a *folder* app where the exe
> had to stay next to an `_internal` folder, and moving the exe on its own gave
> `Failed to load Python DLL '...\_internal\python314.dll'`. A single-file build
> cannot fail that way. The only cost is a second or two of extra start-up time,
> because it unpacks itself each run.

### If the build does not finish

The script writes everything to **build_log.txt** in this folder and tells you
where it is. Send that file and the cause can be identified exactly.

It also checks your internet connection *before* pip spends a minute retrying, so
a network problem is reported in one line rather than twenty.

### Building with no internet

Downloading PyInstaller needs the internet once; there is genuinely no way to
build a standalone app without it. If this PC is offline, on any connected PC run

```
py -m pip download pyinstaller pywebview -d wheels
```

then copy the resulting `wheels` folder next to this file and run the build
again. It will install from there and never touch the network.

### The first time you open the exe

Windows SmartScreen may warn you, because the exe is not code-signed. Click
**More info**, then **Run anyway**. You only do this once. Code signing needs a
paid certificate.

---

---

## If it crashes on first run

Two causes account for nearly all of it, and both are fixed in this copy of the
build recipe. If you built an exe from an earlier download, **build it again from
this folder**: the old exe was missing files it needed at start-up.

1. **The exe crashed immediately.** A single-file build has to carry pywebview's
   own JavaScript and, on Windows, the .NET pieces pythonnet uses. The older
   recipe named the Python modules but not those files, so the exe started and
   then died reaching for something that was never packed. There is no traceback
   in that case because the failure happens below Python, which is why it looked
   like a plain crash.

2. **Microsoft Edge WebView2 runtime is missing.** It is present on almost every
   up-to-date Windows 10 and 11, but not always. Carpe Diem now falls back to
   opening in your browser rather than dying, and tells you so.


3. **A malformed address for the app file.** The window was handed a bare
   Windows path rather than a proper `file:///` address. Edge WebView2 refuses
   that navigation inside itself, below Python, so the window died with nothing
   written down. It now receives the same kind of address the studio windows
   always used.

4. **The wrong engine.** Left to choose, the window component can settle on
   MSHTML, the old Internet Explorer engine, when a .NET bridge is present but
   the Edge runtime is not. MSHTML cannot run this app, and fails somewhere
   inside the page rather than saying so. Edge WebView2 is now asked for by
   name, with three ordered fallbacks behind it and the browser last.

### Two HP laptops, two different crashes, both addressed

Reported from the field, and both signatures are useful:

* **AMD Ryzen with Radeon graphics: died on the very first click.** That is the
  signature of a crash inside the web view's *graphics* process, which takes the
  whole program with it and leaves nothing in any log, because the failure is
  below Python entirely. Carpe Diem now starts Edge WebView2 with graphics
  compositing turned off, which costs nothing you would notice. If a run still
  ends without finishing, the next run turns graphics acceleration off
  altogether, and if that happens twice in a row it opens in your browser
  instead of trying a third time. It is self-correcting: you do not have to
  change a setting.

* **Intel Core i5: ran until a studio was opened, then crashed.** Opening a
  studio used to create a SECOND web view inside the same program, and a second
  web view is the single most fragile thing this kind of app can ask for.
  On Windows it no longer does. Studios now open in the app's own floating
  windows, drawn inside the page: they resize from every edge and corner,
  remember their size and place, fold into the dock at the lower left and answer
  the tabs along the top. Nothing is lost except the crash.

From build 1059 a room's own desktop window is back, on by default: the ↗ key on a
floating window offers "Open in its own window on this device", and the window
shares the desk's work, notes and Clepsydra. If a run ends badly while such a
window is open, the next run offers none and says so; the run after that offers
them again. To keep everything in one window, set the environment variable
`CARPE_DIEM_NATIVE_WINDOWS` to `0` before starting.

### Run it without building anything

Double-click **Run Carpe Diem (Windows).bat**. It opens the app in its own window
using the Python you already have, installs the one component it needs if that is
absent, and **stays open to print the reason** if anything fails. This is the
quickest way to see a real message instead of a window that vanishes.

### Where the evidence is

* `carpe_diem_crash.log` — beside the program, or in your user folder if the
  program sits somewhere read only. Every start and every fault is recorded.
* `build_log.txt` — beside the builder, if the build itself failed.

Send either file and the cause can be named rather than guessed.

### And the guarantee that never depends on any of this

`carpe_diem.html` in this folder **is** the whole application. Double-click it and
it runs offline in your browser with nothing installed, no Python, no build, no
runtime. Every feature is there.

## What is in this folder

| File | What it is |
| --- | --- |
| `carpe_diem.html` | The entire application. One file. |
| `Build Carpe Diem (Windows).bat` | Builds the standalone exe. Needs Python 3. |
| `Run Carpe Diem (Windows).bat` | Runs the app in its own window without building. |
| `carpe_diem_app.py` | The window the app runs in. Not run directly. |
| `carpe_diem.spec` | The recipe for the portable single exe. Not run directly. |
| `carpe_diem_onedir.spec` | The recipe for the installed app, a folder. Not run directly. |
| `build/carpe_diem.iss` | The installer's recipe, for Inno Setup on GitHub. |
| `build/quiet_console.py` | A small part of the installed app's build. |
| `carpe_diem.ico`, `carpe_diem.png` | The Carpe Diem seal, used as the app icon. |
| `BUILD_INFO.txt` | The build number (Pass) the release notes read. |
| `.github/workflows/build-windows-app.yml` | The recipe GitHub follows to build the installer and the exe. |
| `GITHUB_WORKFLOW_paste_this.txt` | The same recipe, as a visible file. |

The guided Python installer and the Python launcher script have been removed from
this bundle. Only the standalone route is here now.

The build creates a hidden `.buildenv` folder for its own tools, so it cannot
collide with any Python setup you already have. You can delete `.buildenv`,
`build` and `build_log.txt` afterwards; keep `dist`.

Nothing in this folder connects to the internet. The application contains no
network code at all, which you can confirm yourself: open `carpe_diem.html`, open
your browser's network tab, reload, and watch nothing be requested.

## If the build script stops early

**You never need it.** `carpe_diem.html` in this folder is the whole app.
Double-click it and it runs offline, with nothing installed. The script only
wraps that same app as an `.exe`, which is a convenience, not a requirement.

If it does stop, it now prints the last lines of its own log on screen, so the
reason is visible without opening anything. Two causes are worth naming:

**"No build tool exists yet for this version of Python."**
PyInstaller lags a few months behind each new Python release, so a very new
Python cannot build an exe at all. Install Python 3.12 or 3.13 alongside the
one you have and run the script again. Windows keeps both happily.

**"This step needs the internet once."**
Only the first run needs it, to fetch PyInstaller. Either connect and run it
again, or on any connected PC run `py -m pip download pyinstaller pywebview -d wheels`
and copy the resulting `wheels` folder next to the script.

An earlier version of the script could report the second of these wrongly. It
asked the network for an IPv4 address alone, so a connection answering only
over IPv6, or one behind a proxy, looked offline when it was not. It now tries
the download regardless and only blames the network if the download itself
fails that way.

## If the app closes the moment you open it

This was possible until now, and the cause was not in Carpe Diem itself.

On Windows the window is drawn by Microsoft's **Edge WebView2** runtime, reached
through a component called pywebview. If that runtime is absent, or the piece
that loads it will not start, the failure happened *before* anything was drawn,
and a windowed program with no console has nowhere to say so. The result was an
icon you clicked and a window that never came.

Three separate steps could fail that way, and all three are now caught: loading
the component, creating the window, and starting it. Whichever fails, Carpe Diem
now **opens the same page in your browser instead** and tells you why, writing
the details to `carpe_diem_crash.log` beside the program.

If you would rather have the separate window back, install the free **Microsoft
Edge WebView2 Runtime** from Microsoft's site and open the app again. Most
Windows 11 PCs already have it; some Windows 10 ones do not.

## If the built app seems to do nothing

It cannot any more, and this is worth knowing about because it used to be
possible. The exe is built as a windowed program, which on Windows means it has
no console: anything it wrote as text went nowhere, so a failure looked like an
icon you double-clicked to no effect.

Every failure now shows a dialog, and where possible the app carries on anyway:

* **No native window can be created**, usually because the Microsoft Edge
  WebView2 runtime is absent. Carpe Diem opens itself in your default browser
  instead and says so. Everything works the same there.
* **The pywebview component is missing**, which happens if the build was
  interrupted. Again it opens in the browser and says so.
* **carpe_diem.html is not beside the program.** It says exactly that.
* **Anything else** writes a crash note and tells you the path to it, and
  reminds you that carpe_diem.html on its own is the whole app.

The build recipe also names the pywebview backends outright, because
PyInstaller cannot see them: the backend is chosen while the app runs, so
nothing in the source mentions it by name. Left out, the exe built perfectly
and then refused to open a window.


## Moving the app

The portable Windows app is the single file made by Build, Carpe Diem.exe. It
carries the whole app inside, so it runs from the Desktop, a USB stick, or any
folder you move it to, with nothing beside it. The Run script is different: it
starts the app from the source files and needs carpe_diem.html in the same
folder. If you ever see a message about keeping carpe_diem.html in the folder,
you are using Run or the loose folder; use the Build exe instead, or just open
carpe_diem.html on its own, which is the whole app, offline.
