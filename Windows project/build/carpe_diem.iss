; CARPE DIEM  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
; NO LICENCE IS GRANTED. See LICENCE.txt.
;
; The Windows installer, made by Inno Setup on GitHub's Windows computer from the folder build of Carpe Diem
; (dist_installed\Carpe Diem). You do not run this file yourself.
;
; It installs Carpe Diem for the current user only, with no administrator password, into
;   %LOCALAPPDATA%\Programs\Carpe Diem
; puts Carpe Diem in the Start menu (and on the Desktop if you tick it), with its five rooms beside it (Tabula,
; Abacus, Imago, Scriba and Fontes, each opening in a window of its own), and registers an uninstaller in Settings,
; Apps. Your work is NOT in that folder: it lives in %LOCALAPPDATA%\CarpeDiem\storage, which installing, updating and
; uninstalling never delete; before each install a copy of it is made in %LOCALAPPDATA%\CarpeDiem\backups (the three
; newest copies are kept).
;
; Build 1063 takes The Forge's installer as its pattern (the_forge.iss, 9s57 to 24 October 2026): an update first
; clears the program's own libraries, so nothing stale is left behind, and the app's record of an unfinished run, so an
; update never counts as a bad ending; uninstalling asks a running Carpe Diem to close the way its own close button does
; and waits for it; a PC without Microsoft Edge WebView2 is told so on one calm page and the install carries on; a
; shortcut left by an older copy whose program has gone ("the file has moved") is mended to open the installed one; and
; if something on the PC removes the program a moment after it is installed (an antivirus), the installer says so.
; The AppId never changes, so every build installs over the one before and keeps one entry in Settings, Apps.

#ifndef AppVersion
  #define AppVersion "1072"
#endif
#ifndef SourceDir
  #define SourceDir "..\dist_installed\Carpe Diem"
#endif
#ifndef OutputDir
  #define OutputDir "..\dist"
#endif

