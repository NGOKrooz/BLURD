/**
 * Blurd API Server
 * Handles identity proof verification and ZK proof validation
 */

import express from 'express';
import cors from 'cors';
import { JSONDatabase, type Database } from './database';
import { verifyProofRoute, storeProof, getProofByHash } from './routes/proofs';
import { registerCredential, checkUnique } from './routes/credentials';
import { uploadDocument, documentHealth, uploadMiddleware } from './routes/documents';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database (JSON file with automatic in-memory fallback)
const db: Database = new JSONDatabase();
db.init().catch((err) => {
  console.error('Failed to initialize JSON database; continuing with in-memory store only:', err);
});

// Routes
app.post('/api/proofs/verify', (req, res) => verifyProofRoute(req, res));
app.post('/api/proofs/store', (req, res) => storeProof(req, res, db));
app.get('/api/proofs/get/:proofHash', (req, res) => getProofByHash(req, res, db));

// Credential routes
app.post('/api/register-credential', (req, res) => registerCredential(req, res, db));
app.get('/api/check-unique/:unique_key_hash', (req, res) => checkUnique(req, res, db));

// Document upload routes
app.post('/api/documents/upload', uploadMiddleware, (req, res) => uploadDocument(req, res));
app.get('/api/documents/health', (req, res) => documentHealth(req, res));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'blurd-api' });
});

app.listen(PORT, () => {
  console.log(`🚀 Blurd API server running on http://localhost:${PORT}`);
});

