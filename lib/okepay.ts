import type { OrderPayload } from "./orders";

export type QrisPayment = {
  qrisUrl: string;
  qrisString?: string;
  provider: "okepay" | "demo";
};

export type PaymentCheck =
  | { paid: true; mutation: unknown }
  | { paid: false; reason: "pending" | "missing_config" };

const AMOUNT_KEYS = /^(amount|nominal|jumlah|total|kredit|credit|paid|value|harga)$/i;
const TIME_KEYS = /^(created_at|tanggal|date|waktu|time|datetime|transaction_time)$/i;

function getApiKey() {
  return process.env.OKEPAY_API_KEY || "";
}

function buildUrl(action: string, params: Record<string, string | number> = {}) {
  const base = process.env.OKEPAY_BASE_URL || "https://apipay.nikistore.biz.id/api.php";
  const url = new URL(base);
  url.searchParams.set("apikey", getApiKey());
  url.searchParams.set("action", action);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  return url;
}

function parseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Response Okepay bukan JSON valid.");
  }
}

function getMessage(json: unknown) {
  if (json && typeof json === "object" && "message" in json) {
    const value = (json as { message?: unknown }).message;
    if (typeof value === "string") return value;
  }
  return "Request Okepay gagal.";
}

export async function createQrisPayment(amount: number): Promise<QrisPayment> {
  if (!getApiKey()) {
    return {
      provider: "demo",
      qrisString: `DEMO-ORDER-${amount}`,
      qrisUrl: `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(
        `DEMO-ORDER-${amount}`
      )}`
    };
  }

  const res = await fetch(buildUrl("qris_dinamis", { nominal: amount }), {
    method: "POST",
    headers: { accept: "application/json" },
    cache: "no-store"
  });
  const json = parseJson(await res.text());
  if (!res.ok || json?.status === false) throw new Error(getMessage(json));

  const data = json?.data || json?.result || json?.results || json;
  const qrisUrl = data?.qris_url || data?.qrisUrl || data?.qr_url;
  const qrisString = data?.qris_string || data?.qrisString || data?.qris;
  if (!qrisUrl && !qrisString) throw new Error("QRIS tidak ditemukan di response Okepay.");

  return {
    provider: "okepay",
    qrisUrl:
      qrisUrl ||
      `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(
        qrisString
      )}`,
    qrisString
  };
}

async function fetchMutations() {
  if (!getApiKey()) return null;

  const res = await fetch(buildUrl("qris_mutasi", { page: 1 }), {
    headers: { accept: "application/json" },
    cache: "no-store"
  });
  const json = parseJson(await res.text());
  if (!res.ok || json?.status === false) throw new Error(getMessage(json));

  const candidates = [
    json?.data?.mutasi,
    json?.mutasi,
    json?.results?.mutasi,
    json?.data?.qris_history?.results,
    json?.qris_history?.results,
    json?.results
  ];
  return candidates.find(Array.isArray) || [];
}

function normalizeAmount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.abs(Math.round(value));
  if (typeof value !== "string") return null;

  let text = value.trim().replace(/[^\d.,-]/g, "");
  if (!text) return null;
  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  const lastSep = Math.max(lastComma, lastDot);
  if (lastSep >= 0 && text.length - lastSep - 1 === 2) text = text.slice(0, lastSep);

  const number = Number(text.replace(/[^\d-]/g, ""));
  return Number.isFinite(number) ? Math.abs(number) : null;
}

function collectAmounts(value: unknown, amounts: number[] = []) {
  if (!value || typeof value !== "object") return amounts;
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (AMOUNT_KEYS.test(key)) {
      const amount = normalizeAmount(item);
      if (amount !== null) amounts.push(amount);
    }
    if (item && typeof item === "object") collectAmounts(item, amounts);
  }
  return amounts;
}

function collectTimes(value: unknown, times: number[] = []) {
  if (!value || typeof value !== "object") return times;
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (TIME_KEYS.test(key) && typeof item === "string") {
      const parsed = Date.parse(item);
      if (Number.isFinite(parsed)) times.push(parsed);
    }
    if (item && typeof item === "object") collectTimes(item, times);
  }
  return times;
}

function looksOutgoing(record: unknown) {
  const text = JSON.stringify(record).toLowerCase();
  const outgoing = ["debit", "keluar", "refund", "withdraw"].some((word) => text.includes(word));
  const incoming = ["credit", "kredit", "masuk", "qris", "success", "berhasil"].some((word) =>
    text.includes(word)
  );
  return outgoing && !incoming;
}

function matchesOrder(order: OrderPayload, record: unknown) {
  if (looksOutgoing(record)) return false;
  if (!collectAmounts(record).includes(order.amount)) return false;

  const times = collectTimes(record);
  if (times.length === 0) return true;
  return times.some((time) => time >= order.createdAt - 10 * 60 * 1000 && time <= order.downloadExpiresAt);
}

export async function checkPayment(order: OrderPayload): Promise<PaymentCheck> {
  const mutations = await fetchMutations();
  if (mutations === null) return { paid: false, reason: "missing_config" };

  const mutation = mutations.find((record) => matchesOrder(order, record));
  return mutation ? { paid: true, mutation } : { paid: false, reason: "pending" };
}
