'use client';

import { useState, useEffect, useCallback } from 'react';
import { getEthereumBalance } from '@/lib/ethereum';

interface UseEthBalanceResult {
  balance: string | null;
  balanceWei: bigint | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage ETH balance
 * Automatically refetches when address changes
 */
export function useEthBalance(address: string | null): UseEthBalanceResult {
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceWei, setBalanceWei] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!address) {
      setBalance(null);
      setBalanceWei(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const balanceWeiValue = await getEthereumBalance(address);
      setBalanceWei(balanceWeiValue);
      
      // Convert from wei to ETH (1 ETH = 1e18 wei)
      const balanceStr = (Number(balanceWeiValue) / 1e18).toFixed(4);
      setBalance(balanceStr);
    } catch (err: any) {
      console.error('Error fetching ETH balance:', err);
      setError(err.message || 'Unable to fetch balance. Check RPC.');
      setBalance(null);
      setBalanceWei(null);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    balanceWei,
    loading,
    error,
    refetch: fetchBalance,
  };
}

