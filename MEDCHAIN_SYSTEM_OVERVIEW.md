# MedChain System Overview

## 1. What Is MedChain?

MedChain is a medicine supply-chain traceability application. It connects manufacturers, distributors, retailers, consumers, administrators, MongoDB, and an Ethereum-compatible blockchain workflow in one system.

The system gives every medicine batch a digital identity and records important events such as:

- Medicine registration
- Manufacturing information
- Batch and expiry details
- Distribution orders
- Inventory handoffs
- Storage acceptance
- Current medicine status
- QR-based identity verification
- Transaction hash and block information

The goal is to make the journey of a medicine visible from production to the patient.

## 2. What Problem Does It Solve?

Medicine supply chains often involve many separate parties and systems. This creates several risks:

- A medicine's origin may be difficult to verify.
- Batch and expiry information may be incomplete or inconsistent.
- Supply-chain handoffs may not be visible to every authorized participant.
- Counterfeit products can enter the distribution chain.
- Records can be changed without a clear audit trail.
- Consumers may not know whether a medicine is genuine.
- Administrators may not have one place to monitor orders and stock.

MedChain addresses these problems by combining:

1. A role-based operational application.
2. MongoDB for application records and searchable inventory.
3. QR codes for medicine identity lookup.
4. Ethereum-compatible transaction records for tamper-evident supply-chain events.
5. A blockchain feed that shows transaction hashes, blocks, confirmations, and network mode.

## 3. Main Project Purpose

The main purpose is to provide a trusted chain of custody for medicine batches.

A manufacturer registers a batch. A distributor or retailer orders it. An administrator accepts the incoming order. A consumer or retailer can search or scan the medicine identity. Each important step is associated with a transaction record.

The application is designed as a working academic/demo system. It demonstrates how blockchain can support medicine provenance and supply-chain accountability.

## 4. High-Level Architecture

```text
User browser
    |
    | React frontend
    v
Express backend API
    |
    +--> MongoDB
    |      Medicine, order, inventory, and transaction metadata
    |
    +--> Blockchain service
           Local demo receipts OR Ethereum/Sepolia contract transactions
```

### Frontend

The frontend is a React and Vite application. It provides:

- Home page
- Authentication screens
- Role-based dashboards
- Medicine registration
- Inventory and ordering
- QR scanning
- Consumer search
- Super Admin controls
- Blockchain transaction feed

### Backend

The backend is an Express application. It provides:

- Medicine registration API
- Medicine listing and lookup
- Order creation
- Status updates
- Blockchain comparison and history endpoints
- Transaction feed endpoint
- MongoDB persistence
- Blockchain service integration

### Database

MongoDB stores the application record for each medicine. A medicine record includes fields such as:

- Medicine name
- Batch number
- Manufacturer
- Manufacturing date
- Expiry date
- Chemical components
- Quantity
- Distributor
- Retailer
- Order date
- Current operational status
- Blockchain transaction hash
- Blockchain block number
- Blockchain network

MongoDB is used for fast application queries and operational state. The blockchain transaction metadata connects the database record to the blockchain workflow.

## 5. Which Blockchain Is Used?

The project is designed for Ethereum-compatible networks using the `ethers` library and a Solidity smart contract called `MedicineChain`.

The supported modes are:

### Local demo mode

Local demo mode is intended for current development and presentations. It does not broadcast real transactions to Ethereum. Instead, the backend:

- Creates a fake Ethereum-style transaction hash.
- Creates a local demo block number.
- Marks the transaction as confirmed for the demo.
- Saves the hash and block number in MongoDB.
- Shows the network as `Local Demo Ethereum` in the UI.

This mode is useful because it does not require:

- An RPC provider
- A wallet private key
- Gas fees
- Sepolia ETH
- A deployed public contract

Enable it with:

```env
NETWORK=local-demo
DEMO_MODE=true
CONTRACT_ADDRESS=demo-local-contract
```

### Local Hardhat mode

A local Hardhat node can be used when a real local EVM blockchain is desired. In that setup, the application uses an actual local blockchain process rather than fake database receipts.

Typical values are:

```env
NETWORK=localhost
LOCALHOST_URL=http://127.0.0.1:8545
```

The contract must be deployed locally and its address must be placed in `CONTRACT_ADDRESS`.

### Sepolia mode

Sepolia is the public Ethereum test network. It is appropriate when the project needs real public testnet transactions.

Sepolia requires:

- An Ethereum Sepolia RPC URL.
- A valid Ethereum wallet private key.
- Sepolia ETH for gas.
- A deployed `MedicineChain` contract address.

Example configuration:

```env
NETWORK=sepolia
DEMO_MODE=false
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=0xYOUR_64_HEX_CHARACTER_PRIVATE_KEY
CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
```

