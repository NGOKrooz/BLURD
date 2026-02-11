# Blurd App

A comprehensive zero-knowledge proof-based privacy application with multiple frontend and backend components.

## Project Overview

Blurd is a monorepo application featuring:
- **Merchant Dashboard** - Management interface for merchants
- **Wallet App** - User wallet application with privacy features
- **Backend API** - RESTful API for application services
- **Zero-Knowledge Circuits** - Privacy-preserving proof circuits (Circom & Noir)

## Project Structure

```
BLURD/
├── apps/
│   ├── api/                 # Backend API service
│   ├── merchant-dashboard/  # Merchant frontend (Next.js)
│   └── wallet-app/          # User wallet frontend (Next.js)
├── blurd-zk/                # Circom zero-knowledge circuits
├── zk/                      # Additional ZK utilities and circuits
├── noir/                    # Noir proof circuits
├── shared/                  # Shared utilities and constants
├── config/                  # Configuration files
└── scripts/                 # Build and setup scripts
```

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, TypeScript
- **Zero-Knowledge Proofs**: Circom, Noir
- **Build Tools**: Nixpacks, Docker
- **Testing**: Vitest (wallet-app)

## Prerequisites

- Node.js 18+ or higher
- npm or yarn
- For ZK development: Circom, Noir compiler

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd BLURD
```

2. **Install dependencies**
```bash
npm install
# or if using individual workspace installations
cd apps/api && npm install
cd ../merchant-dashboard && npm install
cd ../wallet-app && npm install
```

## Development

### API Server
```bash
cd apps/api
npm run dev
```

### Merchant Dashboard
```bash
cd apps/merchant-dashboard
npm run dev
```

### Wallet App
```bash
cd apps/wallet-app
npm run dev
```

## Building

### Production Build
```bash
npm run build
```

### Zero-Knowledge Circuits
Build ZK circuits:
```bash
npm run build-zk
```

Or for specific circuits:
```bash
node scripts/setup-age-proof.js
node scripts/setup-country-proof.js
node scripts/setup-uniqueness-proof.js
```

## Deployment

The application uses Nixpacks for containerization and Procfile for process management.

### Deploy to Production
```bash
# Review nixpacks.toml for build configuration
nixpacks build .
```

## Key Features

- **Age Verification**: Zero-knowledge proof for age verification
- **Country Verification**: Privacy-preserving country proof
- **Uniqueness Proofs**: Verify user uniqueness without exposing identity
- **Merchant Dashboard**: Management tools for merchants
- **Wallet Application**: Secure user wallet with privacy controls

## Scripts

- `build-zk.js` - Build ZK circuits
- `compile-noir.ps1` - Compile Noir circuits
- `setup-age-proof.js` - Initialize age proof circuit
- `setup-country-proof.js` - Initialize country proof circuit
- `setup-uniqueness-proof.js` - Initialize uniqueness proof circuit
- `test-credential-issue.js` - Test credential issuance

## Architecture

- **Monorepo Structure**: Multiple independent apps managed in single repository
- **Shared Utilities**: Common functions across applications
- **ZK Circuits**: Separate circuit compilation and verification logic
- **API-First**: Central API service for business logic
- **Next.js Frontend**: Modern React applications with SSR support

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally
4. Submit a pull request

## License

[Add your license information here]

## Support

For issues and questions, please refer to the repository issues page or contact the development team.
