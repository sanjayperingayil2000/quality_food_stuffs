import mongoose from 'mongoose';

let isConnected = 0; // 0 = disconnected, 1 = connecting, 2 = connected

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (isConnected === 2) {
    return mongoose;
  }

  const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';

  if (isConnected === 1) {
    // connection in progress
    return mongoose;
  }

  isConnected = 1;

  mongoose.set('strictQuery', true);

  const urlWithoutQuery = mongoUrl.split('?')[0];
  const urlParts = urlWithoutQuery.split('/');
  const hasDatabaseInUrl = urlParts.length > 3 && urlParts.at(-1) !== '';
  await mongoose.connect(mongoUrl, hasDatabaseInUrl ? {} : { dbName: 'qualityfoodstuffs' });

  isConnected = 2;
  if(isConnected === 2) {
    console.log('Connected to MongoDB');
  }
  return mongoose;
}

export function disconnectFromDatabase(): Promise<void> {
  return mongoose.disconnect();
}


