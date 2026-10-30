"""Load one of the apps' programs, hand it two files as Open With would, and record the JavaScript it sends."""
import importlib.util, json, sys, time, os
prog, out = sys.argv[1], sys.argv[2]
spec = importlib.util.spec_from_file_location("app", prog)
app = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app)
app.crash_log_path = lambda: os.path.join(os.path.dirname(out), "record.log")
sent = []
class W:
    def evaluate_js(self, js):
        if "cdHostOpenFile &&" in js:
            return True
        sent.append(js)
        return 0
class Api:
    pass
S = os.environ.get('CD_TEST_DIR', os.path.dirname(os.path.abspath(__file__)) + '/')
app.files_asked([S + "docs/chapter.docx", S + "pdfwork/article.pdf", S + "docs/plain.txt", "/no/such.pdf"])
app._deliver_files(Api(), W())
for _ in range(60):
    time.sleep(0.5)
    if sum(1 for j in sent if "cdHostOpenFile(" in j) >= 2:
        break
json.dump(sent, open(out, "w"))
print(len(sent), "calls;", open(app.crash_log_path()).read().replace("\n\n", "\n").strip())
