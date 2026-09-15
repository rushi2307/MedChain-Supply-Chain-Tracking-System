require('dotenv').config();

const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}/api`;
const seedManufacturer = process.env.SEED_MANUFACTURER || 'seed-manufacturer@medchain.local';

const records = [
  { name: 'Aurexil 250', batchNumber: 'SEED-AUREXIL-250', chemicalComponents: 'Amoxicillin trihydrate', dosage: '250mg', price: 12.5, quantity: 120, storageConditions: 'Store below 25C', description: 'Seed antibiotic record' },
  { name: 'Cardiovex 10', batchNumber: 'SEED-CARDIOVEX-010', chemicalComponents: 'Atorvastatin calcium', dosage: '10mg', price: 8.75, quantity: 80, storageConditions: 'Keep dry', description: 'Seed cardiovascular record' },
  { name: 'Neurocalm 5', batchNumber: 'SEED-NEUROCALM-005', chemicalComponents: 'Escitalopram oxalate', dosage: '5mg', price: 16.25, quantity: 60, storageConditions: 'Protect from light', description: 'Seed neurology record' }
];

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${path} ${response.status}: ${body.error || 'request failed'}`);
  return body;
}

async function main() {
  const existing = await request('/medicines');
  const existingBatches = new Set(existing.map((medicine) => medicine.batchNumber));
  const created = [];

  for (const record of records) {
    if (existingBatches.has(record.batchNumber)) {
      console.log(`[seed] skipped existing batch=${record.batchNumber}`);
      continue;
    }
    const payload = {
      ...record,
      blockchainId: `seed-${record.batchNumber.toLowerCase()}`,
      qrCodeData: JSON.stringify({ source: 'medchain-seed', batch: record.batchNumber }),
      manufacturer: seedManufacturer,
      manufacturingDate: '2026-09-01',
      expiryDate: '2027-09-01',
      status: 'Manufactured'
    };
    const result = await request('/medicines/register', { method: 'POST', body: JSON.stringify(payload) });
    created.push(result.medicine);
    console.log(`[seed] created batch=${record.batchNumber} tx=${result.medicine.blockchainTransactionHash}`);
  }

  console.log(`[seed] complete total=${records.length} created=${created.length} existing=${records.length - created.length}`);
}

main().catch((error) => {
  console.error(`[seed] failed: ${error.message}`);
  process.exitCode = 1;
});
