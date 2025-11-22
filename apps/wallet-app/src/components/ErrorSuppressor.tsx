'use client';

import { useEffect } from 'react';

/**
 * Suppresses WalletConnect WebSocket errors that occur when
 * no valid project ID is configured. These errors are non-fatal
 * and don't affect the app's functionality (MetaMask/Injected wallets still work).
 */
export function ErrorSuppressor({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Suppress WalletConnect WebSocket errors in console
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      if (
        message.includes('WebSocket connection closed') ||
        message.includes('Unauthorized: invalid key') ||
        message.includes('WalletConnect') ||
        message.includes('code: 3000') ||
        message.includes('jsonrpc-provider')
      ) {
        // Silently ignore WalletConnect connection errors
        return;
      }
      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      if (
        message.includes('WebSocket connection closed') ||
        message.includes('Unauthorized: invalid key') ||
        message.includes('WalletConnect') ||
        message.includes('code: 3000')
      ) {
        // Silently ignore WalletConnect connection warnings
        return;
      }
      originalWarn.apply(console, args);
    };

    // Suppress unhandled errors from WalletConnect
    const handleError = (event: ErrorEvent) => {
      const message = event.message || '';
      if (
        message.includes('WebSocket connection closed') ||
        message.includes('Unauthorized: invalid key') ||
        message.includes('WalletConnect') ||
        message.includes('code: 3000') ||
        message.includes('jsonrpc-provider')
      ) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    window.addEventListener('error', handleError);

    // Cleanup
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('error', handleError);
    };
  }, []);

  return <>{children}</>;
}

