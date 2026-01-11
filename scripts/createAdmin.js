const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  uid: String,
  email: String,
  name: String,
  role: String,
  coins: Number,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get your Firebase UID (from Firebase console or after login)
    const adminUid = process.argv[2];
    
    if (!adminUid) {
      console.log('\n❌ Please provide your Firebase UID as an argument');
      console.log('Usage: node scripts/createAdmin.js YOUR_FIREBASE_UID');
      console.log('\nTo get your Firebase UID:');
      console.log('1. Login to your app normally');
      console.log('2. Check browser console for "User UID: ..."');
      console.log('3. Or check Firebase Console → Authentication → Users');
      process.exit(1);
    }

    // Check if user exists
    let user = await User.findOne({ uid: adminUid });
    
    if (user) {
      // Update existing user to admin
      user.role = 'admin';
      await user.save();
      console.log(`✅ Updated user "${user.email}" to admin role`);
    } else {
      console.log('❌ User not found with that UID');
      console.log('Make sure you login to the app first to create the user');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createAdmin();