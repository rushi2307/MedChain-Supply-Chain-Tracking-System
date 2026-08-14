# MedChain - Blockchain-Based Medicine Supply Chain

A comprehensive blockchain solution for transparent, secure, and immutable medicine supply chain management. MedChain leverages Ethereum smart contracts and MongoDB to create an end-to-end tracking system for pharmaceutical products from manufacturer to consumer.

## Key Features

### Blockchain Verification
- **Ethereum Smart Contracts** - Immutable medicine records with full audit trail
- **Transparent Tracking** - Real-time supply chain status monitoring
- **Tamper-Proof Records** - Cryptographic verification of authenticity
- **Authorization Levels** - Role-based access control for manufacturers, distributors, and retailers

### Medicine Management
- **QR Code Integration** - Fast and easy product identification and verification
- **Batch Tracking** - Monitor entire production batches through the supply chain
- **Expiry Management** - Automatic tracking of medicine expiration dates
- **Storage Conditions** - Document and verify proper storage requirements

### Supply Chain Visibility
- **Location Tracking** - Record medicine location at every stage
- **Status Monitoring** - Real-time status updates (Manufactured, InTransit, Stored, Sold, Expired, Recalled)
- **Event History** - Complete audit log of all supply chain events
- **Owner Transfer** - Secure transfer of ownership with blockchain verification

## Technology Stack

### Backend
- **Node.js + Express** - RESTful API server
- **Solidity** - Smart contract development
- **Hardhat** - Ethereum development framework
- **MongoDB Atlas** - Distributed NoSQL database
- **Web3.js/Ethers.js** - Blockchain interaction

### Frontend
- **React 19** - Modern UI framework
- **Vite** - Next-generation build tool
- **Tailwind CSS** - Utility-first CSS framework
- **QR Code Libraries** - `qrcode.react` and `html5-qrcode`
- **Headless UI** - Unstyled accessible components

## 📁 Project Structure

```
MedChain/
├── backend/                          # Node.js + Solidity backend
│   ├── contracts/
│   │   └── MedicineChain.sol         # Main smart contract
│   ├── models/
│   │   └── Medicine.js               # MongoDB schema
│   ├── routes/
│   │   └── medicine.js               # API routes
│   ├── services/
│   │   └── blockchain.js             # Blockchain interactions
│   ├── config/
│   │   └── db.js                     # Database configuration
│   ├── scripts/
│   │   └── deploy.js                 # Contract deployment script
│   ├── server.js                     # Express server entry point
│   ├── hardhat.config.js             # Hardhat configuration
│   └── package.json
│
├── frontend/                         # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── QRCodeGenerator.jsx   # QR code functionality
│   │   ├── Interface.jsx             # Main interface
│   │   ├── App.jsx                   # App component
│   │   ├── main.jsx                  # Entry point
│   │   ├── App.css                   # App styling
│   │   └── index.css                 # Global styles
│   ├── index.html                    # HTML template
│   ├── vite.config.js                # Vite configuration
│   ├── package.json
│   └── postcss.config.js
│
└── readme.md                         # This file
```

## Getting Started

### Prerequisites
- **Node.js** (v14 or higher)
- **MongoDB Atlas** account and connection string
- **Hardhat** and Ethereum testnet setup (Ganache or Sepolia)
- **npm** or **yarn** package manager

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/MedChain.git
cd MedChain
```

#### 2. Backend Setup
```bash
cd MedChain/backend

# Install dependencies
npm install

# Create .env file with required variables
echo "MONGODB_URI=your_mongodb_atlas_uri" > .env
echo "PORT=5000" >> .env
echo "HARDHAT_NETWORK=localhost" >> .env
```

#### 3. Smart Contract Deployment
```bash
# Compile contracts
npm run compile

# Start local Hardhat network (in another terminal)
npx hardhat node

