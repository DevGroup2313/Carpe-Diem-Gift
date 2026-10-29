"""1060 · the About panel, shorter.

The owner's words (29 October 2026): "The paragraphs of the About panel are a bit too wordy and should be cut down to be
more consise, especially the seal paragraph, please cut down anything that is not necessary and superfluous from the page
so that it is an easier and cleaner read. Please keep the warm and intellectual register of Carpe Diem".

Each paragraph keeps what it must say (and every fact the audits rely on: no accounts, no AI but Scriba's named models,
what reaches the internet and only when asked), in about half the words; the seal's paragraph keeps only what the seal
means. English and French alike."""
import json, re

NEW = {
    "Carpe Diem is a tranquil haven": (
        "Carpe Diem est un cabinet d’étude discret et hors ligne, fait pour la lecture profonde et la pensée sans hâte. "
        "Il réunit une salle de lecture, la Clepsydre, minuterie de concentration nommée d’après l’horloge à eau antique, et les "
        "outils du lettré : Tabula pour écrire, Abacus pour les chiffres, Imago pour les présentations, afin qu’une journée de "
        "travail se déroule en un seul lieu paisible. Ni notifications ni comptes : votre travail reste sur votre appareil. "
        "Bilingue, il se veut moins un logiciel qu’un bureau bien tenu dans un coin préféré d’une bibliothèque.",
        "Carpe Diem is a quiet, offline study for deep reading and unhurried thought. It gathers a reading room, the "
        "Clepsydra focus timer, named after the ancient water clock, and a scholar’s tools: Tabula for writing, Abacus for "
        "figures, Imago for presentations, so that a day’s work can unfold in one calm place. There are no notifications and "
        "no accounts, and your work stays on your own device. It speaks English and French, and means to feel less like "
        "software than a well-kept desk in a favourite corner of a library."),
    "The seal that marks these pages": (
        "En son cœur, une fleur de lis, pour la moitié française du cursus ; son haut pétale central est une étagère de cinq "
        "livres : une bibliothèque à soi. Derrière elle, un soleil pour le jour que la devise invite à saisir ; autour, comme sur "
        "un vieux tampon de bibliothèque, Carpe Diem et la date où l’œuvre fut achevée, die XVI Augusti MMXXVI. Bleu et or le "
        "jour, or champagne la nuit.",
        "At its heart stands a fleur-de-lis, for the French half of the curriculum; its tall middle petal is a shelf of five "
        "books: a library of one’s own. Behind it, a sunburst for the day the motto asks you to seize; around it, as on an "
        "old library stamp, Carpe Diem and the date the work was finished, die XVI Augusti MMXXVI. Blue and gold by day, "
        "champagne gold by night."),
    "Carpe Diem has no accounts and needs no connection": (
        "Carpe Diem n’a pas de compte et n’a besoin d’aucune connexion ; votre travail reste sur cet appareil. Il n’a pas d’IA, "
        "à une exception près, nommée clairement : Scriba peut transcrire ce que vous dites avec un modèle de parole, et résumer "
        "un enregistrement avec un modèle d’écriture, chacun téléchargé une seule fois, à votre demande, puis exécuté sur cet "
        "appareil ou sur un ordinateur à vous. Scriba fonctionne aussi sans aucune IA. La dictée du navigateur ne sert que si "
        "vous la choisissez (Affichage, En ligne), car certains navigateurs envoient ce son à leur éditeur. Tout le reste, des "
        "questions de Magister à la visite et au Guide, est écrit à la main. Deux choses seulement passent par internet, et "
        "seulement à votre demande : le premier téléchargement d’un modèle de Scriba, et la recherche d’une source par son DOI "
        "ou son ISBN dans Fontes, que vous pouvez désactiver dans Affichage.",
        "Carpe Diem needs no account and no connection; your work stays on this device. It has no AI, with one exception, "
        "named plainly: Scriba can write out what you say with a speech model, and summarise a recording with a writing "
        "model, each downloaded once, only when you ask, then run on this device or on a computer of your own. Scriba also "
        "works with no AI at all. Your browser’s own dictation is used only if you choose it (Display, Online), since some "
        "browsers send that audio to their maker. Everything else, from Magister’s questions to the tour and the Guidebook, "
        "is written by hand. Only two things ever reach the internet, and only when you ask: Scriba’s first download of a "
        "model, and Fontes looking up a source by its DOI or ISBN, which you can switch off in Display."),
    "Every room is built on that line.": (
        "Chaque salle repose sur cette phrase : Carpe Diem ne fait jamais votre travail à votre place. Il vous montre où sont les "
        "choses et pourquoi elles comptent, puis vous rend la main, pour que vous appreniez en faisant.",
        "Every room is built on that line: Carpe Diem never does your work for you. It shows you where things are and why "
        "they matter, then hands the work back to you, so that you learn by doing."),
    "Carpe Diem is designed and built by Yannie D. Forest": (
        "Carpe Diem est conçu et développé par Yannie D. Forest, chercheuse dont le travail se situe entre les sciences sociales "
        "et les sciences humaines, né du souhait d’un espace d’étude qui respecte l’attention au lieu de la disputer : un lieu "
        "pour lire les classiques, ébaucher des idées et suivre les longs projets, loin du bruit du web, et cueillir le jour, "
        "une page à la fois.",
        "Carpe Diem is designed and built by Yannie D. Forest, a researcher whose work moves between the social sciences and "
        "the humanities. It grew from a wish for a study that respects attention rather than competing for it: a place to "
        "read the classics, draft ideas and follow long projects away from the noise of the web, and to seize the day one "
        "page at a time."),
}


def apply(p, full):
    a = p.s.find("function openAbout() {")
    if a < 0 or p.s.count("function openAbout() {") != 1:
        raise SystemExit("openAbout not found once")
    b = p.s.find("\nfunction ", a + 20)
    src = p.s[a:b]
    done = 0
    for start, (fr, en) in NEW.items():
        ms = [m for m in re.finditer(r'fr \? ("(?:[^"\\]|\\.)*") : ("(?:[^"\\]|\\.)*")', src) if json.loads(m.group(2)).startswith(start)]
        if len(ms) != 1:
            raise SystemExit("About: %r found %d times" % (start, len(ms)))
        m = ms[0]
        src = src[:m.start()] + "fr ? " + json.dumps(fr, ensure_ascii=False) + " : " + json.dumps(en, ensure_ascii=False) + src[m.end():]
        done += 1
    p.s = p.s[:a] + src + p.s[b:]
    if done != len(NEW):
        raise SystemExit("About: not every paragraph replaced")
