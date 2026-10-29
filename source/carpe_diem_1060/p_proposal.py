"""1060 · the proposal's date, title and sections.

The owner's words (29 October 2026): "The Proposal Draft keeps on showing on my Overview page that it is overdue but I
don't know where I can go to edit the date or remove it. Please remove the date and reset it everywhere inside of the
app, I want to be able to put in a new date if and when it suits me. I don't want it preset and wired inside of the
app", and "The 'Rename the Proposal' function does not actually allow me to rename the proposal, it opens up this weird
long panel that shows the curriculum's terms ... I tried to change the proposal's deadline date and it did not change
anything".

Measured in 1059: a new desk set the target 42 days after its first start (proposalTarget: cdRelDay(42)) and so did each
milestone (+42 to +112 days); three lines wrote a fixed date whatever was chosen (16 September 2026 twice, and in French
31 August 2026); "Rename the proposal" opened the curriculum's names (openLabelEditor), whose date field changed the
countdown but not those three lines.

Now: no edition sets a date for the owner (the demonstrations keep a sample date, always ahead of the visit); the owner's
own desk has its proposal date cleared once, as asked; every line reads the date that is set, or says none is; "Rename
the proposal" opens the proposal's own details (its working title, its target date with Clear, its sections' names), and
the curriculum's names have their own panel, named for what it does. The proposal's date and its milestone are one."""


