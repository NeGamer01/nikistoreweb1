import { MongoClient, type Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var __nikiMongoClient: MongoClient | undefined;
  // eslint-disable-next-line no-var
  var __nikiMongoPromise: Promise<MongoClient> | undefined;
}

function getUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI belum diset.");
  return uri;
}

function getDbName() {
  return process.env.MONGODB_DB || "nikistore";
}

export function isMongoConfigured() {
  return Boolean(process.env.MONGODB_URI);
}

export async function getMongoDb(): Promise<Db> {
  if (!global.__nikiMongoPromise) {
    const client = new MongoClient(getUri(), {
      serverSelectionTimeoutMS: 8000
    });
    global.__nikiMongoPromise = client.connect().then((c) => {
      global.__nikiMongoClient = c;
      return c;
    });
  }
  const client = await global.__nikiMongoPromise;
  return client.db(getDbName());
}
