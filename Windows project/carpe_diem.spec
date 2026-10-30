# CARPE DIEM  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
# NO LICENCE IS GRANTED. No copying, adaptation, redistribution, reverse
# engineering or commercial use without the author's written permission.
# See LICENCE.txt. Every distributed copy carries a build marker.
# -*- mode: python ; coding: utf-8 -*-
#
# Carpe Diem — standalone Windows app, built as ONE portable .exe.
#
#   Built by "Build Carpe Diem (Windows).bat". You do not run this file yourself.
#
# Two things this recipe deliberately does:
#
# 1. SINGLE FILE. Everything lives inside "Carpe Diem.exe", so it runs from the
#    Desktop, a USB stick or anywhere else. The older folder build required the
#    exe to stay beside an "_internal" folder, and moving the exe on its own gave
#        Failed to load Python DLL '...\_internal\python3xx.dll'
#    That failure is impossible with a single-file build.
#
# 2. PYINSTALLER 6 COMPATIBLE. The previous recipe used `cipher`,
#    `Analysis(win_no_prefer_redirects=...)`, `Analysis(win_private_assemblies=...)`,
#    `PYZ(a.pure, a.zipped_data, ...)` and `a.zipfiles`. All five were removed in
#    PyInstaller 6.0, and `pip install pyinstaller` installs version 6, so the old
#    recipe raised as soon as it was read, leaving an empty "dist" folder behind.
#    This version uses only arguments that exist in both 5 and 6.

# ---------------------------------------------------------------------------
# What was missing before, and why the exe crashed on its very first run.
#
# 1. pywebview ships its own JavaScript files (api.js, drag.js and friends) and
#    loads them FROM DISK while a window is opening. Naming the backend modules
#    as hidden imports brings in the Python but leaves those files behind, so a
#    single-file exe opened a window and then died reaching for a file that was
#    never packed.
#
# 2. On Windows pywebview talks to .NET through pythonnet. Naming 'clr' is not
#    enough: clr_loader carries native DLLs and runtime configuration files of
#    its own, and Python.Runtime.dll lives inside pythonnet. When those are
#    absent the failure happens inside the .NET loader, below Python, so there is
#    no traceback to catch and the process simply disappears.
#
# collect_all gathers a package's modules, data files AND binaries together,
# which is exactly what both cases need. Each is wrapped because a package that
# is not installed must not stop the build: pywebview on a machine without
# pythonnet still builds and still runs through the Edge WebView2 backend.
from PyInstaller.utils.hooks import collect_all

extra_datas = []
extra_binaries = []
extra_hidden = []

for _pkg in ('webview', 'clr_loader', 'pythonnet', 'proxy_tools'):
    try:
        _d, _b, _h = collect_all(_pkg)
        extra_datas += _d
        extra_binaries += _b
        extra_hidden += _h
    except Exception as _e:
        print('carpe diem: nothing collected for %s (%s)' % (_pkg, _e))

a = Analysis(
    ['carpe_diem_app.py'],
    pathex=[],
    binaries=extra_binaries,
    # build 1073: each room's own icon, for its window and taskbar button
    datas=[('carpe_diem.html', '.'), ('carpe_diem.ico', '.'), ('carpe_diem.png', '.'), ('rooms/*.ico', 'rooms')] + extra_datas,
    # Named outright because PyInstaller cannot see them: pywebview picks its
    # backend at run time, so nothing in the source imports these by name and
    # the analyser leaves them out. Missing, the exe builds cleanly and then
    # fails to open a window. Any that are not installed are simply reported as
    # not found, which does not stop the build.
    hiddenimports=[
        'webview.platforms.winforms',
        'webview.platforms.edgechromium',
        'webview.platforms.mshtml',
        'clr',
    ] + extra_hidden,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)

pyz = PYZ(a.pure)

# No exclude_binaries and no COLLECT: everything is packed into the one exe.
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='Carpe Diem',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='carpe_diem.ico',
)
