const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function test() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('URI:', process.env.MONGODB_URI?.substring(0, 30) + '...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected!');
    
    const events = await mongoose.connection.db.collection('events').find({}).toArray();
    console.log(`✅ Found ${events.length} events in database`);
    
    if (events.length > 0) {
      console.log('\n📋 Sample event:');
      console.log('Name:', events[0].name);
      console.log('Date:', events[0].date);
      console.log('Price:', events[0].price);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

test();