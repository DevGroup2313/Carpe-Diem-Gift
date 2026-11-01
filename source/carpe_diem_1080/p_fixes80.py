"""1080 · four things the owner saw (1 November 2026).

1. "The little hover cards for the Ascensus page and its tabs ... are entirely transluscent and almost ineligible in Dark
   mode." The name card (#cd-name-tip, block cd-ctxmenu-843) takes the look of the key it names. When that key's face is a
   gradient, the card was given the gradient alone; by night the keys' faces are a faint white veil, so the card had no
   surface and the page showed through it. The gradient is now laid over the solid colour beneath the key, by day and by
   night, wherever the card appears.
2. "The side emoji buttons do not show inside of the 'Ask the Librarian' chat page only the collapsible chevron ... they
   appear behind the page on the apps Homepage." The Librarian's and Magister's conversations (1077) open in the modal
   root, and the panel watch (cd-panel-watch) counted any child there as a panel, which hides the side keys. A
   conversation is a page, not a panel: the side keys now stay with it, above it, and the chevron folds them there.
3. "The Fontes button on the Candidatus/Projects page is missing its app symbol." Home's Fontes key carries its small
   drawing; the Proposal's and the Citations' Fontes keys were made as words alone. They now carry the same drawing.
4. "I want the 'Offline By Design' card to only be tan on Folio mode and to be white acrylic on Classic mode." By day in
   Classic the card is white acrylic: a frosted white surface over the page, with the app's raised edge. Folio keeps its
   tan card; night is unchanged."""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ICON = ('<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#145671" stroke-width="1.7" stroke-linecap="round" '
        'stroke-linejoin="round"><path d="M5 19h14"/><path d="M8.2 19c0-2.9 1.5-4.9 3.8-6.2 2.3 1.3 3.8 3.3 3.8 6.2"/>'
        '<path d="M12 12.8V5"/><path d="M9.5 7.5C10.1 6.4 11 5.5 12 5c1 .5 1.9 1.4 2.5 2.5"/></svg>')


def apply(p, full):
    if 'id="cd-fixes-1080-css"' in p.s:
        raise SystemExit("fixes80: already applied")
    if ICON not in p.s:
        raise SystemExit("fixes80: Home's Fontes drawing is not where it was")

    # 1. the name card: the key's gradient over the colour beneath it
    p.rep("tip.style.background = look.image || look.bg;",
          "tip.style.background = look.image ? look.image + ',' + look.bg : look.bg;")

    # 2. a conversation is a page: only a real panel in the modal root hides the side keys
    p.rep("try { var mr = document.getElementById('modal-root'); if (mr && mr.childElementCount) return true; } catch (e) {}",
          "try { var mr = document.getElementById('modal-root'); if (mr && mr.childElementCount && !(mr.childElementCount === 1 && mr.firstElementChild.classList.contains('cdc'))) return true; } catch (e) {}")

    # 3. the Fontes keys of the Proposal and the Citations carry Home's drawing
    p.rep('var _fb = el("button", { class: "fontes-btn", text: "Fontes" });',
          'var _fb = el("button", { class: "fontes-btn" }); _fb.innerHTML = \'' + ICON + '\' + "Fontes";', where="core")
    p.rep('var _cfb = el("button", { class: "fontes-btn", style: { marginBottom: "12px" }, text: "Fontes" });',
          'var _cfb = el("button", { class: "fontes-btn", style: { marginBottom: "12px" } }); _cfb.innerHTML = \'' + ICON + '\' + "Fontes";', where="core")
    p.rep('<button type="button" class="fontes-btn" data-c="fontes">Fontes</button>',
          '<button type="button" class="fontes-btn" data-c="fontes">' + ICON + 'Fontes</button>')

    # 4. Offline by design: white acrylic in Classic by day
    css = open(os.path.join(HERE, "fixes80.css"), encoding="utf-8").read()
    if "</style" in css:
        raise SystemExit("fixes80: a closing tag inside fixes80.css")
    p.before_body_end('<style id="cd-fixes-1080-css">\n' + css + "\n</style>")
    print("    the name card's surface, the side keys with a conversation, the Fontes drawing, Offline by design")
