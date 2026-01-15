require('dotenv').config();
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Check for MONGODB_URI
if (!process.env.MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI is not defined in .env.local');
  console.log('Please add your MongoDB connection string to .env.local:');
  console.log('MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname');
  process.exit(1);
}

// Define the Event schema matching your models
const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  Venue: { type: String, default: '' },
  price: { type: Number, required: true },
  coins: { type: Number, required: true, default: 0 },
  collabWith: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Use the same collection name
const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

// Your event data
const rawEvents = [
  {
    name: "DMD Pune Tournament - Swig Pune",
    description: "Joy Juncture brought Dead Man's Deck to Pune! 38 players battled it out in style, with beers, cheers, and a ₹5100 cash prize going to the champion Tamanna!",
    date: new Date("2025-08-23"),
    Venue: "Surat",
    price: 100,
    coins: 10,
    collabWith: "Board Game Meetups Pune & Pickle Haus"
  },
  {
    name: "DMD Pune Tournament - Swig Pune",
    description: "Joy Juncture brought Dead Man's Deck to Pune! 38 players battled it out in style, with beers, cheers, and a ₹5100 cash prize going to the champion Tamanna!",
    date: new Date("2025-08-24"),
    Venue: "Surat", // Added this as it was missing
    price: 100,
    coins: 10,
    collabWith: "Board Game Meetups Pune & Pickle Haus"
  },
  {
    name: "DMD Pune Tournament - Swig Pune",
    description: "Joy Juncture brought Dead Man's Deck to Pune! 38 players battled it out in style, with beers, cheers, and a ₹5100 cash prize going to the champion Tamanna!",
    date: new Date("2025-08-22"),
    Venue: "Surat",
    price: 100,
    coins: 10,
    collabWith: "" // Explicitly empty string for consistency
  },
  // Add more events...
];

async function importData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to MongoDB successfully');
    
    // Check if we should clear existing data
    const shouldClear = process.argv.includes('--clear');
    if (shouldClear) {
      const count = await Event.countDocuments();
      console.log(`🗑️  Clearing ${count} existing events...`);
      await Event.deleteMany({});
      console.log('✅ Cleared existing events');
    }
    
    // Import new data
    console.log('📥 Importing events...');
    const result = await Event.insertMany(rawEvents);
    
    console.log(`✅ Successfully imported ${result.length} events`);
    
    // Display summary
    console.log('\n📊 IMPORT SUMMARY:');
    console.log('='.repeat(60));
    
    const now = new Date();
    const upcomingCount = result.filter(e => new Date(e.date) >= now).length;
    const pastCount = result.filter(e => new Date(e.date) < now).length;
    
    console.log(`Total Events: ${result.length}`);
    console.log(`Upcoming Events: ${upcomingCount}`);
    console.log(`Past Events: ${pastCount}`);
    
    const withCollab = result.filter(e => e.collabWith && e.collabWith.trim() !== '').length;
    console.log(`Events with Collaborations: ${withCollab}`);
    
    console.log('\n📋 Event List:');
    result.forEach((event, index) => {
      const status = new Date(event.date) >= now ? '🟢 UPCOMING' : '🔴 PAST';
      const collab = event.collabWith && event.collabWith.trim() ? ` | 🤝 ${event.collabWith}` : '';
      console.log(`${index + 1}. ${event.name}`);
      console.log(`   📅 ${event.date.toDateString()} | ${status} | 💰 ₹${event.price} | 🪙 ${event.coins} coins${collab}`);
    });
    
    console.log('='.repeat(60));
    console.log('🎉 Import completed! You can now run: npm run dev');
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error importing data:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Check your internet connection');
      console.log('2. Verify your MongoDB URI in .env.local');
      console.log('3. Make sure your IP is whitelisted in MongoDB Atlas');
    }
    
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help')) {
  console.log(`
🎪 Joy Juncture Data Import Script
===================================

Usage:
  node scripts/importData.js [options]

Options:
  --clear    : Clear all existing events before importing new ones
  --help     : Show this help message

Examples:
  node scripts/importData.js           # Import new events (keep existing)
  node scripts/importData.js --clear   # Clear all events first, then import

Note: 
  You have 3 events with the same name but different dates.
  Make sure this is intentional!
  `);
  process.exit(0);
}

// Run the import
importData();