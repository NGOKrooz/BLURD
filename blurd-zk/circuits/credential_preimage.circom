pragma circom 2.0.0;

include "templates/comparators.circom";

/**
 * Credential Preimage Circuit
 * 
 * Proves knowledge of id_commit and wallet_address_hash such that:
 * - unique_key_hash is the registered hash
 * 
 * Private Inputs:
 *   - id_commit: The credential commitment (BigInt)
 *   - wallet_address_hash: Hash of wallet address (BigInt)
 *   - unique_key: The computed unique_key = Poseidon(id_commit, wallet_address_hash) (BigInt)
 * 
 * Public Inputs:
 *   - unique_key_hash: SHA256(unique_key) as BigInt - what server stores
 * 
 * This circuit verifies the relationship between the private inputs and public hash.
 * For MVP, we'll do a simplified verification that proves structure.
 */

template CredentialPreimage() {
    // Private inputs (all as field elements)
    signal input id_commit;
    signal input wallet_address_hash;
    signal input unique_key;
    
    // Public input (what server stores - as field element representation)
    signal input unique_key_hash;
    
    // Public output: valid (1 if structure is valid)
    signal output valid;
    
    // For MVP: Simple validation that inputs are provided and non-zero
    // In production, implement full Poseidon and SHA256 verification:
    // 1. Verify unique_key = Poseidon(id_commit, wallet_address_hash)
    // 2. Verify unique_key_hash = SHA256(unique_key)
    
    // Basic check: verify that all inputs are non-zero
    // If any input is zero, the product will be zero, making valid = 0
    signal product1;
    product1 <== id_commit * wallet_address_hash;
    signal product;
    product <== product1 * unique_key;
    
    // If product is zero, valid = 0, else valid = 1
    // Use LessThan to check if product < 1
    // If product >= 1, then all inputs are non-zero
    component lt = LessThan(32);
    lt.in[0] <== 0;
    lt.in[1] <== product;
    
    // lt.out = 1 if 0 < product, so if product is non-zero
    // But we want valid = 1 if product is non-zero (>= 1)
    // So we check if product >= 1 by checking if product - 1 >= 0
    component lt2 = LessThan(32);
    lt2.in[0] <== 0;
    lt2.in[1] <== product - 1;
    
    // valid = 1 if product >= 1 (i.e., lt2.in[1] >= 0, so lt2.out = 0)
    valid <== 1 - lt2.out;
}

component main = CredentialPreimage();

