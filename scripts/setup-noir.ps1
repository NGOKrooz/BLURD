# PowerShell script to set up Noir and compile the circuit

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Blurd Noir ZK Setup" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Noir is installed
if (Get-Command nargo -ErrorAction SilentlyContinue) {
    Write-Host "✅ Noir is already installed" -ForegroundColor Green
    nargo --version
} else {
    Write-Host "📦 Installing Noir..." -ForegroundColor Yellow
    irm https://raw.githubusercontent.com/noir-lang/noirup/main/install.ps1 | iex
    noirup
    Write-Host "✅ Noir installed successfully" -ForegroundColor Green
}

# Navigate to circuit directory
$circuitDir = Join-Path $PSScriptRoot "..\noir\blurd_age_proof"
if (-not (Test-Path $circuitDir)) {
    Write-Host "❌ Circuit directory not found: $circuitDir" -ForegroundColor Red
    exit 1
}

Set-Location $circuitDir
Write-Host "`n📁 Working directory: $circuitDir" -ForegroundColor Cyan

# Generate proving key and test proof
Write-Host "`n🔨 Generating proving key and test proof..." -ForegroundColor Yellow
try {
    nargo prove
    Write-Host "✅ Proof generated successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to generate proof: $_" -ForegroundColor Red
    exit 1
}

# Verify the proof
Write-Host "`n🔍 Verifying proof..." -ForegroundColor Yellow
try {
    nargo verify
    Write-Host "✅ Proof verified successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Proof verification failed: $_" -ForegroundColor Red
    exit 1
}

# Compile to WASM
Write-Host "`n⚙️ Compiling to WASM..." -ForegroundColor Yellow
try {
    nargo compile --target wasm
    Write-Host "✅ WASM compilation successful" -ForegroundColor Green
} catch {
    Write-Host "❌ WASM compilation failed: $_" -ForegroundColor Red
    Write-Host "   Make sure you're using Noir >= 0.20.0" -ForegroundColor Yellow
    exit 1
}

# Copy files to frontend
Write-Host "`n📋 Copying files to frontend..." -ForegroundColor Yellow

$targetDir = Join-Path $circuitDir "target"
$walletPublic = Join-Path $PSScriptRoot "..\apps\wallet-app\public\zk"
$merchantPublic = Join-Path $PSScriptRoot "..\apps\merchant-dashboard\public\zk"

# Create directories if they don't exist
New-Item -ItemType Directory -Force -Path $walletPublic | Out-Null
New-Item -ItemType Directory -Force -Path $merchantPublic | Out-Null

# Copy WASM files
$wasmFile = Join-Path $targetDir "blurd_age_proof.wasm"
$verifierFile = Join-Path $targetDir "blurd_age_proof_verifier.json"

if (Test-Path $wasmFile) {
    Copy-Item $wasmFile (Join-Path $walletPublic "prover.wasm") -Force
    Copy-Item $wasmFile (Join-Path $merchantPublic "verifier.wasm") -Force
    Write-Host "✅ Copied WASM files" -ForegroundColor Green
} else {
    Write-Host "❌ WASM file not found: $wasmFile" -ForegroundColor Red
}

if (Test-Path $verifierFile) {
    Copy-Item $verifierFile (Join-Path $walletPublic "verifier.json") -Force
    Copy-Item $verifierFile (Join-Path $merchantPublic "verifier.json") -Force
    Write-Host "✅ Copied verifier files" -ForegroundColor Green
} else {
    Write-Host "❌ Verifier file not found: $verifierFile" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update the WASM loading code in:" -ForegroundColor White
Write-Host "   - apps/wallet-app/src/lib/zk/noir-wasm.ts" -ForegroundColor Gray
Write-Host "   - apps/merchant-dashboard/src/lib/zk/noir-verifier.ts" -ForegroundColor Gray
Write-Host "2. Test proof generation in the wallet app" -ForegroundColor White
Write-Host "3. Test proof verification in the merchant dashboard`n" -ForegroundColor White


