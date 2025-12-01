import { Provider, Account, ContractFactory, json } from 'starknet';
import * as fs from 'fs';
import * as path from 'path';
import { STARKNET_RPC } from '../../config/starknet';

async function main() {
  const provider = new Provider({ rpc: { nodeUrl: STARKNET_RPC } });

  const accountAddress = process.env.STARKNET_DEPLOYER_ADDRESS!;
  const privateKey = process.env.STARKNET_DEPLOYER_PRIVATE_KEY!;

  const account = new Account(provider, accountAddress, privateKey);

  const compiledPath = path.join(
    __dirname,
    '../../contracts/payment_proof/payment_proof.compiled.json'
  );
  const compiled = json.parse(fs.readFileSync(compiledPath, 'utf-8'));

  const factory = new ContractFactory(compiled.abi, compiled.bytecode, account);
  const contract = await factory.deploy();

  console.log('Deployed PaymentProof contract at', contract.address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


