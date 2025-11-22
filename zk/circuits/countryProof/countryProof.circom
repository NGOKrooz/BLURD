pragma circom 2.0.0;

/**
 * CountryProof Circuit
 * Proves that a user is from a specific country without revealing other details
 * 
 * Private Inputs:
 *   - userCountryHash: Hash of user's country
 *   - requiredCountryHash: Hash of required country
 * 
 * Public Output:
 *   - countryMatch: 1 if countries match, 0 otherwise
 */

// Inline IsEqual template to avoid include path issues on Windows
template IsZero() {
    signal input in;
    signal output out;
    
    signal inv;
    inv <== in != 0 ? 1/in : 0;
    out <== 1 - (in * inv);
}

template IsEqual() {
    signal input in[2];
    signal output out;
    
    component eq = IsZero();
    eq.in <== in[0] - in[1];
    out <== eq.out;
}

template CountryProof() {
    // Private inputs
    signal private input userCountryHash;
    signal private input requiredCountryHash;
    
    // Public output
    signal output countryMatch;
    
    // Check if hashes match
    component eq = IsEqual();
    eq.in[0] <== userCountryHash;
    eq.in[1] <== requiredCountryHash;
    
    countryMatch <== eq.out;
}

component main = CountryProof();

