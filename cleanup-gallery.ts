
import { connectDb } from "./lib/mongodb";
import mongoose from "mongoose";

async function cleanupGallery() {
    try {
        await connectDb();
        console.log("Connected to DB.");

        // Direct collection access to bypass Mongoose Schema limitations
        if (!mongoose.connection.db) {
            throw new Error("Database connection not established");
        }
        const collection = mongoose.connection.db.collection("galleries");

        // Find documents without category
        const broken = await collection.find({ category: { $exists: false } }).toArray();
        console.log(`Found ${broken.length} broken images (missing category).`);

        if (broken.length > 0) {
            const res = await collection.deleteMany({ category: { $exists: false } });
            console.log(`Deleted ${res.deletedCount} broken images.`);
        }

        // Also verify if we have any valid ones
        const valid = await collection.find({ category: { $exists: true } }).toArray();
        console.log(`Found ${valid.length} valid images.`);

    } catch (error) {
        console.error("Cleanup Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

cleanupGallery();
