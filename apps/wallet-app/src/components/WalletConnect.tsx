'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

/**
 * Wallet Connect Component using RainbowKit
 * Supports MetaMask, Coinbase, and other EVM-compatible wallets
 */
export default function WalletConnect() {
  return (
    <div className="flex items-center">
      <ConnectButton showBalance={false} chainStatus="icon" />
    </div>
  );
}
