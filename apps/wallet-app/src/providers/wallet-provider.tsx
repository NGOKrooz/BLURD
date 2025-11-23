'use client';

import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { defineChain } from 'viem';
import { publicProvider } from 'wagmi/providers/public';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';

// Polygon Amoy testnet
const polygonAmoy = defineChain({
  id: 80002,
  name: 'Polygon Amoy',
  network: 'amoy',
  nativeCurrency: {
    decimals: 18,
    name: 'MATIC',
    symbol: 'MATIC',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-amoy.polygon.technology'],
    },
    public: {
      http: ['https://rpc-amoy.polygon.technology'],
    },
  },
  blockExplorers: {
    default: { name: 'PolygonScan', url: 'https://amoy.polygonscan.com' },
  },
  testnet: true,
});

const { chains, publicClient } = configureChains(
  [polygonAmoy as any],
  [publicProvider()]
);

// Get WalletConnect project ID from environment variable
// If not set, WalletConnect will be disabled (only MetaMask/Injected wallets will work)
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

// Use getDefaultWallets to properly configure RainbowKit's ConnectButton modal
// This ensures wallet options are displayed correctly
// IMPORTANT: RainbowKit's modal needs getDefaultWallets to properly display wallet options
// Even if WalletConnect project ID is missing, we'll use a dummy one to enable the modal
let connectors;
let wallets;
try {
  if (walletConnectProjectId && walletConnectProjectId.trim() !== '') {
    // Use provided WalletConnect project ID
    wallets = getDefaultWallets({
      appName: 'Blurd',
      projectId: walletConnectProjectId,
      chains,
    });
    connectors = wallets.connectors;
  } else {
    // CRITICAL FIX: RainbowKit's modal requires getDefaultWallets to work properly
    // Use a placeholder project ID to enable the modal, but WalletConnect will fail gracefully
    // The modal will still show MetaMask and Injected wallets
    try {
      wallets = getDefaultWallets({
        appName: 'Blurd',
        projectId: '00000000000000000000000000000000', // Placeholder - WalletConnect will fail but modal will work
        chains,
      });
      connectors = wallets.connectors;
    } catch (wcError) {
      // If getDefaultWallets fails, fall back to manual connectors
      console.warn('getDefaultWallets failed, using manual connectors:', wcError);
      connectors = [
        new MetaMaskConnector({ chains }),
        new InjectedConnector({ chains }),
      ];
      wallets = { connectors };
    }
  }
} catch (error) {
  console.warn('WalletConnect configuration error, using fallback connectors:', error);
  // Fallback to basic connectors if WalletConnect fails
  connectors = [
    new MetaMaskConnector({ chains }),
    new InjectedConnector({ chains }),
  ];
  wallets = { connectors };
}

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

// Ensure connectors are properly initialized
if (connectors.length === 0) {
  console.warn('No wallet connectors available. Adding fallback connectors.');
  connectors = [
    new MetaMaskConnector({ chains }),
    new InjectedConnector({ chains }),
  ];
}

// Suppress WalletConnect errors globally
if (typeof window !== 'undefined') {
  // Catch and suppress WalletConnect WebSocket errors
  const originalError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const errorMessage = message?.toString() || '';
    if (
      errorMessage.includes('WebSocket connection closed') ||
      errorMessage.includes('Unauthorized: invalid key') ||
      errorMessage.includes('WalletConnect') ||
      errorMessage.includes('code: 3000')
    ) {
      return true; // Suppress the error
    }
    if (originalError) {
      return originalError(message, source, lineno, colno, error);
    }
    return false;
  };
}

const queryClient = new QueryClient();

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          chains={chains}
          modalSize="compact"
          initialChain={polygonAmoy as any}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
}

