'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { checkNetwork, ETHEREUM_SEPOLIA_CHAIN_ID, AZTEC_SEPOLIA_CHAIN_ID } from '@/lib/ethereum';
import { validateEthereumNetwork, getWorkingProvider } from '@/lib/ethereum/rpc';
import { ethers } from 'ethers';

/**
 * Ethereum/Aztec Wallet Provider
 * Replaces Starknet provider with Ethereum-compatible wallet support
 * Supports: MetaMask, WalletConnect, and other Ethereum wallets
 * Network: Ethereum Sepolia or Aztec Sepolia
 */

interface EthereumContextType {
  wallet: ethers.BrowserProvider | null;
  address: string | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  networkError: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
  signer: ethers.JsonRpcSigner | null;
}

const EthereumContext = createContext<EthereumContextType | undefined>(undefined);

export function EthereumProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Startup diagnostics - initialize RPC on mount
  useEffect(() => {
    const initRpc = async () => {
      if (typeof window !== 'undefined') {
        try {
          await getWorkingProvider();
          // Diagnostics are already logged in getWorkingProvider
        } catch (error: any) {
          console.error('❌ No RPCs reachable. Check internet or RPC endpoints.');
        }
      }
    };
    initRpc();
  }, []);

  // Validate network immediately after connection
  const validateNetworkImmediately = async () => {
    try {
      const provider = await getWorkingProvider();
      await validateEthereumNetwork(provider);
      setIsCorrectNetwork(true);
      setNetworkError(null);
    } catch (error: any) {
      setIsCorrectNetwork(false);
      
      // Provide specific error messages
      if (error.message?.includes('not on Ethereum Sepolia')) {
        setNetworkError('Wallet connected to wrong network. Please switch to Ethereum Sepolia or Aztec Sepolia.');
      } else if (error.message?.includes('RPC unreachable')) {
        setNetworkError('RPC unreachable: Unable to verify network. Trying fallback RPC...');
        // Retry with checkNetwork which has better fallback handling
        const result = await checkNetwork();
        setIsCorrectNetwork(result.valid);
        setNetworkError(result.error || null);
      } else {
        setNetworkError(error.message || 'Unable to fetch chain ID');
      }
    }
  };

  // Check network when connected - with immediate validation
  useEffect(() => {
    if (isConnected) {
      validateNetworkImmediately();
    }
  }, [isConnected, address]);

  // Check for existing connection on mount and set up event listeners
  useEffect(() => {
    checkExistingConnection();
    
    // Set up event listeners for wallet changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        // Update signer
        if (wallet) {
          wallet.getSigner().then(setSigner).catch(console.error);
        }
      } else {
        // Wallet disconnected
        setWallet(null);
        setSigner(null);
        setAddress(null);
        setIsConnected(false);
      }
    };

    const handleChainChanged = () => {
      // Network changed - refresh connection
      checkExistingConnection();
    };

    // Listen for wallet events if available
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    // Cleanup
    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [wallet]);

  const checkExistingConnection = async () => {
    try {
      if (typeof window === 'undefined' || !window.ethereum) return;

      // Check if wallet is connected
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts && accounts.length > 0) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          
          setWallet(provider);
          setSigner(signer);
          setAddress(accounts[0]);
          setIsConnected(true);
          setError(null);
          
          // Immediately validate network after connection
          validateNetworkImmediately();
        } else {
          // Wallet exists but not connected
          setWallet(null);
          setSigner(null);
          setAddress(null);
          setIsConnected(false);
        }
      } catch (err) {
        // Wallet not connected
        setWallet(null);
        setSigner(null);
        setAddress(null);
        setIsConnected(false);
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

      if (!window.ethereum) {
        throw new Error('No Ethereum wallet detected. Please install MetaMask or another Ethereum wallet.');
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

      if (!accounts || accounts.length === 0) {
        throw new Error('Wallet connection failed. No account selected.');
      }

      // Verify the selected address is valid
      if (accounts[0].length < 10) {
        throw new Error('Invalid wallet address. Please try reconnecting.');
      }

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      setWallet(provider);
      setSigner(signer);
      setAddress(accounts[0]);
      setIsConnected(true);
      setError(null);
      
      // Immediately validate network after connection
      try {
        const rpcProvider = await getWorkingProvider();
        await validateEthereumNetwork(rpcProvider);
        setIsCorrectNetwork(true);
        setNetworkError(null);
      } catch (error: any) {
        setIsCorrectNetwork(false);
        if (error.message?.includes('not on Ethereum Sepolia')) {
          setNetworkError('Wallet connected to wrong network. Please switch to Ethereum Sepolia or Aztec Sepolia.');
        } else if (error.message?.includes('RPC unreachable')) {
          setNetworkError('RPC unreachable: Trying fallback RPC...');
          // Retry with checkNetwork
          const result = await checkNetwork();
          setIsCorrectNetwork(result.valid);
          setNetworkError(result.error || null);
        } else {
          setNetworkError(error.message || 'Unable to fetch chain ID');
        }
      }

      // Set up event listeners for this wallet
      if (window.ethereum.on) {
        window.ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
            provider.getSigner().then(setSigner).catch(console.error);
          } else {
            setWallet(null);
            setSigner(null);
            setAddress(null);
            setIsConnected(false);
          }
        });

        window.ethereum.on('chainChanged', () => {
          // Network changed - refresh connection
          checkExistingConnection();
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
    setWallet(null);
    setSigner(null);
    setAddress(null);
    setIsConnected(false);
    setError(null);
    setNetworkError(null);
  };

  return (
    <EthereumContext.Provider
      value={{
        wallet,
        address,
        isConnected,
        isCorrectNetwork,
        networkError,
        connect,
        disconnect,
        error,
        signer,
      }}
    >
      {children}
    </EthereumContext.Provider>
  );
}

export function useEthereum() {
  const context = useContext(EthereumContext);
  if (context === undefined) {
    throw new Error('useEthereum must be used within an EthereumProvider');
  }
  return context;
}

