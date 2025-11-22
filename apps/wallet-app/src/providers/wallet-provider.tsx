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
// WalletConnect errors will be handled gracefully during connection attempts
let connectors;
try {
  if (walletConnectProjectId) {
    const wallets = getDefaultWallets({
      appName: 'Blurd',
      projectId: walletConnectProjectId,
      chains,
    });
    connectors = wallets.connectors;
  } else {
    // Fallback: Only use MetaMask and Injected connectors if no WalletConnect project ID
    connectors = [
      new MetaMaskConnector({ chains }),
      new InjectedConnector({ chains }),
    ];
  }
} catch (error) {
  console.warn('WalletConnect configuration error, using fallback connectors:', error);
  // Fallback to basic connectors if WalletConnect fails
  connectors = [
    new MetaMaskConnector({ chains }),
    new InjectedConnector({ chains }),
  ];
}

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

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
        <RainbowKitProvider chains={chains}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
}

