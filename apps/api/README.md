# Blurd API Server

Backend API for payment verification and proof validation.

## Features

- Verify ZK proofs
- Store and retrieve payment records
- Check payment status by transaction ID or proof hash
- Combined proof + payment verification

## Development

```bash
npm install
npm run dev
```

Server runs on http://localhost:3002

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```
PORT=3002
DATABASE_PATH=./data/payments.db
ZCASH_RPC_URL=http://localhost:8232
```

## API Endpoints

- `POST /api/payments/verify` - Verify proof and payment
- `POST /api/payments/store` - Store payment record
- `GET /api/payments/check/:txid` - Check payment by transaction ID
- `POST /api/proofs/verify` - Verify ZK proof only
- `GET /health` - Health check

