require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

async function main() {
  const networkName = process.env.NETWORK || 'localhost';
  const rpcUrl = networkName === 'sepolia'
    ? process.env.SEPOLIA_RPC_URL
    : networkName === 'mainnet'
      ? process.env.MAINNET_RPC_URL
      : process.env.LOCALHOST_URL || 'http://127.0.0.1:8545';
  if (!rpcUrl) throw new Error(`${networkName.toUpperCase()} RPC URL is required`);
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error('PRIVATE_KEY is required to deploy locally');

  const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'MedicineChain.sol', 'MedicineChain.json');
  if (!fs.existsSync(artifactPath)) throw new Error('Contract artifact missing. Run npm run compile first.');

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  const network = await provider.getNetwork();
  console.log(`[blockchain] deploying MedicineChain network=${networkName} chain=${network.chainId}`);

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  const deploymentTx = contract.deploymentTransaction();
  const receipt = deploymentTx ? await deploymentTx.wait() : null;

  const envPath = path.join(__dirname, '..', '.env');
  let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  if (/^CONTRACT_ADDRESS=.*$/m.test(env)) env = env.replace(/^CONTRACT_ADDRESS=.*$/m, `CONTRACT_ADDRESS=${address}`);
  else env += `${env.endsWith('\n') ? '' : '\n'}CONTRACT_ADDRESS=${address}\n`;
  fs.writeFileSync(envPath, env);

  console.log(`[blockchain] deployed address=${address} block=${receipt?.blockNumber || 'pending'}`);
  console.log('[blockchain] CONTRACT_ADDRESS updated in backend/.env');
}

main().catch((error) => {
  console.error(`[blockchain] deployment failed: ${error.message}`);
  process.exitCode = 1;
});
