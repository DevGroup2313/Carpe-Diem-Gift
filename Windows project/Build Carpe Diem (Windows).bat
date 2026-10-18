@echo off
REM CARPE DIEM  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
REM NO LICENCE IS GRANTED. No copying, adaptation, redistribution, reverse
REM engineering or commercial use without the author's written permission.
REM See LICENCE.txt. Every distributed copy carries a build marker.
REM
REM Carpe Diem - build the standalone Windows app.
REM Double-click this file. It needs Python 3 and an internet connection ONCE,
REM on this PC only. The finished exe needs neither.
REM
REM This file must keep Windows line endings. With Unix endings cmd.exe loses
REM its place when jumping to a label, which prints half a message and pauses
REM twice. That is what went wrong before.

setlocal
cd /d "%~dp0"
set "LOG=build_log.txt"
break > "%LOG%"

call :say "Carpe Diem - building the standalone Windows app"
call :say "Started %DATE% %TIME%"
call :blank
call :say "You do not have to build anything to use Carpe Diem."
call :say "carpe_diem.html in this folder IS the whole app: double-click it and"
call :say "it runs offline, with nothing installed. This script is optional, and"
call :say "only wraps that same app as a Windows .exe."
call :blank

REM ---------------------------------------------------------------- Python --
where py >nul 2>nul
if errorlevel 1 goto :use_python_word
set "PY=py"
goto :have_py
:use_python_word
set "PY=python"
:have_py

%PY% --version >nul 2>nul
if errorlevel 1 goto :no_python
for /f "delims=" %%v in ('%PY% --version 2^>^&1') do call :say "Python:      %%v"

REM ------------------------------------------------------------- the tools --
REM The private environment is made first, because the offline path needs it
REM just as much as the online one. Creating it requires no internet.
if exist ".buildenv" goto :env_ready
call :say "Creating a private build environment. Nothing else on this PC is touched."
%PY% -m venv .buildenv >> "%LOG%" 2>&1
if errorlevel 1 goto :env_failed
:env_ready
set "VPY=.buildenv\Scripts\python.exe"

if exist "wheels\*.whl" goto :install_offline

REM A reachability probe, advisory only. The old one asked DNS for an IPv4
REM address alone, so a network that answers only over IPv6, or through a
REM proxy, looked offline when it was not, and the script gave up early.
%PY% -c "import socket;socket.setdefaulttimeout(6);s=socket.create_connection(('pypi.org',443));s.close()" >nul 2>nul
if errorlevel 1 goto :probe_failed
call :say "Internet:    reachable"
goto :install_online
:probe_failed
call :say "Internet:    could not be confirmed. Trying anyway, in case the"
call :say "             probe is blocked rather than the connection."
goto :install_online

:install_offline
call :say "Installing the build tools from the local wheels folder..."
call :say "Working. The window will look idle for a while."
"%VPY%" -m pip install --no-index --find-links wheels pyinstaller pywebview >> "%LOG%" 2>&1
if errorlevel 1 goto :tools_failed
REM pythonnet lets the window use the .NET backend. Not fatal if absent:
REM Edge WebView2 works without it, so a failure here is only noted.
"%VPY%" -m pip install --no-index --find-links wheels pythonnet >> "%LOG%" 2>&1
if errorlevel 1 call :say "Note: pythonnet was not available offline. The app will use Edge WebView2."
goto :tools_ready

:install_online
call :say "Installing the build tools. A few minutes the first time."
call :say "Working. The window will look idle for a while."
"%VPY%" -m pip install --disable-pip-version-check --retries 2 --timeout 30 --upgrade pip >> "%LOG%" 2>&1
"%VPY%" -m pip install --disable-pip-version-check --retries 2 --timeout 30 pyinstaller pywebview >> "%LOG%" 2>&1
if errorlevel 1 goto :tools_failed
REM pythonnet lets the window use the .NET backend. Not fatal if absent:
REM Edge WebView2 works without it, so a failure here is only noted.
"%VPY%" -m pip install --disable-pip-version-check --retries 2 --timeout 30 pythonnet >> "%LOG%" 2>&1
if errorlevel 1 call :say "Note: pythonnet could not be installed. The app will use Edge WebView2."

:tools_ready
for /f "delims=" %%v in ('"%VPY%" -m PyInstaller --version 2^>^&1') do call :say "PyInstaller: %%v"
call :blank

