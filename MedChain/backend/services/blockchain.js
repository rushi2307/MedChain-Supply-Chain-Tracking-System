require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const CONTRACT_ABI = [
  "function medicines(string memory) public view returns (string memory name, string memory manufacturer, uint256 manufacturingDate, uint256 expiryDate, string memory batchNumber, string memory currentLocation, address currentOwner, uint8 status, bool isRegistered)",
  "function medicineCount() public view returns (uint256)",
  "function medicineOwners(string memory) public view returns (address)",
  "function authorizedManufacturers(address) public view returns (bool)",
  "function authorizedDistributors(address) public view returns (bool)",
  "function getMedicine(string memory batchNumber) public view returns (string memory name, string memory manufacturer, uint256 manufacturingDate, uint256 expiryDate, string memory currentLocation, address currentOwner, uint8 status)",
  "function getHistoryLength(string memory batchNumber) public view returns (uint256)",
  "function getSupplyChainEvent(string memory batchNumber, uint256 index) public view returns (string memory action, string memory location, string memory description, uint256 timestamp, address actor)",
  "function isExpired(string memory batchNumber) public view returns (bool)",
  "function registerMedicine(string memory name, string memory manufacturer, uint256 manufacturingDate, uint256 expiryDate, string memory batchNumber, string memory initialLocation)",
  "function transferMedicine(string memory batchNumber, address newOwner, string memory newLocation)",
  "function updateStatus(string memory batchNumber, uint8 newStatus)",
  "function recordSupplyChainEvent(string memory batchNumber, string memory action, string memory location, string memory description)",
  "function authorizeManufacturer(address account, bool authorized)",
  "function authorizeDistributor(address account, bool authorized)",
  "event MedicineRegistered(string indexed batchNumber, string name, address indexed manufacturer, uint256 timestamp)",
  "event MedicineTransferred(string indexed batchNumber, address indexed from, address indexed to, string newLocation, uint256 timestamp)",
  "event StatusChanged(string indexed batchNumber, uint8 oldStatus, uint8 newStatus, uint256 timestamp)",
  "event SupplyChainEventAdded(string indexed batchNumber, string action, uint256 timestamp)",
  "event AuthorizationChanged(address indexed account, string role, bool authorized, uint256 timestamp)"
];

const MedicineStatus = {
  0: 'Manufactured',
  1: 'InTransit',
  2: 'Stored',
  3: 'Sold',
  4: 'Expired',
  5: 'Recalled'
};

class BlockchainService {
  constructor() {
    this.contract = null;
    this.signer = null;
    this.provider = null;
    this.isInitialized = false;
  }

  isDemoMode() {
    return process.env.DEMO_MODE === 'true';
  }

  createDemoTransaction(action, identity) {
    const seed = `${action}:${identity}:${Date.now()}:${Math.random()}`;
    return {
      success: true,
      transactionHash: ethers.keccak256(ethers.toUtf8Bytes(seed)),
      blockNumber: Math.floor(Date.now() / 1000)
    };
  }

