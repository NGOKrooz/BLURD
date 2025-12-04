# Deploy Private Payment Contract to Starknet Testnet (PowerShell)
# 
# Prerequisites:
# 1. Install Scarb: https://docs.swmansion.com/scarb/download
# 2. Set environment variables in .env.local:
#    STARKNET_DEPLOYER_ADDRESS=0x...
#    STARKNET_DEPLOYER_PRIVATE_KEY=0x...
#    NEXT_PUBLIC_STARKNET_RPC=https://starknet-sepolia.public.blastapi.io/rpc/v0_7
#
# Usage:
#   .\scripts\deploy-private-payment.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying Private Payment Contract to Starknet Testnet..." -ForegroundColor Cyan
Write-Host ""

# Check if Scarb is installed
try {
    $scarbVersion = scarb --version 2>&1
    Write-Host "✅ Scarb found: $scarbVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Scarb is not installed" -ForegroundColor Red
    Write-Host "   Install it from: https://docs.swmansion.com/scarb/download" -ForegroundColor Yellow
    exit 1
}

# Build contract
Write-Host "📦 Building contract..." -ForegroundColor Cyan
Set-Location contracts/private_payment

try {
    scarb build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
    Write-Host "✅ Contract built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Contract build failed" -ForegroundColor Red
    Set-Location ../..
    exit 1
}

# Get paths
$sierraFile = "target/dev/private_payment_PrivatePayment.sierra.json"
$casmFile = "target/dev/private_payment_PrivatePayment.casm.json"

if (-not (Test-Path $sierraFile)) {
    Write-Host "❌ Error: Sierra file not found at $sierraFile" -ForegroundColor Red
    Set-Location ../..
    exit 1
}

Write-Host ""
Write-Host "📝 To deploy, use one of these methods:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: TypeScript script (Recommended)" -ForegroundColor Yellow
Write-Host "   npx tsx scripts/deploy-private-payment.ts" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Manual deployment with starkli" -ForegroundColor Yellow
Write-Host "   starkli declare $sierraFile --network testnet" -ForegroundColor White
Write-Host "   starkli deploy <CLASS_HASH> --network testnet" -ForegroundColor White
Write-Host ""
Write-Host "📋 Contract files:" -ForegroundColor Cyan
Write-Host "   Sierra: $sierraFile" -ForegroundColor White
Write-Host "   CASM: $casmFile" -ForegroundColor White
Write-Host ""

Set-Location ../..

