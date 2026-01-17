
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined');
    process.exit(1);
}

async function debugPoints() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI!);
        console.log('✅ Connected');

        // Find the user (using the email from the prompt earlier: paidarajarathan@gmail.com)
        // Or just find any user
        const email = 'paidarajarathan@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.error(`❌ User not found: ${email}`);
            return;
        }

        console.log(`👤 User found: ${user.name} (${user.email})`);
        console.log(`💰 Current Wallet: ${user.walletBalance}`);
        console.log(`🏆 Current Total Points: ${user.totalPoints}`);
        console.log(`🆔 Firebase UID: ${user.firebaseUid}`);

        // Simulate adding points
        const pointsToAdd = 10;
        console.log(`\n➕ Adding ${pointsToAdd} points...`);

        const updateResult = await User.findOneAndUpdate(
            { firebaseUid: user.firebaseUid },
            {
                $inc: {
                    walletBalance: pointsToAdd,
                    totalPoints: pointsToAdd,
                },
            },
            { new: true }
        );

        console.log(`💰 New Wallet: ${updateResult?.walletBalance}`);
        console.log(`🏆 New Total Points: ${updateResult?.totalPoints}`);

        if (updateResult?.walletBalance === user.walletBalance + pointsToAdd) {
            console.log("✅ SUCCESS: Points incremented correctly.");
        } else {
            console.log("❌ FAILURE: Points did not increment as expected.");
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected');
    }
}

debugPoints();
