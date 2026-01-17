const { MongoClient } = require('mongodb');

// URI from .env.local
const uri = "mongodb+srv://joyjuncture_admin:Hemanth2118@joy-juncture-cluster.ci1ju07.mongodb.net/?appName=joy-juncture-cluster";
const dbName = "joy_juncture";

async function updateEvent() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('events');

    // Find the most recent event (by any date)
    // We want to force at least one event to be in the future.
    const events = await collection.find({}).sort({ date: -1 }).toArray();
    
    if (events.length > 0) {
        const eventToUpdate = events[0];
        // Set date to 1 month in the future from now
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        
        console.log(`Updating event "${eventToUpdate.name}"...`);
        console.log(`Original Date: ${eventToUpdate.date}`);
        
        const result = await collection.updateOne(
            { _id: eventToUpdate._id },
            { $set: { date: futureDate } }
        );
        
        console.log(`Updated to New Date: ${futureDate.toISOString()}`);
        console.log(`Modified count: ${result.modifiedCount}`);
    } else {
        console.log("No events found to update.");
    }
  } catch (err) {
      console.error("Error occurred:", err);
  } finally {
    await client.close();
  }
}

updateEvent();
