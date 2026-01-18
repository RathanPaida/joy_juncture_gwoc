import connectDb from "../lib/mongodb";
import Product from "../models/Product";

async function check() {
    await connectDb();
    const products = await Product.find({}, "name meta.players gametype category");
    console.log(JSON.stringify(products, null, 2));
    process.exit(0);
}

check();
