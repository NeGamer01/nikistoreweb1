import { compactDateTime, formatRupiah } from "./format";
import { sendFonnteMessage } from "./fonnte";
import { describeSelection } from "./panelPricing";
import { isPanelOrder, type OrderPayload } from "./orders";
import type { PanelCreationSuccess } from "./pterodactyl";
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
  if (isPanelOrder(order)) return;
  const key = `${order.id}:${order.amount}:source`;
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

  await dispatch(order.customerPhone, buyerMessage, ownerTarget, ownerMessage);
}

export async function notifyPanelOrder({
  order,
  panel
}: {
  order: OrderPayload;
  panel: PanelCreationSuccess;
}) {
  if (!isPanelOrder(order)) return;
  const key = `${order.id}:${order.amount}:panel`;
  const sent = notifiedOrders();
  if (sent.has(key)) return;
  sent.add(key);

  const specText = describeSelection(order.panel.selection);

  const buyerLines = [
    `Halo ${order.customerName}, pembayaran panel kamu berhasil.`,
    ``,
    `Detail transaksi:`,
    `Order ID: ${order.id}`,
    `Server: ${order.panel.serverName}`,
    `Spesifikasi: ${specText}`,
    `Total dibayar: ${formatRupiah(order.amount)}`,
    ``,
    `Akses panel:`,
    `URL: ${panel.panelUrl}`,
    `Username: ${panel.username}`
  ];
  if (panel.password) buyerLines.push(`Password: ${panel.password}`);
  if (panel.email) buyerLines.push(`Email login: ${panel.email}`);
  buyerLines.push(``, `Simpan kredensial ini di tempat aman dan ganti password setelah login.`);

  const ownerTarget = process.env.OWNER_WHATSAPP_NUMBER || "";
  const ownerLines = [
    `Panel order sukses`,
    ``,
    `Order: ${order.id}`,
    `Server: ${order.panel.serverName}`,
    `Spesifikasi: ${specText}`,
    `Total: ${formatRupiah(order.amount)}`,
    `Nama: ${order.customerName}`,
    `WA: ${order.customerPhone}`,
    `Username panel: ${panel.username}`,
    `Panel URL: ${panel.panelUrl}`
  ];
  if (panel.serverId !== undefined) ownerLines.push(`Server ID: ${panel.serverId}`);

  await dispatch(order.customerPhone, buyerLines.join("\n"), ownerTarget, ownerLines.join("\n"));
}

async function dispatch(buyerTarget: string, buyerMessage: string, ownerTarget: string, ownerMessage: string) {
  const tasks = [sendFonnteMessage(buyerTarget, buyerMessage)];
  if (ownerTarget) tasks.push(sendFonnteMessage(ownerTarget, ownerMessage));
  const settled = await Promise.allSettled(tasks);
  for (const result of settled) {
    if (result.status === "rejected") {
      console.error("[fonnte] notification failed", result.reason);
    }
  }
}
