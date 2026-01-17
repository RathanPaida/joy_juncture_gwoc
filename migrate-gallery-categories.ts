
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { Gallery } from "./models/Gallery"; // Adjust path if needed, or define schema inline if easier

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

if (!MONGODB_URI) throw new Error("Please define MONGODB_URI");
if (!MONGODB_DB) throw new Error("Please define MONGODB_DB");

async function migrateGallery() {
    try {
        await mongoose.connect(MONGODB_URI!, { dbName: MONGODB_DB });
        console.log("Connected to DB for migration.");

        // Update all documents that do not have a category field
        const result = await Gallery.updateMany(
            { category: { $exists: false } }, // Query: where category is missing
            { $set: { category: "general" } } // Update: set category to "general"
        );

        // Also update if category is null
        const result2 = await Gallery.updateMany(
            { category: null },
            { $set: { category: "general" } }
        );

        console.log(`Migration Complete.`);
        console.log(`Updated (missing field): ${result.modifiedCount}`);
        console.log(`Updated (null field): ${result2.modifiedCount}`);

    } catch (error) {
        console.error("Migration Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

migrateGallery();
