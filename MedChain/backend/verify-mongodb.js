require('dotenv').config();
const mongoose = require('mongoose');

async function testMongoDB() {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...\n');
    
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });
    
    console.log('✅ SUCCESS! MongoDB Atlas is connected!\n');
    console.log('📊 Connection Details:');
    console.log(`   Database: ${connection.connection.name}`);
    console.log(`   Host: ${connection.connection.host}`);
    console.log(`   Port: ${connection.connection.port}`);
    console.log(`   State: ${connection.connection.readyState === 1 ? 'Connected' : 'Not Connected'}\n`);
    
    await mongoose.disconnect();
    console.log('✅ Disconnected successfully\n');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Connection Failed:', error.message);
    console.error('\n⚠️ Actions to try:');
    console.error('   1. Did you whitelist IP 106.216.242.198 in MongoDB Atlas?');
    console.error('   2. Wait 2-3 minutes after whitelisting');
    console.error('   3. Check if credentials are correct in .env');
    console.error('   4. Verify database name matches in connection string');
    process.exit(1);
  }
}

testMongoDB();
