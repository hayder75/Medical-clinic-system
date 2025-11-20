# Medical Clinic System - Windows Installer Creator
# Creates a professional Windows installer using Inno Setup
# Requires: Inno Setup Compiler installed

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Medical Clinic System - Windows Installer Creator" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$BuildDir = "$ProjectRoot\build-package\MedicalClinic-System"
$InnoScript = "$ScriptDir\installer-script.iss"

# Check if build directory exists
if (-not (Test-Path $BuildDir)) {
    Write-Host "ERROR: Build directory not found: $BuildDir" -ForegroundColor Red
    Write-Host "Please run build-package.sh first" -ForegroundColor Yellow
    exit 1
}

# Create Inno Setup script
Write-Host "Creating Inno Setup script..." -ForegroundColor Yellow

$InnoScriptContent = @"
[Setup]
AppName=Medical Clinic System
AppVersion=1.0.0
AppPublisher=Your Company Name
DefaultDirName={pf}\MedicalClinic
DefaultGroupName=Medical Clinic System
OutputDir=installer-output
OutputBaseFilename=MedicalClinic-Setup
Compression=lzma2
SolidCompression=yes
PrivilegesRequired=admin
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create desktop shortcut"; GroupDescription: "Additional icons:"
Name: "startup"; Description: "Start automatically on Windows boot"; GroupDescription: "Startup options:"

[Files]
Source: "$BuildDir\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Medical Clinic System"; Filename: "{app}\start-server.bat"
Name: "{group}\Stop Server"; Filename: "{app}\stop-server.bat"
Name: "{commondesktop}\Medical Clinic System"; Filename: "{app}\start-server.bat"; Tasks: desktopicon

[Run]
Filename: "{app}\setup.bat"; Description: "Run initial setup"; Flags: runhidden waituntilterminated
Filename: "{app}\start-server.bat"; Description: "Start Medical Clinic System"; Flags: nowait postinstall skipifsilent

[Code]
procedure InitializeWizard;
begin
  WizardForm.LicenseLabel.Caption := 'Medical Clinic System License Agreement';
end;
"@

$InnoScriptContent | Out-File -FilePath $InnoScript -Encoding UTF8

Write-Host "✅ Inno Setup script created: $InnoScript" -ForegroundColor Green

# Check if Inno Setup Compiler is installed
$InnoCompiler = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
if (-not (Test-Path $InnoCompiler)) {
    Write-Host ""
    Write-Host "⚠️  Inno Setup Compiler not found at: $InnoCompiler" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To create installer:" -ForegroundColor Yellow
    Write-Host "1. Download Inno Setup from: https://jrsoftware.org/isdl.php" -ForegroundColor Yellow
    Write-Host "2. Install it" -ForegroundColor Yellow
    Write-Host "3. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or manually compile: $InnoScript" -ForegroundColor Yellow
    exit 0
}

# Compile installer
Write-Host ""
Write-Host "Compiling installer..." -ForegroundColor Yellow
& $InnoCompiler $InnoScript

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "✅ Installer created successfully!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "Installer location: installer-output\MedicalClinic-Setup.exe" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Installer compilation failed" -ForegroundColor Red
    exit 1
}

