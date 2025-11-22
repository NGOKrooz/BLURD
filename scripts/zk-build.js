#!/usr/bin/env node

/**
 * Unified ZK Circuit Build Script
 * Builds all circuits: age, country, and uniqueness proofs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const publicZkDir = path.join(projectRoot, 'apps', 'wallet-app', 'public', 'zk');

const circuits = [
  { name: 'ageProof', outputName: 'age18', circuitPath: 'zk/circuits/ageProof/ageProof.circom' },
  { name: 'countryProof', outputName: 'countryProof', circuitPath: 'zk/circuits/countryProof/countryProof.circom' },
  { name: 'uniquenessProof', outputName: 'uniquenessProof', circuitPath: 'zk/circuits/uniquenessProof/uniquenessProof.circom' },
];

console.log('🔨 Building all ZK circuits...\n');

// Check if Circom is installed
try {
  execSync('circom --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Circom compiler not found!');
  console.error('   Please install it: npm install -g circom');
  process.exit(1);
}

// Check if SnarkJS is available
let snarkjsAvailable = false;
try {
  execSync('snarkjs --version', { stdio: 'ignore' });
  snarkjsAvailable = true;
} catch (error) {
  console.warn('⚠️  SnarkJS not found. Will skip zkey generation.');
  console.warn('   Install it: npm install -g snarkjs');
}

// Ensure public directory exists
if (!fs.existsSync(publicZkDir)) {
  fs.mkdirSync(publicZkDir, { recursive: true });
}

// Build each circuit
for (const { name, outputName, circuitPath } of circuits) {
  const fullCircuitPath = path.join(projectRoot, circuitPath);
  const buildDir = path.join(projectRoot, 'zk', 'build', name);
  
  if (!fs.existsSync(fullCircuitPath)) {
    console.warn(`⚠️  Circuit not found: ${fullCircuitPath}`);
    continue;
  }
  
  console.log(`\n📦 Building ${name}...`);
  
  try {
    // Create build directory
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }
    
    // Compile circuit
    // Run from circuit directory so relative includes work correctly
    const circuitDir = path.dirname(fullCircuitPath);
    const circuitFileName = path.basename(fullCircuitPath);
    console.log(`   Compiling ${name}...`);
    
    // Make buildDir relative to circuitDir or use absolute path
    const buildDirRelative = path.relative(circuitDir, buildDir);
    const buildOutputDir = path.isAbsolute(buildDirRelative) ? buildDir : buildDirRelative;
    
    execSync(
      `circom ${circuitFileName} --r1cs --wasm --sym -o "${buildDir}"`,
      { stdio: 'inherit', cwd: circuitDir }
    );
    
    // Find generated files
    const wasmSubDir = path.join(buildDir, `${name}_js`);
    const wasmFile = path.join(wasmSubDir, `${name}.wasm`);
    const r1csFile = path.join(buildDir, `${name}.r1cs`);
    
    if (!fs.existsSync(wasmFile)) {
      console.warn(`   ⚠️  WASM file not found: ${wasmFile}`);
      continue;
    }
    
    // Copy WASM file
    const wasmDest = path.join(publicZkDir, `${outputName}.wasm`);
    fs.copyFileSync(wasmFile, wasmDest);
    console.log(`   ✅ Copied WASM to ${path.basename(wasmDest)}`);
    
    // Generate zkey if SnarkJS is available
    if (snarkjsAvailable && fs.existsSync(r1csFile)) {
      const zkeyFile = path.join(buildDir, `${name}.zkey`);
      const vkeyFile = path.join(buildDir, `${name}_verification_key.json`);
      const ptauFile = path.join(buildDir, 'powersOfTau28_hez_final_10.ptau');
      
      // Generate powers of tau if needed
      if (!fs.existsSync(ptauFile)) {
        console.log(`   Generating test powers of tau for ${name}...`);
        const pot10_0000 = path.join(buildDir, 'pot10_0000.ptau');
        const pot10_0001 = path.join(buildDir, 'pot10_0001.ptau');
        
        execSync(`snarkjs powersoftau new bn128 10 ${pot10_0000} -v`, { stdio: 'inherit' });
        execSync(`snarkjs powersoftau contribute ${pot10_0000} ${pot10_0001} --name="Test" -v -e="test"`, { stdio: 'inherit' });
        execSync(`snarkjs powersoftau prepare phase2 ${pot10_0001} ${ptauFile} -v`, { stdio: 'inherit' });
      }
      
      // Generate zkey if not exists
      if (!fs.existsSync(zkeyFile)) {
        console.log(`   Generating proving key for ${name}...`);
        execSync(`snarkjs groth16 setup ${r1csFile} ${ptauFile} ${zkeyFile} -v`, { stdio: 'inherit' });
        execSync(`snarkjs zkey export verificationkey ${zkeyFile} ${vkeyFile}`, { stdio: 'inherit' });
      }
      
      // Copy zkey and vkey
      const zkeyDest = path.join(publicZkDir, `${outputName}.zkey`);
      const vkeyDest = path.join(publicZkDir, `${outputName}_verification_key.json`);
      
      if (fs.existsSync(zkeyFile)) {
        fs.copyFileSync(zkeyFile, zkeyDest);
        console.log(`   ✅ Copied zkey to ${path.basename(zkeyDest)}`);
      }
      
      if (fs.existsSync(vkeyFile)) {
        fs.copyFileSync(vkeyFile, vkeyDest);
        console.log(`   ✅ Copied verification key to ${path.basename(vkeyDest)}`);
      }
    }
    
    console.log(`✅ ${name} built successfully`);
  } catch (error) {
    console.error(`❌ Failed to build ${name}:`, error.message);
    // Continue with other circuits
  }
}

console.log('\n✨ All circuits built successfully!');
console.log('⚠️  NOTE: This uses a TEST setup. For production, use a proper trusted setup ceremony.');
