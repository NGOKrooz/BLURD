pragma circom 2.0.0;

include "templates/comparators.circom";

template GreaterOrEqual() {
    signal input age;
    signal input min_age;
    signal output result;

    // Check age >= min_age using LessThan component
    // age >= min_age is equivalent to !(age < min_age)
    // We check if min_age < age, which is the opposite
    component lt = LessThan(32);
    lt.in[0] <== min_age;
    lt.in[1] <== age;
    
    // If min_age < age, then age >= min_age
    // lt.out = 1 if min_age < age, so result = lt.out
    result <== lt.out;
    
    // Enforce the boolean output is correct
    result * (1 - result) === 0;
}

component main = GreaterOrEqual();

