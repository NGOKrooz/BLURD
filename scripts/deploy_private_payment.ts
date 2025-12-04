/**
 * Deploy PrivatePayment Contract to Starknet Testnet
 * Using starknet.js v6
 */

import { RpcProvider, Account, Contract, json, cairo, CallData } from "starknet";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env files
const envFiles = [".env.local", ".env"];
for (const envFile of envFiles) {
  const envPath = path.join(__dirname, "..", envFile);
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=").replace(/^["']|["']$/g, "");
        if (key && value && !process.env[key.trim()]) {
          process.env[key.trim()] = value.trim();
        }
      }
    });
  }
}

async function main() {
  console.log("🚀 Deploying PrivatePayment Contract...\n");

  // Load environment variables
  const rpcUrl =
    process.env.NEXT_PUBLIC_STARKNET_RPC ||
    process.env.STARKNET_RPC ||
    "https://starknet-sepolia.public.blastapi.io/rpc/v0_7";
  const privateKey = process.env.STARKNET_PRIVATE_KEY;
  const accountAddress = process.env.STARKNET_PUBLIC_KEY || process.env.STARKNET_DEPLOYER_ADDRESS;

  if (!privateKey || !accountAddress) {
    console.error("❌ Error: Missing environment variables");
    console.error("Required:");
    console.error("  - STARKNET_PRIVATE_KEY");
    console.error("  - STARKNET_PUBLIC_KEY (or STARKNET_DEPLOYER_ADDRESS)");
    console.error("\nAdd these to your .env.local file");
    process.exit(1);
  }

  // Initialize provider and account
  console.log("📡 Connecting to Starknet...");
  console.log(`   RPC: ${rpcUrl}`);
  console.log(`   Account: ${accountAddress}\n`);

  const provider = new RpcProvider({ nodeUrl: rpcUrl });
  
  // Check if account exists on network
  let accountExists = false;
  try {
    await provider.getNonce(accountAddress);
    accountExists = true;
    console.log("✅ Account found on network\n");
  } catch (error: any) {
    if (error.message?.includes("starknet_getNonce") || error.message?.includes("Contract not found")) {
      console.error("❌ Account not found on network!");
      console.error("\nYour account needs to be deployed before it can send transactions.");
      console.error("\nTo fix this:");
      console.error("1. Open your Starknet wallet (Argent X or Braavos)");
      console.error("2. Make sure you're connected to Sepolia Testnet");
      console.error("3. If the account shows as 'Not deployed', deploy it from the wallet");
      console.error("4. Fund it at: https://starknet-faucet.vercel.app/");
      console.error("\nAlternatively, verify your account address is correct in .env.local");
      process.exit(1);
    }
    throw error;
  }

  const account = new Account(provider, accountAddress, privateKey);

  // Check balance
  try {
    const balance = await provider.getBalance(accountAddress);
    const balanceStr = (Number(balance) / 1e18).toFixed(4);
    console.log(`💰 Account balance: ${balanceStr} STRK\n`);

    if (balance === 0n) {
      console.warn("⚠️  Warning: Account has zero balance");
      console.warn("   Fund it at: https://starknet-faucet.vercel.app/\n");
    }
  } catch (error) {
    console.warn("⚠️  Could not check balance\n");
  }

  // Load compiled contract
  const contractDir = path.join(__dirname, "../contracts");
  const sierraPath = path.join(contractDir, "target/dev/private_payment_PrivatePayment.contract_class.json");
  const casmPath = path.join(contractDir, "target/dev/private_payment_PrivatePayment.compiled_contract_class.json");

  if (!fs.existsSync(sierraPath)) {
    console.error("❌ Contract not compiled!");
    console.error(`   Expected: ${sierraPath}`);
    console.error("\nBuild the contract first:");
    console.error("   cd contracts");
    console.error("   scarb build\n");
    process.exit(1);
  }

  console.log("📦 Loading compiled contract...");
  const sierra = json.parse(fs.readFileSync(sierraPath, "utf-8"));
  const casm = fs.existsSync(casmPath)
    ? json.parse(fs.readFileSync(casmPath, "utf-8"))
    : undefined;

  // Declare contract
  console.log("📝 Declaring contract...");
  let classHash: string;

  try {
    // Use declare instead of declareIfNot for better error handling
    const declareResponse = await account.declare({
      contract: sierra,
      casm: casm,
    });

    classHash = declareResponse.class_hash;
    console.log(`✅ Contract declared`);
    console.log(`   Class Hash: ${classHash}\n`);

    if (declareResponse.transaction_hash) {
      console.log(`   Declare TX: ${declareResponse.transaction_hash}`);
      await provider.waitForTransaction(declareResponse.transaction_hash);
      console.log(`   ✅ Declaration confirmed\n`);
    }
  } catch (error: any) {
    // Check if contract is already declared
    if (
      error.message?.includes("already declared") ||
      error.message?.includes("Class already declared") ||
      error.message?.includes("CONTRACT_CLASS_ALREADY_DECLARED")
    ) {
      console.log("ℹ️  Contract already declared\n");
      // Extract class hash from compiled contract or calculate it
      if (sierra.class_hash) {
        classHash = sierra.class_hash;
      } else {
        // Try to get class hash from error or calculate
        const errorStr = JSON.stringify(error);
        const classHashMatch = errorStr.match(/0x[a-fA-F0-9]{64}/);
        if (classHashMatch) {
          classHash = classHashMatch[0];
        } else {
          console.error("❌ Could not determine class hash");
          throw error;
        }
      }
      console.log(`   Using existing Class Hash: ${classHash}\n`);
    } else {
      console.error("❌ Declaration failed:", error.message);
      if (error.data) {
        console.error(`   Error data: ${JSON.stringify(error.data)}`);
      }
      throw error;
    }
  }

  // Deploy contract
  console.log("🚀 Deploying contract...");

  try {
    const deployPayload = {
      classHash: classHash,
      constructorCalldata: [], // No constructor arguments
    };

    const { transaction_hash, contract_address } = await account.deployContract(deployPayload);

    console.log(`   Deploy TX: ${transaction_hash}`);
    console.log(`   Waiting for confirmation...`);

    await provider.waitForTransaction(transaction_hash);

    console.log("\n✅ ==========================================");
    console.log("✅ CONTRACT DEPLOYED SUCCESSFULLY");
    console.log("✅ ==========================================\n");

    console.log("📋 Deployment Details:");
    console.log(`   Contract Address: ${contract_address}`);
    console.log(`   Class Hash: ${classHash}`);
    console.log(`   Transaction Hash: ${transaction_hash}`);
    console.log(`   Network: Starknet Testnet (Sepolia)\n`);

    console.log("📝 Add this to your .env.local:");
    console.log(`   NEXT_PUBLIC_PRIVATE_PAYMENT_CONTRACT_ADDRESS=${contract_address}\n`);

    console.log("🔗 View on Starkscan:");
    console.log(`   Contract: https://sepolia.starkscan.co/contract/${contract_address}`);
    console.log(`   Transaction: https://sepolia.starkscan.co/tx/${transaction_hash}\n`);

    // Save deployment info
    const deploymentInfo = {
      network: "sepolia-testnet",
      contractAddress: contract_address,
      classHash: classHash,
      transactionHash: transaction_hash,
      deployedAt: new Date().toISOString(),
      deployer: accountAddress,
    };

    const deploymentFile = path.join(__dirname, "../deployments/private-payment.json");
    const deploymentsDir = path.dirname(deploymentFile);

    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`💾 Deployment info saved to: deployments/private-payment.json\n`);
  } catch (error: any) {
    console.error("\n❌ Deployment failed:");
    console.error(`   ${error.message || error}`);
    if (error.data) {
      console.error(`   Data: ${JSON.stringify(error.data)}`);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

