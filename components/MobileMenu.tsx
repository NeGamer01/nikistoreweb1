"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(true)}
        className="mobile-menu-btn"
        style={{
          position: "fixed",
          top: "1rem",
          left: "1rem",
          zIndex: 50,
          padding: "0.5rem",
          background: "#6366f1",
          border: "none",
          borderRadius: "0.5rem",
          color: "#fff",
          cursor: "pointer",
          display: "none"
        }}
      >
        <Menu size={24} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 35
          }}
          className="mobile-overlay"
        />
      )}

      {/* Close button */}
      {isOpen && (
        <button
          onClick={() => setIsOpen(false)}
          className="mobile-close-btn"
          style={{
            position: "fixed",
            top: "1rem",
            right: "1rem",
            zIndex: 45,
            padding: "0.5rem",
            background: "#ef4444",
            border: "none",
            borderRadius: "0.5rem",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          <X size={24} />
        </button>
      )}

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: block !important;
          }
          .admin-sidebar {
            ${isOpen ? "transform: translateX(0) !important;" : ""}
          }
        }
      `}</style>
    </>
  );
}
