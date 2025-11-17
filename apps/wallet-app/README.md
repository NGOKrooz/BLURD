# Blurd Wallet App

User-facing wallet application for generating ZK proofs and sending private payments.

## Features

- Generate zero-knowledge proofs for attributes (verified, age, country)
- Send shielded ZEC payments with proof binding
- View transaction history and proof hashes

## Development

```bash
npm install
npm run dev
```

App runs on http://localhost:3000

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```
NEXT_PUBLIC_API_URL=http://localhost:3002
```

