// Blurd - Constants

export const CIRCUIT_TYPES = {
  VERIFIED: 'verified',
  AGE: 'age',
  COUNTRY: 'country',
} as const;

export type CircuitType = typeof CIRCUIT_TYPES[keyof typeof CIRCUIT_TYPES];

export const CIRCUIT_PATHS = {
  [CIRCUIT_TYPES.VERIFIED]: 'zk/circuits/verifiedProof',
  [CIRCUIT_TYPES.AGE]: 'zk/circuits/ageProof',
  [CIRCUIT_TYPES.COUNTRY]: 'zk/circuits/countryProof',
} as const;

export const API_ENDPOINTS = {
  VERIFY_PAYMENT: '/api/payments/verify',
  CHECK_PAYMENT: '/api/payments/check',
} as const;

export const ZCASH_NETWORK = {
  MAINNET: 'mainnet',
  TESTNET: 'testnet',
} as const;

export const PROOF_STATUS = {
  VERIFIED_AND_PAID: 'VERIFIED_AND_PAID',
  PROOF_INVALID: 'PROOF_INVALID',
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
} as const;

