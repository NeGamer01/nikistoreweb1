import { NextResponse } from "next/server";
import { notifyPanelOrder, notifySuccessfulOrder } from "@/lib/notifications";
import { checkPayment } from "@/lib/okepay";
import { isPanelOrder, isPaymentExpired, verifyOrderToken } from "@/lib/orders";
import { updateOrderStatus } from "@/lib/orderStore";
import { getPanelResult, releasePanelLock, savePanelResult, tryAcquirePanelLock } from "@/lib/panelStore";
import { getProductById } from "@/lib/products";
import { createPterodactylServer, isPterodactylConfigured } from "@/lib/pterodactyl";
import { getServerById, recordPanelOrder } from "@/lib/servers";

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

  try {
    const payment = await checkPayment(order);
    if (!payment.paid) {
      if (isPaymentExpired(order)) {
        return NextResponse.json({ status: "expired", message: "Invoice kedaluwarsa." });
      }
      return NextResponse.json({
        status: "pending",
        message: payment.reason === "missing_config" ? "Payment config belum aktif." : "Belum ada mutasi cocok."
      });
    }

    if (isPanelOrder(order)) {
      const serverConfig = getServerById(order.panel.serverId);
      if (!serverConfig) {
        return NextResponse.json(
          { status: "error", message: "Server tidak ditemukan untuk order ini." },
          { status: 500 }
        );
      }
      if (!isPterodactylConfigured(serverConfig)) {
        return NextResponse.json({
          status: "paid_pending_panel",
          message: "Pembayaran berhasil. Owner sedang setup panel manual."
        });
      }

      let panelResult = getPanelResult(order.id);
      if (!panelResult) {
        if (!tryAcquirePanelLock(order.id)) {
          return NextResponse.json({
            status: "paid_pending_panel",
            message: "Pembayaran berhasil. Server sedang dibuat."
          });
        }
        try {
          const result = await createPterodactylServer({
            serverName: order.panel.serverName,
            username: order.panel.username,
            selection: order.panel.selection,
            server: serverConfig
          });
          if (!result.ok) {
            return NextResponse.json(
              {
                status: "paid_panel_failed",
                message: `Pembayaran berhasil, tapi gagal membuat server: ${result.message}`
              },
              { status: 502 }
            );
          }
          panelResult = result;
          savePanelResult(order.id, result);
          await recordPanelOrder({
            orderId: order.id,
            serverId: serverConfig.id,
            username: result.username,
            panelUrl: result.panelUrl,
            raw: result.raw
          });
        } finally {
          releasePanelLock(order.id);
        }
      }

      await notifyPanelOrder({ order, panel: panelResult });
      await updateOrderStatus(order.id, "paid");
      return NextResponse.json({
        status: "paid",
        kind: "panel",
        panel: {
          panelUrl: panelResult.panelUrl,
          username: panelResult.username,
          password: panelResult.password,
          email: panelResult.email,
          serverId: panelResult.serverId
        }
      });
    }

    const product = getProductById(order.productId);
    if (!product) {
      return NextResponse.json({ status: "error", message: "Produk tidak ditemukan." }, { status: 404 });
    }

    const downloadPath = `/api/download/${encodeURIComponent(decodedToken)}`;
    await notifySuccessfulOrder({
      order,
      product,
      downloadUrl: new URL(downloadPath, getPublicOrigin(req)).toString()
    });
    await updateOrderStatus(order.id, "paid");
    return NextResponse.json({
      status: "paid",
      kind: "source",
      downloadUrl: downloadPath
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal cek mutasi.";
    return NextResponse.json({ status: "error", message }, { status: 502 });
  }
}