def apply(p, full):
    core = "core"
    # 1. no preset date in the owner's edition
    if full:
        p.rep('    proposalTarget: cdRelDay(42),\n', '    proposalTarget: "",\n', where=core)
        for d in ("42", "56", "70", "112"):
            n = 2 if d == "112" else 1
            p.rep('date: cdRelDay(%s), done: false' % d, 'date: "", done: false', count=n, where=core)

    # 2. the lines that wrote a fixed date
    p.alt(['text: doneSubs + tr("cand.of", " of ") + totalSubs + tr("cand.itemsTarget", " items complete \\u00b7 target 16 September 2026") }',
           'text: doneSubs + tr("cand.of", " of ") + totalSubs + tr("cand.itemsTarget", " items complete") }'],
          'text: doneSubs + tr("cand.of", " of ") + totalSubs + cdPropTargetLine(true) }', where=core)
    p.alt(['text: doneSubs + " of " + totalSubs + " items complete. Target date: 16 September 2026." }',
           'text: doneSubs + " of " + totalSubs + " items complete." }'],
          'text: doneSubs + (state.lang === "fr" ? " sur " : " of ") + totalSubs + cdPropTargetLine(false) }', where=core)

    # 3. the Overview's proposal panel
    old_ov = ('  if (days == null) line(p2, tr("ov.noTarget", "No target set."), false);\n'
              '  else if (days >= 0) bigNum(p2, days, tr("ov.daysToDraft", "days to the first full draft \\u23F3"), false);\n'
              '  else bigNum(p2, Math.abs(days), tr("ov.daysPast", "days past the draft target"), true);\n'
              '  line(p2, tr("ov.target", "\\u{1F3AF} Target: 16 September 2026."), true);\n')
    new_ov = ('  const _frP = state.lang === "fr";\n'
              '  if (state.proposalTitle) p2.appendChild(el("div", { style: { fontFamily: "var(--cd-serif)", fontSize: "15px", fontStyle: "italic", color: "var(--text-primary)", margin: "2px 0 6px" }, text: state.proposalTitle }));\n'
              '  if (days == null) line(p2, _frP ? "Aucune date n\\u2019est fix\\u00e9e. Choisissez-en une si et quand cela vous convient." : "No target date is set. Choose one if and when it suits you.", false);\n'
              '  else if (days >= 0) { bigNum(p2, days, days === 1 ? (_frP ? "jour avant la date vis\\u00e9e \\u23F3" : "day to the target \\u23F3") : tr("ov.daysToDraft", "days to the first full draft \\u23F3"), false); line(p2, "\\u{1F3AF} " + (_frP ? "Objectif : " : "Target: ") + cdPropDateFmt(state.proposalTarget) + ".", true); }\n'
              '  else line(p2, _frP ? "La date choisie (" + cdPropDateFmt(state.proposalTarget) + ") est pass\\u00e9e. Choisissez-en une nouvelle quand cela vous convient, ou effacez-la." : "The date you chose (" + cdPropDateFmt(state.proposalTarget) + ") has passed. Choose a new one when it suits you, or clear it.", false);\n'
              '  jump(p2, days == null ? (_frP ? "Choisir une date \\u2192" : "Choose a date \\u2192") : (_frP ? "Modifier ou effacer la date \\u2192" : "Change or clear the date \\u2192"), () => openProposalDetails());\n')
    if full:
        p.rep(old_ov, new_ov, where=core)
    elif 'const p2 = panel(' in p.s:
        raise SystemExit("a demonstration with the Overview's proposal panel: not expected")

    # 4. the dashboard tile asked with the browser's prompt
    p.rep('  if (editable.type === "proposal") {\n    const newDate = prompt(tr("dlg.propTarget", "Proposal target date (YYYY-MM-DD):"), state.proposalTarget);\n'
          '    if (newDate && /^\\d{4}-\\d{2}-\\d{2}$/.test(newDate)) {\n      state.proposalTarget = newDate; saveState(); renderDashboard(); renderReminders();\n    }\n  } else',
          '  if (editable.type === "proposal") {\n    openProposalDetails();\n  } else', where=core)

    # 5. a passed date is said calmly, once, with the way to change it
    p.rep('list.push({ id: "prop-past", severity: "high", title: tr("rem.propWas","Proposal target was ") + Math.abs(days) + (Math.abs(days) === 1 ? tr("u.day"," day") : tr("u.days"," days")) + tr("rem.ago"," ago"), body: tr("rem.propSlipped","If the date has slipped, edit it to a realistic new target on the dashboard tile.") });',
          'list.push({ id: "prop-past-" + state.proposalTarget, severity: "low", title: state.lang === "fr" ? "La date choisie pour le projet est pass\\u00e9e" : "The date you chose for the proposal has passed", body: state.lang === "fr" ? "Choisissez une nouvelle date quand cela vous convient, ou effacez-la : Candidatus, Proposition, Renommer la proposition." : "Choose a new date when it suits you, or clear it: Candidatus, Proposal, Rename the proposal." });',
          where=core)

    # 6. "Rename the proposal" opens the proposal's own details
    p.rep('  renameBtn.onclick = () => openLabelEditor();\n', '  renameBtn.onclick = () => openProposalDetails();\n', where=core)

    # 7. the curriculum's names, in a panel named for what it does, without the proposal's date
    p.rep('head.appendChild(el("div", { class: "label-tiny", text: tr("re.title", "Rename for my proposal") }));',
          'head.appendChild(el("div", { class: "label-tiny", text: state.lang === "fr" ? "Renommer le cursus" : "Rename the curriculum" }));', where=core)
    a = p.s.find('  sectionLabel("PROPOSAL TARGET DATE");\n')
    b = p.s.find('  sectionLabel("TERMS AND MODULES");\n', a)
    if a < 0 or b < 0 or b - a > 2000 or p.s.count('  sectionLabel("PROPOSAL TARGET DATE");\n') != 1:
        raise SystemExit("the curriculum panel's date field was not where expected")
    p.s = p.s[:a] + p.s[b:]
    p.rep('  sectionLabel("TERMS AND MODULES");\n', '  sectionLabel(state.lang === "fr" ? "TRIMESTRES ET MODULES" : "TERMS AND MODULES");\n', where=core)
    p.rep('  sectionLabel("WEEKLY RHYTHM");\n', '  sectionLabel(state.lang === "fr" ? "RYTHME DE LA SEMAINE" : "WEEKLY RHYTHM");\n', where=core)

    # 8. a milestone without a date offers to set one; the proposal's milestone and its target are one
    p.rep('text: fmtMilestoneDate(m.date) });\n    dateBtn.onclick = () => {',
          'text: m.date ? fmtMilestoneDate(m.date) : (state.lang === "fr" ? "\\uff0b Choisir une date" : "\\uff0b Set a date") });\n    dateBtn.onclick = () => {', where=core)
    p.rep('      inp.onchange = () => { m.date = inp.value; saveState(); renderMilestonesView(); };',
          '      inp.onchange = () => { if (m.id === "ms-proposal") { cdSetProposalTarget(inp.value); } else { m.date = inp.value; saveState(); } renderMilestonesView(); };', where=core)
    p.rep('text: dl < 0 ? tr("ms.agoPre", "") + Math.abs(dl) + tr("ms.agoSuf", " days ago")',
          'text: dl < 0 ? (state.lang === "fr" ? "date pass\\u00e9e, \\u00e0 d\\u00e9placer quand cela vous convient" : "date passed: move it when it suits you")', where=core)
    p.rep('color: dl < 0 ? "rgba(190,60,60,0.9)" : "var(--text-tertiary)"', 'color: dl < 0 ? "var(--accent)" : "var(--text-tertiary)"', where=core)

    # 9. the proposal's own details panel, with its helpers, after the curriculum's
    anchor = '\nfunction cdSyncFavicon() {\n'
    p.rep(anchor, '\n' + DETAILS + anchor, where=core)

    # 10. the working title above the proposal's progress
    p.rep('  root.appendChild(hero);\n  const wsRow = el("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" } });',
          '  try { const _t = el("button", { class: "cd-prop-title" + (state.proposalTitle ? "" : " cd-prop-untitled"), type: "button", text: state.proposalTitle || (state.lang === "fr" ? "Sans titre : donnez-lui un titre de travail" : "Untitled: give it a working title") }); _t.onclick = () => openProposalDetails(); hero.insertBefore(_t, hero.firstChild); } catch (e) {}\n'
          '  root.appendChild(hero);\n  const wsRow = el("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" } });', where=core)


