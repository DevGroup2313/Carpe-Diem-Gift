#!/usr/bin/env bash
# CARPE DIEM  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
# NO LICENCE IS GRANTED. No copying, adaptation, redistribution, reverse
# engineering or commercial use without the author's written permission.
# See LICENCE.txt. Every distributed copy carries a build marker.
# Carpe Diem — build the standalone macOS app.
# Double-click this file. It needs Python 3 on THIS Mac only; the finished app
# needs nothing at all on the Macs you give it to.

cd "$(dirname "$0")" || exit 1
LOG="build_log.txt"
# The round seal at its full size: macOS 26 sets an app's own icon in a grey square when it is not Apple's rounded
# square, and shrinks it, but leaves a custom icon as it is; so each copy is given the seal as its custom icon, as
# Finder's Get Info would. To undo: Get Info on the app, click the small icon at the top, press Delete.
seal_icon(){ [ -f "$1" ] && [ -d "$2" ] || return 0
  osascript -l JavaScript - "$1" "$2" >>"$LOG" 2>&1 <<'JS' || true
ObjC.import('AppKit');
function run(a){var i=$.NSImage.alloc.initWithContentsOfFile(a[0]);if(!i||i.isNil())return 'seal: no picture';return $.NSWorkspace.sharedWorkspace.setIconForFileOptions(i,a[1],0)?'seal: set':'seal: refused';}
JS
}
: > "$LOG"
say(){ printf '%s\n' "$*" | tee -a "$LOG"; }

# Why the tools would not install, said plainly. A path to a log is not an
# answer, and the two causes below account for nearly every failure.
tools_failed(){
  say ""
  say "The build tools could not be installed."
  say ""
  say "The last lines of the log say:"
  tail -n 18 "$LOG"
  say ""
  if grep -qiE "no matching distribution|could not find a version" "$LOG"; then
    say "READ THIS FIRST: no build tool exists yet for this version of Python."
    say "PyInstaller lags a few months behind each new Python release, so a very"
    say "new Python cannot build an app at all."
    say ""
    say "Two ways forward:"
    say "  1. Install Python 3.12 or 3.13 alongside the one you have, then run"
    say "     this again. The installers keep both, and nothing breaks."
    say "  2. Skip the app: double-click carpe_diem.html. Same app, offline,"
    say "     nothing to install."
  elif grep -qiE "temporary failure in name resolution|failed to establish a new connection|proxyerror|network is unreachable" "$LOG"; then
    say "This step needs the internet once, to download PyInstaller."
    say ""
    say "Three ways forward:"
    say "  1. Connect and run this again. That is all."
    say "  2. Build offline: on any connected Mac run"
    say "       python3 -m pip download pyinstaller pywebview -d wheels"
    say "     then copy the resulting wheels folder next to this file."
    say "  3. Skip the app entirely: double-click carpe_diem.html."
  elif grep -qi "certificate_verify_failed" "$LOG"; then
    say "The download was refused by a certificate check, which usually means a"
    say "workplace or school network inspecting traffic. On a home connection"
    say "this normally goes away. Or just open carpe_diem.html."
  else
    say "Full log:  $(pwd)/$LOG"
    say "Send that file and the exact cause can be identified."
  fi
  say ""
  read -r -p "Press Return to close. "
  exit 1
}

say "Carpe Diem — building the standalone Mac app"
say "Started $(date)"
say ""
say "You do not have to build anything to use Carpe Diem."
say "carpe_diem.html in this folder IS the whole app: double-click it and it"
say "runs offline, with nothing installed. This script is optional, and only"
say "wraps that same app as a Mac application."
say ""

if ! command -v python3 >/dev/null 2>&1; then
  say "Python 3 was not found on this Mac."
  say "Install it from https://www.python.org/downloads/ and run this again."
  read -r -p "Press Return to close. "; exit 1
fi
say "Python:      $(python3 --version 2>&1)"

# A private build environment. Without this, Homebrew and system Python refuse
# pip installs with "error: externally-managed-environment" (PEP 668).
if [ ! -d ".buildenv" ]; then
  say "Creating a private build environment (one time)..."
  if ! python3 -m venv .buildenv >>"$LOG" 2>&1; then
    say ""; say "Could not create the build environment. See $LOG"
    read -r -p "Press Return to close. "; exit 1
  fi
fi
PY=".buildenv/bin/python"

if [ -d wheels ] && ls wheels/*.whl >/dev/null 2>&1; then
  say "Installing the build tools from the local wheels folder..."
  if ! "$PY" -m pip install --no-index --find-links wheels pyinstaller pywebview >>"$LOG" 2>&1; then
    tools_failed
  fi
else
  say "Installing the build tools (a few minutes the first time)..."
  "$PY" -m pip install --upgrade pip >>"$LOG" 2>&1
  if ! "$PY" -m pip install pyinstaller pywebview >>"$LOG" 2>&1; then
    tools_failed
  fi
fi
say "PyInstaller: $("$PY" -m PyInstaller --version 2>&1)"
say ""

rm -rf build dist
say "Building. This takes a few minutes and the window will look idle..."
"$PY" -m PyInstaller --noconfirm --clean carpe_diem.spec >>"$LOG" 2>&1
STATUS=$?

APP="dist/Carpe Diem.app"
say ""
if [ "$STATUS" -eq 0 ] && [ -d "$APP" ]; then
  say "SUCCESS."
  say "Your app is:  $(pwd)/$APP"
  say ""
  # Clear the download quarantine on the app just built, so it opens on THIS Mac
  # with no Gatekeeper prompt. This copy only: a copy sent to another Mac is
  # quarantined again on arrival, which only Apple notarisation removes for good.
  xattr -dr com.apple.quarantine "$APP" >/dev/null 2>&1 || true
  seal_icon "$(pwd)/carpe_diem.png" "$(pwd)/$APP"
  say "Carpe Diem.app is one self-contained bundle. It carries the whole app"
  say "inside, so it opens from anywhere you move it on this Mac, with nothing"
  say "beside it. Drag it to Applications or keep it where you like."
  say ""
  say "On THIS Mac it should now open by double-clicking."
  say "On ANOTHER Mac the first open uses right-click then Open, because the app"
  say "is not notarised by Apple. MACOS_IF_BLOCKED.txt has the other routes."
  open dist >/dev/null 2>&1
else
  say "The build did NOT finish, so nothing was produced."
  say "Exit status: $STATUS"
  say ""
  say "What is in dist right now:"
  ls -la dist 2>&1 | tee -a "$LOG"
  say ""
  say "The full build log is:  $(pwd)/$LOG"
  say "Send that file and the exact cause can be identified. The last lines of it"
  say "are the ones that matter."
  say ""
  say "Last 15 lines:"
  tail -n 15 "$LOG"
fi
say ""
read -r -p "Press Return to close. "
