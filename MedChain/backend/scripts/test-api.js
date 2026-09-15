require('dotenv').config();

const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}/api`;
const suffix = Date.now();
const batchNumber = `TEST-E2E-${suffix}`;
let passed = 0;

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${path} ${response.status}: ${body.error || 'request failed'}`);
  return body;
}

async function check(name, action) {
  try {
    const value = await action();
    passed += 1;
    console.log(`[api-test] PASS ${name}`);
    return value;
  } catch (error) {
    console.error(`[api-test] FAIL ${name}: ${error.message}`);
    throw error;
  }
}

async function main() {
  await check('health endpoint', async () => {
    const response = await fetch('http://localhost:5000/');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  });
  const listBefore = await check('list medicines', () => request('/medicines'));
  if (!Array.isArray(listBefore)) throw new Error('list response is not an array');

  const created = await check('register medicine', () => request('/medicines/register', {
    method: 'POST',
    body: JSON.stringify({
      blockchainId: `test-${suffix}`,
      name: 'End-to-End Test Medicine',
      batchNumber,
      qrCodeData: JSON.stringify({ batchNumber, test: true }),
      manufacturer: 'e2e-test@medchain.local',
      manufacturingDate: '2026-09-13',
      expiryDate: '2027-09-13',
      chemicalComponents: 'Test compound',
      description: 'Temporary integration test record',
      storageConditions: 'Cool and dry',
      dosage: '10mg',
      price: 4.5,
      quantity: 10,
      status: 'Manufactured'
    })
  }));
  const id = created.medicine._id;
  if (!created.medicine.blockchainTransactionHash) throw new Error('missing blockchain transaction hash');

  await check('read medicine by id', async () => {
    const medicine = await request(`/medicines/${id}`);
    if (medicine._id !== id) throw new Error('returned wrong medicine');
  });
  await check('read blockchain comparison', async () => {
    const result = await request(`/medicines/${id}/blockchain`);
    if (!result.blockchain || result.blockchain.status !== 'Manufactured') throw new Error('blockchain record mismatch');
  });
  await check('update medicine and blockchain status', async () => {
    const result = await request(`/medicines/${id}`, { method: 'PUT', body: JSON.stringify({ description: 'Updated by integration test', status: 'Stored' }) });
    if (result.medicine.status !== 'Stored') throw new Error('database status was not updated');
  });
  await check('read blockchain history', async () => {
    const result = await request(`/medicines/${id}/history`);
    if (!Array.isArray(result.history) || result.history.length < 2) throw new Error('expected registration and status events');
  });
  await check('place order', async () => {
    const result = await request('/medicines/order', { method: 'POST', body: JSON.stringify({ medicineId: id, distributor: 'e2e-distributor@medchain.local', quantity: 2 }) });
    if (result.medicine.quantity !== 8) throw new Error(`expected quantity 8, received ${result.medicine.quantity}`);
  });
  await check('delete medicine and recall on chain', async () => {
    const result = await request(`/medicines/${id}`, { method: 'DELETE' });
    if (!result.message.includes('Recalled')) throw new Error('delete did not confirm on-chain recall');
  });
  await check('confirm database deletion', async () => {
    const response = await fetch(`${API_URL}/medicines/${id}`);
    if (response.status !== 404) throw new Error(`expected 404, received ${response.status}`);
  });

  console.log(`[api-test] COMPLETE passed=${passed}`);
}

main().catch(() => { process.exitCode = 1; });
