# Blurd – Private Payments with ZK Attribute Proofs

**Zypherpunk Hackathon 2025** | Module for Forge Finance

## Overview

Blurd enables fully private payments using Zcash shielded transactions, combined with zero-knowledge attribute proofs that allow merchants to verify user attributes without exposing any personal data.

### Core Value Proposition

- **Fully Private Payments**: All transaction data (sender, receiver, amount, memo) is hidden using Zcash shielded transactions
- **Selective Disclosure**: Users can prove attributes (age, country, verification status) without revealing underlying data
- **Merchant Verification**: Merchants can verify both payment and attributes without seeing personal information

## Architecture

```
/blurd
  /apps
    /wallet-app          # Next.js user wallet UI
    /merchant-dashboard  # Next.js merchant verification UI
    /api                 # Node.js API for payment verification
  /zk
    /circuits            # Circom ZK circuits
      /ageProof
      /countryProof
      /verifiedProof
    /build               # Compiled circuit artifacts
  /payments
    zcashClient.ts       # Zcash SDK integration
    paymentService.ts    # Payment orchestration
  /shared
    utils.ts             # Shared utilities
    constants.ts         # Constants
```

## Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **ZK**: Circom, SnarkJS
- **Payments**: Zcash lightwallet SDK
- **Database**: SQLite (for demo)

## How It Works

### 1. Zero-Knowledge Proofs

Users generate ZK proofs for attributes:
- **Verified Proof**: Proves user has verified credentials without revealing identity
- **Age Proof**: Proves user is above a certain age without revealing exact age
- **Country Proof**: Proves user is from a specific country without revealing other details

The circuits use Circom and generate proofs that can be verified without revealing the underlying data.

### 2. Private Payments

Payments are sent using Zcash shielded transactions:
- All transaction data is encrypted
- Only the transaction ID and proof hash are stored (for merchant lookup)
- Private keys never leave the user's device

### 3. Proof-Payment Binding

When a user sends a payment:
1. Generate ZK proof for desired attribute
2. Compute `proofHash = SHA256(proof.json)`
3. Include `proofHash` in the shielded transaction memo
4. Merchant can verify both proof validity and payment status

### 4. Merchant Verification

Merchants receive:
- ZK proof JSON
- Public signals JSON
- Transaction ID or proof hash

The system verifies:
- ZK proof is valid
- Payment exists and is confirmed
- Proof hash matches payment memo

**Merchant sees**: `{ paymentConfirmed: true, zkVerified: true }`  
**Merchant never sees**: name, age, nationality, wallet identity, document details

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- Circom compiler (install via: `npm install -g circom`)
- SnarkJS (included in dependencies)

### Installation

```bash
# Install all dependencies
npm run install:all

# Build ZK circuits
npm run build:zk
```

### Running Locally

```bash
# Terminal 1: Wallet App (port 3000)
npm run dev:wallet

# Terminal 2: Merchant Dashboard (port 3001)
npm run dev:merchant

# Terminal 3: API Server (port 3002)
npm run dev:api
```

### Environment Variables

Create `.env.local` files in each app:

**apps/wallet-app/.env.local**:
```
NEXT_PUBLIC_API_URL=http://localhost:3002
```

**apps/merchant-dashboard/.env.local**:
```
NEXT_PUBLIC_API_URL=http://localhost:3002
```

**apps/api/.env.local**:
```
PORT=3002
DATABASE_PATH=./data/payments.db
ZCASH_RPC_URL=http://localhost:8232
```

## Usage Flow

### User Flow (Wallet App)

1. Navigate to `/generate-proof`
2. Select attribute to prove (age, country, verified)
3. Generate proof locally
4. Copy proof JSON and proof hash
5. Navigate to `/send-payment`
6. Enter amount and attach proof hash
7. Send shielded ZEC payment
8. View confirmation

### Merchant Flow (Dashboard)

1. Navigate to `/verify`
2. Upload proof JSON and public signals
3. Enter transaction ID or proof hash
4. Click "Verify"
5. View results: `VERIFIED_AND_PAID` or error message

## ZK Circuit Details

### VerifiedProof Circuit

**Private Inputs**:
- `userSecret`: User's private secret
- `issuerSignature`: Signature from issuer

**Public Output**:
- `proofOfVerification`: 1 if valid, 0 otherwise

**Logic**: Verifies that issuer signature matches hashed user secret.

### AgeProof Circuit

**Private Inputs**:
- `userAge`: Actual age (private)
- `minAge`: Minimum required age

**Public Output**:
- `isAboveAge`: 1 if userAge >= minAge, 0 otherwise

### CountryProof Circuit

**Private Inputs**:
- `userCountryHash`: Hash of user's country
- `requiredCountryHash`: Hash of required country

**Public Output**:
- `countryMatch`: 1 if countries match, 0 otherwise

## Security Considerations

- **Private keys**: Never stored on server, only in browser localStorage (encrypted)
- **ZK proofs**: Generated locally, never sent to server in full
- **Payment data**: Only transaction IDs and proof hashes stored
- **No PII**: No personal identifiable information is ever stored

## Hackathon Demo Value

Blurd demonstrates:
- ✅ Fully private payment system
- ✅ Zero-knowledge attribute verification
- ✅ Practical use case for merchants
- ✅ Privacy-preserving commerce
- ✅ Usable for remittances, anonymous commerce, private trading

## License

MIT License - Zypherpunk Hackathon 2025

