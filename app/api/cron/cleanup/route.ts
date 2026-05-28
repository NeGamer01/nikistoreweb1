import { deletePanelServer, getExpiredPanelServers } from "@/lib/panelServerStore";
import { deletePterodactylServer } from "@/lib/pterodactyl";
import { getServerById } from "@/lib/servers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const expiredServers = await getExpiredPanelServers();

    const deleted: Array<{
      orderId: string;
      serverName: string;
      pterodactylServerId?: string | number;
      dbDeleted: boolean;
      pterodactylDeleted: boolean;
      error?: string;
    }> = [];

    for (const server of expiredServers) {
      let pterodactylDeleted = false;
      let error: string | undefined;

      try {
        const serverConfig = getServerById(server.serverId);
        if (serverConfig && server.pterodactylServerId) {
          const result = await deletePterodactylServer(
            serverConfig,
            server.pterodactylServerId
          );
          pterodactylDeleted = result.success;
          if (!result.success) {
            error = result.error;
          }
        }
      } catch (err) {
        error = err instanceof Error ? err.message : "Unknown error";
      }

      let dbDeleted = false;
      try {
        await deletePanelServer(server.orderId);
        dbDeleted = true;
      } catch (err) {
        error = err instanceof Error ? err.message : "Unknown error";
      }

      deleted.push({
        orderId: server.orderId,
        serverName: server.serverName,
        pterodactylServerId: server.pterodactylServerId,
        dbDeleted,
        pterodactylDeleted,
        error
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        deleted: deleted.length,
        details: deleted
      }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Cron cleanup error:", error);
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
