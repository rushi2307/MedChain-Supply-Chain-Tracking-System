require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'MedicineChain.sol', 'MedicineChain.json');
const suffix = Date.now();
const batchNumber = `CHAIN-TEST-${suffix}`;

async function main() {
  if (!process.env.CONTRACT_ADDRESS) throw new Error('CONTRACT_ADDRESS is missing from .env');
  if (!process.env.PRIVATE_KEY) throw new Error('PRIVATE_KEY is missing from .env');
  if (!fs.existsSync(artifactPath)) throw new Error('Compile the contract before running this test');

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const provider = new ethers.JsonRpcProvider(process.env.LOCALHOST_URL || 'http://127.0.0.1:8545');
  const signer = new ethers.NonceManager(new ethers.Wallet(process.env.PRIVATE_KEY, provider));
  const network = await provider.getNetwork();
  const code = await provider.getCode(process.env.CONTRACT_ADDRESS);
  if (code === '0x') throw new Error('No contract bytecode at CONTRACT_ADDRESS');
  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, artifact.abi, signer);

  const before = Number(await contract.medicineCount());
  const now = Math.floor(Date.now() / 1000);
  const tx = await contract.registerMedicine('Blockchain Test Medicine', 'chain-test@medchain.local', now, now + 86400 * 365, batchNumber, 'Test warehouse');
  const receipt = await tx.wait();
  const record = await contract.getMedicine(batchNumber);
  const historyLength = Number(await contract.getHistoryLength(batchNumber));
  if (record.name !== 'Blockchain Test Medicine' || historyLength !== 1) throw new Error('on-chain record or history mismatch');

  const statusTx = await contract.updateStatus(batchNumber, 2);
  await statusTx.wait();
  const updated = await contract.getMedicine(batchNumber);
  if (Number(updated.status) !== 2) throw new Error('on-chain status update failed');

  const after = Number(await contract.medicineCount());
  if (after !== before + 1) throw new Error(`medicineCount expected ${before + 1}, received ${after}`);
  console.log(`[chain-test] PASS network=${network.chainId} contract=${process.env.CONTRACT_ADDRESS}`);
  console.log(`[chain-test] PASS batch=${batchNumber} registerBlock=${receipt.blockNumber} status=Stored count=${after}`);
}

main().catch((error) => {
  console.error(`[chain-test] FAIL ${error.message}`);
  process.exitCode = 1;
});
