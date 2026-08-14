const mongoose = require('mongoose')

const medicineSchema = new mongoose.Schema({
  blockchainId: {
    type: String,
    required: true,
    unique: true
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