The current repository should be treated as demo/local until these values are correctly configured. A Solana RPC URL, an Alchemy API key used as a private key, or an empty contract address will not work with the Ethereum service.

## 6. Why Use Blockchain?

Blockchain is used for the audit and provenance layer.

### Shared record

Different supply-chain participants can refer to the same event history instead of relying only on separate private spreadsheets or databases.

### Tamper evidence

Once a real transaction is included in a blockchain, changing the historical record becomes difficult and detectable.

### Traceability

A batch can be associated with registration, status changes, transfers, and supply-chain events.

### Verification

A transaction hash can be used to verify whether an event was written to the configured blockchain network.

### Accountability

The system can show which actor or wallet submitted a blockchain event when real contract mode is enabled.

### Important limitation

Blockchain does not automatically prove that physical medicine data is truthful. If a user enters incorrect information, the blockchain preserves the entered record, not the physical truth. Human controls, authorization, audits, and trusted data collection are still necessary.

## 7. Login Panels and Their Purpose

The home page provides these entry points:

- Manufacturer
- Distributor
- Retailer
- Consumer
- Super Admin
- Create account

Each role sees a different workspace after login.

## 8. Manufacturer Panel

### Purpose

The Manufacturer panel is used to create the first trusted digital identity for a medicine batch.

### Main features

#### Register medicine

The manufacturer enters:

- Medicine name
- Batch number
- Manufacturing date
- Expiry date
- Chemical components
- Description
- Storage conditions
- Dosage
- Price
- Quantity

The backend validates the required fields and date order.

#### Generate QR identity

After successful registration, the application creates QR data for the medicine. The QR code can later be scanned by a retailer or consumer.

#### View inventory

The manufacturer can see registered medicine records and their quantities.

#### Blockchain transaction

In demo mode, registration receives a fake transaction hash and block number. In real blockchain mode, the backend calls `registerMedicine` on the `MedicineChain` contract and waits for the transaction receipt.

### Manufacturer flow

```text
Manufacturer login
    -> enter medicine details
    -> submit registration
    -> save MongoDB record
    -> create blockchain/demo receipt
    -> generate QR identity
    -> medicine becomes available to the network
```

## 9. Distributor Panel

### Purpose

The Distributor panel manages upstream medicine orders and distributor inventory.

### Main features

#### Available stock

Displays medicines that can be ordered from the upstream network.

#### Place order

The distributor chooses a medicine and quantity. The backend checks available quantity before creating the order.

#### My orders

Shows orders associated with the distributor's account.

#### My inventory

Shows stock assigned to the distributor.

#### Order status

A successful order changes the medicine status to:

```text
InTransit
```

A transaction/demo receipt is associated with the order.

### Distributor flow

```text
Distributor login
    -> browse available stock
    -> select medicine
    -> enter quantity
    -> place order
    -> quantity decreases
    -> status becomes InTransit
    -> transaction metadata is saved
```

## 10. Retailer Panel

### Purpose

The Retailer panel represents the final commercial inventory point before the medicine reaches the consumer.

### Main features

#### Available stock

Allows the retailer to find upstream medicine stock.

#### Place order

Creates a retailer order and associates it with the retailer account.

#### Store inventory

Shows medicine assigned to the retailer's store.

#### My orders

Shows retailer-specific orders.

#### Verify QR

Uses the device camera and QR scanner to inspect the identity data attached to a medicine batch.

### Retailer flow

```text
Retailer login
    -> place order
    -> receive medicine into store workflow
    -> review store inventory
    -> scan QR code
    -> compare identity and batch information
```

## 11. Consumer Panel

### Purpose

The Consumer panel gives patients and end users a simple way to search and inspect medicine provenance.

### Main features

#### Search network

Searches medicines by:

- Medicine name
- Batch number

#### Medicine details

Displays available medicine identity and operational information.

#### Verify with QR

Allows the consumer to scan a QR identity before using or purchasing a medicine.

### Consumer flow

```text
Consumer login
    -> search medicine or batch
    -> open medicine record
    -> inspect manufacturer, expiry, and status
    -> scan QR code when available
```

## 12. Super Admin Panel

### Purpose

The Super Admin panel is the operational control center. It is intended for monitoring, accepting orders, maintaining records, and managing local application accounts.

### Main features

#### Order approvals

Lists incoming orders waiting for acceptance. The admin can accept an `InTransit` order and change it to `Stored`.

Expected status transition:

```text
InTransit -> Stored
```

In local demo mode, the acceptance creates and stores a fake confirmed transaction. In real blockchain mode, it submits an on-chain status update.

#### Medicine records

Allows the admin to inspect and update medicine records.

#### User directory

Allows the admin to:

