/**
 * Payment verification routes
 */

import { Request, Response } from 'express';
import type { Database } from '../database';
import { verifyProof } from '../zk/utils/verifier';

export async function verifyPayment(
  req: Request,
  res: Response,
  db: Database
) {
  try {
    const { proof, publicSignals, txid, proofHash } = req.body;

    if (!proof || !publicSignals) {
      return res.status(400).json({
        error: 'Missing proof or publicSignals',
      });
    }

    // Verify ZK proof
    const zkResult = await verifyProof(proof, publicSignals, null);

    // Look up payment
    let payment = null as
      | {
          txid: string;
          amount: number;
          proofHash: string;
          timestamp: number;
          confirmed: boolean;
        }
      | null;

    const payments = await db.listPayments();

    if (txid) {
      payment = payments.find((p: any) => p.txid === txid) ?? null;
    } else if (proofHash) {
      payment = payments.find((p: any) => p.proofHash === proofHash) ?? null;
    } else {
      return res.status(400).json({
        error: 'Must provide either txid or proofHash',
      });
    }

    // Check if payment exists
    const paymentExists = !!payment;
    const paymentConfirmed = payment?.confirmed || false;
    const proofHashMatches = payment?.proofHash === proofHash;

    // Combined result
    const result = {
      zkVerified: zkResult.valid,
      paymentExists,
      paymentConfirmed,
      proofHashMatches: proofHashMatches || !proofHash, // If no proofHash provided, assume match
      combinedState:
        zkResult.valid && paymentExists && paymentConfirmed
          ? 'VERIFIED_AND_PAID'
          : zkResult.valid && paymentExists
          ? 'VERIFIED_PENDING'
          : !zkResult.valid
          ? 'PROOF_INVALID'
          : 'PAYMENT_NOT_FOUND',
    };

    res.json(result);
  } catch (error: any) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

export async function checkPayment(
  req: Request,
  res: Response,
  db: Database
) {
  try {
    const { txid } = req.params;

    if (!txid) {
      return res.status(400).json({
        error: 'Missing txid parameter',
      });
    }

    const payments = await db.listPayments();
    const payment = payments.find((p: any) => p.txid === txid) ?? null;

    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found',
      });
    }

    res.json({
      txid: payment.txid,
      amount: payment.amount,
      proofHash: payment.proofHash,
      confirmed: payment.confirmed,
      timestamp: payment.timestamp,
    });
  } catch (error: any) {
    console.error('Payment check error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

export async function storePayment(
  req: Request,
  res: Response,
  db: Database
) {
  try {
    const { txid, amount, proofHash } = req.body;

    if (!txid || !amount || !proofHash) {
      return res.status(400).json({
        error: 'Missing required fields: txid, amount, proofHash',
      });
    }

    const payment = {
      txid,
      amount,
      proofHash,
      timestamp: Date.now(),
      confirmed: false,
    };

    await db.savePayment(payment);

    res.json({
      success: true,
      payment,
    });
  } catch (error: any) {
    console.error('Payment storage error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
