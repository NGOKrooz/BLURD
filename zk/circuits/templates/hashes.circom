pragma circom 2.0.0;

/**
 * Hash templates for ZK circuits
 * Simplified Poseidon hash for demo purposes
 */

template Poseidon(nInputs) {
    signal input inputs[nInputs];
    signal output out;
    
    // Simplified hash: sum of inputs (for demo)
    // In production, use proper Poseidon hash implementation
    component adder = Add();
    adder.in[0] <== inputs[0];
    
    var sum = inputs[0];
    for (var i = 1; i < nInputs; i++) {
        sum = sum + inputs[i];
    }
    
    out <== sum;
}

template Add() {
    signal input in[2];
    signal output out;
    out <== in[0] + in[1];
}