REM -------------------------------------------------------------- the build --
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist
call :say "Building. This takes a few minutes and the window will look idle..."
"%VPY%" -m PyInstaller --noconfirm --clean carpe_diem.spec >> "%LOG%" 2>&1
set "STATUS=%ERRORLEVEL%"
call :blank
if not exist "dist\Carpe Diem.exe" goto :build_failed

call :say "SUCCESS."
call :say "Your app is:  %CD%\dist\Carpe Diem.exe"
call :blank
call :say "That ONE file is the whole application. Move it, copy it to the"
call :say "Desktop, put it on a USB stick. Nothing has to travel with it."
call :blank
call :say "Windows SmartScreen may warn you the first time, because the exe is"
call :say "not code-signed. Click 'More info', then 'Run anyway'."
start "" "dist"
goto :finish

REM ------------------------------------------------------------- failures ---
:no_python
call :say "Python 3 was not found on this PC."
call :say "Install it from https://www.python.org/downloads/"
call :say "IMPORTANT: on the first screen, tick 'Add Python to PATH'."
call :blank
call :say "Or skip all of this: double-click carpe_diem.html. That IS the app."
goto :finish

:env_failed
call :say "The private build environment could not be created."
call :say "The last lines of the log say:"
call :tail
call :say "Full log:  %CD%\%LOG%"
goto :finish

:tools_failed
call :blank
call :say "The build tools could not be installed."
call :say "The last lines of the log say:"
call :tail
call :blank
findstr /i /c:"No matching distribution" "%LOG%" >nul 2>nul && goto :too_new
findstr /i /c:"Could not find a version" "%LOG%" >nul 2>nul && goto :too_new
findstr /i /c:"Failed to establish a new connection" "%LOG%" >nul 2>nul && goto :no_net
findstr /i /c:"Temporary failure in name resolution" "%LOG%" >nul 2>nul && goto :no_net
findstr /i /c:"ProxyError" "%LOG%" >nul 2>nul && goto :no_net
findstr /i /c:"CERTIFICATE_VERIFY_FAILED" "%LOG%" >nul 2>nul && goto :ssl_wall
call :say "Full log:  %CD%\%LOG%"
call :say "Send that file and the exact cause can be identified."
goto :finish

:too_new
call :say "READ THIS FIRST: no build tool exists yet for this version of Python."
call :say "PyInstaller lags a few months behind each new Python release, so a"
call :say "very new Python cannot build an exe at all."
call :blank
call :say "Two ways forward:"
call :say "  1. Install Python 3.12 or 3.13 alongside the one you have, then run"
call :say "     this again. The installers keep both, and nothing breaks."
call :say "  2. Skip the exe: double-click carpe_diem.html. Same app, offline,"
call :say "     nothing to install."
call :say "Full log:  %CD%\%LOG%"
goto :finish

:no_net
call :say "This step needs the internet once, to download PyInstaller."
call :blank
call :say "Three ways forward:"
call :say "  1. Connect and run this again. That is all."
call :say "  2. Build offline: on any connected PC run"
call :say "       py -m pip download pyinstaller pywebview -d wheels"
call :say "     then copy the resulting wheels folder next to this file and run"
call :say "     this again."
call :say "  3. Skip the exe entirely: double-click carpe_diem.html. That IS the"
call :say "     whole app, it works offline, and it needs nothing installed."
call :say "Full log:  %CD%\%LOG%"
goto :finish

:ssl_wall
call :say "The download was refused by a security certificate check, which"
call :say "usually means a workplace or school network inspecting traffic."
call :say "On a home connection this normally goes away."
call :say "Or skip the exe: double-click carpe_diem.html."
call :say "Full log:  %CD%\%LOG%"
goto :finish

:build_failed
call :say "The build did NOT finish, so nothing was produced."
call :say "Exit status: %STATUS%"
call :say "The last lines of the log say:"
call :tail
call :blank
call :say "Full log:  %CD%\%LOG%"
call :say "Send that file and the exact cause can be identified."
call :say "Meanwhile carpe_diem.html works perfectly on its own."
goto :finish

REM -------------------------------------------------------------- helpers ---
:finish
call :blank
pause
endlocal
exit /b

:say
echo %~1
echo %~1>> "%LOG%"
exit /b

:blank
echo(
echo(>> "%LOG%"
exit /b

:tail
powershell -NoProfile -Command "if (Test-Path '%LOG%') { Get-Content -LiteralPath '%LOG%' -Tail 18 }" 2>nul
exit /b
