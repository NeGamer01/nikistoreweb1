import { getMongoDb, isMongoConfigured } from "./mongodb";

type SettingDoc = {
  _id: string;
  value: boolean;
  updatedAt: Date;
};

const COLLECTION = "settings";
const KEY = "panel_orders_enabled";

export async function getPanelOrdersEnabled(): Promise<boolean> {
  if (!isMongoConfigured()) return true;
  const db = await getMongoDb();
  const doc = await db.collection<SettingDoc>(COLLECTION).findOne({ _id: KEY });
  if (!doc) return true;
  return doc.value === true;
}

export async function setPanelOrdersEnabled(value: boolean): Promise<void> {
  if (!isMongoConfigured()) {
    throw new Error("MONGODB_URI belum diset.");
  }
  const db = await getMongoDb();
  await db.collection<SettingDoc>(COLLECTION).updateOne(
    { _id: KEY },
    { $set: { value, updatedAt: new Date() } },
    { upsert: true }
  );
}
