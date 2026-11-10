"""Tabula prints in colour: Print sends the document itself, as it looks by day, to the device's print dialog.

The owner: "I can't print in color in Tabula no matter what I try ... Tabula turns it to gray scale."

In the Mac app, Print made a PDF of Tabula's own (cdBuildPdf: black Times text, no colour, no highlight, no picture)
and handed that to Preview; measured, 0 % of its pixels carry colour. In a browser by night, the page was printed with
the night's pale ink on white paper. Print now builds a clean copy of the document (its text colours, highlights,
shaded cells and pictures as by day, never the night's inks, never the page marks of the screen) and prints that:
in a frame of its own where the browser can print a frame, and through the app's own window where it cannot (the
Mac app). Colours are marked to be kept ("print-color-adjust: exact"), so highlights and shading print without the
dialog's "background graphics" box. Export, PDF Document, is as it was."""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SETUP_OLD = """var pageMargin="1in",pageSize="8.5in 11in",zoom=1,painter=null,tracking=false,endCount=0,enBox=$('endnotes');"""
SETUP_NEW = SETUP_OLD + "window.cdPageSetup=function(){return{size:pageSize,margin:pageMargin};};"
DOC_OLD = "window.cdPrintDocument = function () {\n  var name = 'Untitled';\n  try { if (window.cdDocName) name = window.cdDocName(); } catch (e) {}\n  function native() { try { window.print(); } catch (e) {} }\n  try {\n    if (window.cdBuildPdf && window.cdPrintViaHost) {\n      var bytes = window.cdBuildPdf();\n      if (bytes) { window.cdPrintViaHost(name + '.pdf', 'application/pdf', bytes, native); return; }\n    }\n  } catch (e) {}\n  native();\n};\n"


def patch(room):
    new = open(os.path.join(HERE, "tabula_print.js"), encoding="utf-8").read()
    for old, rep in ((SETUP_OLD, SETUP_NEW), (DOC_OLD, new)):
        if room.count(old) != 1:
            raise SystemExit("Tabula print: found %d times: %r" % (room.count(old), old[:70]))
        room = room.replace(old, rep)
    return room


if __name__ == "__main__":
    import sys
    open(sys.argv[2], "w", encoding="utf-8").write(patch(open(sys.argv[1], encoding="utf-8").read()))
    print("patched", sys.argv[2])
