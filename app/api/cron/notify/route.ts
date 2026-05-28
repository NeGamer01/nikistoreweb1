import { getPanelServers, markNotified } from "@/lib/panelServerStore";
import { sendFonnteMessage } from "@/lib/fonnte";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const now = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const threshold = now + threeDaysMs;

    const servers = await getPanelServers();

    const notifications: Array<{
      orderId: string;
      phone: string;
      serverName: string;
      daysLeft: number;
      success: boolean;
    }> = [];

    for (const server of servers) {
      const timeLeft = server.expiresAt - now;

      if (timeLeft <= 0 || timeLeft > threshold) {
        continue;
      }

      const daysLeft = Math.ceil(timeLeft / (24 * 60 * 60 * 1000));

      if (server.lastNotifiedAt) {
        const hoursSinceNotify = (now - server.lastNotifiedAt) / (60 * 60 * 1000);
        if (hoursSinceNotify < 12) continue;
      }

      const message = `Halo! Server panel "${server.serverName}" kamu akan expired dalam ${daysLeft} hari (${new Date(server.expiresAt).toLocaleDateString("id-ID")}). Silakan perpanjang di https://nikistore.vercel.app/my-servers untuk menghindari server dihapus.`;

      try {
        await sendFonnteMessage(server.phone, message);
        await markNotified(server.orderId);
        notifications.push({
          orderId: server.orderId,
          phone: server.phone,
          serverName: server.serverName,
          daysLeft,
          success: true
        });
      } catch (error) {
        notifications.push({
          orderId: server.orderId,
          phone: server.phone,
          serverName: server.serverName,
          daysLeft,
          success: false
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notified: notifications.length,
        details: notifications
      }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Cron notification error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
