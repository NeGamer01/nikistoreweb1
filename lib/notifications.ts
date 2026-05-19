import { compactDateTime, formatRupiah } from "./format";
import { sendFonnteMessage } from "./fonnte";
import type { OrderPayload } from "./orders";
import type { Product } from "./products";

const notificationStore = globalThis as typeof globalThis & {
  __kodemartNotifiedOrders?: Set<string>;
};

function notifiedOrders() {
  if (!notificationStore.__kodemartNotifiedOrders) {
    notificationStore.__kodemartNotifiedOrders = new Set<string>();
  }
  return notificationStore.__kodemartNotifiedOrders;
}

export async function notifySuccessfulOrder({
  order,
  product,
  downloadUrl
}: {
  order: OrderPayload;
  product: Product;
  downloadUrl: string;
}) {
  const key = `${order.id}:${order.amount}`;
  const sent = notifiedOrders();
  if (sent.has(key)) return;

  sent.add(key);

  const buyerMessage = [
    `Halo ${order.customerName}, pembayaran kamu berhasil.`,
    ``,
    `Detail transaksi:`,
    `Order ID: ${order.id}`,
    `Produk: ${product.title}`,
    `Nama: ${order.customerName}`,
    `Email: ${order.customerEmail}`,
    `WhatsApp: ${order.customerPhone}`,
    `Harga produk: ${formatRupiah(order.basePrice)}`,
    `Kode unik: ${formatRupiah(order.uniqueCode)}`,
    `Total dibayar: ${formatRupiah(order.amount)}`,
    ``,
    `Link download:`,
    downloadUrl,
    ``,
    `Link berlaku sampai ${compactDateTime(order.downloadExpiresAt)}.`
  ].join("\n");

  const ownerTarget = process.env.OWNER_WHATSAPP_NUMBER || "";
  const ownerMessage = [
    `Pembelian sukses`,
    ``,
    `Order: ${order.id}`,
    `Produk: ${product.title}`,
    `Total: ${formatRupiah(order.amount)}`,
    `Nama: ${order.customerName}`,
    `WA: ${order.customerPhone}`,
    `Email: ${order.customerEmail}`,
    ``,
    `Download: ${downloadUrl}`
  ].join("\n");

  const tasks = [sendFonnteMessage(order.customerPhone, buyerMessage)];
  if (ownerTarget) tasks.push(sendFonnteMessage(ownerTarget, ownerMessage));

  const results = await Promise.allSettled(tasks);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[fonnte] notification failed", result.reason);
    }
  }
}
