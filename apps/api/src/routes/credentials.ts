/**
 * Credential registration routes
 * CRITICAL: Server must NEVER accept raw extracted fields or images
 * Only unique_key_hash is stored
 */

import { Request, Response } from 'express';
import { Database } from '../database-memory';
import { verifySignature } from '../utils/wallet';

export interface CredentialRecord {
  unique_key_hash: string;
  issuedAt: string;
  id: string;
}

/**
 * Register a credential
 * Body must only contain: { unique_key_hash, signature?, message? }
 * Reject if raw fields or images are sent
 */
export async function registerCredential(
  req: Request,
  res: Response,
  db: Database
): Promise<void> {
  try {
    const { unique_key_hash, signature, message } = req.body;

    // SECURITY: Reject if raw fields or images are sent
    if (req.body.fields || req.body.image || req.body.dob || req.body.docType || req.body.expiry) {
      res.status(400).json({
        error: 'Server does not accept raw extracted fields or images. Only unique_key_hash is allowed.',
      });
      return;
    }

    if (!unique_key_hash || typeof unique_key_hash !== 'string') {
      res.status(400).json({
        error: 'unique_key_hash is required',
      });
      return;
    }

    // Validate hash format (should be hex string)
    if (!unique_key_hash.match(/^0x[0-9a-fA-F]+$/)) {
      res.status(400).json({
        error: 'Invalid unique_key_hash format. Must be hex string starting with 0x',
      });
      return;
    }

    // Optional: Verify signature if provided
    if (signature && message) {
      // Extract wallet address from message signature
      // This is optional verification to ensure the registering party owns the wallet
      // We verify but don't store the wallet address
      try {
        const ethers = require('ethers');
        const recoveredAddress = ethers.verifyMessage(message, signature);
        
        // Signature verified - good, but we don't store the address
        // Only proceed with registration
      } catch (sigError) {
        res.status(400).json({
          error: 'Invalid signature',
        });
        return;
      }
    }

    // Check if already registered
    const existing = db.getCredentialByHash(unique_key_hash);
    if (existing) {
      res.status(409).json({
        error: 'Credential with this unique_key_hash already registered',
        id: existing.id,
        issuedAt: existing.issuedAt,
      });
      return;
    }

    // Store only unique_key_hash and timestamp
    const credential: CredentialRecord = {
      unique_key_hash,
      issuedAt: new Date().toISOString(),
      id: Date.now().toString() + Math.random().toString(36).substring(7),
    };

    db.storeCredential(credential);

    res.status(200).json({
      registered: true,
      id: credential.id,
      issuedAt: credential.issuedAt,
    });
  } catch (error: any) {
    console.error('Credential registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Check if a unique_key_hash is registered
 */
export async function checkUnique(
  req: Request,
  res: Response,
  db: Database
): Promise<void> {
  try {
    const { unique_key_hash } = req.params;

    if (!unique_key_hash) {
      res.status(400).json({
        error: 'unique_key_hash parameter is required',
      });
      return;
    }

    const credential = db.getCredentialByHash(unique_key_hash);

    if (credential) {
      res.status(200).json({
        issued: true,
        issuedAt: credential.issuedAt,
        id: credential.id,
      });
    } else {
      res.status(200).json({
        issued: false,
      });
    }
  } catch (error: any) {
    console.error('Check unique error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

