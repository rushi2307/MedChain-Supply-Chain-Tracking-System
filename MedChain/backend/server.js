

require('dotenv').config();
const express = require('express')
const cors = require('cors')
const medicineRoutes = require('./routes/medicine')
const { connectDB } = require('./config/db')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
app.use('/api/medicines', medicineRoutes)

connectDB()
  .then(() => {
    console.log('✓ Connected to MongoDB Atlas successfully')
  })
  .catch(err => {
    console.error('✗ MongoDB connection error:', err.message)
    console.error('Make sure:')
    console.error('  1. MongoDB Atlas cluster is running')
    console.error('  2. MONGODB_URI in .env is correct')
    console.error('  3. IP address is whitelisted in MongoDB Atlas')
    console.error('  4. Database credentials are correct')
    process.exit(1)
  })

app.get('/', (req, res) => {
  res.json({ message: 'MedChain API is running' })
})

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`)
})