import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Layout from '@/components/Layout'
import { StarknetProvider } from '@/providers/starknet-provider'
import { ErrorSuppressor } from '@/components/ErrorSuppressor'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Blurd - Privacy-Preserving ZK Credentials',
  description: 'Zero-knowledge credential issuance and verification platform',
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
          <StarknetProvider>
            <Layout>{children}</Layout>
          </StarknetProvider>
        </ErrorSuppressor>
      </body>
    </html>
  );
}

