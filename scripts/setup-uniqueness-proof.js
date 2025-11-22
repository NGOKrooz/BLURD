#!/usr/bin/env node

/**
 * Setup script for Uniqueness Proof circuit
 * Compiles the circuit and generates test proving keys
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const circuitDir = path.join(projectRoot, 'zk', 'circuits', 'uniquenessProof');
const circuitFile = path.join(circuitDir, 'uniquenessProof.circom');
const buildDir = path.join(projectRoot, 'zk', 'build', 'uniquenessProof');
const publicZkDir = path.join(projectRoot, 'apps', 'wallet-app', 'public', 'zk');

console.log('🔨 Setting up Uniqueness Proof circuit...\n');

// Check if Circom is installed
try {
  execSync('circom --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Circom compiler not found!');
  console.error('   Please install it: npm install -g circom');
  process.exit(1);
}

// Check if circuit file exists
if (!fs.existsSync(circuitFile)) {
  console.error(`❌ Circuit file not found: ${circuitFile}`);
  process.exit(1);
}

try {
  // Create build directory
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  // Compile circuit
  console.log('📦 Compiling uniqueness proof circuit...');
  execSync(
    `circom ${circuitFile} --r1cs --wasm --sym -o ${buildDir}`,
    { stdio: 'inherit', cwd: projectRoot }
  );

  console.log('✅ Circuit compiled successfully\n');

  // Find generated files
  const wasmSubDir = path.join(buildDir, 'uniquenessProof_js');
  const wasmFile = path.join(wasmSubDir, 'uniquenessProof.wasm');
  const r1csFile = path.join(buildDir, 'uniquenessProof.r1cs');

  if (!fs.existsSync(wasmFile)) {
    console.error('❌ WASM file not found after compilation');
    process.exit(1);
  }

  // Copy WASM file to public directory
  if (!fs.existsSync(publicZkDir)) {
    fs.mkdirSync(publicZkDir, { recursive: true });
  }

  fs.copyFileSync(wasmFile, path.join(publicZkDir, 'uniquenessProof.wasm'));
  console.log('✅ Copied WASM file to public directory');

  // Check if SnarkJS is available
  try {
    execSync('snarkjs --version', { stdio: 'ignore' });
  } catch (error) {
    console.warn('\n⚠️  SnarkJS not found. Skipping zkey generation.');
    console.warn('   For production use, install SnarkJS: npm install -g snarkjs');
    console.warn('   Then run: npm run setup:uniqueness-proof');
    process.exit(0);
  }

  // Generate powers of tau if needed
  const ptauFile = path.join(buildDir, 'powersOfTau28_hez_final_10.ptau');
  if (!fs.existsSync(ptauFile)) {
    console.log('📦 Generating test powers of tau (this may take a moment)...');
    const pot10_0000 = path.join(buildDir, 'pot10_0000.ptau');
    const pot10_0001 = path.join(buildDir, 'pot10_0001.ptau');
    
    execSync(`snarkjs powersoftau new bn128 10 ${pot10_0000} -v`, { stdio: 'inherit' });
    execSync(`snarkjs powersoftau contribute ${pot10_0000} ${pot10_0001} --name="Test" -v -e="test"`, { stdio: 'inherit' });
    execSync(`snarkjs powersoftau prepare phase2 ${pot10_0001} ${ptauFile} -v`, { stdio: 'inherit' });
  }

  // Generate zkey
  const zkeyFile = path.join(buildDir, 'uniquenessProof.zkey');
  const vkeyFile = path.join(buildDir, 'uniquenessProof_verification_key.json');

  if (!fs.existsSync(zkeyFile)) {
    console.log('📦 Generating proving key...');
    execSync(`snarkjs groth16 setup ${r1csFile} ${ptauFile} ${zkeyFile} -v`, { stdio: 'inherit' });
    
    // Export verification key
    execSync(`snarkjs zkey export verificationkey ${zkeyFile} ${vkeyFile}`, { stdio: 'inherit' });
  }

  // Copy zkey and vkey to public directory
  if (fs.existsSync(zkeyFile)) {
    fs.copyFileSync(zkeyFile, path.join(publicZkDir, 'uniquenessProof.zkey'));
    console.log('✅ Copied zkey file to public directory');
  }
  
  if (fs.existsSync(vkeyFile)) {
    fs.copyFileSync(vkeyFile, path.join(publicZkDir, 'uniquenessProof_verification_key.json'));
    console.log('✅ Copied verification key to public directory');
  }

  console.log('\n✨ Uniqueness Proof setup complete!');
  console.log('⚠️  NOTE: This uses a TEST setup. For production, use a proper trusted setup ceremony.');
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}

