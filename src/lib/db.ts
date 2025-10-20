import mongoose from 'mongoose';

let isConnected = 0; // 0 = disconnected, 1 = connecting, 2 = connected

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (isConnected === 2) {
    return mongoose;
  }

  if (!process.env.MONGO_URL) {
    throw new Error('MONGO_URL is not set in environment variables');
  }

  if (isConnected === 1) {
    // connection in progress
    return mongoose;
  }

  isConnected = 1;

  mongoose.set('strictQuery', true);

  await mongoose.connect(process.env.MONGO_URL, {
    dbName: 'qualityfoodstuffs',
  });

  isConnected = 2;
  return mongoose;
}

export function disconnectFromDatabase(): Promise<void> {
  return mongoose.disconnect();
}