DETAILS = r'''function cdPropDateFmt(iso) { try { return fmtMilestoneDate(iso) || iso || ""; } catch (e) { return iso || ""; } }
function cdPropTargetLine(dot) {
  const fr = state.lang === "fr";
  if (!state.proposalTarget) return dot ? (fr ? " éléments terminés · aucune date fixée" : " items complete · no target date set") : (fr ? " éléments terminés. Aucune date n’est fixée." : " items complete. No target date is set.");
  return dot ? (fr ? " éléments terminés · objectif " : " items complete · target ") + cdPropDateFmt(state.proposalTarget) : (fr ? " éléments terminés. Objectif : " : " items complete. Target date: ") + cdPropDateFmt(state.proposalTarget) + ".";
}
function cdPropRerender() {
  ["renderDashboard", "renderReminders", "renderCandidature", "renderOverview"].forEach(function (f) { try { if (typeof window[f] === "function") window[f](); } catch (e) {} });
  try { if (window.cdFocus && cdFocus.mount) cdFocus.mount(); } catch (e) {}
}
function cdSetProposalTarget(v) {
  v = (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) ? v : "";
  state.proposalTarget = v;
  try { ((state.candidature && state.candidature.milestones) || []).forEach(function (m) { if (m && m.id === "ms-proposal") m.date = v; }); } catch (e) {}
  saveState();
  cdPropRerender();
}
function openProposalDetails() {
  const fr = state.lang === "fr";
  const root = $("#modal-root"); if (!root) return; clear(root);
  const backdrop = el("div", { class: "modal-backdrop", onclick: (e) => { if (e.target === backdrop) closeModal(); } });
  const modal = el("div", { class: "modal cd-prop-details", role: "dialog", "aria-modal": "true", "aria-label": fr ? "Renommer la proposition" : "Rename the proposal", style: { maxWidth: "560px", maxHeight: "88vh", overflowY: "auto" } });
  const head = el("div", { style: { padding: "14px 18px", borderBottom: "0.5px solid var(--hairline-soft)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", position: "sticky", top: "0", background: "var(--surface)", zIndex: "2" } });
  head.appendChild(el("div", { class: "label-tiny", text: fr ? "Renommer la proposition" : "Rename the proposal" }));
  const x = el("button", { class: "btn btn-ghost btn-xs", text: tr("ui.closePlain", "Close") });
  x.onclick = () => closeModal();
  head.appendChild(x);
  modal.appendChild(head);
  const body = el("div", { style: { padding: "16px 18px 20px" } });
  body.appendChild(el("p", { style: { fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 6px" }, text: fr ? "Donnez à votre proposition son titre de travail, renommez ses sections, et choisissez une date seulement si et quand cela vous convient. Laissez un champ vide pour garder le nom d’origine." : "Give your proposal its working title, rename its sections, and choose a date only if and when it suits you. Leave a field blank to keep the original name." }));
  const label = (t) => body.appendChild(el("div", { class: "label-tiny", style: { margin: "16px 0 7px", color: "var(--accent)" }, text: t }));
  const inputStyle = { width: "100%", fontSize: "13.5px", padding: "8px 11px", borderRadius: "9px", border: "1px solid var(--hairline)", background: "var(--surface-soft)", color: "var(--text-primary)", fontFamily: "inherit", boxSizing: "border-box" };

  label(fr ? "TITRE DE TRAVAIL" : "WORKING TITLE");
  const title = el("input", { class: "cd-prop-in", style: inputStyle });
  title.type = "text"; title.value = state.proposalTitle || ""; title.placeholder = fr ? "Proposition sans titre" : "Untitled proposal"; title.maxLength = 240;
  title.setAttribute("aria-label", fr ? "Titre de travail" : "Working title");
  title.onchange = () => { state.proposalTitle = title.value.trim(); saveState(); cdPropRerender(); };
  body.appendChild(title);

  label(fr ? "DATE VISÉE (FACULTATIVE)" : "TARGET DATE (OPTIONAL)");
  const row = el("div", { style: { display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" } });
  const date = el("input", { class: "cd-prop-in", style: Object.assign({}, inputStyle, { width: "auto", minWidth: "170px", flex: "0 1 220px" }) });
  date.type = "date"; date.value = state.proposalTarget || ""; date.setAttribute("aria-label", fr ? "Date visée" : "Target date");
  const clearB = el("button", { class: "btn btn-soft btn-sm", type: "button", text: fr ? "Effacer la date" : "Clear the date" });
  const note = el("div", { style: { fontSize: "11.5px", color: "var(--text-tertiary)", marginTop: "6px", lineHeight: "1.5" }, role: "status" });
  const say = () => {
    if (!state.proposalTarget) { note.textContent = fr ? "Aucune date n’est fixée. L’application n’en choisit jamais une pour vous." : "No date is set. The app never chooses one for you."; clearB.disabled = true; return; }
    clearB.disabled = false;
    const dl = milestoneDaysUntil(state.proposalTarget);
    note.textContent = (fr ? "Enregistrée : " : "Saved: ") + cdPropDateFmt(state.proposalTarget) + (dl == null ? "" : dl > 0 ? (fr ? ", dans " + dl + " jour" + (dl > 1 ? "s" : "") : ", " + dl + " day" + (dl > 1 ? "s" : "") + " away") : dl === 0 ? (fr ? ", aujourd’hui" : ", today") : (fr ? ", déjà passée" : ", already passed")) + (fr ? ". Le jalon du premier brouillon suit cette date." : ". The first-draft milestone follows this date.");
  };
  date.onchange = () => { cdSetProposalTarget(date.value); say(); };
  clearB.onclick = () => { date.value = ""; cdSetProposalTarget(""); say(); };
  row.appendChild(date); row.appendChild(clearB);
  body.appendChild(row); body.appendChild(note); say();

  label(fr ? "SECTIONS" : "SECTIONS");
  let secs = [];
  try { secs = ensureProposalSections(); } catch (e) { secs = []; }
  if (!state.proposalSectionDefaults || typeof state.proposalSectionDefaults !== "object") state.proposalSectionDefaults = {};
  const defs = state.proposalSectionDefaults;
  secs.forEach((s) => {
    if (!s || !s.id) return;
    if (!defs[s.id]) defs[s.id] = s.title;
    const inp = el("input", { class: "cd-prop-in", style: Object.assign({}, inputStyle, { marginBottom: "6px" }) });
    inp.type = "text"; inp.value = s.title === defs[s.id] ? "" : s.title; inp.placeholder = trd(defs[s.id]); inp.maxLength = 160;
    inp.setAttribute("aria-label", (fr ? "Section : " : "Section: ") + trd(defs[s.id]));
    inp.onchange = () => { const v = inp.value.trim(); s.title = v || defs[s.id]; saveState(); cdPropRerender(); };
    body.appendChild(inp);
  });

  const foot = el("div", { style: { marginTop: "18px", paddingTop: "14px", borderTop: "0.5px solid var(--hairline-soft)", display: "flex", gap: "8px", flexWrap: "wrap" } });
  const cur = el("button", { class: "btn btn-ghost btn-sm", type: "button", text: fr ? "✎ Renommer le cursus (trimestres, modules, semaines)…" : "✎ Rename the curriculum (terms, modules, weeks)…" });
  cur.onclick = () => { closeModal(); openLabelEditor(); };
  foot.appendChild(cur);
  body.appendChild(foot);
  modal.appendChild(body);
  backdrop.appendChild(modal);
  root.appendChild(backdrop);
  try { setTimeout(() => title.focus(), 30); } catch (e) {}
}
'''
