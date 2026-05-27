import { getMongoDb, isMongoConfigured } from "./mongodb";
import productData from "@/data/products.json";

export type ProductRecord = {
  _id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  promoPrice?: number;
  category: string;
  image: string;
  stack: string[];
  includes: string[];
  highlights: string[];
  downloadEnvKey: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
};

const COLLECTION = "products";
let seeded = false;

async function ensureSeeded(): Promise<void> {
  if (seeded || !isMongoConfigured()) return;
  seeded = true;
  const db = await getMongoDb();
  const count = await db.collection(COLLECTION).countDocuments();
  if (count > 0) return;

  const now = Date.now();
  const docs: ProductRecord[] = (productData as Array<Record<string, unknown>>).map((p) => ({
    _id: String(p.id),
    slug: String(p.slug),
    title: String(p.title),
    subtitle: String(p.subtitle || ""),
    description: String(p.description || ""),
    price: Number(p.price) || 0,
    promoPrice: p.promoPrice ? Number(p.promoPrice) : undefined,
    category: String(p.category || ""),
    image: String(p.image || ""),
    stack: (p.stack as string[]) || [],
    includes: (p.includes as string[]) || [],
    highlights: (p.highlights as string[]) || [],
    downloadEnvKey: String(p.downloadEnvKey || ""),
    active: true,
    createdAt: now,
    updatedAt: now
  }));
  await db.collection<ProductRecord>(COLLECTION).insertMany(docs);
}

export async function getAllProducts(): Promise<ProductRecord[]> {
  if (!isMongoConfigured()) {
    return (productData as Array<Record<string, unknown>>).map((p) => ({
      _id: String(p.id),
      slug: String(p.slug),
      title: String(p.title),
      subtitle: String(p.subtitle || ""),
      description: String(p.description || ""),
      price: Number(p.price) || 0,
      promoPrice: p.promoPrice ? Number(p.promoPrice) : undefined,
      category: String(p.category || ""),
      image: String(p.image || ""),
      stack: (p.stack as string[]) || [],
      includes: (p.includes as string[]) || [],
      highlights: (p.highlights as string[]) || [],
      downloadEnvKey: String(p.downloadEnvKey || ""),
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }));
  }
  await ensureSeeded();
  const db = await getMongoDb();
  return db.collection<ProductRecord>(COLLECTION).find({ active: true }).sort({ createdAt: -1 }).toArray();
}

export async function getAllProductsAdmin(): Promise<ProductRecord[]> {
  if (!isMongoConfigured()) return getAllProducts();
  await ensureSeeded();
  const db = await getMongoDb();
  return db.collection<ProductRecord>(COLLECTION).find({}).sort({ createdAt: -1 }).toArray();
}

export async function getProductById(id: string): Promise<ProductRecord | null> {
  if (!isMongoConfigured()) {
    const all = await getAllProducts();
    return all.find((p) => p._id === id) || null;
  }
  await ensureSeeded();
  const db = await getMongoDb();
  return db.collection<ProductRecord>(COLLECTION).findOne({ _id: id });
}

export async function getProductBySlug(slug: string): Promise<ProductRecord | null> {
  if (!isMongoConfigured()) {
    const all = await getAllProducts();
    return all.find((p) => p.slug === slug) || null;
  }
  await ensureSeeded();
  const db = await getMongoDb();
  return db.collection<ProductRecord>(COLLECTION).findOne({ slug });
}

export async function createProduct(product: Omit<ProductRecord, "_id" | "createdAt" | "updatedAt">): Promise<string> {
  if (!isMongoConfigured()) throw new Error("MongoDB not configured");
  await ensureSeeded();
  const db = await getMongoDb();
  const now = Date.now();
  const id = `prod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  await db.collection<ProductRecord>(COLLECTION).insertOne({
    ...product,
    _id: id,
    createdAt: now,
    updatedAt: now
  });
  return id;
}

export async function updateProduct(id: string, updates: Partial<ProductRecord>): Promise<void> {
  if (!isMongoConfigured()) throw new Error("MongoDB not configured");
  const db = await getMongoDb();
  const { _id, createdAt, ...safeUpdates } = updates;
  await db.collection<ProductRecord>(COLLECTION).updateOne(
    { _id: id },
    { $set: { ...safeUpdates, updatedAt: Date.now() } }
  );
}

export async function deleteProduct(id: string): Promise<void> {
  if (!isMongoConfigured()) throw new Error("MongoDB not configured");
  const db = await getMongoDb();
  await db.collection<ProductRecord>(COLLECTION).deleteOne({ _id: id });
}
