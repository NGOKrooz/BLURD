'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Starknet Wallet Provider
 * Replaces EVM wallet providers (wagmi/rainbowkit) with Starknet-native wallet support
 * Supports: Argent X, Braavos
 */

interface StarknetContextType {
  wallet: any | null;
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
}

const StarknetContext = createContext<StarknetContextType | undefined>(undefined);

declare global {
  interface Window {
    starknet?: any;
    starknet_braavos?: any;
    starknet_argentX?: any;
  }
}

export function StarknetProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<any | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing connection on mount
  useEffect(() => {
    checkExistingConnection();
  }, []);

  const checkExistingConnection = async () => {
    try {
      if (typeof window === 'undefined') return;

      // Check for any Starknet wallet
      const candidate = window.starknet_braavos || window.starknet_argentX || window.starknet;
      
      if (candidate && candidate.isConnected) {
        setWallet(candidate);
        setAddress(candidate.selectedAddress);
        setIsConnected(true);
      }
    } catch (err) {
      console.error('Error checking existing connection:', err);
    }
  };

  const connect = async () => {
    try {
      setError(null);
      
      if (typeof window === 'undefined') {
        throw new Error('Window object not available');
      }

      // Prefer Braavos, then Argent X, then generic starknet
      const candidate = window.starknet_braavos || window.starknet_argentX || window.starknet;

      if (!candidate) {
        throw new Error('No Starknet wallet detected. Please install Argent X or Braavos.');
      }

      // Enable wallet connection
      await candidate.enable({ showModal: true });

      if (candidate.selectedAddress) {
        setWallet(candidate);
        setAddress(candidate.selectedAddress);
        setIsConnected(true);
      } else {
        throw new Error('Wallet connection failed. Please try again.');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect wallet';
      setError(errorMessage);
      console.error('Wallet connection error:', err);
      throw err;
    }
  };

  const disconnect = () => {
    if (wallet && wallet.disconnect) {
      wallet.disconnect();
    }
    setWallet(null);
    setAddress(null);
    setIsConnected(false);
    setError(null);
  };

  return (
    <StarknetContext.Provider
      value={{
        wallet,
        address,
        isConnected,
        connect,
        disconnect,
        error,
      }}
    >
      {children}
    </StarknetContext.Provider>
  );
}

export function useStarknet() {
  const context = useContext(StarknetContext);
  if (context === undefined) {
    throw new Error('useStarknet must be used within a StarknetProvider');
  }
  return context;
}

