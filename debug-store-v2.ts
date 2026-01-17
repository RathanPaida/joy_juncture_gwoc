
import connectDb from "./lib/mongodb";
import Product from "./models/Product";

async function debugStore() {
    try {
        await connectDb();
        console.log("Connected to DB");

        const products = await Product.find({}).select("name gametype category meta").limit(20).lean();

        console.log(`Found ${products.length} products`);

        const gametypes = new Set();
        const categories = new Set();

        products.forEach((p: any) => {
            if (p.gametype) gametypes.add(p.gametype);
            if (p.category) categories.add(p.category);
        });

        console.log("Unique Gametypes:", Array.from(gametypes));
        console.log("Unique Categories:", Array.from(categories));

        console.log("Sample Products:");
        products.slice(0, 3).forEach(p => console.log(JSON.stringify(p, null, 2)));

    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit();
    }
}

debugStore();
