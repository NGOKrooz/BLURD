# Blurd Merchant Dashboard

Merchant-facing dashboard for verifying ZK proofs and payment status.

## Features

- Upload and verify zero-knowledge proofs
- Check payment status by transaction ID or proof hash
- View combined verification results

## Development

```bash
npm install
npm run dev
```

App runs on http://localhost:3001

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```
NEXT_PUBLIC_API_URL=http://localhost:3002
```

