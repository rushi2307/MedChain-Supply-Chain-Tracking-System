const express = require('express')
const router = express.Router()
const Medicine = require('../models/Medicine')

router.post('/register', async (req, res) => {
  try {
    const { 
      blockchainId, 
      name, 
      batchNumber, 
      qrCodeData, 
      manufacturer,
      manufacturingDate,
      expiryDate,
      chemicalComponents,
      description,
      storageConditions,
      dosage,
      price,
      quantity,
      status
    } = req.body
    
    const medicine = new Medicine({
      blockchainId,
      name,
      batchNumber,
      qrCodeData,
      manufacturer,
      manufacturingDate,
      expiryDate,
      chemicalComponents,
      description,
      storageConditions,
      dosage,
      price,
      quantity,
      status
    })
    
    await medicine.save()
    res.status(201).json({ message: 'Medicine registered successfully', medicine })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Failed to register medicine' })
  }
})

router.get('/', async (req, res) => {
  try {
    const medicines = await Medicine.find()
    res.json(medicines)
  } catch (error) {
    console.error('Fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch medicines' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findOne({ blockchainId: req.params.id })
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' })
    }
    res.json(medicine)
  } catch (error) {
    console.error('Fetch by ID error:', error)
    res.status(500).json({ error: 'Failed to fetch medicine' })
  }
})

module.exports = router