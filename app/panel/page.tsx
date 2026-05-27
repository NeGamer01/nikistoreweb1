"use client";

import { Server, Power, Loader2 } from "lucide-react";
import { PanelOrderForm } from "@/components/PanelOrderForm";
import { Topbar } from "@/components/Topbar";
import { useCallback, useEffect, useState } from "react";

export default function PanelOrderPage() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    fetch("/api/panel-settings")
      .then((r) => r.json())
      .then((d) => setEnabled(Boolean(d.enabled)))
      .catch(() => setEnabled(true));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function toggle() {
    if (enabled === null) return;
    setBusy(true);
    try {
      const res = await fetch("/api/panel-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled })
      });
      if (res.ok) setEnabled(!enabled);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <Topbar />

      <section className="panel-hero">
        <span className="eyebrow">Pterodactyl</span>
        <h1>Order Panel Custom</h1>
        <p>Pilih spesifikasi server sesuai kebutuhan. Setelah QRIS dibayar, server otomatis dibuat dan kredensial dikirim via WhatsApp.</p>

        <div className="panel-toggle" style={{ marginTop: "1.25rem", display: "inline-flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 1rem", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "999px", background: "rgba(255,255,255,0.03)" }}>
          <Power size={16} />
          <span>Status: {enabled === null ? "..." : enabled ? "Aktif" : "Nonaktif"}</span>
          <button
            type="button"
            onClick={toggle}
            disabled={enabled === null || busy}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "999px",
              border: "none",
              cursor: busy ? "wait" : "pointer",
              fontWeight: 600,
              fontSize: "0.85rem",
              background: enabled ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
              color: enabled ? "#f87171" : "#4ade80"
            }}
          >
            {busy ? "..." : enabled ? "Matikan" : "Aktifkan"}
          </button>
        </div>
      </section>

      {enabled === null ? (
        <section className="checkout-layout">
          <div style={{ textAlign: "center", padding: "3rem 1rem", opacity: 0.6 }}>
            <Loader2 className="spin" size={24} style={{ margin: "0 auto" }} />
          </div>
        </section>
      ) : enabled ? (
        <section className="checkout-layout">
          <div className="checkout-summary">
            <div className="panel-icon">
              <Server size={40} />
            </div>
            <span className="eyebrow">Auto Provisioning</span>
            <h2>Cara order</h2>
            <ol className="ordered-list">
              <li>Pilih nama server dan username panel.</li>
              <li>Atur RAM, disk, dan CPU.</li>
              <li>Bayar via QRIS.</li>
              <li>Server otomatis dibuat dan kredensial dikirim ke WhatsApp.</li>
            </ol>
            <p className="muted-note">Username hanya huruf, angka, dan _ (3-32 karakter). Simpan kredensial yang dikirim, ganti password setelah login.</p>
          </div>
          <PanelOrderForm />
        </section>
      ) : (
        <section className="checkout-layout">
          <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
            <Power size={48} style={{ opacity: 0.4, margin: "0 auto 1rem" }} />
            <h2 style={{ marginBottom: "0.5rem" }}>Order Panel Ditutup Sementara</h2>
            <p style={{ opacity: 0.7 }}>Silakan hubungi admin untuk informasi lebih lanjut.</p>
          </div>
        </section>
      )}
    </main>
  );
}
