'use client';

import { useState, useEffect } from 'react';
import { Wallet, AlertCircle } from 'lucide-react';
import { useStarknet } from '@/providers/starknet-provider';

/**
 * Starknet Wallet Connect Component
 * Replaces RainbowKit ConnectButton with Starknet-native wallet connection
 * Supports: Argent X, Braavos
 */
export default function WalletConnect() {
  const { isConnected, address, connect, disconnect, error } = useStarknet();
  const [walletDetected, setWalletDetected] = useState(false);

  useEffect(() => {
    // Check if any Starknet wallet is installed
    if (typeof window !== 'undefined') {
      const detected = !!(window.starknet_braavos || window.starknet_argentX || window.starknet);
      setWalletDetected(detected);
    }
  }, []);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err: any) {
      // Error is handled by the provider
      console.error('Connection failed:', err);
    }
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}…${addr.substring(addr.length - 4)}`;
  };

  if (!walletDetected) {
    return (
      <div className="relative z-50">
        <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-400" />
          <span className="text-xs text-yellow-300">No Starknet wallet detected</span>
        </div>
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <div className="relative z-50">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs font-mono text-green-300">{truncateAddress(address)}</span>
          </div>
          <button
            onClick={disconnect}
            className="px-3 py-2 text-xs text-gray-400 hover:text-white transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-50">
      <button
        onClick={handleConnect}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        <Wallet className="h-4 w-4" />
        <span>Connect Wallet</span>
      </button>
      {error && (
        <div className="mt-2 text-xs text-red-400 max-w-xs">
          {error}
        </div>
      )}
    </div>
  );
}
