# -*- coding: utf-8 -*-
"""1089 · the install kits are made even when Ubuntu's package server does not answer.

usage: kits_step.py GIFT_REPO        (the edit is made once; a second run finds it made and stops)

On 11 November 2026 the kits of builds 1087 and 1088 were not made: GitHub's Ubuntu machine could not reach Ubuntu's
package server ("Temporary failure resolving 'azure.archive.ubuntu.com'") while installing the headless browser's
system libraries, three times in a row. Those libraries are already on GitHub's Ubuntu machines, so the browser is now
installed on its own, and the libraries are asked for separately: if the package server does not answer, a warning
says so and the kits are made with the libraries the machine has. If a library were really missing, the next step
(making the kits) would fail and say why."""
import os, sys

OLD = "          npx playwright install --with-deps chromium > /dev/null\n"
NEW = ("          npx playwright install chromium > /dev/null\n"
       "          # build 1089: the browser's system libraries are already on GitHub's Ubuntu machines; installing them again\n"
       "          # needs Ubuntu's package server, which did not answer on 11 November 2026 (builds 1087 and 1088 had no\n"
       "          # kits), so a failure there is noted and the kits are made with the libraries the machine has\n"
       "          npx playwright install-deps chromium > /dev/null 2>&1 || echo \"::warning::The browser's system libraries could "
       "not be installed from Ubuntu's package server; the kits are made with those already on this machine.\"\n")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    p = os.path.join(sys.argv[1], ".github", "workflows", "build-kits.yml")
    t = open(p, encoding="utf-8").read()
    if NEW in t:
        sys.exit("the kits step is hardened already")
    if t.count(OLD) != 1:
        sys.exit("the kits step is not as this edit expects")
    open(p, "w", encoding="utf-8").write(t.replace(OLD, NEW))
    print("  .github/workflows/build-kits.yml: the browser and its libraries are installed apart")
