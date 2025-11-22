# Script to compile Noir circuit once Noir is installed

param(
    [switch]$SkipInstallCheck
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Compiling Noir Circuit" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Noir is installed
if (-not $SkipInstallCheck) {
    if (-not (Get-Command nargo -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Noir (nargo) is not installed!" -ForegroundColor Red
        Write-Host "`nPlease install Noir first:" -ForegroundColor Yellow
        Write-Host "  1. Run: irm https://raw.githubusercontent.com/noir-lang/noirup/main/install.ps1 | iex" -ForegroundColor White
        Write-Host "  2. Then: noirup" -ForegroundColor White
        Write-Host "  3. Verify: nargo --version" -ForegroundColor White
        Write-Host "`nOr see noir/INSTALL_NOIR.md for manual installation options.`n" -ForegroundColor Gray
        exit 1
    }
    
    Write-Host "✅ Noir is installed" -ForegroundColor Green
    nargo --version
    Write-Host ""
}

# Navigate to circuit directory
$circuitDir = Join-Path $PSScriptRoot "..\noir\blurd_age_proof"
if (-not (Test-Path $circuitDir)) {
    Write-Host "❌ Circuit directory not found: $circuitDir" -ForegroundColor Red
    exit 1
}

Set-Location $circuitDir
Write-Host "📁 Working directory: $circuitDir" -ForegroundColor Cyan

# Step 1: Check circuit
Write-Host "`n🔍 Checking circuit..." -ForegroundColor Yellow
try {
    nargo check
    Write-Host "✅ Circuit is valid" -ForegroundColor Green
} catch {
    Write-Host "❌ Circuit check failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Generate proving key and test proof
Write-Host "`n🔨 Generating proving key and test proof..." -ForegroundColor Yellow
try {
    nargo prove
    Write-Host "✅ Proof generated successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to generate proof: $_" -ForegroundColor Red
    Write-Host "   Make sure Prover.toml has valid inputs" -ForegroundColor Yellow
    exit 1
}

# Step 3: Verify the proof
Write-Host "`n🔍 Verifying proof..." -ForegroundColor Yellow
try {
    nargo verify
    Write-Host "✅ Proof verified successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Proof verification failed: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Compile to WASM
Write-Host "`n⚙️ Compiling to WASM..." -ForegroundColor Yellow
try {
    nargo compile --target wasm
    Write-Host "✅ WASM compilation successful" -ForegroundColor Green
} catch {
    Write-Host "❌ WASM compilation failed: $_" -ForegroundColor Red
    Write-Host "   Make sure you're using Noir >= 0.20.0" -ForegroundColor Yellow
    Write-Host "   Try: noirup --nightly" -ForegroundColor Yellow
    exit 1
}

# Step 5: Copy files to frontend
Write-Host "`n📋 Copying files to frontend..." -ForegroundColor Yellow

$targetDir = Join-Path $circuitDir "target"
$walletPublic = Join-Path $PSScriptRoot "..\apps\wallet-app\public\zk"
$merchantPublic = Join-Path $PSScriptRoot "..\apps\merchant-dashboard\public\zk"

# Create directories if they don't exist
New-Item -ItemType Directory -Force -Path $walletPublic | Out-Null
New-Item -ItemType Directory -Force -Path $merchantPublic | Out-Null

# Find the compiled WASM file
$wasmFiles = Get-ChildItem -Path $targetDir -Filter "*.wasm" -Recurse
$verifierFiles = Get-ChildItem -Path $targetDir -Filter "*verifier*.json" -Recurse

if ($wasmFiles.Count -eq 0) {
    Write-Host "⚠️  No WASM file found in target directory" -ForegroundColor Yellow
    Write-Host "   Expected: target/blurd_age_proof.wasm" -ForegroundColor Gray
} else {
    $wasmFile = $wasmFiles[0]
    Copy-Item $wasmFile.FullName (Join-Path $walletPublic "prover.wasm") -Force
    Copy-Item $wasmFile.FullName (Join-Path $merchantPublic "verifier.wasm") -Force
    Write-Host "✅ Copied WASM: $($wasmFile.Name)" -ForegroundColor Green
}

if ($verifierFiles.Count -eq 0) {
    Write-Host "⚠️  No verifier JSON found in target directory" -ForegroundColor Yellow
    Write-Host "   Expected: target/blurd_age_proof_verifier.json" -ForegroundColor Gray
} else {
    $verifierFile = $verifierFiles[0]
    Copy-Item $verifierFile.FullName (Join-Path $walletPublic "verifier.json") -Force
    Copy-Item $verifierFile.FullName (Join-Path $merchantPublic "verifier.json") -Force
    Write-Host "✅ Copied verifier: $($verifierFile.Name)" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Compilation Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update WASM loading code in:" -ForegroundColor White
Write-Host "   - apps/wallet-app/src/lib/zk/noir-wasm.ts" -ForegroundColor Gray
Write-Host "   - apps/merchant-dashboard/src/lib/zk/noir-verifier.ts" -ForegroundColor Gray
Write-Host "2. Test proof generation in wallet app" -ForegroundColor White
Write-Host "3. Test proof verification in merchant dashboard`n" -ForegroundColor White

