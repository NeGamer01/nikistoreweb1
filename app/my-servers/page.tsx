"use client";

import { useState, useEffect } from "react";
import { Search, Server, Calendar, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";

type PanelServer = {
  _id: string;
  orderId: string;
  serverName: string;
  username: string;
  phone: string;
  email: string;
  pterodactylServerId?: string | number;
  panelUrl: string;
  ram: number;
  disk: number;
  cpu: number;
  eggId: number;
  eggName: string;
  createdAt: number;
  expiresAt: number;
  renewedCount: number;
};

export default function MyServersPage() {
  const [query, setQuery] = useState("");
  const [servers, setServers] = useState<PanelServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async (searchQuery?: string) => {
    const q = searchQuery ?? query;
    if (!q.trim()) {
      setServers([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/my-servers?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setServers(data.servers || []);
    } catch (error) {
      console.error("Search failed:", error);
      setServers([]);
    } finally {
      setLoading(false);
    }
  };

  const formatExpireDate = (expiresAt: number) => {
    const date = new Date(expiresAt);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const getDaysLeft = (expiresAt: number) => {
    const days = Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getExpireColor = (expiresAt: number) => {
    const days = getDaysLeft(expiresAt);
    if (days <= 0) return "bg-red-500/20 text-red-400 border-red-500/30";
    if (days <= 3) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    if (days <= 7) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-green-500/20 text-green-400 border-green-500/30";
  };

  const formatSpecs = (ram: number, disk: number, cpu: number) => {
    const ramStr = ram === 0 ? "Unlimited" : `${ram}MB`;
    const diskStr = disk === 0 ? "Unlimited" : `${disk}MB`;
    const cpuStr = cpu === 0 ? "Unlimited" : `${cpu}%`;
    return `${ramStr} / ${diskStr} / ${cpuStr}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Server Saya</h1>
          <p className="text-slate-400">
            Cari server panel kamu dengan nomor WhatsApp, email, atau nama server
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-8 backdrop-blur-sm">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && search()}
                placeholder="Masukkan nomor WhatsApp, email, atau nama server..."
                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500"
              />
            </div>
            <button
              onClick={() => search()}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={20} />
              ) : (
                <Search size={20} />
              )}
              Cari
            </button>
          </div>
        </div>

        {searched && servers.length === 0 && !loading && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 backdrop-blur-sm text-center">
            <AlertCircle className="mx-auto mb-4 text-slate-500" size={48} />
            <p className="text-slate-400 text-lg">
              Tidak ada server yang ditemukan untuk pencarian tersebut
            </p>
            <p className="text-slate-500 text-sm mt-2">
              Pastikan nomor WhatsApp, email, atau nama server sudah benar
            </p>
          </div>
        )}

        {servers.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">
              Ditemukan {servers.length} server
            </h2>
            {servers.map((server) => {
              const daysLeft = getDaysLeft(server.expiresAt);
              const isExpired = daysLeft <= 0;

              return (
                <div
                  key={server._id}
                  className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <Server className="text-blue-400 mt-1" size={24} />
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-1">
                            {server.serverName}
                          </h3>
                          <p className="text-slate-400 text-sm">
                            {server.eggName} • {server.username}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-slate-500 text-xs mb-1">Spesifikasi</p>
                          <p className="text-white font-medium">
                            {formatSpecs(server.ram, server.disk, server.cpu)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">Diperpanjang</p>
                          <p className="text-white font-medium">
                            {server.renewedCount}x
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">Kadaluarsa</p>
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-slate-400" />
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getExpireColor(server.expiresAt)}`}>
                              {formatExpireDate(server.expiresAt)}
                              {daysLeft > 0 && ` (${daysLeft} hari)`}
                              {daysLeft <= 0 && " (Expired)"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-sm text-slate-400">
                        <span>📧 {server.email}</span>
                        <span>•</span>
                        <span>📱 {server.phone}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link
                        href={server.panelUrl}
                        target="_blank"
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors text-center"
                      >
                        Buka Panel
                      </Link>
                      <Link
                        href={`/renew/${server.orderId}`}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors text-center ${
                          isExpired
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {isExpired ? "Aktifkan Kembali" : "Perpanjang"}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
