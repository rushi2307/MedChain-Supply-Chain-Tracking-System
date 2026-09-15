const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const blockchain = require('../services/blockchain');
const logger = require('../utils/logger');

const statusValues = ['Manufactured', 'InTransit', 'Stored', 'Sold', 'Expired', 'Recalled'];
const statusNumbers = Object.fromEntries(statusValues.map((value, index) => [value, index]));
const editableFields = ['name', 'batchNumber', 'qrCodeData', 'manufacturingDate', 'expiryDate', 'chemicalComponents', 'description', 'storageConditions', 'dosage', 'price', 'quantity', 'status'];

function sendError(res, error, fallback = 'Request failed') {
  logger.error('api.failure', { error: error.message, code: error.code });
  if (error.code === 11000) return res.status(409).json({ error: 'A medicine with that unique identity already exists' });
  if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
  return res.status(500).json({ error: fallback });
}

router.post('/register', async (req, res) => {
  try {
    const { blockchainId, name, batchNumber, qrCodeData, manufacturer, manufacturingDate, expiryDate, chemicalComponents, description, storageConditions, dosage, price, quantity, status } = req.body;
    if (!blockchainId || !name || !manufacturer || !batchNumber || !manufacturingDate || !expiryDate || !chemicalComponents || !qrCodeData) {
      return res.status(400).json({ error: 'Blockchain ID, name, manufacturer, batch number, dates, chemical components, and QR data are required' });
    }
    if (new Date(manufacturingDate) >= new Date(expiryDate)) return res.status(400).json({ error: 'Manufacturing date must be before expiry date' });
    if (await Medicine.exists({ $or: [{ blockchainId }, { batchNumber }] })) return res.status(409).json({ error: 'A medicine with that blockchain ID or batch already exists' });

    logger.info('medicine.registration_started', { blockchainId, batchNumber, manufacturer });
    const blockchainResult = await blockchain.registerMedicine({ name, manufacturer, manufacturingDate, expiryDate, batchNumber, currentLocation: storageConditions || 'Not specified' });
    if (!blockchainResult.success) {
      logger.error('medicine.blockchain_registration_failed', { batchNumber, error: blockchainResult.error });
      return res.status(503).json({ error: 'Medicine was not registered because the blockchain transaction failed', details: blockchainResult.error });
    }

    const medicine = await Medicine.create({ blockchainId, blockchainTransactionHash: blockchainResult.transactionHash, blockchainBlockNumber: blockchainResult.blockNumber, blockchainNetwork: process.env.NETWORK || 'localhost', name, batchNumber, qrCodeData, manufacturer, manufacturingDate, expiryDate, chemicalComponents, description, storageConditions, dosage, price, quantity, status });
    logger.info('medicine.registered', { id: medicine._id, batchNumber, transactionHash: blockchainResult.transactionHash });
    res.status(201).json({ message: 'Medicine registered successfully', medicine });
  } catch (error) {
    sendError(res, error, 'Failed to register medicine');
  }
});

router.get('/', async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ createdAt: -1 });
    logger.info('medicine.listed', { count: medicines.length });
    res.json(medicines);
  } catch (error) { sendError(res, error, 'Failed to fetch medicines'); }
});

router.get('/:id/history', async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
    const result = await blockchain.getMedicineHistory(medicine.batchNumber);
    if (!result.success) return res.status(503).json({ error: result.error });
    res.json({ batchNumber: medicine.batchNumber, history: result.history });
  } catch (error) { sendError(res, error, 'Failed to fetch blockchain history'); }
});

router.get('/:id/blockchain', async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
    const result = await blockchain.getMedicine(medicine.batchNumber);
    if (!result.success) return res.status(503).json({ error: result.error });
    res.json({ database: medicine, blockchain: result.data });
  } catch (error) { sendError(res, error, 'Failed to compare database and blockchain records'); }
});

router.get('/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
    res.json(medicine);
  } catch (error) { sendError(res, error, 'Failed to fetch medicine'); }
});

router.put('/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => editableFields.includes(key)));
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No editable fields provided' });
    if (updates.status && !statusValues.includes(updates.status)) return res.status(400).json({ error: `Status must be one of: ${statusValues.join(', ')}` });
    if (updates.manufacturingDate && updates.expiryDate && new Date(updates.manufacturingDate) >= new Date(updates.expiryDate)) return res.status(400).json({ error: 'Manufacturing date must be before expiry date' });

    if (updates.status && updates.status !== medicine.status) {
      const chainResult = await blockchain.updateStatus(medicine.batchNumber, statusNumbers[updates.status]);
      if (!chainResult.success) return res.status(503).json({ error: 'Blockchain status update failed', details: chainResult.error });
      updates.blockchainTransactionHash = chainResult.transactionHash;
      updates.blockchainBlockNumber = chainResult.blockNumber;
    }
    Object.assign(medicine, updates);
    await medicine.save();
    logger.info('medicine.updated', { id: medicine._id, fields: Object.keys(updates), batchNumber: medicine.batchNumber });
    res.json({ message: 'Medicine updated successfully', medicine });
  } catch (error) { sendError(res, error, 'Failed to update medicine'); }
});

router.delete('/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
    const chainResult = await blockchain.updateStatus(medicine.batchNumber, statusNumbers.Recalled);
    if (!chainResult.success) return res.status(503).json({ error: 'Medicine was not deleted because the blockchain recall failed', details: chainResult.error });
    await medicine.deleteOne();
    logger.warn('medicine.deleted', { id: medicine._id, batchNumber: medicine.batchNumber, transactionHash: chainResult.transactionHash });
    res.json({ message: 'Medicine deleted from the database and marked Recalled on the blockchain' });
  } catch (error) { sendError(res, error, 'Failed to delete medicine'); }
});

router.post('/order', async (req, res) => {
  try {
    const { medicineId, distributor, retailer, quantity, orderDate } = req.body;
    const requestedQuantity = Number(quantity);
    const orderedBy = distributor || retailer;
    if (!medicineId || !orderedBy || !Number.isInteger(requestedQuantity) || requestedQuantity <= 0) return res.status(400).json({ error: 'Medicine, distributor/retailer, and a positive quantity are required' });
    const setPayload = { orderDate: orderDate || new Date(), orderedQuantity: requestedQuantity, status: 'InTransit' };
    if (distributor) setPayload.distributor = distributor;
    if (retailer) setPayload.retailer = retailer;
    const medicine = await Medicine.findOneAndUpdate({ _id: medicineId, quantity: { $gte: requestedQuantity } }, { $inc: { quantity: -requestedQuantity }, $set: setPayload }, { new: true, runValidators: true });
    if (!medicine) return res.status(404).json({ error: 'Medicine not found or insufficient stock' });
    const chainResult = await blockchain.updateStatus(medicine.batchNumber, statusNumbers.InTransit);
    if (!chainResult.success) logger.warn('order.blockchain_status_failed', { medicineId, error: chainResult.error });
    logger.info('medicine.order_placed', { medicineId, orderedBy, quantity: requestedQuantity, transactionHash: chainResult.transactionHash });
    res.status(201).json({ message: 'Order placed successfully', medicine });
  } catch (error) { sendError(res, error, 'Failed to place order'); }
});

module.exports = router;
