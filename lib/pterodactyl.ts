import type { PanelSelection } from "./panelPricing";
import { getServerCredentials, type ServerConfig } from "./servers";

export type PanelCreationInput = {
  serverName: string;
  username: string;
  selection: PanelSelection;
  server: ServerConfig;
};

export type PanelCreationSuccess = {
  ok: true;
  panelUrl: string;
  username: string;
  password?: string;
  email?: string;
  serverId?: string | number;
  raw: unknown;
};

export type PanelCreationFailure = {
  ok: false;
  message: string;
  status?: number;
  raw?: unknown;
};

export type PanelCreationResult = PanelCreationSuccess | PanelCreationFailure;

export function isPterodactylConfigured(server: ServerConfig) {
  const creds = getServerCredentials(server);
  return Boolean(server.panelUrl && creds.ptla && creds.ptlc && creds.wrapperUrl);
}

function panelUrl(domain: string) {
  if (/^https?:\/\//i.test(domain)) return domain.replace(/\/$/, "");
  return `https://${domain.replace(/\/$/, "")}`;
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

export async function createPterodactylServer(
  input: PanelCreationInput
): Promise<PanelCreationResult> {
  const creds = getServerCredentials(input.server);
  if (!isPterodactylConfigured(input.server)) {
    return { ok: false, message: `Konfigurasi server ${input.server.name} belum lengkap.` };
  }

  const params = new URLSearchParams({
    domain: input.server.panelUrl,
    ptla: creds.ptla,
    ptlc: creds.ptlc,
    loc: String(input.server.locationId),
    eggid: String(input.selection.eggId),
    nestid: String(input.selection.nestId),
    ram: String(input.selection.ram),
    disk: String(input.selection.disk),
    cpu: String(input.selection.cpu),
    username: input.username,
    name: input.serverName
  });

  const url = `${creds.wrapperUrl.replace(/\/$/, "")}/api/pterodactyl/create?${params.toString()}`;

  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error.";
    return { ok: false, message: `Gagal hubungi wrapper Pterodactyl: ${message}` };
  }

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    return {
      ok: false,
      status: res.status,
      message: "Response wrapper Pterodactyl bukan JSON valid.",
      raw: text
    };
  }

  const failed =
    !res.ok ||
    data?.error === true ||
    (Object.prototype.hasOwnProperty.call(data || {}, "status") && data?.status === false);

  if (failed) {
    return {
      ok: false,
      status: res.status,
      message: typeof data?.message === "string" ? data.message : "Wrapper Pterodactyl gagal membuat server.",
      raw: data
    };
  }

  const result = data?.result || data?.data || data;
  const username = pickString(result?.username, result?.user?.username, input.username) || input.username;
  const password = pickString(result?.password, result?.user?.password);
  const email = pickString(result?.email, result?.user?.email);
  const serverId =
    (typeof result?.id_server === "string" || typeof result?.id_server === "number") ? result.id_server :
    (typeof result?.serverId === "string" || typeof result?.serverId === "number") ? result.serverId :
    (typeof result?.id === "string" || typeof result?.id === "number") ? result.id :
    undefined;

  return {
    ok: true,
    panelUrl: panelUrl(input.server.panelUrl),
    username,
    password,
    email,
    serverId,
    raw: data
  };
}
