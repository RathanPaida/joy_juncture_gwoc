// scripts/make-admin.ts
// Run with: npx ts-node scripts/make-admin.ts your-email@example.com
// Or: node --loader ts-node/esm scripts/make-admin.ts your-email@example.com

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// User Schema (minimal version for script)
const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  role: String,
  firebaseUid: String,
  totalPoints: Number,
  level: Number
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function makeAdmin(email: string, role: 'admin' | 'super_admin' = 'admin') {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log(`🔍 Looking for user: ${email}...`);
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found!');
      console.log('💡 Make sure the user has logged in at least once to create their account.');
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${user.name} (${user.email})`);
    console.log(`📊 Current role: ${user.role}`);
    
    if (user.role === role) {
      console.log(`ℹ️  User is already a ${role}`);
      process.exit(0);
    }
    
    // Update role
    user.role = role;
    await user.save();
    
    console.log(`🎉 Success! ${user.email} is now a ${role}!`);
    console.log(`📋 User Details:`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Points: ${user.totalPoints || 0}`);
    console.log(`   Level: ${user.level || 1}`);
    
    console.log('\n✨ Next steps:');
    console.log('   1. Logout and login again to refresh your session');
    console.log('   2. Visit http://localhost:3000/admin/wallet');
    console.log('   3. Start managing your wallet system!');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];
const roleArg = process.argv[3];

if (!email) {
  console.log('❌ Usage: npx ts-node scripts/make-admin.ts <email> [role]');
  console.log('');
  console.log('Examples:');
  console.log('  npx ts-node scripts/make-admin.ts user@example.com');
  console.log('  npx ts-node scripts/make-admin.ts user@example.com super_admin');
  console.log('');
  console.log('Roles:');
  console.log('  admin       - Can manage wallet system (default)');
  console.log('  super_admin - Full admin access');
  process.exit(1);
}

const role = (roleArg === 'super_admin' ? 'super_admin' : 'admin') as 'admin' | 'super_admin';

console.log('🚀 Making user admin...\n');
makeAdmin(email, role);