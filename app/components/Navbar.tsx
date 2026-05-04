"use client";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { auth, db } from "@/app/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import {
  ShoppingCart,
  Menu,
  X,
  PackageCheck,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        try {
          await setDoc(
            doc(db, "user_logs", currentUser.uid),
            {
              email: currentUser.email,
              nama: currentUser.displayName || "User Nusantara",
              last_login: serverTimestamp(),
              status: "Online",
            },
            { merge: true }
          );
        } catch (err) {
          console.error("Gagal catat absen login:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.clear();
      await signOut(auth);
      setDropdownOpen(false);
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const isActive = (path: string) => pathname === path;

  const linkStyle = (path: string) => ({
    color: isActive(path) ? "#ffd700" : "#94a3b8",
    textDecoration: "none",
    fontWeight: isActive(path) ? 600 : 400,
    paddingBottom: "4px",
    borderBottom: isActive(path) ? "2px solid #ffd700" : "2px solid transparent",
    transition: "color 0.2s",
  });

  const Avatar = () => {
    const photo = user?.photoURL;
    const initial = (user?.displayName?.[0] || user?.email?.[0])?.toUpperCase() || "?";

    if (photo) {
      return (
        <img
          src={photo}
          alt="avatar"
          width={30}
          height={30}
          style={{
            borderRadius: "50%",
            objectFit: "cover",
            display: "block",
          }}
          referrerPolicy="no-referrer"
        />
      );
    }

    return (
      <div
        style={{
          width: "30px",
          height: "30px",
          borderRadius: "50%",
          background: "rgba(255,215,0,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffd700",
          fontWeight: 700,
          fontSize: "13px",
        }}
      >
        {initial}
      </div>
    );
  };

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "17px 5%",
        background: "rgba(2,6,23,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        fontFamily: "'Plus Jakarta Sans', Poppins, sans-serif",
      }}
    >
      {/* KIRI: Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <img src="/img/logo.png" alt="Logo" width="40" />
        <span style={{ fontSize: "20px", fontWeight: "bold", color: "white", letterSpacing: "-0.5px" }}>
          Nusantara<span style={{ color: "#ffd700" }}>Assets</span>
        </span>
      </div>

      {/* TENGAH: Menu links */}
      <div
        className={`nav-links ${isOpen ? "open" : ""}`}
        style={{ display: "flex", alignItems: "start", gap: "30px" }}
      >
        <Link href="/" onClick={() => setIsOpen(false)} style={linkStyle("/")}>
          Beranda
        </Link>
        <Link href="/katalog" onClick={() => setIsOpen(false)} style={linkStyle("/katalog")}>
          Katalog Aset
        </Link>
        <Link href="/#kotak-saran" onClick={() => setIsOpen(false)} style={{ color: "#94a3b8", textDecoration: "none" }}>
          Saran
        </Link>
      </div>

      {/* KANAN: Cart & Auth */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <Link href="/keranjang" style={{ color: "#ffd700", display: "flex" }}>
          <ShoppingCart size={24} />
        </Link>

        {!loading && (
          <div className="auth-section" ref={dropdownRef}>
             {user ? (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "30px",
                    padding: "6px 14px 6px 8px",
                    cursor: "pointer",
                    color: "#e2e8f0",
                    fontFamily: "inherit",
                    fontSize: "14px",
                    fontWeight: 500,
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,215,0,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                  }}
                >
                  <Avatar />
                  <span
                    style={{
                      maxWidth: "120px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Halo, {user.displayName?.split(" ")[0] || user.email?.split("@")[0]}
                  </span>
                  <ChevronDown
                    size={14}
                    style={{
                      marginLeft: "2px",
                      transition: "transform 0.2s",
                      transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>

                {dropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 10px)",
                      background: "rgba(15, 23, 42, 0.95)",
                      backdropFilter: "blur(24px)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "16px",
                      minWidth: "190px",
                      overflow: "hidden",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                      padding: "8px 0",
                      animation: "fadeIn 0.15s ease",
                    }}
                  >
                    <Link
                      href="/pesanan"
                      onClick={() => {
                        setIsOpen(false);
                        setDropdownOpen(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 16px",
                        color: "#cbd5e1",
                        textDecoration: "none",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,215,0,0.08)";
                        e.currentTarget.style.color = "#ffd700";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#cbd5e1";
                      }}
                    >
                      <PackageCheck size={17} />
                      Pesanan Saya
                    </Link>
                    <button
                      onClick={handleLogout}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        width: "100%",
                        padding: "10px 16px",
                        background: "transparent",
                        border: "none",
                        color: "#f87171",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "background 0.15s",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <LogOut size={17} />
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                style={{
                  border: "1px solid #ffd700",
                  color: "#ffd700",
                  padding: "8px 25px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontWeight: "bold",
                  transition: "all 0.2s",
                }}
              >
                Masuk
              </Link>
            )}
          </div>
        )}

        <div
          className="hamburger"
          style={{ display: "none", cursor: "pointer", color: "white" }}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .hamburger {
            display: block !important;
          }
          .nav-links {
            display: none !important;
            flex-direction: column;
            position: absolute;
            top: 70px;
            left: 0;
            width: 100%;
            background: rgba(2,6,23,0.95);
            backdrop-filter: blur(20px);
            padding: 25px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            gap: 25px !important;
            text-align: center;
          }
          .nav-links.open {
            display: flex !important;
          }
          .auth-section {
            display: flex;
            align-items: center;
          }
        }
      `}</style>
    </nav>
  );
}