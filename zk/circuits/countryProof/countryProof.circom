pragma circom 2.0.0;

include "../templates/comparators.circom";

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

