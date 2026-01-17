
import mongoose from "mongoose";
import * as dotenv from 'dotenv';
dotenv.config();

// Try to load from .env.local if .env missing
import path from 'path';
import fs from 'fs';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/joy_juncture";

async function migrate() {
    try {
        console.log("Connecting to:", MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log("Connected.");

        const db = mongoose.connection.db;
        const collection = db.collection("products");

        // Update all docs where gametype matches {$exists: false} or is null
        const result = await collection.updateMany(
            { $or: [{ gametype: { $exists: false } }, { gametype: null }] },
            { $set: { gametype: "board-game" } }
        );

        console.log(`Matched ${result.matchedCount} documents.`);
        console.log(`Modified ${result.modifiedCount} documents.`);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

migrate();
