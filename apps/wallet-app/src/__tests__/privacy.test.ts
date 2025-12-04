import { describe, it, expect } from 'vitest';
import { 
  generateNonce, 
  generateCommitment, 
  verifyCommitment,
  type PaymentProof 
} from '../utils/privacy';

describe('Privacy Utils', () => {
  describe('generateNonce', () => {
    it('generates unique nonces', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      const nonce3 = generateNonce();

      // All nonces should be different
      expect(nonce1).not.toBe(nonce2);
      expect(nonce2).not.toBe(nonce3);
      expect(nonce1).not.toBe(nonce3);
    });

    it('generates valid numeric strings', () => {
      const nonce = generateNonce();
      
      // Should be a valid numeric string
      expect(() => BigInt(nonce)).not.toThrow();
      expect(BigInt(nonce)).toBeGreaterThan(0n);
    });

    it('generates nonces of consistent format', () => {
      for (let i = 0; i < 10; i++) {
        const nonce = generateNonce();
        // Should be a numeric string
        expect(/^\d+$/.test(nonce)).toBe(true);
      }
    });
  });

  describe('generateCommitment', () => {
    const testSender = '0x1234567890abcdef1234567890abcdef12345678';
    const testRecipient = '0xabcdef1234567890abcdef1234567890abcdef12';
    const testAmount = '1000000000000000000'; // 1 STRK in wei
    const testNonce = '123456789';

    it('generates deterministic commitments for same inputs', () => {
      const commitment1 = generateCommitment(testSender, testRecipient, testAmount, testNonce);
      const commitment2 = generateCommitment(testSender, testRecipient, testAmount, testNonce);

      expect(commitment1).toBe(commitment2);
    });

    it('changes commitment when sender changes', () => {
      const commitment1 = generateCommitment(testSender, testRecipient, testAmount, testNonce);
      const commitment2 = generateCommitment(
        '0x9999999999999999999999999999999999999999',
        testRecipient,
        testAmount,
        testNonce
      );

      expect(commitment1).not.toBe(commitment2);
    });

    it('changes commitment when recipient changes', () => {
      const commitment1 = generateCommitment(testSender, testRecipient, testAmount, testNonce);
      const commitment2 = generateCommitment(
        testSender,
        '0x8888888888888888888888888888888888888888',
        testAmount,
        testNonce
      );

      expect(commitment1).not.toBe(commitment2);
    });

    it('changes commitment when amount changes', () => {
      const commitment1 = generateCommitment(testSender, testRecipient, testAmount, testNonce);
      const commitment2 = generateCommitment(
        testSender,
        testRecipient,
        '2000000000000000000', // 2 STRK
        testNonce
      );

      expect(commitment1).not.toBe(commitment2);
    });

    it('changes commitment when nonce changes', () => {
      const commitment1 = generateCommitment(testSender, testRecipient, testAmount, testNonce);
      const commitment2 = generateCommitment(
        testSender,
        testRecipient,
        testAmount,
        '987654321'
      );

      expect(commitment1).not.toBe(commitment2);
    });

    it('generates valid hex string commitment', () => {
      const commitment = generateCommitment(testSender, testRecipient, testAmount, testNonce);
      
      // Should be a valid hex string starting with 0x
      expect(commitment.startsWith('0x')).toBe(true);
      expect(/^0x[0-9a-fA-F]+$/.test(commitment)).toBe(true);
    });
  });

  describe('verifyCommitment', () => {
    it('verifies valid commitment', () => {
      const sender = '0x1234567890abcdef1234567890abcdef12345678';
      const recipient = '0xabcdef1234567890abcdef1234567890abcdef12';
      const amount = '1000000000000000000';
      const nonce = generateNonce();
      const commitment = generateCommitment(sender, recipient, amount, nonce);

      const proof: PaymentProof = {
        sender,
        recipient,
        amount,
        nonce,
        commitment,
        timestamp: Date.now(),
      };

      expect(verifyCommitment(proof)).toBe(true);
    });

    it('rejects invalid commitment', () => {
      const sender = '0x1234567890abcdef1234567890abcdef12345678';
      const recipient = '0xabcdef1234567890abcdef1234567890abcdef12';
      const amount = '1000000000000000000';
      const nonce = generateNonce();

      const proof: PaymentProof = {
        sender,
        recipient,
        amount,
        nonce,
        commitment: '0xINVALIDCOMMITMENT', // Wrong commitment
        timestamp: Date.now(),
      };

      expect(verifyCommitment(proof)).toBe(false);
    });

    it('rejects tampered data', () => {
      const sender = '0x1234567890abcdef1234567890abcdef12345678';
      const recipient = '0xabcdef1234567890abcdef1234567890abcdef12';
      const amount = '1000000000000000000';
      const nonce = generateNonce();
      const commitment = generateCommitment(sender, recipient, amount, nonce);

      // Tamper with the amount
      const proof: PaymentProof = {
        sender,
        recipient,
        amount: '2000000000000000000', // Changed amount
        nonce,
        commitment,
        timestamp: Date.now(),
      };

      expect(verifyCommitment(proof)).toBe(false);
    });
  });
});

