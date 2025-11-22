pragma circom 2.0.0;

// Inline comparator templates to avoid include path issues on Windows
template IsZero() {
    signal input in;
    signal output out;
    
    signal inv;
    inv <== in != 0 ? 1/in : 0;
    out <== 1 - (in * inv);
}

template Num2Bits(n) {
    signal input in;
    signal output out[n];
    var lc1=0;
    
    var e2=1;
    for (var i = 0; i < n; i++) {
        out[i] <-- (in >> i) & 1;
        out[i] * (out[i] - 1) === 0;
        lc1 += out[i] * e2;
        e2 = e2 + e2;
    }
    
    lc1 === in;
}

template LessThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;
    
    component n2b = Num2Bits(n+1);
    n2b.in <== in[0] + (1 << n) - in[1];
    
    out <== 1 - n2b.out[n];
}

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