- View local accounts.
- Change a user's role.
- Reset a user's password.

Passwords are stored as salted PBKDF2-SHA-256 hashes in browser local storage.

#### Operational statistics

The panel shows values such as:

- Registered medicines
- Orders awaiting acceptance
- Known local accounts

### Super Admin flow

```text
Super Admin login
    -> review pending orders
    -> accept an InTransit order
    -> status becomes Stored
    -> create demo or real blockchain receipt
    -> review users and medicine records
```

## 13. Authentication

The current frontend authentication is a local demo authentication system.

### Default credentials

```text
Super Admin username: sadmin
Super Admin password: 123456
```

New browser accounts are created with the requested demo password `123456`.

### Password storage

The frontend uses the browser Web Crypto API with:

- PBKDF2
- SHA-256
- 120,000 iterations
- Random salt for user accounts

The plain password is not stored in `localStorage`.

### Production limitation

For production, authentication should move to a backend identity service with secure sessions or tokens, server-side password hashing, account recovery, rate limiting, audit logging, and access control enforced by the backend. Browser-only role checks are suitable for a demo but are not sufficient for production security.

## 14. Smart Contract Overview

The Solidity contract is `MedicineChain.sol`.

### Medicine record

The contract stores:

- Name
- Manufacturer
- Manufacturing date
- Expiry date
- Batch number
- Current location
- Current owner
- Status
- Registration flag

### Supply-chain history

Each medicine can have a history of events containing:

- Action
- Location
- Description
- Timestamp
- Actor address

### Contract operations

The contract supports:

- Registering a medicine.
- Transferring medicine ownership.
- Updating medicine status.
- Recording a supply-chain event.
- Reading medicine details.
- Reading history length and history entries.
- Checking expiry.
- Authorizing manufacturers.
- Authorizing distributors.

### Contract statuses

```text
Manufactured
InTransit
Stored
Sold
Expired
Recalled
```

### Contract events

The contract emits events for:

- Medicine registration
- Medicine transfer
- Status changes
- Supply-chain events
- Authorization changes

## 15. Complete System Walkthrough

The normal end-to-end flow is:

```text
1. Manufacturer creates a medicine batch.
2. Backend validates and stores the record.
3. Blockchain service creates a local demo receipt or real blockchain receipt.
4. QR identity is generated.
5. Distributor or retailer browses available stock.
6. Distributor or retailer places an order.
7. Quantity is reduced and status becomes InTransit.
8. Super Admin reviews and accepts the order.
9. Status becomes Stored.
10. Retailer verifies the QR identity.
11. Consumer searches or scans the medicine.
12. Admin and users review the transaction feed and chain-of-custody data.
```

## 16. Transaction Feed

The home page transaction panel shows recent records.

In local demo mode it displays:

- `Local Demo Ethereum`
- Chain ID `31337`
- Fake transaction hash
- Demo block number
- Demo confirmation count
- `Confirmed` demo status

In real Sepolia mode it should display:

- `Ethereum sepolia`
- Chain ID `11155111`
- Real transaction hash
- Real block number
- Real confirmations
- Etherscan transaction link

The list is internally scrollable so a growing transaction history does not make the entire home page unusable.

## 17. API Responsibilities

Important backend endpoints include:

```text
GET  /                         Backend health check
GET  /api/medicines            List medicine records
POST /api/medicines/register   Register medicine
POST /api/medicines/order      Place distributor or retailer order
PUT  /api/medicines/:id        Update medicine/status
GET  /api/medicines/:id        Get one medicine
GET  /api/medicines/:id/history
GET  /api/medicines/:id/blockchain
GET  /api/medicines/transactions/feed
```

## 18. What the Project Demonstrates

MedChain demonstrates:

- Role-based medicine supply-chain workflows.
- Batch-level traceability.
- QR identity verification.
- MongoDB-backed operational data.
- Ethereum-compatible smart-contract design.
- Transaction metadata and audit visibility.
- Local blockchain simulation for development.
- A path toward public Sepolia deployment.

## 19. What It Does Not Yet Guarantee

This project is a demonstration system and does not by itself guarantee:

- That a physical medicine is genuine.
- That a user-entered manufacturer identity is legitimate.
- That browser-local accounts are production-secure.
- That demo hashes exist on public Ethereum.
- That every physical warehouse event was independently witnessed.
- That the application is ready for regulated healthcare production use.

A production deployment would require stronger identity, backend authorization, secure secrets, audited contracts, regulated data handling, monitoring, backups, and verified integrations with real supply-chain systems.

## 20. One-Sentence Summary

MedChain is a role-based medicine traceability platform that uses MongoDB for operational records, QR codes for batch verification, and a local-demo or Ethereum-compatible blockchain layer for auditable supply-chain transaction history.
