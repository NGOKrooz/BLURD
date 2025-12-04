# BLURD - Privacy-Preserving ZK Credentials & Payments

BLURD is a privacy-first MVP that combines zero-knowledge identity proofs with private payments on Ethereum/Aztec L2.

## Features

- 🔒 **ZK Identity Proofs**: Generate proofs for age, nationality, and uniqueness without revealing personal data
- 💰 **Private Payments**: Send payments with attached ZK proofs while maintaining privacy
- 🛡️ **Privacy-First**: Commitment-based privacy system (Aztec-style) ensures transaction details stay private
- 🌐 **Ethereum/Aztec L2**: Built on Ethereum Sepolia testnet with Aztec L2 compatibility

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Blockchain**: Ethereum (Sepolia Testnet), Aztec L2 compatible
- **Wallet**: MetaMask, WalletConnect, and other Ethereum wallets
- **ZK Proofs**: Circom, snarkjs for client-side proof generation
- **Privacy**: Commitment-based payment system

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MetaMask or another Ethereum wallet
- Ethereum Sepolia testnet ETH (get from [Sepolia Faucet](https://sepoliafaucet.com/))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/NGOKrooz/BLURD.git
cd BLURD
```

2. Install dependencies:
```bash
npm install
cd apps/wallet-app
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Ethereum/Aztec RPC
NEXT_PUBLIC_ETHEREUM_RPC=https://rpc.ankr.com/eth_sepolia
NEXT_PUBLIC_AZTEC_RPC=https://your-aztec-rpc-url

# Contract Address (deploy your privacy contract first)
NEXT_PUBLIC_PRIVATE_PAYMENT_CONTRACT_ADDRESS=0x...

# WalletConnect (optional)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
```

4. Build ZK circuits:
```bash
npm run build:zk
```

5. Start the development server:
```bash
npm run dev:wallet
```

The app will be available at `http://localhost:3000`

## Usage

### 1. Connect Wallet

1. Click "Connect Wallet" in the top right
2. Select MetaMask or your preferred Ethereum wallet
3. Approve the connection request
4. Ensure you're on Ethereum Sepolia testnet

### 2. Generate Identity Proofs

1. Navigate to "Generate Proof" or "Credentials"
2. Select proof type (Age 18+, Nationality, Uniqueness)
3. Upload required documents or enter data
4. Generate and download your ZK proof

### 3. Send Private Payment

1. Go to "Payments" → "Send Payment"
2. Enter recipient address
3. Enter amount in ETH
4. (Optional) Attach a ZK identity proof
5. Click "Send Private Payment"
6. Approve transaction in your wallet
7. Download the payment proof file

### 4. Verify Payment

1. Navigate to "Verify Payment"
2. Upload payment proof JSON file
3. System verifies the proof and checks on-chain commitment

## Architecture

### Privacy System

BLURD uses a commitment-based privacy system:

1. **Commitment Generation**: Payment details (sender, recipient, amount) are hashed with a random nonce
2. **On-Chain Storage**: Only the commitment hash is stored on-chain
3. **Off-Chain Proof**: Full payment details and ZK proofs are stored locally
4. **Verification**: Merchants can verify payments using the commitment hash and proof file

### ZK Proof Flow

1. User generates ZK proof for identity attributes (age, nationality, etc.)
2. Proof is stored locally with public signals
3. When sending payment, proof hash is calculated and attached
4. Payment proof file contains commitment + proof hash (no sensitive data)

## Project Structure

```
apps/wallet-app/
├── src/
│   ├── app/              # Next.js pages
│   ├── components/        # React components
│   ├── lib/
│   │   ├── ethereum/     # Ethereum/Aztec integration
│   │   ├── zk/           # ZK proof generation
│   │   └── payment-proof.ts
│   ├── providers/        # React context providers
│   └── hooks/            # Custom React hooks
└── public/
    └── zk/               # ZK circuit files
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_ETHEREUM_RPC` | Ethereum RPC endpoint | Yes |
| `NEXT_PUBLIC_AZTEC_RPC` | Aztec L2 RPC endpoint | Optional |
| `NEXT_PUBLIC_PRIVATE_PAYMENT_CONTRACT_ADDRESS` | Privacy contract address | Yes |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID | Optional |

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
npm start
```

### ZK Circuit Development

ZK circuits are built using Circom. To modify circuits:

1. Edit circuits in `zk/circuits/`
2. Rebuild: `npm run build:zk`
3. Update proof generation code if needed

## Migration from Starknet

This project was migrated from Starknet to Ethereum/Aztec L2. Key changes:

- ✅ Replaced Starknet.js with ethers.js
- ✅ Updated wallet connection to use MetaMask/WalletConnect
- ✅ Changed STRK to ETH
- ✅ Updated RPC endpoints to Ethereum Sepolia
- ✅ Maintained ZK proof functionality
- ✅ Preserved privacy-preserving payment system

## Troubleshooting

### Wallet Connection Issues

- Ensure MetaMask is installed and unlocked
- Check that you're on Ethereum Sepolia testnet
- Try disconnecting and reconnecting

### RPC Connection Errors

- The app automatically tries multiple RPC fallbacks
- Check console for which RPC is being used
- Update `NEXT_PUBLIC_ETHEREUM_RPC` if needed

### Balance Not Loading

- Ensure you have ETH on Sepolia testnet
- Check RPC connection status
- Try refreshing the page

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Hackathon Notes

This project was built for the Zypherpunk Hackathon 2025. It demonstrates:

- Privacy-preserving payments with ZK proofs
- Client-side proof generation
- Commitment-based privacy system
- Ethereum/Aztec L2 integration

## Support

For issues or questions, please open an issue on GitHub.

