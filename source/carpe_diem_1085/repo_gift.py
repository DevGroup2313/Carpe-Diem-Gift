"""The build's numbers, for p_builders.py (the kits the page carries), read from notes.json; node24() as in pass 1060."""
import json, os, re

_n = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "notes.json"), encoding="utf-8"))
DATE, PASS, STAMP, PREV = _n["date"], _n["pass"], _n["stamp"], _n["prev"]
NODE24 = [(r"actions/checkout@v4\b", "actions/checkout@v5"), (r"actions/upload-artifact@v4\b", "actions/upload-artifact@v6"),
          (r"actions/download-artifact@v4\b", "actions/download-artifact@v7"), (r"actions/setup-python@v5\b", "actions/setup-python@v6"),
          (r"gradle/actions/setup-gradle@v4\b", "gradle/actions/setup-gradle@v5"), (r"actions/setup-java@v4\b", "actions/setup-java@v5"),
          (r"actions/cache@v4\b", "actions/cache@v5")]


def node24(t):
    for a, b in NODE24:
        t = re.sub(a, b, t)
    return t
