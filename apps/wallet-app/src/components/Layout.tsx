'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import EncryptedBackground from './EncryptedBackground';
import WalletConnect from './WalletConnect';
import { Menu, X } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen relative overflow-hidden overflow-x-hidden">
      <EncryptedBackground />
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        fixed md:relative z-50 md:z-auto
        transition-transform duration-300 ease-in-out
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 w-full min-w-0">
        {/* Mobile Header */}
        <div className="sticky top-0 z-30 bg-neutral-900/80 backdrop-blur-md border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between md:justify-end">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <WalletConnect />
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-8 w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}

