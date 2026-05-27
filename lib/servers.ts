import serverData from "@/data/servers.json";
import { getMongoDb, isMongoConfigured } from "./mongodb";

export type ServerConfig = {
  id: string;
  name: string;
  location: string;
  panelUrl: string;
  ptlaEnvKey: string;
  ptlcEnvKey: string;
  wrapperUrlEnvKey: string;
  locationId: number;
  nestId: number;
  eggId: number;
  maxPanels: number;
};

export type ServerAvailability = {
  config: ServerConfig;
  used: number;
  remaining: number;
  full: boolean;
};

export const servers = serverData as ServerConfig[];

export function getServerById(id: string) {
  return servers.find((s) => s.id === id);
}

export function getServerCredentials(server: ServerConfig) {
  return {
    ptla: process.env[server.ptlaEnvKey] || "",
    ptlc: process.env[server.ptlcEnvKey] || "",
    wrapperUrl: process.env[server.wrapperUrlEnvKey] || ""
  };
}

export function isServerCredentialReady(server: ServerConfig) {
  const creds = getServerCredentials(server);
  return Boolean(server.panelUrl && creds.ptla && creds.ptlc && creds.wrapperUrl);
}

export async function countPanelsForServer(serverId: string): Promise<number> {
  if (!isMongoConfigured()) return 0;
  const db = await getMongoDb();
  return db.collection("panel_orders").countDocuments({ serverId, status: "success" });
}

export async function getServerAvailability(): Promise<ServerAvailability[]> {
  const counts: Record<string, number> = {};
  if (isMongoConfigured()) {
    try {
      const db = await getMongoDb();
      const agg = await db
        .collection("panel_orders")
        .aggregate<{ _id: string; count: number }>([
          { $match: { status: "success" } },
          { $group: { _id: "$serverId", count: { $sum: 1 } } }
        ])
        .toArray();
      for (const row of agg) counts[row._id] = row.count;
    } catch (err) {
      console.error("[servers] mongo agg failed", err);
    }
  }

  return servers.map((config) => {
    const used = counts[config.id] || 0;
    const remaining = Math.max(0, config.maxPanels - used);
    return { config, used, remaining, full: remaining <= 0 };
  });
}

export async function isServerAvailable(serverId: string): Promise<boolean> {
  const config = getServerById(serverId);
  if (!config) return false;
  const used = await countPanelsForServer(serverId);
  return used < config.maxPanels;
}

export async function recordPanelOrder({
  orderId,
  serverId,
  username,
  panelUrl,
  raw
}: {
  orderId: string;
  serverId: string;
  username: string;
  panelUrl: string;
  raw?: unknown;
}) {
  if (!isMongoConfigured()) return;
  try {
    const db = await getMongoDb();
    await db.collection("panel_orders").updateOne(
      { orderId },
      {
        $set: {
          orderId,
          serverId,
          username,
          panelUrl,
          status: "success",
          createdAt: new Date(),
          raw
        }
      },
      { upsert: true }
    );
  } catch (err) {
    console.error("[servers] mongo record failed", err);
  }
}
