"""1075 · the backup sheet's "This file holds" list names everything the file holds.

Found after 1074: the list named the study only under the owner's store key, so a backup made in a demonstration (whose
store is carpe_diem_demo_v1) did not say it held the study; and it named Tabula only by its small keys, so a backup
holding only Tabula's large store (tabula-big, carried since 1074) did not name Tabula."""

FIXES = [
    ("if (data.carpe_diem_offline_v1) L.push(",
     "if (data.carpe_diem_offline_v1 || (typeof STORAGE_KEY !== 'undefined' && data[STORAGE_KEY])) L.push("),
    ("if (n(/^tabula_/)) L.push(",
     "if (n(/^tabula_/) || idb['tabula-big']) L.push("),
]


def apply(p, full):
    a, b = p.block("cd-jewel-js")
    blk = p.s[a:b]
    for o, n in FIXES:
        if blk.count(o) != 1:
            raise SystemExit("holds: found %d times: %r" % (blk.count(o), o))
        blk = blk.replace(o, n)
    p.s = p.s[:a] + blk + p.s[b:]
    print("    the backup sheet names the study in every edition, and Tabula's large store")
