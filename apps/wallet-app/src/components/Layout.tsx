'use client';

import Sidebar from './Sidebar';
import EncryptedBackground from './EncryptedBackground';
import WalletConnect from './WalletConnect';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen relative overflow-hidden">
      <EncryptedBackground />
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="sticky top-0 z-30 bg-neutral-900/80 backdrop-blur-md border-b border-white/10">
          <div className="mx-auto max-w-7xl px-6 py-4 flex justify-end">
            <WalletConnect />
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

