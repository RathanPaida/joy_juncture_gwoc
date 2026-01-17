
import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable");
}

if (!MONGODB_DB) {
    throw new Error("Please define the MONGODB_DB environment variable");
}

async function debugGallery() {
    try {
        await mongoose.connect(MONGODB_URI!, {
            dbName: MONGODB_DB,
        });
        console.log("Connected to DB:", MONGODB_DB);

        const db = mongoose.connection.db;
        if (!db) throw new Error("DB connection failed");

        const collection = db.collection("galleries"); // Mongoose pluralizes to 'galleries' usually, or 'galleries'
        // Check actual collection name if needed, but Gallery model usually -> galleries

        // Let's list collections to be sure
        const collections = await db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));

        const docs = await collection.find({}).toArray();
        console.log(`Found ${docs.length} gallery documents.`);

        docs.forEach(doc => {
            console.log(`ID: ${doc._id}, Title: ${doc.title}, Category: ${doc.category}`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

debugGallery();
