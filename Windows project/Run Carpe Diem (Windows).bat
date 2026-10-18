@echo off
REM CARPE DIEM  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
REM NO LICENCE IS GRANTED. See LICENCE.txt.
REM
REM Carpe Diem - run the app in its own window WITHOUT building an exe.
REM
REM Use this when the built exe will not start, or before building one at all.
REM It needs Python 3 on this PC. Unlike the exe, this window STAYS OPEN and
REM prints the reason if anything goes wrong, so a fault can be read instead of
REM guessed at.
REM
REM This file must keep Windows line endings.

setlocal
cd /d "%~dp0"

echo Carpe Diem - starting in its own window
echo.

where py >nul 2>nul
if errorlevel 1 goto :use_python_word
set "PY=py"
goto :have_py
:use_python_word
set "PY=python"
:have_py

%PY% --version >nul 2>nul
if errorlevel 1 goto :no_python
for /f "delims=" %%v in ('%PY% --version 2^>^&1') do echo Python:  %%v

REM pywebview draws the window. Install it once if it is absent, into the user's
REM own Python, which needs no administrator rights.
%PY% -c "import webview" >nul 2>nul
if errorlevel 1 goto :install_webview
goto :run

:install_webview
echo Installing the one component that draws the window. A minute, once only.
%PY% -m pip install --user --disable-pip-version-check pywebview
if errorlevel 1 goto :install_failed
REM On Windows the .NET backend also wants pythonnet. Not fatal if it refuses:
REM Edge WebView2 works without it.
%PY% -m pip install --user --disable-pip-version-check pythonnet
goto :run

:run
echo.
echo Opening Carpe Diem...
%PY% carpe_diem_app.py
if errorlevel 1 goto :ran_badly
echo.
echo Carpe Diem has closed.
goto :finish

:ran_badly
echo.
echo Carpe Diem stopped with an error. The reason is printed above, and also
echo written to carpe_diem_crash.log beside this file.
echo.
echo Whatever happens, carpe_diem.html in this folder IS the whole app: open it
echo by double-clicking and it runs offline with nothing installed.
goto :finish

:no_python
echo Python 3 was not found on this PC.
echo Install it from https://www.python.org/downloads/ and tick
echo "Add Python to PATH" on the first screen.
echo.
echo Or skip all of this: double-click carpe_diem.html. That IS the app.
goto :finish

:install_failed
echo.
echo The window component could not be installed.
echo Try:  %PY% -m pip install --user pywebview
echo.
echo Or skip it: double-click carpe_diem.html. That IS the whole app.
goto :finish

:finish
echo.
pause
endlocal
exit /b
