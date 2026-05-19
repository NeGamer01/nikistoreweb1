import { normalizeWhatsAppTargets } from "./phone";

type FonnteResponse = {
  status?: boolean;
  Status?: boolean;
  reason?: string;
  detail?: string;
};

export async function sendFonnteMessage(target: string, message: string) {
  const token = process.env.FONNTE_TOKEN || process.env.FONNTE_DEVICE_TOKEN;
  if (!token) return { skipped: true, reason: "FONNTE_TOKEN kosong." };

  const normalizedTarget = normalizeWhatsAppTargets(target);
  if (!normalizedTarget) return { skipped: true, reason: "Target WhatsApp kosong." };

  const form = new FormData();
  form.set("target", normalizedTarget);
  form.set("message", message);
  form.set("countryCode", "62");
  form.set("preview", "false");
  form.set("typing", "true");

  const res = await fetch(process.env.FONNTE_API_URL || "https://api.fonnte.com/send", {
    method: "POST",
    headers: {
      Authorization: token
    },
    body: form,
    cache: "no-store"
  });

  const data = (await res.json().catch(() => ({}))) as FonnteResponse;
  const ok = data.status ?? data.Status;
  if (!res.ok || ok === false) {
    throw new Error(data.reason || data.detail || "Gagal kirim pesan Fonnte.");
  }

  return { skipped: false, data };
}
