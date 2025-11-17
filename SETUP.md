# Blurd Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all app dependencies
cd apps/wallet-app && npm install && cd ../..
cd apps/merchant-dashboard && npm install && cd ../..
cd apps/api && npm install && cd ../..
```

Or use the convenience script:
```bash
npm run install:all
```

### 2. Build ZK Circuits

```bash
npm run build:zk
```

**Note**: This requires Circom to be installed globally:
```bash
npm install -g circom
```

For the hackathon demo, the circuits are provided but may need compilation. The build script will compile all three circuits (verifiedProof, ageProof, countryProof).

### 3. Set Up Environment Variables

**Wallet App** (`apps/wallet-app/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:3002
```

**Merchant Dashboard** (`apps/merchant-dashboard/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:3002
```

**API Server** (`apps/api/.env.local`):
```
PORT=3002
DATABASE_PATH=./data/payments.db
ZCASH_RPC_URL=http://localhost:8232
```

### 4. Start Development Servers

Open three terminal windows:

**Terminal 1 - API Server**:
```bash
cd apps/api
npm run dev
```
Runs on http://localhost:3002

**Terminal 2 - Wallet App**:
```bash
cd apps/wallet-app
npm run dev
```
Runs on http://localhost:3000

**Terminal 3 - Merchant Dashboard**:
```bash
cd apps/merchant-dashboard
npm run dev
```
Runs on http://localhost:3001

## Demo Flow

### User Flow (Wallet App)

1. Navigate to http://localhost:3000
2. Click "Generate Proof"
3. Select proof type (Verified, Age, or Country)
4. Enter required inputs
5. Click "Generate Proof"
6. Copy the proof hash or JSON
7. Click "Continue to Send Payment"
8. Enter recipient address and amount
9. Click "Send Shielded Payment"
10. Note the transaction ID

### Merchant Flow (Dashboard)

1. Navigate to http://localhost:3001
2. Click "Verify Proof & Payment"
3. Paste the proof JSON from the user
4. Paste the public signals JSON
5. Enter either:
   - Transaction ID, OR
   - Proof hash
6. Click "Verify Proof & Payment"
7. View results:
   - `VERIFIED_AND_PAID` - Success!
   - `VERIFIED_PENDING` - Proof valid, payment pending
   - `PROOF_INVALID` - Proof verification failed
   - `PAYMENT_NOT_FOUND` - Payment not found

## Architecture Notes

### ZK Circuits

The circuits are located in `zk/circuits/`:
- `verifiedProof/verifiedProof.circom` - Proves user is verified
- `ageProof/ageProof.circom` - Proves user is above minimum age
- `countryProof/countryProof.circom` - Proves user is from specific country

### Payment Integration

Currently uses mock Zcash client for demo. To integrate with real Zcash:

1. Install Zcash lightwallet SDK or set up zcashd RPC
2. Update `payments/zcashClient.ts` with real implementation
3. Configure ZCASH_RPC_URL in API `.env.local`

### Database

Uses SQLite for simplicity. Database file is created automatically at `apps/api/data/payments.db`.

## Troubleshooting

### Circom Not Found

Install Circom:
```bash
npm install -g circom
```

Or use npx:
```bash
npx circom --version
```

### Port Already in Use

Change ports in:
- `apps/wallet-app/package.json` (dev script)
- `apps/merchant-dashboard/package.json` (dev script)
- `apps/api/src/index.ts` (PORT env var)

### Database Errors

Ensure the `apps/api/data/` directory exists and is writable.

### CORS Issues

The API server has CORS enabled for all origins in development. For production, update `apps/api/src/index.ts`.

## Production Build

```bash
# Build all apps
cd apps/wallet-app && npm run build && cd ../..
cd apps/merchant-dashboard && npm run build && cd ../..
cd apps/api && npm run build && cd ../..
```

## Next Steps for Production

1. **ZK Circuits**: Complete trusted setup and generate real proving/verification keys
2. **Zcash Integration**: Replace mock client with real Zcash SDK
3. **Security**: Add authentication, rate limiting, input validation
4. **Database**: Migrate to PostgreSQL for production
5. **Deployment**: Set up Docker containers or cloud deployment

