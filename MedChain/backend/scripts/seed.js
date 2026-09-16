require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');

const records = [
  { name: 'Aurexil 250', batchNumber: 'SEED-AUREXIL-250', chemicalComponents: 'Amoxicillin trihydrate', dosage: '250mg', price: 12.5, quantity: 120, storageConditions: 'Store below 25C', description: 'Broad-spectrum antibiotic', status: 'Manufactured' },
  { name: 'Cardiovex 10', batchNumber: 'SEED-CARDIOVEX-010', chemicalComponents: 'Atorvastatin calcium', dosage: '10mg', price: 8.75, quantity: 80, storageConditions: 'Keep dry', description: 'Cholesterol management medicine', status: 'Stored' },
  { name: 'Neurocalm 5', batchNumber: 'SEED-NEUROCALM-005', chemicalComponents: 'Escitalopram oxalate', dosage: '5mg', price: 16.25, quantity: 60, storageConditions: 'Protect from light', description: 'Prescribed neurological medicine', status: 'InTransit' },
  { name: 'Glucozen 500', batchNumber: 'SEED-GLUCOZEN-500', chemicalComponents: 'Metformin hydrochloride', dosage: '500mg', price: 6.4, quantity: 200, storageConditions: 'Store at room temperature', description: 'Type 2 diabetes medicine', status: 'Manufactured' },
  { name: 'Respira 100', batchNumber: 'SEED-RESPIRA-100', chemicalComponents: 'Salbutamol sulfate', dosage: '100mcg', price: 11.9, quantity: 45, storageConditions: 'Keep away from heat', description: 'Relief inhaler', status: 'Sold' },
  { name: 'Dermacare 20', batchNumber: 'SEED-DERMACARE-020', chemicalComponents: 'Omeprazole', dosage: '20mg', price: 9.3, quantity: 95, storageConditions: 'Protect from moisture', description: 'Gastrointestinal treatment', status: 'Manufactured' }
];

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medchain';
  await mongoose.connect(uri);
  await mongoose.connection.dropDatabase();
  const manufacturer = process.env.SEED_MANUFACTURER || 'manufacturer@medchain.local';
  const medicines = records.map((record, index) => ({
    ...record,
    blockchainId: `seed-${record.batchNumber.toLowerCase()}`,
    blockchainTransactionHash: `0x${crypto.createHash('sha256').update(record.batchNumber).digest('hex')}`,
    blockchainBlockNumber: 1000 + index,
    blockchainNetwork: process.env.NETWORK || 'local-demo',
    qrCodeData: JSON.stringify({ source: 'medchain-seed', batch: record.batchNumber }),
    manufacturer,
    manufacturingDate: new Date('2026-09-01'),
    expiryDate: new Date('2027-09-01')
  }));
  await Medicine.insertMany(medicines);
  console.log(`[seed] reset database and inserted ${medicines.length} medicines`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(`[seed] failed: ${error.message}`);
  process.exitCode = 1;
});
