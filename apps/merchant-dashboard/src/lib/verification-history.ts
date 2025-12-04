import { VerificationResult, ProofType } from '@/components/VerificationResultCard';

export interface VerificationRecord {
  id: string;
  timestamp: string;
  result: VerificationResult;
  proofHash: string;
  proofType: ProofType;
}

const STORAGE_KEY = 'blurd_merchant_verifications';

/**
 * Save a verification to history
 */
export function saveVerification(result: VerificationResult): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getVerificationHistory();
    const record: VerificationRecord = {
      id: `verification-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      result,
      proofHash: result.proofHash || '',
      proofType: result.proofType,
    };

    history.unshift(record); // Add to beginning
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    
    // Dispatch custom event for same-tab updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('verification-saved'));
    }
  } catch (error) {
    console.error('Failed to save verification:', error);
  }
}

/**
 * Get all verification history
 */
export function getVerificationHistory(): VerificationRecord[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as VerificationRecord[];
  } catch (error) {
    console.error('Failed to load verification history:', error);
    return [];
  }
}

/**
 * Clear all verification history
 */
export function clearVerificationHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Calculate metrics from verification history
 */
export function calculateMetrics(): {
  verifiedToday: number;
  pending: number;
  totalVerified: number;
} {
  const history = getVerificationHistory();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const verifiedToday = history.filter((record) => {
    const recordDate = new Date(record.timestamp);
    return recordDate >= todayStart && record.result.verified;
  }).length;

  const totalVerified = history.filter((record) => record.result.verified).length;

  // For demo purposes, pending is always 0 (real implementation would track pending verifications)
  const pending = 0;

  return {
    verifiedToday,
    pending,
    totalVerified,
  };
}

