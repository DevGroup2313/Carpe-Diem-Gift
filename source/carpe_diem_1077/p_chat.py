"""1077 · the Librarian's and Magister's conversations in the look the owner approved.

The owner's words (31 October 2026): "I love the chats new look for Magister and the Librarian, push it everywhere."

`chat.css` and `chat.js`: the two conversations laid out as Ingenium's chat, in its three looks (Carpe Diem: the
conversation in its raised card, each message raised; Soft: quieter messages; Clean: flat and open, like a page),
chosen from the ⋯ menu and kept, in Carpe Diem's colours (the Librarian's cream and gold, Magister's blue), by day and
by night: the top of the page with its keys, the messages lifting under the pointer with their own keys (read aloud,
copy, keep in my notes; edit, copy, ask again), the Librarian's books as cards with their spines and Open the book,
the moods and the prompts as keys, the composer, the end of a session. Everything the two pages did is done by the
app's own functions; should anything fail, the app draws its own page. Nothing else in the app changes."""
import os

HERE = os.path.dirname(os.path.abspath(__file__))


def read(n):
    t = open(os.path.join(HERE, n), encoding="utf-8").read()
    if "</script" in t or "</style" in t:
        raise SystemExit("chat: a closing tag inside " + n)
    return t


def apply(p, full):
    if 'id="cd-chat-1077' in p.s:
        raise SystemExit("chat: already applied")
    for f in ("function renderLibrarian(", "function renderMagisterChatView(", "function librarianSendFree(", "function librarianAct(", "function magisterSendChip(", "function magisterSendFree("):
        if p.s.count(f) != 1:
            raise SystemExit("chat: %s found %d times" % (f, p.s.count(f)))
    # the old Magister page's dresser (1047) took the first child of whatever conversation is open for its header: it
    # leaves the new pages, which carry their own look, alone
    a, b = p.block("cd-mag3d-1047-js")
    blk = p.s[a:b]
    old = "var room = root.firstElementChild; if (!room) return;"
    if blk.count(old) != 1:
        raise SystemExit("chat: the Magister dresser is not as expected")
    p.s = p.s[:a] + blk.replace(old, "var room = root.firstElementChild; if (!room || (room.classList && room.classList.contains('cdc'))) return;") + p.s[b:]
    p.before_body_end('<style id="cd-chat-1077-css">\n' + read("chat.css") + '\n</style>\n<script id="cd-chat-1077">\n' + read("chat.js") + "\n</script>")
    print("    the Librarian's and Magister's conversations in the approved look")
