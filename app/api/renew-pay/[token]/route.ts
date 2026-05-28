import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { renewPanelServer, getPanelServer } from "@/lib/panelServerStore";
import { sendFonnteMessage } from "@/lib/fonnte";
import { formatRupiah } from "@/lib/format";

type RenewToken = {
  orderId: string;
  type: "renew";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serverName: string;
  amount: number;
  uniqueCode: number;
  createdAt: number;
  expiresAt: number;
};

function verifyToken(token: string): RenewToken | null {
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const secret = process.env.JWT_SECRET || "default-secret";
  const expected = createHmac("sha256", secret)
    .update(payloadB64)
    .digest("hex");

  if (expected !== signature) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf8"));
    if (payload.type !== "renew") return null;
    if (Date.now() > payload.expiresAt) return null;
    return payload as RenewToken;
  } catch {
    return null;
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const decoded = decodeURIComponent(token);

  const renewData = verifyToken(decoded);
  if (!renewData) {
    return NextResponse.json({
      status: "error",
      message: "Token perpanjangan tidak valid atau sudah kadaluarsa."
    });
  }

  const server = await getPanelServer(renewData.orderId);
  if (!server) {
    return NextResponse.json({
      status: "error",
      message: "Server tidak ditemukan."
    });
  }

  try {
    const okepayToken = process.env.OKEPAY_TOKEN;
    const okepayApiKey = process.env.OKEPAY_API_KEY;

    if (!okepayToken || !okepayApiKey) {
      return NextResponse.json({
        status: "pending",
        message: "Payment config belum aktif."
      });
    }

    const checkUrl = new URL("https://api.okepay.co.id/v1/transactions");
    checkUrl.searchParams.set("amount", String(renewData.amount));
    checkUrl.searchParams.set("limit", "10");

    const res = await fetch(checkUrl.toString(), {
      headers: {
        Authorization: `Bearer ${okepayToken}`,
        "X-API-Key": okepayApiKey
      },
      cache: "no-store"
    });

    const data = await res.json();
    const transactions = data.data || [];

    const matched = transactions.some((tx: any) => {
      const txAmount = typeof tx.amount === "number" ? tx.amount : parseInt(tx.amount);
      const status = (tx.status || "").toLowerCase();
      return txAmount === renewData.amount && (status === "success" || status === "completed" || status === "paid");
    });

    if (!matched) {
      return NextResponse.json({
        status: "pending",
        message: "Belum ada pembayaran yang cocok."
      });
    }

    const RENEW_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
    const updated = await renewPanelServer(renewData.orderId, RENEW_DURATION_MS);

    if (!updated) {
      return NextResponse.json({
        status: "error",
        message: "Gagal memperpanjang server."
      });
    }

    const expireDate = new Date(updated.expiresAt).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const buyerMessage = [
      `Halo ${renewData.customerName}, perpanjangan server berhasil.`,
      ``,
      `Detail transaksi:`,
      `Server: ${renewData.serverName}`,
      `Total dibayar: ${formatRupiah(renewData.amount)}`,
      `Masa aktif baru: ${expireDate}`,
      ``,
      `Terima kasih telah memperpanjang server Anda.`
    ].join("\n");

    const ownerTarget = process.env.OWNER_WHATSAPP_NUMBER || "";
    const ownerMessage = [
      `Perpanjangan server berhasil`,
      ``,
      `Order ID: ${renewData.orderId}`,
      `Server: ${renewData.serverName}`,
      `Total: ${formatRupiah(renewData.amount)}`,
      `Nama: ${renewData.customerName}`,
      `WA: ${renewData.customerPhone}`,
      `Masa aktif baru: ${expireDate}`
    ].join("\n");

    const tasks = [sendFonnteMessage(renewData.customerPhone, buyerMessage)];
    if (ownerTarget) tasks.push(sendFonnteMessage(ownerTarget, ownerMessage));

    await Promise.allSettled(tasks);

    return NextResponse.json({
      status: "paid",
      newExpiresAt: updated.expiresAt,
      newExpireDate: expireDate
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal cek pembayaran.";
    return NextResponse.json({ status: "error", message }, { status: 502 });
  }
}
