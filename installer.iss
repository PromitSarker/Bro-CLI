#define MyAppName "Bro-CLI"
#define MyAppVersion "1.0.1"
#define MyAppPublisher "Aether"
#define MyAppExeName "Bro-CLI.exe"

[Setup]
; AppId uniquely identifies this application.
AppId={{8B840A9A-1F4B-4E38-8950-B0A2127A3C8B}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
; Default installation directory in Program Files
DefaultDirName={autopf}\{#MyAppName}
DisableProgramGroupPage=yes
; Output folder for the setup.exe
OutputDir=Output
OutputBaseFilename=Bro-CLI-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Copy the main executable and all the bundled dependencies from the PyInstaller dist folder
Source: "dist\Bro-CLI\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\Bro-CLI\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
; Create a shortcut in the Start Menu and Desktop
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
; Option to launch the app immediately after installation
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
