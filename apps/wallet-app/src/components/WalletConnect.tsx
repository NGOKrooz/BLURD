'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';

/**
 * Wallet Connect Component using RainbowKit
 * Supports MetaMask, Rainbow, Coinbase, and other EVM wallets
 */
export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });

  return (
    <div className="flex items-center space-x-4">
      {isConnected && balance && (
        <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
          <span className="text-sm text-gray-300">
            {parseFloat(balance.formatted).toFixed(4)} ETH
          </span>
        </div>
      )}
      <ConnectButton 
        showBalance={false}
        chainStatus="icon"
      />
    </div>
  );
}
