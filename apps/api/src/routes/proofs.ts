/**
 * ZK Proof verification routes
 */

import { Request, Response } from 'express';
import { verifyProof } from '../zk/utils/verifier';

export async function verifyProofRoute(req: Request, res: Response) {
  try {
    const { proof, publicSignals, verificationKey } = req.body;

    if (!proof || !publicSignals) {
      return res.status(400).json({
        error: 'Missing proof or publicSignals',
      });
    }

    const result = await verifyProof(proof, publicSignals, verificationKey);

    res.json({
      valid: result.valid,
      publicSignals: result.publicSignals,
    });
  } catch (error: any) {
    console.error('Proof verification error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

