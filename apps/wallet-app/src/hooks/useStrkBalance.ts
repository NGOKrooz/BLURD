'use client';

import { useState, useEffect, useCallback } from 'react';
import { getStarknetBalance } from '@/lib/starknet';

interface UseStrkBalanceResult {
  balance: string | null;
  balanceWei: bigint | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage STRK balance
 * Automatically refetches when address changes
 */
export function useStrkBalance(address: string | null): UseStrkBalanceResult {
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
      const balanceWeiValue = await getStarknetBalance(address);
      setBalanceWei(balanceWeiValue);
      
      // Convert from wei to STRK (1 STRK = 1e18 wei)
      const balanceStr = (Number(balanceWeiValue) / 1e18).toFixed(4);
      setBalance(balanceStr);
    } catch (err: any) {
      console.error('Error fetching STRK balance:', err);
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

