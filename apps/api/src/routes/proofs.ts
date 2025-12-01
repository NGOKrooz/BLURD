/**
 * Proof verification routes
 */

import { Request, Response } from 'express';
import type { Database } from '../database';

/**
 * Verify a ZK proof
 */
export async function verifyProofRoute(
  req: Request,
  res: Response
) {
  try {
    const { proof, publicSignals } = req.body;

    if (!proof || !publicSignals) {
      return res.status(400).json({
        error: 'Missing proof or publicSignals',
      });
    }

    // For now, return a basic validation
    // In production, use actual Circom/Noir verifier
    const isValid = 
      proof.pi_a && Array.isArray(proof.pi_a) &&
      proof.pi_b && Array.isArray(proof.pi_b) &&
      proof.pi_c && Array.isArray(proof.pi_c) &&
      Array.isArray(publicSignals);

    res.json({
      valid: isValid,
      message: isValid ? 'Proof structure is valid' : 'Invalid proof structure',
    });
  } catch (error: any) {
    console.error('Proof verification error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Store a proof (for lookup by hash)
 */
export async function storeProof(
  req: Request,
  res: Response,
  db: Database
) {
  try {
    const { proof, publicSignals, proofHash } = req.body;

    if (!proof || !publicSignals || !proofHash) {
      return res.status(400).json({
        error: 'Missing proof, publicSignals, or proofHash',
      });
    }

    await db.saveProof({
      proof,
      publicSignals,
      timestamp: Date.now(),
      proofHash,
    });

    res.json({
      stored: true,
      proofHash,
    });
  } catch (error: any) {
    console.error('Proof storage error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Get a proof by hash
 */
export async function getProofByHash(
  req: Request,
  res: Response,
  db: Database
) {
  try {
    const { proofHash } = req.params;

    if (!proofHash) {
      return res.status(400).json({
        error: 'Missing proofHash parameter',
      });
    }

    const proofs = await db.listProofs();
    const proofData = proofs.find((p: any) => p.proofHash === proofHash) ?? null;

    if (!proofData) {
      return res.status(404).json({
        error: 'Proof not found',
      });
    }

    res.json({
      proof: proofData.proof,
      publicSignals: proofData.publicSignals,
      timestamp: proofData.timestamp,
    });
  } catch (error: any) {
    console.error('Get proof error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
