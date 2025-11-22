#!/usr/bin/env node

/**
 * Setup script for age proof circuit
 * Generates WASM files and test proving keys for development
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const circuitName = 'ageProof';
const circuitPath = path.join(__dirname, '../zk/circuits', circuitName, `${circuitName}.circom`);
const buildDir = path.join(__dirname, '../zk/build', circuitName);
const publicDir = path.join(__dirname, '../apps/wallet-app/public/zk');

console.log('🔨 Setting up age proof circuit...\n');

// Check if Circom is installed
try {
  execSync('circom --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Circom compiler not found!');
  console.error('   Please install it: npm install -g circom');
  process.exit(1);
}

// Check if circuit file exists
if (!fs.existsSync(circuitPath)) {
  console.error(`❌ Circuit file not found: ${circuitPath}`);
  process.exit(1);
}

// Create build directory
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Step 1: Compile circuit
console.log('📦 Step 1: Compiling circuit...');
try {
  execSync(
    `circom ${circuitPath} --r1cs --wasm --sym -o ${buildDir}`,
    { stdio: 'inherit' }
  );
  console.log('✅ Circuit compiled successfully\n');
} catch (error) {
  console.error('❌ Failed to compile circuit:', error.message);
  process.exit(1);
}

// Step 2: Generate proving key (using test setup for development)
console.log('📦 Step 2: Generating proving key (test setup)...');

const wasmFile = path.join(buildDir, `${circuitName}_js`, `${circuitName}.wasm`);
const r1csFile = path.join(buildDir, `${circuitName}.r1cs`);
const zkeyFile = path.join(buildDir, `${circuitName}.zkey`);
const vkeyFile = path.join(buildDir, `${circuitName}_verification_key.json`);

// Check if SnarkJS is available
try {
  execSync('snarkjs --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ SnarkJS not found!');
  console.error('   Please install it: npm install -g snarkjs');
  console.error('   Or use: npm install snarkjs');
  process.exit(1);
}

try {
  // Generate test powers of tau (only for development - NOT for production!)
  const ptauFile = path.join(buildDir, 'powersOfTau28_hez_final_10.ptau');
  
  if (!fs.existsSync(ptauFile)) {
    console.log('   Generating test powers of tau (this may take a moment)...');
    execSync(
      `snarkjs powersoftau new bn128 10 ${path.join(buildDir, 'pot10_0000.ptau')} -v`,
      { stdio: 'inherit', cwd: buildDir }
    );
    execSync(
      `snarkjs powersoftau contribute ${path.join(buildDir, 'pot10_0000.ptau')} ${path.join(buildDir, 'pot10_0001.ptau')} --name="Test" -v -e="test"`,
      { stdio: 'inherit', cwd: buildDir }
    );
    execSync(
      `snarkjs powersoftau prepare phase2 ${path.join(buildDir, 'pot10_0001.ptau')} ${ptauFile} -v`,
      { stdio: 'inherit', cwd: buildDir }
    );
  }
  
  // Setup Groth16
  console.log('   Setting up Groth16 proving system...');
  execSync(
    `snarkjs groth16 setup ${r1csFile} ${ptauFile} ${zkeyFile} -v`,
    { stdio: 'inherit' }
  );
  
  // Export verification key
  execSync(
    `snarkjs zkey export verificationkey ${zkeyFile} ${vkeyFile}`,
    { stdio: 'inherit' }
  );
  
  console.log('✅ Proving key generated successfully\n');
} catch (error) {
  console.error('❌ Failed to generate proving key:', error.message);
  console.error('   You may need to install snarkjs: npm install -g snarkjs');
  process.exit(1);
}

// Step 3: Copy files to public directory
console.log('📦 Step 3: Copying files to public directory...');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy to flat structure for now (age18.wasm, age18.zkey)
const filesToCopy = [
  { src: wasmFile, dest: path.join(publicDir, 'age18.wasm') },
  { src: zkeyFile, dest: path.join(publicDir, 'age18.zkey') },
  { src: vkeyFile, dest: path.join(publicDir, 'age18_verification_key.json') },
];

for (const { src, dest } of filesToCopy) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`   ✅ Copied ${path.basename(dest)}`);
  } else {
    console.warn(`   ⚠️  File not found: ${src}`);
  }
}

console.log('\n✨ Age proof setup complete!');
console.log('\n⚠️  NOTE: This uses a TEST setup. For production, use a proper trusted setup ceremony.');
console.log('   See: https://github.com/iden3/snarkjs#trusted-setup');

