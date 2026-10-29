"""1061 · the small passing notes in the pastel card too.

The owner's words (29 October 2026), on the reminder cards: "I don't like this harsh blue colour ... I want the cards to
stay cream or light blue or pastel colours". The page's two small notes at the foot of the screen ("Carpe Diem and
Abacus side by side ...", and the note of the handwriting tools) were near-black boxes; they take the reminders' pastel
card. The old Ctrl+Shift+R shortcut of pass 1047, which drew a black box and reloaded without saving, gives way to
Refresh (pass 1060), which saves every open room first."""


def apply(p, full):
    p.rep("background:rgba(20,40,58,.90);color:#fff;padding:7px 13px;",
          "background:#eaf3f9;color:#173f57;border:1px solid #b9d5e6;box-shadow:0 2px 0 rgba(27,107,147,.14),0 8px 20px rgba(16,42,58,.16);padding:7px 13px;", count=2)
    a, b = p.block("cd-reset-shortcut")
    p.s = p.s[:a] + '<script id="cd-reset-shortcut"></script>' + p.s[b:]
