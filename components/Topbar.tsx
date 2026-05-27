"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Server, ShoppingBag } from "lucide-react";

export function Topbar() {
  const pathname = usePathname() || "";
  const onPanel = pathname === "/panel" || pathname.startsWith("/panel/");
  const [panelOn, setPanelOn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/panel-settings")
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setPanelOn(Boolean(d.enabled)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <header className="topbar">
      <Link href="/" className="brand" aria-label="NikiStore">
        <span className="brand-mark">
          <ShoppingBag size={19} />
        </span>
        <span>NikiStore</span>
      </Link>
      <nav className="topbar-tabs" aria-label="Navigasi">
        <Link href="/" className={`tab${!onPanel ? " active" : ""}`}>
          <ShoppingBag size={15} />
          Produk
        </Link>
        <Link href="/panel" className={`tab${onPanel ? " active" : ""}`}>
          <Server size={15} />
          Order Panel
        </Link>
      </nav>
    </header>
  );
}
