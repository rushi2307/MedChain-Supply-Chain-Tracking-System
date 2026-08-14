require('dotenv').config();
const mongoose = require('mongoose');
const net = require('net');

async function testTCP(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve({ reachable: false, error: 'Timeout' });
    }, 3000);
    
    socket.connect(port, host, () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve({ reachable: true });
    });
    
    socket.on('error', (err) => {
      clearTimeout(timeout);
      resolve({ reachable: false, error: err.code });
    });
  });
}

async function advancedDiagnostics() {
  console.log('\n🔍 ADVANCED MongoDB Atlas Diagnostics\n');
  
  const mongoUri = process.env.MONGODB_URI;
  console.log('📌 Connection String (hidden):', mongoUri.replace(/:[^:]+@/, ':****@'));
  
  console.log('\n🌐 Testing TCP Connectivity to MongoDB Shards...');
  const shards = [
    { name: 'ac-iawd3we-shard-00-00.f5erfcf.mongodb.net', port: 27017 },
    { name: 'ac-iawd3we-shard-00-01.f5erfcf.mongodb.net', port: 27017 },
    { name: 'ac-iawd3we-shard-00-02.f5erfcf.mongodb.net', port: 27017 }
  ];
  
  for (const shard of shards) {
    const result = await testTCP(shard.name, shard.port);
    const status = result.reachable ? '✓' : '✗';
    const error = result.error ? ` (${result.error})` : '';
    console.log(`   ${status} ${shard.name}:${shard.port}${error}`);
  }
  
  console.log('\n🔄 Attempting direct connection...');
  try {
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });
    
    console.log('✅ SUCCESS! Connected to MongoDB Atlas!');
    console.log(`   Database: ${connection.connection.name}`);
    console.log(`   Host: ${connection.connection.host}`);
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.log('❌ Connection Failed:', error.message);
    
    console.log('\n📋 Troubleshooting Guide:\n');
    
    if (error.message.includes('querySrv')) {
      console.log('🔴 ISSUE: SRV DNS resolution failed');
      console.log('   Possible Causes:');
      console.log('   1. ⚠️ IP NOT WHITELISTED in MongoDB Atlas');
      console.log('   2. 🔒 Firewall/Network blocking MongoDB (port 27017)');
      console.log('   3. 🌐 DNS server not resolving SRV records\n');
      
      console.log('✅ SOLUTION STEPS:\n');
      console.log('   Step 1: Go to https://account.mongodb.com');
      console.log('   Step 2: Click your Cluster0 → Network Access');
      console.log('   Step 3: Click "+ ADD IP ADDRESS"');
      console.log('   Step 4: Enter IP: 106.216.242.198');
      console.log('   Step 5: Click "Confirm"');
      console.log('   Step 6: Wait 2-3 minutes');
      console.log('   Step 7: Run this script again\n');
      
      console.log('   🆘 If still failing:');
      console.log('   - Check if your network/firewall blocks MongoDB');
      console.log('   - Try using VPN to bypass network restrictions');
      console.log('   - Contact your network administrator\n');
      
    } else if (error.message.includes('authentication')) {
      console.log('🔴 ISSUE: Authentication failed');
      console.log('   ✅ Check username/password in .env\n');
      
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('🔴 ISSUE: DNS hostname not found');
      console.log('   ✅ Verify cluster name is correct\n');
    }
  }
}

advancedDiagnostics();