# Deploy to local network
npm run deploy
```

#### 4. Start Backend Server
```bash
npm run start
# Server runs on http://localhost:5000
```

#### 5. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

## API Endpoints

### Medicine Management
- `GET /api/medicines` - Retrieve all medicines
- `POST /api/medicines` - Register new medicine batch
- `GET /api/medicines/:batchNumber` - Get specific medicine details
- `PUT /api/medicines/:batchNumber` - Update medicine status
- `GET /api/medicines/:batchNumber/history` - Get supply chain history

### Blockchain Verification
- `GET /api/medicines/:batchNumber/verify` - Verify medicine on blockchain
- `POST /api/medicines/:batchNumber/transfer` - Transfer ownership
- `GET /api/medicines/:batchNumber/events` - Get blockchain events

## Smart Contract Functions

### Core Functions

**registerMedicine()**
- Register a new medicine batch on the blockchain
- Only authorized manufacturers can call this function
- Emits `MedicineRegistered` event

**transferMedicine()**
- Transfer medicine ownership to another party
- Updates current location and owner
- Records transfer in blockchain history

**updateStatus()**
- Change medicine status throughout supply chain
- Valid statuses: Manufactured, InTransit, Stored, Sold, Expired, Recalled

**addSupplyChainEvent()**
- Log supply chain events with descriptions and timestamps
- Creates immutable audit trail

**authorizeManufacturer() / authorizeDistributor()**
- Admin function to grant roles
- Only contract owner can authorize parties

## Medicine Lifecycle

```
Manufactured 
    ↓
  InTransit (from manufacturer to distributor)
    ↓
  Stored (in warehouse/retail)
    ↓
  Sold (to consumer)
    ↓
Success ✓ or Expired/Recalled ⚠️
```

##  Database Schema

### Medicine Model (MongoDB)
```javascript
{
  blockchainId: String,          // Smart contract reference
  name: String,                  // Medicine name
  batchNumber: String,           // Unique batch identifier
  qrCodeData: String,            // Encoded QR data
  manufacturer: String,          // Manufacturer name
  manufacturingDate: Date,       // Production date
  expiryDate: Date,              // Expiration date
  chemicalComponents: String,    // Active ingredients
  description: String,           // Product description
  storageConditions: String,     // Storage requirements
  dosage: String,                // Dosage information
  price: Number,                 // Product price
  // ... additional fields
}
```

##  Testing

### Run Smart Contract Tests
```bash
cd MedChain/backend
npm run test
```

### Verify MongoDB Connection
```bash
npm run verify-mongodb
```

### Test API Connections
```bash
npm run advanced-diagnostics
```

## Security Features

- ✅ **Role-Based Access Control** - Different permissions for manufacturers, distributors, retailers
- ✅ **Immutable Audit Trail** - All changes recorded on blockchain
- ✅ **QR Code Verification** - Easy product authentication for consumers
- ✅ **Expiry Tracking** - Prevent sale of expired medicines
- ✅ **Batch Recall** - Ability to flag compromised batches
- ✅ **Ownership Verification** - Cryptographic proof of current owner

## Future Enhancements

- [ ] Integration with IoT sensors for temperature monitoring
- [ ] Machine learning for anomaly detection
- [ ] Mobile app for real-time tracking
- [ ] Multi-chain support (Polygon, Binance Smart Chain)
- [ ] Advanced analytics dashboard
- [ ] Integration with pharmacy POS systems
- [ ] Consumer-facing verification app
- [ ] Automated compliance reporting

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support & Contact

- **Issues**: Report bugs and request features via GitHub Issues
- **Documentation**: See [Frontend Documentation](MedChain/frontend/MedChain_Frontend_Documentation.md)
- **Email**: your.email@example.com

## Quick Commands Reference

| Command | Description |
|---------|-------------|
| `npm start` | Start backend server |
| `npm run compile` | Compile Solidity contracts |
| `npm run deploy` | Deploy contracts to network |
| `npm run test` | Run contract tests |
| `npm run dev` (frontend) | Start frontend dev server |
| `npm run build` (frontend) | Build for production |

---

**Built with ❤️ for transparent and secure medicine supply chains**
