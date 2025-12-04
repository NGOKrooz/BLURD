'use client';

import Sidebar from './Sidebar';
import EncryptedBackground from './EncryptedBackground';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen relative overflow-hidden">
      <EncryptedBackground />
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

