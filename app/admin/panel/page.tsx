"use client";

import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/format";
import { formatDate } from "@/lib/date";

type PanelOrder = {
  _id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: number;
  status: "pending" | "paid" | "expired";
  createdAt: number;
  panel?: {
    username: string;
    serverId: string;
    serverName: string;
    ram: number;
    disk: number;
    cpu: number;
  };
};

export default function AdminPanelPage() {
  const [orders, setOrders] = useState<PanelOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/panel-orders")
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", marginBottom: "2rem" }}>
        Panel Orders
      </h1>

      {loading ? (
        <div style={{ color: "#fff", textAlign: "center", padding: "4rem" }}>Loading...</div>
      ) : orders.length === 0 ? (
        <div style={{
          background: "#1e293b",
          borderRadius: "0.75rem",
          padding: "3rem",
          textAlign: "center",
          color: "rgba(255,255,255,0.5)"
        }}>
          Belum ada panel orders
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1.5rem" }}>
          {orders.map((order) => (
            <div
              key={order._id}
              style={{
                background: "#1e293b",
                borderRadius: "0.75rem",
                padding: "1.5rem",
                border: "1px solid rgba(255,255,255,0.1)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div>
                  <div style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                    {order._id}
                  </div>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: "1.1rem" }}>
                    {order.customerName}
                  </div>
                </div>
                <span style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "999px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  background: order.status === "paid" ? "rgba(16, 185, 129, 0.2)" :
                             order.status === "pending" ? "rgba(245, 158, 11, 0.2)" :
                             "rgba(239, 68, 68, 0.2)",
                  color: order.status === "paid" ? "#10b981" :
                        order.status === "pending" ? "#f59e0b" :
                        "#ef4444"
                }}>
                  {order.status}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.25rem" }}>Email</div>
                  <div style={{ color: "#fff", fontSize: "0.9rem" }}>{order.customerEmail}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.25rem" }}>Phone</div>
                  <div style={{ color: "#fff", fontSize: "0.9rem" }}>{order.customerPhone}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.25rem" }}>Amount</div>
                  <div style={{ color: "#10b981", fontSize: "0.9rem", fontWeight: 600 }}>{formatRupiah(order.amount)}</div>
                </div>
              </div>

              {order.panel && (
                <div style={{
                  background: "rgba(99, 102, 241, 0.1)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  borderRadius: "0.5rem",
                  padding: "1rem"
                }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#818cf8", marginBottom: "0.75rem" }}>
                    Panel Details
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem" }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.25rem" }}>Username</div>
                      <div style={{ color: "#fff", fontSize: "0.9rem", fontFamily: "monospace" }}>{order.panel.username}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.25rem" }}>Server</div>
                      <div style={{ color: "#fff", fontSize: "0.9rem" }}>{order.panel.serverName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.25rem" }}>Specs</div>
                      <div style={{ color: "#fff", fontSize: "0.9rem" }}>
                        {order.panel.ram}GB / {order.panel.disk}GB / {order.panel.cpu}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: "0.75rem" }}>
                {formatDate(order.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
