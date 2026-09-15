const mongoose = require('mongoose')

const medicineSchema = new mongoose.Schema({
  blockchainId: {
    type: String,
    required: true,
    unique: true
  },
  blockchainTransactionHash: {
    type: String,
    required: true,
    unique: true
  },
  blockchainBlockNumber: {
    type: Number,
    required: true
  },
  blockchainNetwork: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  batchNumber: {
    type: String,
    required: true
  },
  qrCodeData: {
    type: String,
    required: true
  },
  manufacturer: {
    type: String,
    required: true
  },
  manufacturingDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  chemicalComponents: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  storageConditions: {
    type: String,
    default: ''
  },
  dosage: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    default: 0
  },
  quantity: {
    type: Number,
    default: 0
  },
  distributor: {
    type: String,
    default: ''
  },
  retailer: {
    type: String,
    default: ''
  },
  orderDate: {
    type: Date
  },
  orderedQuantity: {
    type: Number
  },
  status: {
    type: String,
    enum: ['Manufactured', 'InTransit', 'Stored', 'Sold', 'Expired', 'Recalled'],
    default: 'Manufactured'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Medicine', medicineSchema)