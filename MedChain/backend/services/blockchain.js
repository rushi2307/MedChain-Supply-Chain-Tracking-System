require('dotenv').config();
const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

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
      console.log('Blockchain service initialized');
      console.log('Contract address:', contractAddress);
      console.log('Network:', networkName);

      return true;
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error.message);
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

  async registerMedicine(medicineData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const tx = await this.contract.registerMedicine(
        medicineData.name,
        medicineData.manufacturer,
        Math.floor(new Date(medicineData.manufacturingDate).getTime() / 1000),
        Math.floor(new Date(medicineData.expiryDate).getTime() / 1000),
        medicineData.batchNumber,
        medicineData.currentLocation
      );

      const receipt = await tx.wait();
      console.log('Medicine registered on blockchain. Transaction:', receipt.hash);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Failed to register medicine on blockchain:', error.message);
      return { success: false, error: error.message };
    }
  }

  async transferMedicine(batchNumber, newOwner, newLocation) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const tx = await this.contract.transferMedicine(
        batchNumber,
        newOwner,
        newLocation
      );

      const receipt = await tx.wait();
      console.log('Medicine transferred. Transaction:', receipt.hash);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Failed to transfer medicine:', error.message);
      return { success: false, error: error.message };
    }
  }

  async updateStatus(batchNumber, status) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const tx = await this.contract.updateStatus(batchNumber, status);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Failed to update status:', error.message);
      return { success: false, error: error.message };
    }
  }

  async recordSupplyChainEvent(batchNumber, action, location, description) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const tx = await this.contract.recordSupplyChainEvent(
        batchNumber,
        action,
        location,
        description
      );

      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Failed to record event:', error.message);
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
          manufacturingDate: new Date(medicine.manufacturingDate * 1000).toISOString(),
          expiryDate: new Date(medicine.expiryDate * 1000).toISOString(),
          currentLocation: medicine.currentLocation,
          currentOwner: medicine.currentOwner,
          status: MedicineStatus[medicine.status] || 'Unknown'
        }
      };
    } catch (error) {
      console.error('Failed to get medicine:', error.message);
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

      for (let i = 0; i < length; i++) {
        const event = await this.contract.getSupplyChainEvent(batchNumber, i);
        history.push({
          action: event.action,
          location: event.location,
          description: event.description,
          timestamp: new Date(event.timestamp * 1000).toISOString(),
          actor: event.actor
        });
      }

      return { success: true, history };
    } catch (error) {
      console.error('Failed to get history:', error.message);
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
      console.error('Failed to check expiry:', error.message);
      return { success: false, error: error.message };
    }
  }

  async authorizeManufacturer(account, authorized) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const tx = await this.contract.authorizeManufacturer(account, authorized);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to authorize manufacturer:', error.message);
      return { success: false, error: error.message };
    }
  }

  async authorizeDistributor(account, authorized) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const tx = await this.contract.authorizeDistributor(account, authorized);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to authorize distributor:', error.message);
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
      console.error('Failed to get count:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new BlockchainService();