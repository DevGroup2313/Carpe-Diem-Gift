# The Windows program's taskbar identity code, driven against a fake shell32 whose property store is a real vtable of
# callbacks: the GUIDs, PROPERTYKEY and PROPVARIANT layouts, the vtable slots and the order of the values are checked.
import ctypes, importlib.util, sys, types, uuid
ctypes.WINFUNCTYPE = ctypes.CFUNCTYPE
from ctypes import wintypes
spec = importlib.util.spec_from_file_location("cdwin", sys.argv[1])
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
got = []
class GUID(ctypes.Structure):
    _fields_ = [("a", wintypes.DWORD), ("b", wintypes.WORD), ("c", wintypes.WORD), ("d", ctypes.c_ubyte * 8)]
class PROPERTYKEY(ctypes.Structure):
    _fields_ = [("fmtid", GUID), ("pid", wintypes.DWORD)]
class PROPVARIANT(ctypes.Structure):
    _fields_ = [("vt", ctypes.c_ushort), ("r1", ctypes.c_ushort), ("r2", ctypes.c_ushort), ("r3", ctypes.c_ushort), ("p", ctypes.c_void_p), ("p2", ctypes.c_void_p)]
def gstr(g):
    return str(uuid.UUID(fields=(g.a, g.b, g.c, g.d[0], g.d[1], int.from_bytes(bytes(g.d[2:8]), "big")))).upper()
SET = ctypes.CFUNCTYPE(ctypes.c_long, ctypes.c_void_p, ctypes.POINTER(PROPERTYKEY), ctypes.POINTER(PROPVARIANT))
REL = ctypes.CFUNCTYPE(ctypes.c_ulong, ctypes.c_void_p)
def set_value(this, key, pv):
    k, v = key.contents, pv.contents
    got.append((gstr(k.fmtid), k.pid, v.vt, ctypes.wstring_at(v.p) if v.vt == 31 else None)); return 0
def release(this): got.append("release"); return 0
cb_set, cb_rel = SET(set_value), REL(release)
nop = ctypes.cast(cb_rel, ctypes.c_void_p).value
vtable = (ctypes.c_void_p * 8)(nop, nop, ctypes.cast(cb_rel, ctypes.c_void_p).value, nop, nop, nop, ctypes.cast(cb_set, ctypes.c_void_p).value, nop)
obj = (ctypes.c_void_p * 1)(ctypes.cast(vtable, ctypes.c_void_p).value)
class Fn:
    def __init__(s, f): s.f = f; s.argtypes = None; s.restype = None
    def __call__(s, *a): return s.f(*a)
def shget(hwnd, iid, out):
    got.append(("iid", gstr(iid._obj), hwnd))
    out._obj.value = ctypes.cast(obj, ctypes.c_void_p).value; return 0
dlls = {"shell32": types.SimpleNamespace(SHGetPropertyStoreForWindow=Fn(shget)), "ole32": types.SimpleNamespace(CoInitializeEx=Fn(lambda *a: 1))}
ctypes.WinDLL = lambda name, **kw: dlls[name]
m._window_properties(0x1234, [(2, '"C:\\x\\Carpe Diem.exe" --room tabula'), (4, "Tabula"), (3, "C:\\x\\rooms\\tabula.ico,0"), (5, "com.yannieforest.carpediem.tabula")])
for g in got: print(g)
assert got[0] == ("iid", "886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99", 0x1234)
assert [x[1] for x in got[1:5]] == [2, 4, 3, 5] and all(x[0] == "9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3" and x[2] == 31 for x in got[1:5])
assert got[-1] == "release" and ctypes.sizeof(PROPVARIANT) == 24
print("PASS: IPropertyStore::SetValue (slot 6) with System.AppUserModel ids 2, 4, 3, 5 as strings, then Release (slot 2)")
print(m._relaunch_command("tabula"), "|", m.room_app_id("slides"), "|", m.room_to_dock("Imago"))
