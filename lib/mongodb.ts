import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;
// const MONGODB_DB = process.env.MONGODB_DB as string;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Extract database name from the URI
const MONGODB_DB = (() => {
  try {
    // Extract database name from connection string
    // Format: mongodb+srv://.../DATABASE_NAME?...
    const match = MONGODB_URI.match(/\/([^/?]+)(?:\?|$)/);
    return match ? match[1] : 'joyjuncture';
  } catch {
    return 'joyjuncture';
  }
})();

console.log(`📊 Using database: ${MONGODB_DB}`);

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

export async function disconnectFromDatabase() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Close the Mongoose connection when the Node process ends
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

// Add connectDb as an alias for connectToDatabase
export const connectDb = connectToDatabase;

// Also export a default for backward compatibility
export default connectToDatabase;