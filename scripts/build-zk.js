#!/usr/bin/env node

/**
 * Build script for ZK circuits
 * Compiles all Circom circuits and generates proving/verification keys
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const circuitsDir = path.join(__dirname, '../zk/circuits');
const buildDir = path.join(__dirname, '../zk/build');

// Ensure build directory exists
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

const circuits = ['verifiedProof', 'ageProof', 'countryProof'];

console.log('🔨 Building ZK circuits...\n');

circuits.forEach((circuitName) => {
  const circuitPath = path.join(circuitsDir, circuitName, `${circuitName}.circom`);
  const outputPath = path.join(buildDir, circuitName);

  if (!fs.existsSync(circuitPath)) {
    console.error(`❌ Circuit not found: ${circuitPath}`);
    return;
  }

  console.log(`📦 Compiling ${circuitName}...`);

  try {
    // Create output directory
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    // Compile circuit
    execSync(
      `circom ${circuitPath} --r1cs --wasm --sym -o ${outputPath}`,
      { stdio: 'inherit' }
    );

    console.log(`✅ ${circuitName} compiled successfully\n`);
  } catch (error) {
    console.error(`❌ Failed to compile ${circuitName}:`, error.message);
    process.exit(1);
  }
});

console.log('✨ All circuits built successfully!');
console.log('\n⚠️  Note: To generate proving/verification keys, run:');
console.log('   snarkjs powersoftau new ... (for trusted setup)');
console.log('   snarkjs groth16 setup ... (for Groth16)');
console.log('   Or use snarkjs powersoftau contribute for production');

