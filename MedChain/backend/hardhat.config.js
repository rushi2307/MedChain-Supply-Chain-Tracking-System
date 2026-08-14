require('dotenv').config();
const fs = require('fs');
const path = require('path');

const NETWORKS = {
  localhost: {
    url: process.env.LOCALHOST_URL || 'http://127.0.0.1:8545',
    chainId: 31337,
    gasPrice: 2000000000
  },
  sepolia: {
    url: process.env.SEPOLIA_RPC_URL || '',
    chainId: 11155111,
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
  },
  mainnet: {
    url: process.env.MAINNET_RPC_URL || '',
    chainId: 1,
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
  }
};

module.exports = {
  networks: NETWORKS,
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: './contracts',
    artifacts: './artifacts'
  }
};