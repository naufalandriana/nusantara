// app/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
  LayoutDashboard,
  Package,
  User,
  CreditCard,
  Lock,
  LogOut,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { createSupabaseBrowser } from "@/app/lib/supabase/client";

/* ─── ICONS ─── */
const IconOverview     = () => <LayoutDashboard size={18} strokeWidth={1.8} />;
const IconProduct      = () => <Package         size={18} strokeWidth={1.8} />;
const IconCustomer     = () => <User            size={18} strokeWidth={1.8} />;
const IconTransaction  = () => <CreditCard      size={18} strokeWidth={1.8} />;
const IconAccess       = () => <Lock            size={18} strokeWidth={1.8} />;
const IconLogout       = () => <LogOut          size={18} strokeWidth={1.8} />;
const IconChevronRight = () => <ChevronRight    size={14} strokeWidth={2.5} />;
const IconChevronLeft  = () => <ChevronLeft     size={14} strokeWidth={2.5} />;

const menus = [
  { name: "Overview",  path: "/admin/dashboard",              icon: <IconOverview />,     exact: true  },
  { name: "Produk",    path: "/admin/dashboard/products",     icon: <IconProduct />,      exact: false },
  { name: "Pelanggan", path: "/admin/dashboard/customers",    icon: <IconCustomer />,     exact: false },
  { name: "Transaksi", path: "/admin/dashboard/transactions", icon: <IconTransaction />,  exact: false },
  { name: "Access",    path: "/admin/dashboard/users",        icon: <IconAccess />,       exact: false },
];

export const SIDEBAR_W   = 260;
export const COLLAPSED_W = 72;

const LOGO_SIZE = 38;
const BRAND_PL  = 17;

interface SidebarProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (val: boolean) => void;
}

