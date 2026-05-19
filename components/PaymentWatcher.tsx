"use client";

import { CheckCircle2, Clock3, Download, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Status = {
  status: "pending" | "paid" | "expired" | "error";
  message?: string;
  downloadUrl?: string;
};

export function PaymentWatcher({ token }: { token: string }) {
  const [state, setState] = useState<Status>({ status: "pending" });
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(token)}`, { cache: "no-store" });
      const data = (await res.json()) as Status;
      setState(data);
    } catch {
      setState({ status: "error", message: "Gagal cek pembayaran." });
    } finally {
      setChecking(false);
    }
  }, [token]);

  useEffect(() => {
    if (state.status !== "pending" || state.message === "Payment config belum aktif.") return;
    check();
    const timer = window.setInterval(check, 6000);
    return () => window.clearInterval(timer);
  }, [check, state.message, state.status]);

  if (state.status === "paid") {
    return (
      <div className="status-box paid">
        <CheckCircle2 size={22} />
        <div>
          <strong>Pembayaran diterima</strong>
          <p>Source code siap diunduh.</p>
        </div>
        <a className="icon-button primary" href={state.downloadUrl}>
          <Download size={18} />
          Download
        </a>
      </div>
    );
  }

  if (state.status === "expired") {
    return (
      <div className="status-box expired">
        <Clock3 size={22} />
        <div>
          <strong>Invoice kedaluwarsa</strong>
          <p>Buat checkout baru untuk nominal unik baru.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="status-box">
      {checking ? <Loader2 className="spin" size={22} /> : <Clock3 size={22} />}
      <div>
        <strong>Menunggu pembayaran</strong>
        <p>{state.message || "Status otomatis dicek tiap beberapa detik."}</p>
      </div>
      <button className="icon-button ghost" type="button" onClick={check} disabled={checking} aria-label="Cek ulang">
        <RefreshCw size={18} />
      </button>
    </div>
  );
}
