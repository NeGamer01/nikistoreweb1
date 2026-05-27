import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const mongoOptions = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
};

let client: MongoClient | undefined;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const globalForMongo = globalThis as unknown as {
  mongo: Promise<MongoClient> | undefined;
};

if (process.env.NODE_ENV === 'development') {
  if (!globalForMongo.mongo) {
    client = new MongoClient(uri, mongoOptions);
    globalForMongo.mongo = client.connect();
  }
  clientPromise = globalForMongo.mongo;
} else {
  client = new MongoClient(uri, mongoOptions);
  clientPromise = client.connect();
}

export async function getMongoDb() {
  const mongoClient = await clientPromise;
  return mongoClient.db('nikistore');
}

export function isMongoConfigured(): boolean {
  return !!uri;
}