export default function Sidebar({ isCollapsed = false, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();

  // ✅ SUPABASE INSTANCE HANYA DIBUAT SEKALI
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const [mounted, setMounted] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    email: string;
    full_name?: string;
    role?: string;
  }>({ email: "", full_name: "", role: "" });

  useEffect(() => {
    setMounted(true);
    let ignore = false;

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email || ignore) return;

      const { data: userData } = await supabase
        .from("users")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (!ignore) {
        setUserInfo({
          email: user.email,
          full_name: userData?.full_name || user.user_metadata?.full_name || "",
          role: userData?.role || "user",
        });
      }
    };

    fetchUser();

    return () => {
      ignore = true;
    };
  }, [supabase]);

  const isActive = (path: string, exact: boolean) =>
    exact ? pathname === path : pathname === path || pathname.startsWith(path + "/");

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout gagal:", error);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("adminLoggedIn");
      sessionStorage.clear();
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=; expires=" + new Date().toUTCString() + "; path=/");
      });
    }
    router.replace("/admin");
  };

  if (!mounted) return null;

  const getInitial = () => {
    if (userInfo.full_name) return userInfo.full_name[0].toUpperCase();
    if (userInfo.email) return userInfo.email[0].toUpperCase();
    return "?";
  };

  const displayName  = userInfo.full_name || userInfo.email.split("@")[0] || "Pengguna";
  const displayEmail = userInfo.email;

  /* ─── Shared sidebar content ─── */
  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => {
    const txt: React.CSSProperties = {
      overflow:      "hidden",
      whiteSpace:    "nowrap",
      flexShrink:    0,
      maxWidth:      collapsed ? "0px" : "140px",
      opacity:       collapsed ? 0 : 1,
      pointerEvents: "none",
      marginLeft:    collapsed ? "0" : "4px",
    };

    return (
      <>
        {/* Brand */}
        <div
          style={{
            display:    "flex",
            alignItems: "center",
            gap:        "12px",
            flexShrink: 0,
            padding:    `28px 16px 24px ${BRAND_PL}px`,
          }}
        >
          <div
            style={{
              width:           LOGO_SIZE,
              height:          LOGO_SIZE,
              minWidth:        LOGO_SIZE,
              background:      "#ffd700",
              borderRadius:    "12px",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              fontWeight:      800,
              fontSize:        "17px",
              color:           "#0f172a",
              boxShadow:       "0 4px 12px rgba(255,215,0,0.2)",
              flexShrink:      0,
            }}
          >
            N
          </div>
          <div style={txt}>
            <div style={{ fontWeight: 800, fontSize: "14px", color: "#fff", letterSpacing: "-0.3px" }}>
              NusaAssets
            </div>
            <div style={{
              fontWeight:    700,
              fontSize:      "9px",
              color:         "rgba(255,215,0,0.55)",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginTop:     "3px",
            }}>
              Admin Panel
            </div>
          </div>
        </div>

        <div style={{
          height:     "1px",
          background: "rgba(255,255,255,0.05)",
          margin:     "0 12px 10px",
          flexShrink: 0,
        }} />

        {/* Navigation */}
        <nav
          style={{
            flex:          1,
            display:       "flex",
            flexDirection: "column",
            gap:           "4px",
            padding:       "0 8px",
            overflowY:     "auto",
            overflowX:     "hidden",
          }}
        >
          {menus.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <Link key={item.path} href={item.path} style={{ textDecoration: "none" }}>
                <div
                  title={collapsed ? item.name : undefined}
                  style={{
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: collapsed ? "center" : "flex-start",
                    gap:            "12px",
                    height:         "44px",
                    padding:        collapsed ? "0" : `0 12px 0 ${BRAND_PL - 8}px`,
                    borderRadius:   "12px",
                    background:     active && !collapsed ? "#ffd700" : "transparent",
                    color:          active ? (collapsed ? "#ffd700" : "#0f172a") : "#64748b",
                    fontWeight:     active ? 700 : 500,
                    fontSize:       "13.5px",
                    cursor:         "pointer",
                    transition:     "background 0.2s ease, color 0.2s ease",
                    userSelect:     "none",
                  }}
                  onMouseEnter={e => {
                    if (!active && !collapsed) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.color      = "#e2e8f0";
                    }
                    if (!collapsed) return;
                    const box = e.currentTarget.querySelector(".icon-box") as HTMLElement;
                    if (box && !active) {
                      box.style.background = "rgba(255,255,255,0.08)";
                      box.style.color      = "#e2e8f0";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active && !collapsed) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color      = "#64748b";
                    }
                    if (!collapsed) return;
                    const box = e.currentTarget.querySelector(".icon-box") as HTMLElement;
                    if (box && !active) {
                      box.style.background = "transparent";
                      box.style.color      = "#64748b";
                    }
                  }}
                >
                  <div
                    className="icon-box"
                    style={{
                      width:          collapsed ? LOGO_SIZE : "auto",
                      height:         collapsed ? LOGO_SIZE : "auto",
                      minWidth:       collapsed ? LOGO_SIZE : "auto",
                      display:        "flex",
                      alignItems:     "center",
                      justifyContent: "center",
                      borderRadius:   collapsed ? "12px" : "0",
                      background:     collapsed && active ? "rgba(255,215,0,0.12)" : "transparent",
                      color:          "inherit",
                      flexShrink:     0,
                      lineHeight:     0,
                      transition:     "background 0.2s, color 0.2s",
                      position:       "relative",
                    }}
                  >
                    {active && collapsed && (
                      <span style={{
                        position:     "absolute",
                        left:         0,
                        top:          "50%",
                        transform:    "translateY(-50%)",
                        width:        "3px",
                        height:       "18px",
                        borderRadius: "0 3px 3px 0",
                        background:   "#ffd700",
                      }} />
                    )}
                    {item.icon}
                  </div>
                  <span style={txt}>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer User & Logout */}
        <div
          style={{
            flexShrink:     0,
            borderTop:      "1px solid rgba(255,255,255,0.06)",
            padding:        "14px 8px 22px",
            display:        "flex",
            flexDirection:  "column",
            gap:            "8px",
          }}
        >
          {/* User info */}
          <div
            title={collapsed ? displayName : undefined}
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap:            "10px",
              padding:        collapsed ? "6px 0" : `8px ${BRAND_PL - 8}px`,
              borderRadius:   "12px",
              background:     "rgba(255,255,255,0.03)",
              minHeight:      "52px",
            }}
          >
            <div style={{
              width:          LOGO_SIZE,
              height:         LOGO_SIZE,
              minWidth:       LOGO_SIZE,
              borderRadius:   "10px",
              background:     "rgba(255,215,0,0.08)",
              border:         "1px solid rgba(255,215,0,0.15)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              color:          "#ffd700",
              fontWeight:     800,
              fontSize:       "14px",
              flexShrink:     0,
            }}>
              {getInitial()}
            </div>
            <div style={txt}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#e2e8f0", lineHeight: 1.3 }}>
                {displayName}
              </div>
              <div style={{ fontSize: "10.5px", color: "#475569", marginTop: "2px", lineHeight: 1.2 }}>
                {displayEmail}
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title={collapsed ? "Keluar" : undefined}
            style={{
              width:          "100%",
              display:        "flex",
              alignItems:     "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap:            "12px",
              height:         "42px",
              padding:        collapsed ? "0" : `0 12px 0 ${BRAND_PL - 8}px`,
              borderRadius:   "12px",
              background:     "transparent",
              border:         "none",
              color:          "rgba(248,113,113,0.65)",
              cursor:         "pointer",
              fontFamily:     "inherit",
              fontSize:       "13px",
              fontWeight:     600,
              transition:     "background 0.2s, color 0.2s",
              flexShrink:     0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = collapsed ? "transparent" : "rgba(239,68,68,0.08)";
              e.currentTarget.style.color      = "#f87171";
              if (collapsed) {
                const box = e.currentTarget.querySelector(".logout-box") as HTMLElement;
                if (box) box.style.background = "rgba(239,68,68,0.08)";
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color      = "rgba(248,113,113,0.65)";
              if (collapsed) {
                const box = e.currentTarget.querySelector(".logout-box") as HTMLElement;
                if (box) box.style.background = "transparent";
              }
            }}
          >
            <div
              className="logout-box"
              style={{
                width:          collapsed ? LOGO_SIZE : "auto",
                height:         collapsed ? LOGO_SIZE : "auto",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                borderRadius:   collapsed ? "12px" : "0",
                background:     "transparent",
                flexShrink:     0,
                lineHeight:     0,
                transition:     "background 0.2s",
              }}
            >
              <IconLogout />
            </div>
            <span style={txt}>Keluar Sistem</span>
          </button>
        </div>
      </>
    );
  };

  /* ─── DESKTOP SIDEBAR (FIXED) ─── */
  return (
    <>
      {/* Collapse toggle button */}
      {setIsCollapsed && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          style={{
            position:       "fixed",
            top:            "50%",
            left:           isCollapsed ? `${COLLAPSED_W - 12}px` : `${SIDEBAR_W - 12}px`,
            transform:      "translateY(-50%)",
            zIndex:         60,
            width:          "24px",
            height:         "40px",
            borderRadius:   "0 8px 8px 0",
            background:     "rgba(15,25,45,0.95)",
            border:         "1px solid rgba(255,255,255,0.12)",
            borderLeft:     "none",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            cursor:         "pointer",
            color:          "#94a3b8",
            boxShadow:      "2px 0 8px rgba(0,0,0,0.3)",
            padding:        0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(255,215,0,0.12)";
            e.currentTarget.style.color      = "#ffd700";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(15,25,45,0.95)";
            e.currentTarget.style.color      = "#94a3b8";
          }}
        >
          {isCollapsed ? <IconChevronRight /> : <IconChevronLeft />}
        </button>
      )}

      <aside
        style={{
          position:       "fixed",
          top:            0,
          left:           0,
          width:          isCollapsed ? COLLAPSED_W : SIDEBAR_W,
          height:         "100vh",
          overflow:       "hidden",
          display:        "flex",
          flexDirection:  "column",
          background:     "rgba(2,6,23,0.98)",
          borderRight:    "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          zIndex:         50,
          boxShadow:      "2px 0 24px rgba(0,0,0,0.35)",
          fontFamily:     "'Plus Jakarta Sans', Poppins, sans-serif",
          boxSizing:      "border-box",
        }}
      >
        <SidebarContent collapsed={isCollapsed} />
      </aside>
    </>
  );
}