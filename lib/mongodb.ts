// import mongoose from 'mongoose';

// const MONGODB_URI = process.env.MONGODB_URI as string;
// const MONGODB_DB = process.env.MONGODB_DB as string;

// if (!MONGODB_URI) {
//   throw new Error('Please define the MONGODB_URI environment variable');
// }



// // console.log(`📊 Using database: ${MONGODB_DB}`);

// /**
//  * Global is used here to maintain a cached connection across hot reloads
//  * in development. This prevents connections growing exponentially
//  * during API Route usage.
//  */
// let cached = (global as any).mongoose;

// if (!cached) {
//   cached = (global as any).mongoose = { conn: null, promise: null };
// }

// export async function connectToDatabase() {
//   if (cached.conn) {
//     return cached.conn;
//   }

//   if (!cached.promise) {
//     const opts = {
//       bufferCommands: false,
//       dbName: MONGODB_DB,
//     };

//     cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
//       return mongoose;
//     });
//   }

//   try {
//     cached.conn = await cached.promise;
//   } catch (e) {
//     cached.promise = null;
//     throw e;
//   }

//   return cached.conn;
// }

// export async function disconnectFromDatabase() {
//   if (cached.conn) {
//     await mongoose.disconnect();
//     cached.conn = null;
//     cached.promise = null;
//   }
// }

// // Handle MongoDB connection events
// mongoose.connection.on('connected', () => {
//   console.log('MongoDB connected successfully');
// });

// mongoose.connection.on('error', (err) => {
//   console.error('MongoDB connection error:', err);
// });

// mongoose.connection.on('disconnected', () => {
//   console.log('MongoDB disconnected');
// });

// // Close the Mongoose connection when the Node process ends
// process.on('SIGINT', async () => {
//   await mongoose.connection.close();
//   process.exit(0);
// });

// // Add connectDb as an alias for connectToDatabase
// export const connectDb = connectToDatabase;

// // Also export a default for backward compatibility
// export default connectToDatabase;

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;
const MONGODB_DB = process.env.MONGODB_DB as string;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: MONGODB_DB,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export async function getEventsCollection() {
  const conn = await connectToDatabase();
  return conn.connection.db.collection('events');
}


export async function disconnectFromDatabase() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}

// Helper function to get database instance
export async function getDatabase() {
  await connectToDatabase();
  
  if (!mongoose.connection.db) {
    throw new Error('Database connection not established');
  }
  
  return mongoose.connection.db;
}

// Helper function to get events collection
export async function getEventsCollection() {
  const db = await getDatabase();
  return db.collection('events');
}

// Helper function to get any collection by name
export async function getCollection(collectionName: string) {
  const db = await getDatabase();
  return db.collection(collectionName);
}

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
  console.log(`📊 Using database: ${MONGODB_DB || 'default'}`);
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

// Close the Mongoose connection when the Node process ends
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

// Add connectDb as an alias for connectToDatabase
export const connectDb = connectToDatabase;

// Also export a default for backward compatibility
export default connectToDatabase;