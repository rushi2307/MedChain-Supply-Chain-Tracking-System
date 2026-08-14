const hre = require('hardhat');
const path = require('path');

async function main() {
  console.log('Deploying MedicineChain smart contract...');

  const MedicineChain = await hre.ethers.getContractFactory('MedicineChain');

  const medicineChain = await MedicineChain.deploy();

  await medicineChain.deployed();

  console.log('MedicineChain deployed to:', medicineChain.address);

  const fs = require('fs');
  const envPath = path.join(__dirname, '..', '.env');

  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  if (envContent.includes('CONTRACT_ADDRESS=')) {
    envContent = envContent.replace(
      /CONTRACT_ADDRESS=.*/,
      `CONTRACT_ADDRESS=${medicineChain.address}`
    );
  } else {
    envContent += `\nCONTRACT_ADDRESS=${medicineChain.address}`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log('Contract address saved to .env');

  if (hre.network.name !== 'localhost' && hre.network.name !== 'hardhat') {
    try {
      await hre.run('verify:verify', {
        address: medicineChain.address,
        constructorArguments: []
      });
      console.log('Contract verified on Etherscan');
    } catch (error) {
      console.log('Verification skipped:', error.message);
    }
  }

  return medicineChain.address;
}

main()
  .then((address) => {
    console.log('\nDeployment successful!');
    console.log('Contract Address:', address);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });