require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns').promises;

async function testConnection() {
  console.log('\n🔍 MongoDB Atlas Connection Diagnostics\n');
  
  const mongoUri = process.env.MONGODB_URI;
  console.log('1. Connection String (with password hidden):');
  const hiddenUri = mongoUri.replace(/:[^:]+@/, ':****@');
  console.log(`   ${hiddenUri}\n`);
  
  console.log('2. Testing DNS Resolution...');
  try {
    const records = await dns.resolveSrv('_mongodb._tcp.cluster0.f5erfcf.mongodb.net');
    console.log('   ✓ DNS SRV records found:', records.length, 'records');
    records.slice(0, 2).forEach(r => {
      console.log(`     - ${r.name}:${r.port}`);
    });
  } catch (err) {
    console.log('   ✗ DNS SRV lookup failed:', err.code);
    console.log('   This usually means: IP not whitelisted OR network issue');
  }
  
  console.log('\n3. Testing Basic DNS Resolution...');
  try {
    const ips = await dns.resolve4('cluster0.f5erfcf.mongodb.net');
    console.log('   ✓ Hostname resolves to:', ips.join(', '));
  } catch (err) {
    console.log('   ✗ DNS resolution failed:', err.code);
  }
  
  console.log('\n4. Testing MongoDB Connection...');
  console.log('   Attempting connection (timeout: 10 seconds)...');
  
  try {
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });
    
    console.log('   ✓ Successfully connected to MongoDB Atlas!');
    console.log(`   Database: ${connection.connection.name}`);
    console.log(`   Host: ${connection.connection.host}`);
    
    await mongoose.disconnect();
    console.log('   ✓ Disconnected successfully\n');
    console.log('✅ All tests passed! Your connection is working.');
    
  } catch (err) {
    console.log('   ✗ Connection failed:', err.message);
    console.log('\n📋 Troubleshooting Steps:');
    console.log('   1. ✅ Go to MongoDB Atlas → Your Cluster');
    console.log('   2. ✅ Click "Network Access" (or "Security" → "Network Access")');
    console.log('   3. ✅ Click "Add IP Address"');
    console.log('   4. ✅ Add your IP or use 0.0.0.0/0 for testing');
    console.log('   5. ✅ Click "Confirm"');
    console.log('   6. ✅ Wait 1-2 minutes for the rule to apply');
    console.log('   7. ✅ Run this test again\n');
    
    console.log('Alternative: Check your connection string format:');
    console.log('   mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority\n');
  }
}

testConnection().catch(console.error);