[Setup]
AppId={{05DA1600-B335-4B47-B7E1-F630789C5596}
AppName=Carpe Diem
AppVersion={#AppVersion}
AppVerName=Carpe Diem, build {#AppVersion}
AppPublisher=Yannie D. Forest
AppCopyright=Copyright (c) 2026 Yannie D. Forest. All rights reserved.
VersionInfoVersion=1.0.{#AppVersion}.0
VersionInfoCompany=Yannie D. Forest
VersionInfoDescription=Carpe Diem installer
VersionInfoProductName=Carpe Diem
VersionInfoProductVersion=1.0.{#AppVersion}.0
VersionInfoCopyright=Copyright (c) 2026 Yannie D. Forest. All rights reserved.
DefaultDirName={localappdata}\Programs\Carpe Diem
DefaultGroupName=Carpe Diem
DisableProgramGroupPage=yes
DisableDirPage=yes
DisableReadyPage=yes
PrivilegesRequired=lowest
OutputDir={#OutputDir}
OutputBaseFilename=Carpe-Diem-{#AppVersion}-Windows-Setup
SetupIconFile=..\carpe_diem.ico
UninstallDisplayIcon={app}\Carpe Diem.exe
UninstallDisplayName=Carpe Diem
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
CloseApplications=yes
RestartApplications=no
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
SetupLogging=yes
; build 1072: Explorer is told when Open With gains Carpe Diem for .docx and .pdf
ChangesAssociations=yes

[Tasks]
Name: "desktopicon"; Description: "Put Carpe Diem on the Desktop"; GroupDescription: "Shortcuts:"
Name: "roomsdesktop"; Description: "Put Tabula, Abacus, Imago, Scriba and Fontes on the Desktop too"; GroupDescription: "Shortcuts:"; Flags: unchecked

[InstallDelete]
; the program's own libraries, cleared before the new ones are copied, so an update leaves nothing stale behind
Type: filesandordirs; Name: "{app}\_internal"
; the app's own records of a run that has not finished: an update starts clean (your work beside them is not touched)
Type: files; Name: "{localappdata}\CarpeDiem\storage\carpe_session.flag"
Type: files; Name: "{localappdata}\CarpeDiem\storage\carpe_room.flag"

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{userprograms}\Carpe Diem"; Filename: "{app}\Carpe Diem.exe"; WorkingDir: "{app}"; Comment: "Carpe Diem, build {#AppVersion}"; AppUserModelID: "com.yannieforest.carpediem"
Name: "{userdesktop}\Carpe Diem"; Filename: "{app}\Carpe Diem.exe"; WorkingDir: "{app}"; Comment: "Carpe Diem, build {#AppVersion}"; Tasks: desktopicon; AppUserModelID: "com.yannieforest.carpediem"
Name: "{userprograms}\Tabula"; Filename: "{app}\Carpe Diem.exe"; Parameters: "--room tabula"; WorkingDir: "{app}"; Comment: "Tabula, Carpe Diem's writing room, in a window of its own"
Name: "{userprograms}\Abacus"; Filename: "{app}\Carpe Diem.exe"; Parameters: "--room abacus"; WorkingDir: "{app}"; Comment: "Abacus, Carpe Diem's room for figures, in a window of its own"
Name: "{userprograms}\Imago"; Filename: "{app}\Carpe Diem.exe"; Parameters: "--room slides"; WorkingDir: "{app}"; Comment: "Imago, Carpe Diem's room for presentations, in a window of its own"
Name: "{userprograms}\Scriba"; Filename: "{app}\Carpe Diem.exe"; Parameters: "--room scriba"; WorkingDir: "{app}"; Comment: "Scriba, Carpe Diem's room for recordings, in a window of its own"
Name: "{userprograms}\Fontes"; Filename: "{app}\Carpe Diem.exe"; Parameters: "--room fontes"; WorkingDir: "{app}"; Comment: "Fontes, Carpe Diem's room for sources, in a window of its own"
Name: "{userdesktop}\Tabula"; Filename: "{app}\Carpe Diem.exe"; Parameters: "--room tabula"; WorkingDir: "{app}"; Comment: "Tabula, in Carpe Diem"; Tasks: roomsdesktop
Name: "{userdesktop}\Abacus"; Filename: "{app}\Carpe Diem.exe"; Parameters: "--room abacus"; WorkingDir: "{app}"; Comment: "Abacus, in Carpe Diem"; Tasks: roomsdesktop
Name: "{userdesktop}\Imago"; Filename: "{app}\Carpe Diem.exe"; Parameters: "--room slides"; WorkingDir: "{app}"; Comment: "Imago, in Carpe Diem"; Tasks: roomsdesktop
Name: "{userdesktop}\Scriba"; Filename: "{app}\Carpe Diem.exe"; Parameters: "--room scriba"; WorkingDir: "{app}"; Comment: "Scriba, in Carpe Diem"; Tasks: roomsdesktop
Name: "{userdesktop}\Fontes"; Filename: "{app}\Carpe Diem.exe"; Parameters: "--room fontes"; WorkingDir: "{app}"; Comment: "Fontes, in Carpe Diem"; Tasks: roomsdesktop

[Registry]
; build 1072: Word and PDF files offer "Tabula (Carpe Diem)" under Open With, and open in Tabula. Only Open With: the
; default program for each stays as it is unless you choose Carpe Diem there ("Always use this app"). For this user
; only, and taken away on uninstall.
Root: HKA; Subkey: "Software\Classes\CarpeDiem.Tabula"; ValueType: string; ValueName: ""; ValueData: "Document for Tabula"; Flags: uninsdeletekey
Root: HKA; Subkey: "Software\Classes\CarpeDiem.Tabula"; ValueType: string; ValueName: "FriendlyTypeName"; ValueData: "Document for Tabula"
Root: HKA; Subkey: "Software\Classes\CarpeDiem.Tabula\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\Carpe Diem.exe,0"
Root: HKA; Subkey: "Software\Classes\CarpeDiem.Tabula\shell\open"; ValueType: string; ValueName: "FriendlyAppName"; ValueData: "Tabula (Carpe Diem)"
Root: HKA; Subkey: "Software\Classes\CarpeDiem.Tabula\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\Carpe Diem.exe"" ""%1"""
Root: HKA; Subkey: "Software\Classes\.docx\OpenWithProgids"; ValueType: string; ValueName: "CarpeDiem.Tabula"; ValueData: ""; Flags: uninsdeletevalue
Root: HKA; Subkey: "Software\Classes\.pdf\OpenWithProgids"; ValueType: string; ValueName: "CarpeDiem.Tabula"; ValueData: ""; Flags: uninsdeletevalue
Root: HKA; Subkey: "Software\Classes\Applications\Carpe Diem.exe"; ValueType: string; ValueName: "FriendlyAppName"; ValueData: "Tabula (Carpe Diem)"; Flags: uninsdeletekey
Root: HKA; Subkey: "Software\Classes\Applications\Carpe Diem.exe\SupportedTypes"; ValueType: string; ValueName: ".docx"; ValueData: ""
Root: HKA; Subkey: "Software\Classes\Applications\Carpe Diem.exe\SupportedTypes"; ValueType: string; ValueName: ".pdf"; ValueData: ""
Root: HKA; Subkey: "Software\Classes\Applications\Carpe Diem.exe\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\Carpe Diem.exe"" ""%1"""

[Run]
Filename: "{app}\Carpe Diem.exe"; Description: "Open Carpe Diem now"; Flags: nowait postinstall skipifsilent

[UninstallRun]
; if Carpe Diem is open, ask it to close, not forcefully, so it records a clean ending (the [Code] below has already
; asked and waited; this line is the uninstaller's own record of the same request)
Filename: "{sys}\taskkill.exe"; Parameters: "/IM ""Carpe Diem.exe"""; Flags: runhidden; RunOnceId: "CloseCarpeDiem"

[UninstallDelete]
; the program's own notes, kept beside it; nothing else, and never your work
Type: files; Name: "{app}\carpe_diem_crash.log"
Type: files; Name: "{app}\.carpe_write_test"

[Code]
var
  WebView2Page: TOutputMsgWizardPage;
  WebView2Missing: Boolean;

{ Microsoft's documented test for the Edge WebView2 Runtime: the pv value under one of these two keys, present and
  greater than 0.0.0.0 (learn.microsoft.com, "Detect if a WebView2 Runtime is already installed"). }
function WebView2Present: Boolean;
var
  Version: String;
begin
  Result := False;
  Version := '';
  if RegQueryStringValue(HKEY_LOCAL_MACHINE, 'SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}', 'pv', Version) then
    if (Trim(Version) <> '') and (Trim(Version) <> '0.0.0.0') then
      Result := True;
  if not Result then
  begin
    Version := '';
    if RegQueryStringValue(HKEY_CURRENT_USER, 'Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}', 'pv', Version) then
      if (Trim(Version) <> '') and (Trim(Version) <> '0.0.0.0') then
        Result := True;
  end;
end;

procedure OpenWebView2Download(Sender: TObject);
var
  ErrorCode: Integer;
begin
  ShellExecAsOriginalUser('open', 'https://developer.microsoft.com/microsoft-edge/webview2/consumer/', '', '', SW_SHOWNORMAL, ewNoWait, ErrorCode);
end;

procedure InitializeWizard;
var
  Button: TNewButton;
begin
  try
    WebView2Missing := not WebView2Present;
  except
    WebView2Missing := False;
  end;
  if WebView2Missing then
    Log('Microsoft Edge WebView2 Runtime: not found in the registry.')
  else
    Log('Microsoft Edge WebView2 Runtime: present (or not checkable).');
  WebView2Page := CreateOutputMsgPage(wpWelcome,
    'Microsoft Edge WebView2',
    'One free part of Windows is missing on this PC.',
    'Carpe Diem draws its window with Microsoft Edge WebView2, a free part of Windows. It is not on this PC.' + #13#10#13#10 +
    'You can carry on. Carpe Diem installs now, and opens in your browser until WebView2 is added.' + #13#10#13#10 +
    'To add it: open Microsoft''s page, click Download WebView2, and run the file. Then open Carpe Diem again.' + #13#10#13#10 +
    'https://developer.microsoft.com/microsoft-edge/webview2/consumer/');
  Button := TNewButton.Create(WebView2Page);
  Button.Caption := 'Open Microsoft''s page';
  Button.Width := ScaleX(180);
  Button.Height := ScaleY(23);
  Button.Top := WebView2Page.MsgLabel.Top + WebView2Page.MsgLabel.Height + ScaleY(12);
  Button.OnClick := @OpenWebView2Download;
  Button.Parent := WebView2Page.Surface;
end;

function ShouldSkipPage(PageID: Integer): Boolean;
begin
  Result := (PageID = WebView2Page.ID) and not WebView2Missing;
end;

{ With no Ready page, the Shortcuts page is the last before installing, so its button says Install. }
procedure CurPageChanged(CurPageID: Integer);
begin
  if CurPageID = wpSelectTasks then
    WizardForm.NextButton.Caption := SetupMessage(msgButtonInstall);
end;

{ True while Carpe Diem is running (tasklist and find, named by their path in System32). }
function ProgramIsRunning: Boolean;
var
  Code: Integer;
begin
  Result := False;
  if Exec(ExpandConstant('{cmd}'), '/C ' + ExpandConstant('{sys}\tasklist.exe') + ' /FI "IMAGENAME eq Carpe Diem.exe" /FO CSV /NH | ' +
          ExpandConstant('{sys}\find.exe') + ' /I "Carpe Diem.exe"',
          '', SW_HIDE, ewWaitUntilTerminated, Code) then
    Result := (Code = 0);
end;

{ Uninstalling while Carpe Diem is open: ask it to close, not forcefully, and give it up to 15 seconds, before any of
  its files are removed. }
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  Code, Tries: Integer;
begin
  if CurUninstallStep = usUninstall then
  begin
    if ProgramIsRunning then
    begin
      Exec(ExpandConstant('{sys}\taskkill.exe'), '/IM "Carpe Diem.exe"', '', SW_HIDE, ewWaitUntilTerminated, Code);
      Tries := 0;
      while ProgramIsRunning and (Tries < 30) do
      begin
        Sleep(500);
        Tries := Tries + 1;
      end;
      if ProgramIsRunning then
      begin
        Exec(ExpandConstant('{sys}\taskkill.exe'), '/F /IM "Carpe Diem.exe" /T', '', SW_HIDE, ewWaitUntilTerminated, Code);
        Log('Carpe Diem was still open after 15 seconds; it was ended so its files could be removed.');
      end
      else
        Log('Carpe Diem closed before its files were removed.');
    end;
  end;
end;

{ Keeps the three newest copies in backups and deletes older setup-<date> copies. }
procedure KeepNewestBackups(Keep: Integer);
var
  Root: String;
  FindRec: TFindRec;
  Names: TStringList;
  I: Integer;
begin
  Root := ExpandConstant('{localappdata}\CarpeDiem\backups');
  Names := TStringList.Create;
  try
    if FindFirst(Root + '\setup-*', FindRec) then
    begin
      try
        repeat
          if (FindRec.Attributes and FILE_ATTRIBUTE_DIRECTORY) <> 0 then
            Names.Add(FindRec.Name);
        until not FindNext(FindRec);
      finally
        FindClose(FindRec);
      end;
    end;
    Names.Sort;
    for I := 0 to Names.Count - 1 - Keep do
      DelTree(Root + '\' + Names[I], True, True, True);
  finally
    Names.Free;
  end;
end;

{ A shortcut left by an older copy (the single Carpe Diem.exe unpacked from a zip wherever it was saved, which has
  since moved or gone) says "the file has moved": every such shortcut on the Desktop, in the Start menu and in the
  taskbar's pins now opens the installed program. Only a shortcut to a Carpe Diem program that is gone is changed. }
function IsCarpeProgramName(const Target: String): Boolean;
var
  N: String;
begin
  N := Lowercase(ExtractFileName(Target));
  Result := (CompareText(ExtractFileExt(N), '.exe') = 0) and
    ((N = 'carpe diem.exe') or (Pos('carpe-diem', N) = 1) or (Pos('carpe_diem', N) = 1) or (Pos('carpediem', N) = 1));
end;

procedure RepairShortcutsIn(Shell: Variant; const Dir, Target: String; Depth: Integer);
var
  FindRec: TFindRec;
  Path, Old: String;
  Lnk: Variant;
begin
  if (Dir = '') or not DirExists(Dir) then
    exit;
  if FindFirst(AddBackslash(Dir) + '*', FindRec) then
  begin
    try
      repeat
        Path := AddBackslash(Dir) + FindRec.Name;
        if (FindRec.Attributes and FILE_ATTRIBUTE_DIRECTORY) <> 0 then
        begin
          if (Depth > 0) and (FindRec.Name <> '.') and (FindRec.Name <> '..') then
            RepairShortcutsIn(Shell, Path, Target, Depth - 1);
        end
        else if CompareText(ExtractFileExt(FindRec.Name), '.lnk') = 0 then
        begin
          try
            Lnk := Shell.CreateShortcut(Path);
            Old := Lnk.TargetPath;
            if (Old <> '') and IsCarpeProgramName(Old) and (CompareText(Old, Target) <> 0) and not FileExists(Old) then
            begin
              Lnk.TargetPath := Target;
              Lnk.WorkingDirectory := ExtractFileDir(Target);
              Lnk.IconLocation := Target + ',0';
              Lnk.Save;
              Log('Shortcut repaired: ' + Path + ' opened ' + Old + ', which is no longer there; it now opens ' + Target);
            end;
          except
            Log('A shortcut could not be read or repaired: ' + Path + ' (' + GetExceptionMessage + ')');
          end;
        end;
      until not FindNext(FindRec);
    finally
      FindClose(FindRec);
    end;
  end;
end;

procedure RepairOldShortcuts;
var
  Shell: Variant;
  Target: String;
begin
  Target := ExpandConstant('{app}\Carpe Diem.exe');
  try
    Shell := CreateOleObject('WScript.Shell');
  except
    Log('Old shortcuts were not looked at: ' + GetExceptionMessage);
    exit;
  end;
  RepairShortcutsIn(Shell, ExpandConstant('{userdesktop}'), Target, 0);
  RepairShortcutsIn(Shell, ExpandConstant('{userstartmenu}'), Target, 2);
  RepairShortcutsIn(Shell, ExpandConstant('{userappdata}\Microsoft\Internet Explorer\Quick Launch'), Target, 2);
end;

{ The program, a moment after it was put in place: if something removed it (an antivirus taking a new, unsigned program
  for a threat), say so plainly, with what to do. }
procedure CheckProgramStayed;
var
  Exe: String;
  I: Integer;
begin
  Exe := ExpandConstant('{app}\Carpe Diem.exe');
  I := 0;
  while FileExists(Exe) and (I < 6) do
  begin
    Sleep(500);
    I := I + 1;
  end;
  if FileExists(Exe) then
    Log('The program is still in place three seconds after it was installed.')
  else
  begin
    Log('Carpe Diem.exe was installed and then removed by something on this PC (an antivirus, most likely).');
    if not WizardSilent then
      MsgBox('Carpe Diem was installed, but a moment later something on this PC removed its program, Carpe Diem.exe.' + #13#10#13#10 +
        'This is almost always an antivirus taking a new program for a threat. In Windows Security, open Virus & threat protection, then Protection history. ' +
        'If Carpe Diem.exe is listed there, choose Actions, then Restore (or Allow on device).' + #13#10#13#10 +
        'Then open Carpe Diem from the Start menu, or run this installer again.', mbInformation, MB_OK);
  end;
end;

{ Before anything changes: close a running Carpe Diem the gentle way, and copy the folder that holds your work to
  backups\setup-<date>. A copy only; nothing is moved. The web view's caches are left out, as they rebuild themselves. }
procedure CurStepChanged(CurStep: TSetupStep);
var
  Code, Tries: Integer;
  Src, Dst: String;
begin
  if CurStep = ssInstall then
  begin
    if ProgramIsRunning then
    begin
      Exec(ExpandConstant('{sys}\taskkill.exe'), '/IM "Carpe Diem.exe"', '', SW_HIDE, ewWaitUntilTerminated, Code);
      Tries := 0;
      while ProgramIsRunning and (Tries < 30) do
      begin
        Sleep(500);
        Tries := Tries + 1;
      end;
      if ProgramIsRunning then
        Exec(ExpandConstant('{sys}\taskkill.exe'), '/F /IM "Carpe Diem.exe" /T', '', SW_HIDE, ewWaitUntilTerminated, Code);
    end;
    Src := ExpandConstant('{localappdata}\CarpeDiem\storage');
    if DirExists(Src) then
    begin
      Dst := ExpandConstant('{localappdata}\CarpeDiem\backups\setup-') + GetDateTimeString('yyyymmdd-hhnnss', #0, #0) + '\storage';
      Exec(ExpandConstant('{sys}\robocopy.exe'), '"' + Src + '" "' + Dst + '" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /XD Cache "Code Cache" GPUCache DawnCache GrShaderCache ShaderCache',
           '', SW_HIDE, ewWaitUntilTerminated, Code);
      try
        KeepNewestBackups(3);
      except
        Log('Older backups could not be tidied: ' + GetExceptionMessage);
      end;
    end;
  end;
  if CurStep = ssPostInstall then
  begin
    RepairOldShortcuts;
    CheckProgramStayed;
  end;
end;
