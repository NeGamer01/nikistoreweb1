import productData from "@/data/products.json";
import { getAllProducts, getProductById as dbGetById, getProductBySlug as dbGetBySlug, type ProductRecord } from "./productStore";

type ProductBase = {
  id: string;
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
};

export type SourceProduct = ProductBase & {
  type?: "source";
  downloadEnvKey: string;
};

export type Product = SourceProduct;

export const products = productData as Product[];

function recordToProduct(r: ProductRecord): Product {
  return {
    id: r._id,
    slug: r.slug,
    title: r.title,
    subtitle: r.subtitle,
    description: r.description,
    price: r.price,
    promoPrice: r.promoPrice,
    category: r.category,
    image: r.image,
    stack: r.stack,
    includes: r.includes,
    highlights: r.highlights,
    downloadEnvKey: r.downloadEnvKey
  };
}

export function getProductPrice(product: Product) {
  return product.promoPrice && product.promoPrice > 0 && product.promoPrice < product.price
    ? product.promoPrice
    : product.price;
}

export function hasPromo(product: Product) {
  return getProductPrice(product) < product.price;
}

export async function getPublicProducts(): Promise<Product[]> {
  try {
    const records = await getAllProducts();
    if (records.length > 0) return records.map(recordToProduct);
  } catch (e) {
    console.error("Failed to load products from MongoDB, falling back to JSON:", e);
  }
  return products;
}

export async function findProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    const record = await dbGetBySlug(slug);
    if (record) return recordToProduct(record);
  } catch (e) {
    console.error("Failed to load product from MongoDB:", e);
  }
  return products.find((product) => product.slug === slug);
}

export async function findProductById(id: string): Promise<Product | undefined> {
  try {
    const record = await dbGetById(id);
    if (record) return recordToProduct(record);
  } catch (e) {
    console.error("Failed to load product from MongoDB:", e);
  }
  return products.find((product) => product.id === id);
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getProductById(id: string) {
  return products.find((product) => product.id === id);
}

export function getDownloadUrl(product: Product) {
  const value = process.env[product.downloadEnvKey];
  return value && /^https?:\/\//i.test(value) ? value : null;
}
