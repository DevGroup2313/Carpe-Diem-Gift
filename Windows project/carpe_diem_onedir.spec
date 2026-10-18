# CARPE DIEM  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
# NO LICENCE IS GRANTED. No copying, adaptation, redistribution, reverse
# engineering or commercial use without the author's written permission.
# See LICENCE.txt. Every distributed copy carries a build marker.
# -*- mode: python ; coding: utf-8 -*-
#
# Carpe Diem — the INSTALLED Windows app, built as a folder (onedir), the way
# Inkwell's is. GitHub's build wraps this folder in an installer
# (build/carpe_diem.iss). You do not run this file yourself.
#
# Why a folder for the installed app: a single-file exe unpacks everything it
# carries (Python, the window component and the 24 MB page) into a temporary
# folder at EVERY start, which is most of the wait before the window appears.
# Installed as a folder, nothing is unpacked: it simply starts. The portable
# single-file exe (carpe_diem.spec) is still built for a USB stick.
#
# The folder has to stay whole. The old folder build failed when the exe was
# moved away from its "_internal" folder ("Failed to load Python DLL"); that
# cannot happen here, because the installer puts the folder in one place and
# the Start menu and Desktop shortcuts point into it.
#
# PYINSTALLER 6 COMPATIBLE. The previous recipe used `cipher`,
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
import os
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
    datas=[('carpe_diem.html', '.'), ('carpe_diem.ico', '.'), ('carpe_diem.png', '.')] + extra_datas,
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
    runtime_hooks=[os.path.join(SPECPATH, 'build', 'quiet_console.py')],
    excludes=[],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='Carpe Diem',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='carpe_diem.ico',
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name='Carpe Diem',
)
