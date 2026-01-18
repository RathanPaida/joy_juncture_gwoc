
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/joy_juncture"; // Fallback if env not set, though it should be

async function checkGametypes() {
    try {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(MONGODB_URI);
            console.log("Connected to DB");
        }

        if (!mongoose.connection.db) {
            throw new Error("Database connection not established");
        }
        const collection = mongoose.connection.db.collection("products");
        const distinctGametypes = await collection.distinct("gametype");
        console.log("Distinct Gametypes in DB:", distinctGametypes);

        // Also check just first 5 docs to see raw structure
        const sample = await collection.find({}).limit(5).toArray();
        console.log("Sample Docs (gametype field):", sample.map(d => ({ name: d.name, gametype: d.gametype })));

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

checkGametypes();
