#!/bin/bash

# Deploy Private Payment Contract to Starknet Testnet
# 
# Prerequisites:
# 1. Install starkli: cargo install starkli
# 2. Set up account: starkli account fetch <ACCOUNT_NAME> --network testnet
# 3. Set environment variables:
#    export STARKNET_ACCOUNT=<ACCOUNT_NAME>
#    export STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7
#
# Usage:
#   ./scripts/deploy-private-payment.sh

set -e

echo "🚀 Deploying Private Payment Contract to Starknet Testnet..."

# Check if starkli is installed
if ! command -v starkli &> /dev/null; then
    echo "❌ Error: starkli is not installed"
    echo "Install it with: cargo install starkli"
    exit 1
fi

# Check if Scarb is installed
if ! command -v scarb &> /dev/null; then
    echo "❌ Error: Scarb is not installed"
    echo "Install it from: https://docs.swmansion.com/scarb/"
    exit 1
fi

# Set network
export STARKNET_NETWORK=testnet

# Build contract
echo "📦 Building contract..."
cd contracts/private_payment
scarb build

if [ $? -ne 0 ]; then
    echo "❌ Contract build failed"
    exit 1
fi

echo "✅ Contract built successfully"

# Get paths
SIERRA_FILE="target/dev/private_payment_PrivatePayment.sierra.json"
CASM_FILE="target/dev/private_payment_PrivatePayment.casm.json"

if [ ! -f "$SIERRA_FILE" ]; then
    echo "❌ Error: Sierra file not found at $SIERRA_FILE"
    exit 1
fi

if [ ! -f "$CASM_FILE" ]; then
    echo "❌ Error: CASM file not found at $CASM_FILE"
    exit 1
fi

# Declare contract
echo "📝 Declaring contract..."
DECLARE_OUTPUT=$(starkli declare "$SIERRA_FILE" --network testnet 2>&1)
CLASS_HASH=$(echo "$DECLARE_OUTPUT" | grep -oP 'class_hash: \K0x[a-fA-F0-9]+' || echo "")

if [ -z "$CLASS_HASH" ]; then
    echo "❌ Failed to extract class hash from declare output"
    echo "Output: $DECLARE_OUTPUT"
    exit 1
fi

echo "✅ Contract declared with class hash: $CLASS_HASH"

# Deploy contract
echo "🚀 Deploying contract..."
DEPLOY_OUTPUT=$(starkli deploy "$CLASS_HASH" --network testnet 2>&1)
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oP 'contract_address: \K0x[a-fA-F0-9]+' || echo "")

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "❌ Failed to extract contract address from deploy output"
    echo "Output: $DEPLOY_OUTPUT"
    exit 1
fi

echo ""
echo "✅ =========================================="
echo "✅ Contract deployed successfully!"
echo "✅ =========================================="
echo ""
echo "📋 Contract Details:"
echo "   Class Hash: $CLASS_HASH"
echo "   Contract Address: $CONTRACT_ADDRESS"
echo "   Network: Starknet Testnet (Sepolia)"
echo ""
echo "📝 Add this to your .env.local:"
echo "   NEXT_PUBLIC_STARKNET_PAYMENT_CONTRACT=$CONTRACT_ADDRESS"
echo ""
echo "🔗 View on Starkscan:"
echo "   https://sepolia.starkscan.co/contract/$CONTRACT_ADDRESS"
echo ""

