import type { Document } from "mongodb";
import { getMongoDb, isMongoConfigured } from "./mongodb";
import { isPanelOrder, type OrderPayload } from "./orders";

export type OrderRecord = {
  _id: string;
  kind: "source" | "panel";
  productId: string;
  productSlug: string;
  productTitle: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  basePrice: number;
  uniqueCode: number;
  amount: number;
  status: "pending" | "paid" | "expired";
  createdAt: number;
  paymentExpiresAt: number;
  downloadExpiresAt: number;
  paidAt?: number;
  panel?: {
    username: string;
    serverId: string;
    serverName: string;
    ram: number;
    disk: number;
    cpu: number;
  };
};

const COLLECTION = "orders";

export async function saveOrder(order: OrderPayload): Promise<void> {
  if (!isMongoConfigured()) return;
  const db = await getMongoDb();
  const record: OrderRecord = {
    _id: order.id,
    kind: order.kind,
    productId: order.productId,
    productSlug: order.productSlug,
    productTitle: isPanelOrder(order) ? order.productTitle : order.productId,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    basePrice: order.basePrice,
    uniqueCode: order.uniqueCode,
    amount: order.amount,
    status: "pending",
    createdAt: order.createdAt,
    paymentExpiresAt: order.paymentExpiresAt,
    downloadExpiresAt: order.downloadExpiresAt,
    ...(isPanelOrder(order) ? {
      panel: {
        username: order.panel.username,
        serverId: order.panel.serverId,
        serverName: order.panel.serverName,
        ram: order.panel.selection.ram,
        disk: order.panel.selection.disk,
        cpu: order.panel.selection.cpu
      }
    } : {})
  };
  await db.collection<OrderRecord>(COLLECTION).updateOne(
    { _id: record._id },
    { $set: record },
    { upsert: true }
  );
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderRecord["status"]
): Promise<void> {
  if (!isMongoConfigured()) return;
  const db = await getMongoDb();
  const update: Record<string, unknown> = { status };
  if (status === "paid") update.paidAt = Date.now();
  await db.collection<OrderRecord>(COLLECTION).updateOne({ _id: orderId }, { $set: update });
}

type Filters = {
  status?: OrderRecord["status"];
  kind?: OrderRecord["kind"];
  search?: string;
  limit?: number;
  skip?: number;
};

export async function getOrders(filters: Filters = {}): Promise<OrderRecord[]> {
  if (!isMongoConfigured()) return [];
  const db = await getMongoDb();
  const query: Record<string, unknown> = {};
  if (filters.status) query.status = filters.status;
  if (filters.kind) query.kind = filters.kind;
  if (filters.search) {
    const s = filters.search;
    query.$or = [
      { _id: { $regex: s, $options: "i" } },
      { customerName: { $regex: s, $options: "i" } },
      { customerEmail: { $regex: s, $options: "i" } },
      { productTitle: { $regex: s, $options: "i" } }
    ];
  }
  return db
    .collection<OrderRecord>(COLLECTION)
    .find(query)
    .sort({ createdAt: -1 })
    .skip(filters.skip ?? 0)
    .limit(filters.limit ?? 100)
    .toArray();
}

export async function countOrders(filters: Omit<Filters, "limit" | "skip"> = {}): Promise<number> {
  if (!isMongoConfigured()) return 0;
  const db = await getMongoDb();
  const query: Record<string, unknown> = {};
  if (filters.status) query.status = filters.status;
  if (filters.kind) query.kind = filters.kind;
  if (filters.search) {
    const s = filters.search;
    query.$or = [
      { _id: { $regex: s, $options: "i" } },
      { customerName: { $regex: s, $options: "i" } },
      { customerEmail: { $regex: s, $options: "i" } },
      { productTitle: { $regex: s, $options: "i" } }
    ];
  }
  return db.collection(COLLECTION).countDocuments(query);
}

export type OrderStats = {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  expiredOrders: number;
  totalRevenue: number;
  revenueThisMonth: number;
  topProducts: { productTitle: string; count: number; revenue: number }[];
};

export async function getOrderStats(): Promise<OrderStats> {
  if (!isMongoConfigured()) {
    return {
      totalOrders: 0,
      paidOrders: 0,
      pendingOrders: 0,
      expiredOrders: 0,
      totalRevenue: 0,
      revenueThisMonth: 0,
      topProducts: []
    };
  }
  const db = await getMongoDb();
  const col = db.collection<OrderRecord>(COLLECTION);

  const [totalOrders, paidOrders, pendingOrders, expiredOrders] = await Promise.all([
    col.countDocuments(),
    col.countDocuments({ status: "paid" }),
    col.countDocuments({ status: "pending" }),
    col.countDocuments({ status: "expired" })
  ]);

  const revenueAgg = await col
    .aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ])
    .toArray();
  const totalRevenue = (revenueAgg[0]?.total as number) ?? 0;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthRevenueAgg = await col
    .aggregate([
      { $match: { status: "paid", paidAt: { $gte: startOfMonth.getTime() } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ])
    .toArray();
  const revenueThisMonth = (monthRevenueAgg[0]?.total as number) ?? 0;

  const topProductsAgg = await col
    .aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: "$productTitle",
          count: { $sum: 1 },
          revenue: { $sum: "$amount" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])
    .toArray();
  const topProducts = topProductsAgg.map((p) => ({
    productTitle: p._id as string,
    count: p.count as number,
    revenue: p.revenue as number
  }));

  return {
    totalOrders,
    paidOrders,
    pendingOrders,
    expiredOrders,
    totalRevenue,
    revenueThisMonth,
    topProducts
  };
}

export async function getOrderById(orderId: string): Promise<OrderRecord | null> {
  if (!isMongoConfigured()) return null;
  const db = await getMongoDb();
  return db.collection<OrderRecord>(COLLECTION).findOne({ _id: orderId });
}