  async initialize() {
    try {
      const networkName = process.env.NETWORK || 'localhost';
      const rpcUrl = this.getRpcUrl(networkName);

      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      if (process.env.PRIVATE_KEY) {
        this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      } else {
        const accounts = await this.provider.listAccounts();
        if (accounts.length > 0) {
          this.signer = accounts[0];
        }
      }

      const contractAddress = process.env.CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error('CONTRACT_ADDRESS not found in .env');
      }

      this.contract = new ethers.Contract(
        contractAddress,
        CONTRACT_ABI,
        this.signer
      );

      this.isInitialized = true;
      logger.info('blockchain.initialized', { contractAddress, network: networkName });

      return true;
    } catch (error) {
      logger.error('blockchain.initialization_failed', { error: error.message });
      return false;
    }
  }

  getRpcUrl(networkName) {
    switch (networkName) {
      case 'sepolia':
        return process.env.SEPOLIA_RPC_URL;
      case 'mainnet':
        return process.env.MAINNET_RPC_URL;
      case 'localhost':
      default:
        return process.env.LOCALHOST_URL || 'http://127.0.0.1:8545';
    }
  }

  getExplorerUrl(networkName, hash) {
    const explorers = {
      mainnet: 'https://etherscan.io/tx/',
      sepolia: 'https://sepolia.etherscan.io/tx/'
    };
    return explorers[networkName] ? `${explorers[networkName]}${hash}` : null;
  }

  async getTransactionFeed(medicines) {
    if (this.isDemoMode()) {
      const transactions = medicines.map((medicine) => ({
        id: medicine._id,
        type: medicine.status === 'InTransit' ? 'Distribution transfer' : medicine.status === 'Stored' ? 'Inventory verified' : medicine.status === 'Sold' ? 'Retail handoff' : 'Medicine registered',
        name: medicine.name || medicine.batchNumber,
        batchNumber: medicine.batchNumber,
        hash: medicine.blockchainTransactionHash,
        blockNumber: medicine.blockchainBlockNumber,
        confirmations: 1,
        status: 'Confirmed',
        timestamp: medicine.createdAt,
        network: 'local-demo',
        chainId: 31337,
        explorerUrl: null
      }));
      return { available: true, demo: true, network: 'local-demo', chainId: 31337, latestBlock: transactions[0]?.blockNumber || 0, contractAddress: 'demo-local-contract', explorerUrl: null, transactions };
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    const networkName = process.env.NETWORK || 'localhost';
    const network = await this.provider.getNetwork();
    const latestBlock = await this.provider.getBlockNumber();
    const transactions = await Promise.all(medicines.map(async (medicine) => {
      const hash = medicine.blockchainTransactionHash;
      const receipt = await this.provider.getTransactionReceipt(hash);
      const blockNumber = receipt?.blockNumber || medicine.blockchainBlockNumber;
      const confirmations = receipt ? Math.max(0, latestBlock - receipt.blockNumber + 1) : 0;

      return {
        id: medicine._id,
        type: medicine.status === 'InTransit' ? 'Distribution transfer' : medicine.status === 'Stored' ? 'Inventory verified' : medicine.status === 'Sold' ? 'Retail handoff' : 'Medicine registered',
        name: medicine.name || medicine.batchNumber,
        batchNumber: medicine.batchNumber,
        hash,
        blockNumber,
        confirmations,
        status: receipt?.status === 1 ? 'Confirmed' : receipt ? 'Failed' : 'Pending',
        timestamp: medicine.createdAt,
        network: networkName,
        chainId: Number(network.chainId),
        explorerUrl: this.getExplorerUrl(networkName, hash)
      };
    }));

    return {
      network: networkName,
      chainId: Number(network.chainId),
      latestBlock,
      contractAddress: this.contract.target,
      explorerUrl: networkName === 'mainnet' ? 'https://etherscan.io/address/' : networkName === 'sepolia' ? 'https://sepolia.etherscan.io/address/' : null,
      transactions
    };
  }

  resetSignerNonce() {
    if (this.provider && process.env.PRIVATE_KEY) {
      this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      this.contract = this.contract.connect(this.signer);
    }
  }

  async getWriteOverrides() {
    const address = await this.signer.getAddress();
    // Use a raw RPC request to bypass JsonRpcProvider's short-lived nonce cache.
    const hexNonce = await this.provider.send('eth_getTransactionCount', [address, 'pending']);
    return { nonce: Number(BigInt(hexNonce)) };
  }

  async registerMedicine(medicineData) {
    if (this.isDemoMode()) return this.createDemoTransaction('register', medicineData.batchNumber);
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      this.resetSignerNonce();
      const tx = await this.contract.registerMedicine(
        medicineData.name,
        medicineData.manufacturer,
        Math.floor(new Date(medicineData.manufacturingDate).getTime() / 1000),
        Math.floor(new Date(medicineData.expiryDate).getTime() / 1000),
        medicineData.batchNumber,
        medicineData.currentLocation,
        await this.getWriteOverrides()
      );

      const receipt = await tx.wait();
      logger.info('blockchain.medicine_registered', { batchNumber: medicineData.batchNumber, transactionHash: receipt.hash, blockNumber: receipt.blockNumber });

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      logger.error('blockchain.medicine_registration_failed', { batchNumber: medicineData.batchNumber, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async transferMedicine(batchNumber, newOwner, newLocation) {
    if (this.isDemoMode()) return this.createDemoTransaction('transfer', batchNumber);
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      this.resetSignerNonce();
      const tx = await this.contract.transferMedicine(
        batchNumber,
        newOwner,
        newLocation,
        await this.getWriteOverrides()
      );

      const receipt = await tx.wait();
      logger.info('blockchain.medicine_transferred', { batchNumber, transactionHash: receipt.hash, blockNumber: receipt.blockNumber });

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      logger.error('blockchain.medicine_transfer_failed', { batchNumber, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async updateStatus(batchNumber, status) {
    if (this.isDemoMode()) return this.createDemoTransaction(`status-${status}`, batchNumber);
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      this.resetSignerNonce();
      const tx = await this.contract.updateStatus(batchNumber, status, await this.getWriteOverrides());
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      logger.error('blockchain.status_update_failed', { batchNumber, status, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async recordSupplyChainEvent(batchNumber, action, location, description) {
    if (this.isDemoMode()) return this.createDemoTransaction(`event-${action}`, batchNumber);
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      this.resetSignerNonce();
      const tx = await this.contract.recordSupplyChainEvent(
        batchNumber,
        action,
        location,
        description,
        await this.getWriteOverrides()
      );

      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      logger.error('blockchain.event_record_failed', { batchNumber, action, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async getMedicine(batchNumber) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const medicine = await this.contract.getMedicine(batchNumber);

      return {
        success: true,
        data: {
          name: medicine.name,
          manufacturer: medicine.manufacturer,
          manufacturingDate: new Date(Number(medicine.manufacturingDate) * 1000).toISOString(),
          expiryDate: new Date(Number(medicine.expiryDate) * 1000).toISOString(),
          currentLocation: medicine.currentLocation,
          currentOwner: medicine.currentOwner,
          status: MedicineStatus[medicine.status] || 'Unknown'
        }
      };
    } catch (error) {
      logger.error('blockchain.medicine_read_failed', { batchNumber, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async getMedicineHistory(batchNumber) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const length = await this.contract.getHistoryLength(batchNumber);
      const history = [];

      for (let i = 0; i < Number(length); i++) {
        const event = await this.contract.getSupplyChainEvent(batchNumber, i);
        history.push({
          action: event.action,
          location: event.location,
          description: event.description,
          timestamp: new Date(Number(event.timestamp) * 1000).toISOString(),
          actor: event.actor
        });
      }

      return { success: true, history };
    } catch (error) {
      logger.error('blockchain.history_read_failed', { batchNumber, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async checkExpired(batchNumber) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const expired = await this.contract.isExpired(batchNumber);
      return { success: true, expired };
    } catch (error) {
      logger.error('blockchain.expiry_check_failed', { batchNumber, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async authorizeManufacturer(account, authorized) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      this.resetSignerNonce();
      const tx = await this.contract.authorizeManufacturer(account, authorized, await this.getWriteOverrides());
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash
      };
    } catch (error) {
      logger.error('blockchain.manufacturer_authorization_failed', { account, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async authorizeDistributor(account, authorized) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      this.resetSignerNonce();
      const tx = await this.contract.authorizeDistributor(account, authorized, await this.getWriteOverrides());
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash
      };
    } catch (error) {
      logger.error('blockchain.distributor_authorization_failed', { account, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async getMedicineCount() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const count = await this.contract.medicineCount();
      return { success: true, count: Number(count) };
    } catch (error) {
      logger.error('blockchain.count_read_failed', { error: error.message });
      return { success: false, error: error.message };
    }
  }
}

module.exports = new BlockchainService();