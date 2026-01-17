
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

async function migrate() {
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
        const collection = db.collection("products");

        // Update all docs where gametype matches {$exists: false} or is null, or is NOT "card-game" (assuming all current are board games)
        // Actually, let's just default everything to board-game first, as user requested store filter fix for board games.
        // AND most items in sample were games so safe to assume board-game.
        // One item "Dead Man's Deck" is a card game.
        // "Buzzed" is a card game.
        // "Mehfil" is a card game.

        // Strategy:
        // 1. Set EVERYTHING to board-game first.
        // 2. Explicitly set known Card Games to card-game.

        const result1 = await collection.updateMany(
            { $or: [{ gametype: { $exists: false } }, { gametype: null }] },
            { $set: { gametype: "board-game" } }
        );
        console.log(`Set default board-game for ${result1.modifiedCount} documents.`);

        // Fix specific Card Games based on slugs from sample output
        const cardGames = ["dead-mans-deck", "mehfil", "buzzed", "tamasha"]; // tamasha is party game, potentially card

        const result2 = await collection.updateMany(
            { slug: { $in: cardGames } },
            { $set: { gametype: "card-game" } }
        );
        console.log(`Updated ${result2.modifiedCount} to card-game.`);


    } catch (error) {
        console.error("Error:", error);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        process.exit();
    }
}

migrate();
