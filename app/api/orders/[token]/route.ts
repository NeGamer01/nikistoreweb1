import { NextResponse } from "next/server";
import { notifySuccessfulOrder } from "@/lib/notifications";
import { checkPayment } from "@/lib/okepay";
import { isPaymentExpired, verifyOrderToken } from "@/lib/orders";
import { getProductById } from "@/lib/products";

export const runtime = "nodejs";

function getPublicOrigin(req: Request) {
  return process.env.SITE_URL || new URL(req.url).origin;
}

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const decodedToken = decodeURIComponent(token);
  let order;
  try {
    order = verifyOrderToken(decodedToken);
  } catch {
    return NextResponse.json({ status: "error", message: "Token order tidak valid." }, { status: 400 });
  }
  const product = getProductById(order.productId);
  if (!product) {
    return NextResponse.json({ status: "error", message: "Produk tidak ditemukan." }, { status: 404 });
  }

  try {
    const payment = await checkPayment(order);
    if (payment.paid) {
      const downloadPath = `/api/download/${encodeURIComponent(decodedToken)}`;
      await notifySuccessfulOrder({
        order,
        product,
        downloadUrl: new URL(downloadPath, getPublicOrigin(req)).toString()
      });
      return NextResponse.json({
        status: "paid",
        downloadUrl: downloadPath
      });
    }
    if (isPaymentExpired(order)) {
      return NextResponse.json({ status: "expired", message: "Invoice kedaluwarsa." });
    }
    return NextResponse.json({
      status: "pending",
      message: payment.reason === "missing_config" ? "Payment config belum aktif." : "Belum ada mutasi cocok."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal cek mutasi.";
    return NextResponse.json({ status: "error", message }, { status: 502 });
  }
}
