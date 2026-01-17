
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

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

async function debugDB() {
    try {
        console.log("Connecting to URI:", MONGODB_URI?.split("?")[0] + "...");
        console.log("Target DB Name:", MONGODB_DB);

        if (!MONGODB_URI || !MONGODB_DB) {
            throw new Error("Missing Env Vars");
        }

        await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
        console.log("Connected.");

        const db = mongoose.connection.db;
        if (!db) {
            throw new Error("Database connection not established");
        }
        const collections = await db.listCollections().toArray();

        // Check products
        const productCollection = db.collection("products");
        const count = await productCollection.countDocuments();

        const output = {
            targetDB: MONGODB_DB,
            collections: collections.map(c => c.name),
            productCount: count,
            distinctGametypes: count > 0 ? await productCollection.distinct("gametype") : [],
            missingGametypeDocs: count > 0 ? await productCollection.countDocuments({ $or: [{ gametype: { $exists: false } }, { gametype: null }] }) : 0,
            sample: count > 0 ? await productCollection.find({}).limit(5).toArray() : []
        };

        fs.writeFileSync("debug_output_v2.txt", JSON.stringify(output, null, 2));
        console.log("Written to debug_output_v2.txt");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        process.exit();
    }
}

debugDB();
