# Evaluation copies of the two demonstrations

Copyright (c) 2026 Yannie D. Forest. All rights reserved.

What is sent to a committee, or put on a website, is never the page as built:

1. `make_eval.py IN.html OUT.html [--for "Panel"] [--copy CD-XXXXXX] [--until YYYY-MM-DD]` takes the public sample's or
   the committee demonstration's page (never the owner's own edition) and removes the tools that hand out the app's
   code: the mini Forge (The Forge's own page) and the page's copy of itself (Edit this app, copies of the app). It
   takes out comments and makes every script compact, the rooms' own included (`minify_html.js`, terser: local names
   shortened, white space gone, behaviour unchanged; the seal's stamp and data blocks are left as they are), makes the
   integrity seal again, and adds `eval.html`: the terms, shown before a committee's copy first opens, and a mark at
   the foot of the screen naming the copy (and its end date, if one is given).
2. `node lock_page.js IN.html OUT.html CODE seal240.png "Panel" CD-XXXXXX [YYYY-MM-DD]` seals a committee's copy: the
   page compressed and encrypted (AES-256-GCM; key from the access code by PBKDF2-SHA-256, 600,000 rounds) inside a
   small door (`lock_door.html`) that asks for the code. Without the code nothing of the page can be read. The code is
   remembered on the device once given, so Refresh and a room's own window open without asking again. The access code
   is never written into a repository or a package: it is sent apart.

Tests: `node t_eval.js URL` (terms, mark, every room, a sum in Abacus, the seal intact, the Forge and the copy of the
page gone, no error); `node t_lock.js FILE CODE` (from the file: a wrong code refused, the right one opening the app,
Refresh and a room's own window opening with no code asked). `npm install` here fetches terser.
