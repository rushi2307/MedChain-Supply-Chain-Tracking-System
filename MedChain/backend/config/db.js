const mongoose = require('mongoose')

function connectDB(uri) {
  const MONGO_URI = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/medchain'
  
  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }
  
  return mongoose.connect(MONGO_URI, options)
}

module.exports = { connectDB };