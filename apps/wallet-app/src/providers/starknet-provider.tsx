'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { checkNetwork, SN_SEPOLIA_CHAIN_ID } from '@/lib/starknet';

/**
 * Starknet Wallet Provider
 * Replaces EVM wallet providers (wagmi/rainbowkit) with Starknet-native wallet support
 * Supports: Argent X, Braavos
 * Network: Starknet Sepolia
 */

interface StarknetContextType {
  wallet: any | null;
  address: string | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  networkError: string | null;
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
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check network when connected
  useEffect(() => {
    if (isConnected) {
      checkNetwork().then((result) => {
        setIsCorrectNetwork(result.valid);
        setNetworkError(result.error || null);
      });
    }
  }, [isConnected]);

  // Check for existing connection on mount and set up event listeners
  useEffect(() => {
    checkExistingConnection();
    
    // Set up event listeners for wallet changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
      } else {
        // Wallet disconnected
        setWallet(null);
        setAddress(null);
        setIsConnected(false);
      }
    };

    const handleNetworkChanged = () => {
      // Network changed - refresh connection
      checkExistingConnection();
    };

    // Listen for wallet events if available
    if (typeof window !== 'undefined') {
      const candidate = window.starknet_braavos || window.starknet_argentX || window.starknet;
      if (candidate) {
        // Some wallets support event listeners
        if (candidate.on) {
          candidate.on('accountsChanged', handleAccountsChanged);
          candidate.on('networkChanged', handleNetworkChanged);
        }
      }
    }

    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        const candidate = window.starknet_braavos || window.starknet_argentX || window.starknet;
        if (candidate && candidate.removeListener) {
          candidate.removeListener('accountsChanged', handleAccountsChanged);
          candidate.removeListener('networkChanged', handleNetworkChanged);
        }
      }
    };
  }, []);

  const checkExistingConnection = async () => {
    try {
      if (typeof window === 'undefined') return;

      // Check for any Starknet wallet
      const candidate = window.starknet_braavos || window.starknet_argentX || window.starknet;
      
      if (candidate) {
        // Check if wallet is connected
        const isConnected = candidate.isConnected || (candidate.selectedAddress && candidate.selectedAddress.length > 0);
        
        if (isConnected && candidate.selectedAddress) {
          setWallet(candidate);
          setAddress(candidate.selectedAddress);
          setIsConnected(true);
          setError(null);
        } else {
          // Wallet exists but not connected
          setWallet(null);
          setAddress(null);
          setIsConnected(false);
        }
      }
    } catch (err) {
      console.error('Error checking existing connection:', err);
      setError('Failed to check wallet connection');
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

      if (!candidate.selectedAddress) {
        throw new Error('Wallet connection failed. No account selected.');
      }

      // Verify the selected address is valid
      if (candidate.selectedAddress.length < 10) {
        throw new Error('Invalid wallet address. Please try reconnecting.');
      }

      setWallet(candidate);
      setAddress(candidate.selectedAddress);
      setIsConnected(true);
      setError(null);

      // Set up event listeners for this wallet
      if (candidate.on) {
        candidate.on('accountsChanged', (accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
          } else {
            setWallet(null);
            setAddress(null);
            setIsConnected(false);
          }
        });

        candidate.on('networkChanged', () => {
          // Network changed - refresh address
          if (candidate.selectedAddress) {
            setAddress(candidate.selectedAddress);
          }
        });
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
        isCorrectNetwork,
        networkError,
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

