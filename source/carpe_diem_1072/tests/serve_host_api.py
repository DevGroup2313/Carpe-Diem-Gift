"""Load one of the apps' programs, ask it to open files as Open With would, then answer the page's requests (one JSON
request a line on stdin, one JSON answer a line on stdout), as pywebview passes them to the program's API."""
import importlib.util, json, os, sys
prog, logpath = sys.argv[1], sys.argv[2]
files = sys.argv[3:]
spec = importlib.util.spec_from_file_location("app", prog)
app = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app)
app.crash_log_path = lambda: logpath
class Desk:          # Carpe Diem's window, no Tabula window of its own open
    def _alive(self, which): return False
api_cls = app.CarpeApi
api = api_cls.__new__(api_cls)
api._wins = {}
api._alive = lambda which: False
app.files_asked(files)
print(json.dumps({"ready": True}), flush=True)
for line in sys.stdin:
    r = json.loads(line)
    try:
        out = getattr(api, r["m"])(*r["a"])
    except Exception as e:
        out = {"error": repr(e)}
    print(json.dumps(out), flush=True)
