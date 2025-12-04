/**
 * Deploy Private Payment Contract to Starknet Testnet
 * 
 * Prerequisites:
 * 1. Install dependencies: npm install
 * 2. Set environment variables in .env.local:
 *    STARKNET_DEPLOYER_ADDRESS=0x...
 *    STARKNET_DEPLOYER_PRIVATE_KEY=0x...
 *    NEXT_PUBLIC_STARKNET_RPC=https://starknet-sepolia.public.blastapi.io/rpc/v0_7
 * 
 * Usage:
 *   npx tsx scripts/deploy-private-payment.ts
 */

import { Provider, Account, ContractFactory, json } from 'starknet';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🚀 Deploying Private Payment Contract to Starknet Testnet...\n');

  // Check environment variables
  const deployerAddress = process.env.STARKNET_DEPLOYER_ADDRESS;
  const deployerPrivateKey = process.env.STARKNET_DEPLOYER_PRIVATE_KEY;
  const rpcUrl = process.env.NEXT_PUBLIC_STARKNET_RPC || 
                 process.env.STARKNET_RPC_URL || 
                 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7';

  if (!deployerAddress || !deployerPrivateKey) {
    console.error('❌ Error: Missing required environment variables');
    console.error('   Required: STARKNET_DEPLOYER_ADDRESS');
    console.error('   Required: STARKNET_DEPLOYER_PRIVATE_KEY');
    console.error('\n   Add these to your .env.local file');
    process.exit(1);
  }

  // Initialize provider and account
  console.log('📡 Connecting to Starknet Testnet...');
  const provider = new Provider({ rpc: { nodeUrl: rpcUrl } });
  const account = new Account(provider, deployerAddress, deployerPrivateKey);

  // Check account balance
  try {
    const balance = await provider.getBalance(deployerAddress);
    const balanceStr = (Number(balance) / 1e18).toFixed(4);
    console.log(`💰 Deployer balance: ${balanceStr} STRK\n`);
    
    if (balance === 0n) {
      console.warn('⚠️  Warning: Deployer account has zero balance');
      console.warn('   You may need to fund the account with testnet STRK\n');
    }
  } catch (error) {
    console.warn('⚠️  Could not check balance:', error);
  }

  // Find compiled contract files
  const contractDir = path.join(__dirname, '../contracts/private_payment');
  const sierraPath = path.join(contractDir, 'target/dev/private_payment_PrivatePayment.sierra.json');
  const casmPath = path.join(contractDir, 'target/dev/private_payment_PrivatePayment.casm.json');

  // Check if contract is built
  if (!fs.existsSync(sierraPath)) {
    console.error('❌ Error: Contract not compiled');
    console.error(`   Expected: ${sierraPath}`);
    console.error('\n   Build the contract first:');
    console.error('   cd contracts/private_payment');
    console.error('   scarb build');
    process.exit(1);
  }

  console.log('📦 Loading compiled contract...');
  const sierra = json.parse(fs.readFileSync(sierraPath, 'utf-8'));
  const casm = fs.existsSync(casmPath) 
    ? json.parse(fs.readFileSync(casmPath, 'utf-8'))
    : null;

  // Declare contract
  console.log('📝 Declaring contract...');
  try {
    const declareResponse = await account.declare({
      contract: sierra,
      casm: casm,
    });

    console.log(`✅ Contract declared!`);
    console.log(`   Class Hash: ${declareResponse.class_hash}\n`);

    // Deploy contract
    console.log('🚀 Deploying contract...');
    const deployResponse = await account.deployContract({
      classHash: declareResponse.class_hash,
      constructorCalldata: [], // No constructor parameters
    });

    await provider.waitForTransaction(deployResponse.transaction_hash);

    console.log('\n✅ ==========================================');
    console.log('✅ Contract deployed successfully!');
    console.log('✅ ==========================================\n');
    console.log('📋 Contract Details:');
    console.log(`   Class Hash: ${declareResponse.class_hash}`);
    console.log(`   Contract Address: ${deployResponse.contract_address}`);
    console.log(`   Transaction Hash: ${deployResponse.transaction_hash}`);
    console.log(`   Network: Starknet Testnet (Sepolia)\n`);
    console.log('📝 Add this to your .env.local:');
    console.log(`   NEXT_PUBLIC_STARKNET_PAYMENT_CONTRACT=${deployResponse.contract_address}\n`);
    console.log('🔗 View on Starkscan:');
    console.log(`   https://sepolia.starkscan.co/contract/${deployResponse.contract_address}\n`);

    // Save deployment info
    const deploymentInfo = {
      classHash: declareResponse.class_hash,
      contractAddress: deployResponse.contract_address,
      transactionHash: deployResponse.transaction_hash,
      network: 'testnet',
      deployedAt: new Date().toISOString(),
    };

    const deploymentFile = path.join(__dirname, '../deployments/private-payment.json');
    const deploymentsDir = path.dirname(deploymentFile);
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`💾 Deployment info saved to: ${deploymentFile}\n`);

  } catch (error: any) {
    console.error('\n❌ Deployment failed:');
    if (error.message) {
      console.error(`   ${error.message}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

