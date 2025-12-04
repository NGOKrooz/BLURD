import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Layout from '@/components/Layout'
import { WalletProvider } from '@/providers/wallet-provider'
import { ErrorSuppressor } from '@/components/ErrorSuppressor'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BLURD - zk-Passport: Privacy-Preserving Cryptoidentity',
  description: 'Generate and verify zero-knowledge identity proofs using your EVM wallet as your cryptoidentity handle',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorSuppressor>
          <WalletProvider>
            <Layout>{children}</Layout>
          </WalletProvider>
        </ErrorSuppressor>
      </body>
    </html>
  );
}

