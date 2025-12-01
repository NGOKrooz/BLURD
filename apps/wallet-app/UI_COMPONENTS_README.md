# BLURD MVP UI Components - React/Next.js 14

## Overview

Complete set of Starknet-native, privacy-first UI screens for the BLURD MVP. All components are hackathon-ready with dark themes, mobile-responsive layouts, and smooth animations.

## Components Created

### 1. **WalletConnected** (`/components/WalletConnected.tsx`)
- Displays wallet address (truncated format)
- Shows STRK balance from Starknet Testnet
- Wallet connection status indicator
- Connect/Disconnect functionality
- Auto-detects Braavos/Argent X wallets
- Copy address to clipboard
- Link to Starkscan explorer

**Usage:**
```tsx
import WalletConnected from '@/components/WalletConnected';

<WalletConnected />
```

### 2. **TransactionLoading** (`/components/TransactionLoading.tsx`)
- Animated spinner for pending transactions
- Status updates: pending → accepted → confirmed
- Progress bar animation
- Error state handling
- Transaction hash display

**Usage:**
```tsx
import TransactionLoading from '@/components/TransactionLoading';

<TransactionLoading 
  status="pending" // 'pending' | 'accepted' | 'confirmed' | 'rejected'
  txHash="0x..."
  message="Waiting for confirmation..."
/>
```

### 3. **ZKProofAttached** (`/components/ZKProofAttached.tsx`)
- Displays proof type (age, nationality, uniqueness)
- Shows proof hash with copy functionality
- Download proof JSON button
- Color-coded by proof type
- Privacy-first messaging

**Usage:**
```tsx
import ZKProofAttached from '@/components/ZKProofAttached';

<ZKProofAttached 
  proofType="age"
  proofHash="0x..."
  onDownload={() => {/* custom download logic */}}
/>
```

## Pages Created

### 1. **Enhanced Send Payment** (`/app/payments/send-enhanced/page.tsx`)
- Full payment form with Starknet integration
- Real transaction sending via `sendStarknetPayment()`
- Transaction loading states
- Success screen with payment details
- ZK proof binding integration
- Error handling with user-friendly messages
- Privacy-preserving proof download

**Route:** `/payments/send-enhanced`

**Features:**
- Recipient address input
- Amount input (STRK)
- Optional ZK proof attachment
- Auto-calculated proof hash
- Real-time transaction status
- Success animation
- Transaction hash with explorer link

### 2. **Enhanced Dashboard** (`/app/dashboard-enhanced/page.tsx`)
- Wallet connection card
- Overview statistics (proofs, payments, last proof)
- Quick actions grid
- Clean navigation
- Mobile-responsive layout

**Route:** `/dashboard-enhanced`

**Features:**
- Total verified proofs count
- Last proof type and timestamp
- Total payments count
- Quick action cards:
  - My Proofs
  - Send Payment
  - Verify Payment
  - History
  - Settings

## Integration Points

### Starknet Functions Used

1. **Wallet Connection:**
   ```tsx
   import { detectAndConnectWallet } from '@/lib/starknet';
   const wallet = await detectAndConnectWallet();
   ```

2. **Balance Fetching:**
   ```tsx
   import { getStarknetBalance } from '@/lib/starknet';
   const balance = await getStarknetBalance(address);
   ```

3. **Sending Payments:**
   ```tsx
   import { sendStarknetPayment } from '@/lib/starknet';
   const txHash = await sendStarknetPayment({
     recipient: '0x...',
     amount: '1.5',
     proofHash: '0x...' // optional
   });
   ```

## Design System

### Colors
- **Blue:** Identity proofs, primary actions
- **Green:** Payments, success states
- **Purple:** Payment proofs, verification
- **Yellow:** History, warnings
- **Gray:** Settings, neutral states

### Typography
- Headings: `font-semibold`
- Body: `text-sm` or `text-xs`
- Monospace: Wallet addresses, hashes

### Spacing
- Cards: `p-4 sm:p-6 lg:p-8`
- Gaps: `gap-4 sm:gap-5`
- Margins: `mb-4 sm:mb-6`

### Responsive Breakpoints
- Mobile: Default (no prefix)
- Tablet: `sm:` (640px+)
- Desktop: `lg:` (1024px+)

## Testing

All components have been tested and verified:
- ✅ TypeScript compilation passes
- ✅ Next.js build succeeds
- ✅ No linting errors
- ✅ Mobile-responsive layouts
- ✅ Dark theme consistency

## Next Steps

1. **Deploy Contract:**
   - Deploy `payment_proof.cairo` to Starknet Testnet
   - Update `STARKNET_PAYMENT_CONTRACT` in `.env.local`

2. **Configure RPC:**
   - Add `STARKNET_RPC_URL` to `.env.local`
   - Use Infura or public Starknet Sepolia RPC

3. **Test Flow:**
   - Connect wallet (Braavos/Argent X)
   - Generate ZK proof
   - Send payment with proof hash
   - Verify payment on-chain

## File Structure

```
apps/wallet-app/
├── src/
│   ├── components/
│   │   ├── WalletConnected.tsx          # Wallet connection screen
│   │   ├── TransactionLoading.tsx        # Transaction status animation
│   │   └── ZKProofAttached.tsx           # Proof attachment display
│   ├── app/
│   │   ├── dashboard-enhanced/
│   │   │   └── page.tsx                  # Enhanced dashboard
│   │   └── payments/
│   │       └── send-enhanced/
│   │           └── page.tsx              # Enhanced send payment
│   └── lib/
│       └── starknet.ts                   # Starknet integration helpers
```

## Privacy-First Messaging

All components emphasize:
- "Prove Anything. Reveal Nothing."
- No personal data exposure
- On-chain proof hash storage only
- Privacy-preserving payment proofs

## Hackathon Demo Flow

1. **Dashboard** → Overview of proofs and payments
2. **My Proofs** → Generate ZK identity proofs
3. **Send Payment** → Send payment with optional proof binding
4. **Transaction Loading** → Real-time status updates
5. **Success Screen** → Payment confirmed with proof hash
6. **Verify Payment** → Merchant verification flow

---

**Ready for hackathon demo!** 🚀

