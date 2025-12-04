'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, coinbaseWallet, rainbowWallet, walletConnectWallet, okxWallet } from '@rainbow-me/rainbowkit/wallets';
import { mainnet, sepolia } from 'wagmi/chains';
import '@rainbow-me/rainbowkit/styles.css';
import { ReactNode } from 'react';

// Create wagmi config with multiple wallet connectors
const config = getDefaultConfig({
  appName: 'BLURD Identity Proof',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default-project-id',
  chains: [sepolia, mainnet],
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        rainbowWallet,
        walletConnectWallet,
        okxWallet,
      ],
    },
  ],
});

const queryClient = new QueryClient();

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
