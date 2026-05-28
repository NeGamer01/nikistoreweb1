import { getMongoDb, isMongoConfigured } from "./mongodb";

export type PanelServer = {
  _id: string;
  orderId: string;
  serverId: string;
  serverName: string;
  username: string;
  phone: string;
  email: string;
  pterodactylServerId?: string | number;
  panelUrl: string;
  ram: number;
  disk: number;
  cpu: number;
  eggId: number;
  eggName: string;
  createdAt: number;
  expiresAt: number;
  renewedCount: number;
  lastNotifiedAt?: number;
};

const COLLECTION = "panel_servers";

export async function savePanelServer(server: Omit<PanelServer, "_id" | "lastNotifiedAt">): Promise<void> {
  if (!isMongoConfigured()) return;
  const db = await getMongoDb();
  await db.collection<PanelServer>(COLLECTION).updateOne(
    { _id: server.orderId },
    { $set: server },
    { upsert: true }
  );
}

export async function getPanelServer(orderId: string): Promise<PanelServer | null> {
  if (!isMongoConfigured()) return null;
  const db = await getMongoDb();
  return db.collection<PanelServer>(COLLECTION).findOne({ _id: orderId });
}

export async function deletePanelServer(orderId: string): Promise<void> {
  if (!isMongoConfigured()) return;
  const db = await getMongoDb();
  await db.collection<PanelServer>(COLLECTION).deleteOne({ _id: orderId });
}

export async function renewPanelServer(orderId: string, durationMs: number): Promise<PanelServer | null> {
  if (!isMongoConfigured()) return null;
  const db = await getMongoDb();
  const server = await getPanelServer(orderId);
  if (!server) return null;

  const baseTime = server.expiresAt > Date.now() ? server.expiresAt : Date.now();
  const newExpiresAt = baseTime + durationMs;

  await db.collection<PanelServer>(COLLECTION).updateOne(
    { _id: orderId },
    { $set: { expiresAt: newExpiresAt, renewedCount: server.renewedCount + 1 } }
  );

  return { ...server, expiresAt: newExpiresAt, renewedCount: server.renewedCount + 1 };
}

export async function searchPanelServers(query: string): Promise<PanelServer[]> {
  if (!isMongoConfigured()) return [];
  const db = await getMongoDb();
  const q = query.trim().toLowerCase();
  return db
    .collection<PanelServer>(COLLECTION)
    .find({
      $or: [
        { phone: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { serverName: { $regex: q, $options: "i" } }
      ]
    })
    .sort({ expiresAt: 1 })
    .toArray();
}

export async function getExpiredPanelServers(): Promise<PanelServer[]> {
  if (!isMongoConfigured()) return [];
  const db = await getMongoDb();
  return db
    .collection<PanelServer>(COLLECTION)
    .find({ expiresAt: { $lt: Date.now() } })
    .toArray();
}

export async function getServersExpiringSoon(daysAhead: number): Promise<PanelServer[]> {
  if (!isMongoConfigured()) return [];
  const db = await getMongoDb();
  const now = Date.now();
  const cutoff = now + daysAhead * 24 * 60 * 60 * 1000;
  return db
    .collection<PanelServer>(COLLECTION)
    .find({
      expiresAt: { $gte: now, $lt: cutoff },
      $or: [
        { lastNotifiedAt: { $exists: false } },
        { lastNotifiedAt: { $lt: now - 12 * 60 * 60 * 1000 } }
      ]
    })
    .toArray();
}

export async function getPanelServers(): Promise<PanelServer[]> {
  if (!isMongoConfigured()) return [];
  const db = await getMongoDb();
  return db.collection<PanelServer>(COLLECTION).find({}).toArray();
}

export async function markNotified(orderId: string): Promise<void> {
  if (!isMongoConfigured()) return;
  const db = await getMongoDb();
  await db.collection<PanelServer>(COLLECTION).updateOne(
    { _id: orderId },
    { $set: { lastNotifiedAt: Date.now() } }
  );
}
