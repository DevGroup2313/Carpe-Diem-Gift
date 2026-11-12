"""1090 · the demonstrations' Guidebook: their two chapters with names of their own, each in its section.

Build 1089's sections (gb1089.js) place the Guidebook's chapters by their English titles. Two chapters have other
names in the demonstrations: Projects (the owner's Candidatus) and Renaming for your writing (the owner's Renaming for
your proposal). Neither was listed, so in the demonstrations both fell into a tenth section, More chapters. Projects
now stands in Your projects and Renaming for your writing in Reading and study, in English and in French. The owner's
edition has no chapters of those names and is unchanged."""


def apply(p, full):
    old = "items: ['Candidatus', 'Workspace'] },"
    if p.s.count(old) != 1:
        raise SystemExit("gbprojects90: the Your projects section of 1089 is not found once")
    p.rep(old, "items: ['Candidatus', 'Projects', 'Workspace'] },")
    p.rep("'Renaming for your proposal'] },", "'Renaming for your proposal', 'Renaming for your writing'] },")
    print("    Guidebook: the demonstrations' Projects and Renaming for your writing in their sections")
