# Blurd - Hackathon Demo Guide

## Quick Demo Script

### Step 1: Start All Services

Open 3 terminals:

**Terminal 1 - API**:
```bash
cd apps/api
npm install
npm run dev
```

**Terminal 2 - Wallet**:
```bash
cd apps/wallet-app
npm install
npm run dev
```

**Terminal 3 - Merchant Dashboard**:
```bash
cd apps/merchant-dashboard
npm install
npm run dev
```

### Step 2: User Flow (Wallet App)

1. Open http://localhost:3000
2. Click **"Generate Proof"**
3. Select **"Verified Proof"** (or Age/Country)
4. Click **"Generate Proof"**
5. **Copy the proof JSON** (you'll need this for merchant)
6. **Copy the proof hash** (also needed)
7. Click **"Continue to Send Payment"**
8. Enter:
   - Recipient address: `ztestsapling123` (any test address)
   - Amount: `0.1`
9. Click **"Send Shielded Payment"**
10. **Copy the Transaction ID**

### Step 3: Merchant Flow (Dashboard)

1. Open http://localhost:3001
2. Click **"Verify Proof & Payment"**
3. Paste the **Proof JSON** from Step 2
4. Paste the **Public Signals JSON**: `["1"]`
5. Enter the **Transaction ID** from Step 2
6. Click **"Verify Proof & Payment"**
7. See result: **"VERIFIED_AND_PAID"** ✅

## What This Demonstrates

### Privacy Features

✅ **Fully Private Payments**
- Transaction details (sender, receiver, amount) are hidden
- Only transaction ID and proof hash are stored

✅ **Zero-Knowledge Proofs**
- User proves attributes without revealing data
- Merchant only sees verification result (true/false)
- No personal information is exposed

✅ **Selective Disclosure**
- User chooses which attribute to prove
- Can prove age without revealing exact age
- Can prove country without revealing identity

### Technical Stack

- **ZK Circuits**: Circom for attribute proofs
- **Payments**: Zcash shielded transactions (mock for demo)
- **Frontend**: Next.js 14 with TypeScript & Tailwind
- **Backend**: Node.js/Express API
- **Database**: SQLite for payment records

## Demo Talking Points

1. **"Blurd enables fully private payments using Zcash shielded transactions"**
   - Show the send payment screen
   - Explain that all transaction data is encrypted

2. **"Users can prove attributes without revealing personal data"**
   - Show proof generation
   - Explain ZK proof concept

3. **"Merchants verify both payment and attributes without seeing any PII"**
   - Show merchant dashboard
   - Show verification result
   - Emphasize: no name, age, country, or wallet identity revealed

4. **"Use cases: anonymous commerce, private remittances, age-restricted services"**
   - Explain real-world applications

## Troubleshooting

### API Not Responding
- Check Terminal 1 for errors
- Ensure port 3002 is available
- Check database directory exists: `apps/api/data/`

### Proof Verification Fails
- Ensure proof JSON is valid
- Public signals should be `["1"]` for valid proofs
- Check browser console for errors

### Payment Not Found
- Ensure payment was sent from wallet app
- Check API logs for storage errors
- Verify transaction ID is correct

## Next Steps for Production

1. **Real Zcash Integration**: Replace mock client with Zcash SDK
2. **Trusted Setup**: Complete ZK circuit trusted setup
3. **Security Hardening**: Add authentication, rate limiting
4. **Scalability**: Migrate to PostgreSQL, add caching
5. **Mobile Support**: Build React Native wallet app

## Contact & Resources

- **Project**: Blurd - Private Payments with ZK Proofs
- **Hackathon**: Zypherpunk Hackathon 2025
- **Module**: Forge Finance

