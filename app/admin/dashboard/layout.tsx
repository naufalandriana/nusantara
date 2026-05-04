// app/admin/dashboard/layout.tsx
"use client";

import { useState, useEffect } from "react";
import Sidebar, { SIDEBAR_W, COLLAPSED_W } from "@/app/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Ambil preferensi collapse dari localStorage
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved !== null) setIsCollapsed(saved === "true");

    // Deteksi mobile
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsCollapsed(true);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Simpan state ke localStorage
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("sidebarCollapsed", String(isCollapsed));
  }, [isCollapsed, mounted]);

  const sidebarW = isCollapsed ? COLLAPSED_W : SIDEBAR_W;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0f1e" }}>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <main
        style={{
          flex: 1,
          marginLeft: `${sidebarW}px`,
          transition: "margin-left 0.3s cubic-bezier(0.4,0,0.2,1)",
          minHeight: "100vh",
          background: "radial-gradient(circle at 0% 0%, #111827 0%, #0f172a 100%)",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            padding: "32px",
            maxWidth: "1400px",
            margin: "0",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}