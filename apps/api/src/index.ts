/**
 * Blurd API Server
 * Handles payment verification and ZK proof validation
 */

import express from 'express';
import cors from 'cors';
// Use in-memory database for demo (avoids SQLite native module compilation)
import { Database } from './database-memory';
import { verifyPayment, checkPayment, storePayment } from './routes/payments';
import { verifyProofRoute, storeProof, getProofByHash } from './routes/proofs';
import { registerCredential, checkUnique } from './routes/credentials';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
const db = new Database();
db.init();

// Routes
app.post('/api/payments/verify', (req, res) => verifyPayment(req, res, db));
app.post('/api/payments/store', (req, res) => storePayment(req, res, db));
app.get('/api/payments/check/:txid', (req, res) => checkPayment(req, res, db));
app.post('/api/proofs/verify', (req, res) => verifyProofRoute(req, res));
app.post('/api/proofs/store', (req, res) => storeProof(req, res));
app.get('/api/proofs/get/:proofHash', (req, res) => getProofByHash(req, res));

// Credential routes
app.post('/api/register-credential', (req, res) => registerCredential(req, res, db));
app.get('/api/check-unique/:unique_key_hash', (req, res) => checkUnique(req, res, db));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'blurd-api' });
});

app.listen(PORT, () => {
  console.log(`🚀 Blurd API server running on http://localhost:${PORT}`);
});

