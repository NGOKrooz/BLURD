pragma circom 2.0.0;

include "../templates/comparators.circom";
include "../templates/hashes.circom";

/**
 * VerifiedProof Circuit
 * Proves that a user has verified credentials without revealing identity
 * 
 * Private Inputs:
 *   - userSecret: User's private secret
 *   - issuerSignature: Signature from issuer
 * 
 * Public Output:
 *   - proofOfVerification: 1 if valid, 0 otherwise
 */

template VerifiedProof() {
    // Private inputs
    signal private input userSecret;
    signal private input issuerSignature;
    
    // Public output
    signal output proofOfVerification;
    
    // Simple verification: check if signature matches expected hash
    // In production, use proper signature verification
    component hasher = Poseidon(1);
    hasher.inputs[0] <== userSecret;
    
    // Verify signature matches hash (simplified for demo)
    component eq = IsEqual();
    eq.in[0] <== hasher.out;
    eq.in[1] <== issuerSignature;
    
    proofOfVerification <== eq.out;
}

component main = VerifiedProof();

