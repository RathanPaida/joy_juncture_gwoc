#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Create a simple User model for the script
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'editor', 'viewer'], default: 'viewer' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createAdminUser() {
  try {
    // Validate environment variables
    const requiredEnvVars = ['MONGODB_URI', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:', missingVars);
      console.log('Please add them to your .env.local file:');
      console.log(`
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/joyjuncture
ADMIN_EMAIL=admin@joyjuncture.com
ADMIN_PASSWORD=YourSecurePassword123
      `);
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Created: ${existingAdmin.createdAt}`);
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log('🔑 Creating admin user...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    
    // Create admin user
    const adminUser = new User({
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      name: 'JoyJuncture Admin',
      role: 'admin',
      isActive: true
    });

    await adminUser.save();
    
    console.log('🎉 Admin user created successfully!');
    console.log('\n📋 Admin Details:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD} (remember to save this!)`);
    console.log('\n🔐 You can now log in at: http://localhost:3000/blog/admin/login');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    
    if (error.name === 'MongoServerError' && error.code === 11000) {
      console.error('   Email already exists in database');
    } else if (error.name === 'MongooseServerSelectionError') {
      console.error('   Could not connect to MongoDB. Check your MONGODB_URI');
    }
    
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Run the function
createAdminUser();