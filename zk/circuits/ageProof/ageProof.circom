pragma circom 2.0.0;

include "../templates/comparators.circom";

/**
 * AgeProof Circuit
 * Proves that a user is above a certain age without revealing exact age
 * 
 * Private Inputs:
 *   - userAge: User's actual age (private)
 *   - minAge: Minimum required age
 * 
 * Public Output:
 *   - isAboveAge: 1 if userAge >= minAge, 0 otherwise
 */

template AgeProof() {
    // Private inputs
    signal private input userAge;
    signal private input minAge;
    
    // Public output
    signal output isAboveAge;
    
    // Check if userAge >= minAge
    // Calculate diff = userAge - minAge
    signal diff;
    diff <== userAge - minAge;
    
    // Check if diff < 0 (i.e., userAge < minAge)
    // LessThan returns 1 if in[0] < in[1]
    component lt = LessThan(32);
    lt.in[0] <== 0;
    lt.in[1] <== diff;
    
    // If diff < 0, lt.out = 1, so isAboveAge = 0
    // If diff >= 0, lt.out = 0, so isAboveAge = 1
    isAboveAge <== 1 - lt.out;
}

component main = AgeProof();

