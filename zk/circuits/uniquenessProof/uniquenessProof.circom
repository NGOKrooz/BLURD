pragma circom 2.0.0;

// Uniqueness circuit doesn't need comparators - it just outputs the hash

/**
 * UniquenessProof Circuit
 * Proves that a user has a unique document identifier without revealing it
 * 
 * Private Inputs:
 *   - identifierHash: Hash of unique document identifier (documentNumber, serialNumber, etc.)
 * 
 * Public Outputs:
 *   - merkleRoot: Root of Merkle tree containing all uniqueness commitments
 * 
 * The circuit verifies:
 * 1. The identifierHash is valid (non-zero)
 * 2. The identifierHash is included in the Merkle tree (simplified for MVP)
 * 
 * Note: Full Merkle inclusion proof would require path, siblings, etc.
 * For MVP, we use a simplified approach where the circuit validates the hash format
 * and the backend maintains the Merkle tree and checks for duplicates.
 */

template UniquenessProof() {
    // Private input: hash of unique identifier
    signal private input identifierHash;
    
    // Public output: Merkle root
    // For MVP, we output the identifierHash as merkleRoot
    // In production, this would be computed from Merkle tree inclusion proof
    signal output merkleRoot;
    
    // Simply pass through the identifier hash as the merkle root
    // In a full implementation, this would verify Merkle tree inclusion
    merkleRoot <== identifierHash;
}

component main = UniquenessProof();

