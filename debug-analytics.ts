
import { connectDb } from "./lib/mongodb";
import { Order } from "./models/Order";
import Registration from "./models/Registration";

async function check() {
    await connectDb();
    const oCount = await Order.countDocuments({ paymentStatus: 'completed' });
    const rCount = await Registration.countDocuments({ paymentStatus: 'completed' });
    console.log('Completed Orders:', oCount);
    console.log('Completed Registrations:', rCount);
    process.exit(0);
}
check();
