; CARPE DIEM  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
; NO LICENCE IS GRANTED. See LICENCE.txt.
;
; The Windows installer, made the way Inkwell's is: built by Inno Setup on
; GitHub's Windows machine from the folder build of Carpe Diem (dist\Carpe Diem).
; It installs for the current user only, with no administrator password, into
;   %LOCALAPPDATA%\Programs\Carpe Diem
; puts Carpe Diem in the Start menu (and on the Desktop if you tick it), and
; registers an uninstaller in Settings, Apps.
;
; Your work is NOT in that folder. It lives in
;   %LOCALAPPDATA%\CarpeDiem\storage
; the same folder the portable Carpe Diem.exe has always used, so an installed
; copy opens on exactly the work you already have. Installing, updating and
; uninstalling never touch it; before each install a COPY of it is made in
;   %LOCALAPPDATA%\CarpeDiem\backups\setup-<date and time>

#ifndef AppVersion
  #define AppVersion "1062"
#endif
#ifndef SourceDir
  #define SourceDir "..\dist\Carpe Diem"
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
DefaultDirName={localappdata}\Programs\Carpe Diem
DefaultGroupName=Carpe Diem
DisableProgramGroupPage=yes
DisableDirPage=yes
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
ArchitecturesInstallIn64BitMode=x64

[Tasks]
Name: "desktopicon"; Description: "Put Carpe Diem on the Desktop"; GroupDescription: "Shortcuts:"

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{userprograms}\Carpe Diem"; Filename: "{app}\Carpe Diem.exe"; WorkingDir: "{app}"; Comment: "Carpe Diem, build {#AppVersion}"
Name: "{userdesktop}\Carpe Diem"; Filename: "{app}\Carpe Diem.exe"; WorkingDir: "{app}"; Comment: "Carpe Diem, build {#AppVersion}"; Tasks: desktopicon

[Run]
Filename: "{app}\Carpe Diem.exe"; Description: "Open Carpe Diem now"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "{sys}\taskkill.exe"; Parameters: "/F /IM ""Carpe Diem.exe"" /T"; Flags: runhidden; RunOnceId: "StopCarpeDiem"

[UninstallDelete]
; the program's own note of how it last started, kept beside it; nothing else
Type: files; Name: "{app}\carpe_diem_crash.log"

[Code]
{ Before anything changes: close a running Carpe Diem, and copy the folder that
  holds your work to backups\setup-<date>. A copy only; nothing is moved or
  deleted. }
procedure CurStepChanged(CurStep: TSetupStep);
var
  Code: Integer;
  Src, Dst: String;
begin
  if CurStep = ssInstall then
  begin
    Exec(ExpandConstant('{sys}\taskkill.exe'), '/F /IM "Carpe Diem.exe" /T', '', SW_HIDE, ewWaitUntilTerminated, Code);
    Src := ExpandConstant('{localappdata}\CarpeDiem\storage');
    if DirExists(Src) then
    begin
      Dst := ExpandConstant('{localappdata}\CarpeDiem\backups\setup-') + GetDateTimeString('yyyymmdd-hhnnss', #0, #0) + '\storage';
      Exec(ExpandConstant('{sys}\robocopy.exe'), '"' + Src + '" "' + Dst + '" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /XD Cache "Code Cache" GPUCache DawnCache GrShaderCache ShaderCache',
           '', SW_HIDE, ewWaitUntilTerminated, Code);
    end;
  end;
end;
