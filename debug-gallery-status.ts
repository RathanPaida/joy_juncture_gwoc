
import { connectDb } from "./lib/mongodb";
import { Gallery } from "./models/Gallery";
import mongoose from "mongoose";

async function debugGallery() {
    try {
        await connectDb();
        console.log("Connected to DB:", mongoose.connection.name);

        const recentImages = await Gallery.find().sort({ createdAt: -1 }).limit(5);
        console.log("----- Recent Gallery Images -----");
        if (recentImages.length === 0) {
            console.log("No images found in database.");
        } else {
            recentImages.forEach(img => {
                console.log({
                    id: img._id,
                    title: img.title,
                    category: img.category,
                    url: img.url,
                    createdAt: img.createdAt
                });
            });
        }

        // Check count by category
        const generalCount = await Gallery.countDocuments({ category: 'general' });
        const expCount = await Gallery.countDocuments({ category: 'experiences' });
        const nullCount = await Gallery.countDocuments({ category: null });
        const undefinedCount = await Gallery.countDocuments({ category: { $exists: false } });

        console.log("----- Category Counts -----");
        console.log("General:", generalCount);
        console.log("Experiences:", expCount);
        console.log("Null Category:", nullCount);
        console.log("Undefined Category:", undefinedCount);

    } catch (error) {
        console.error("Debug Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

debugGallery();
