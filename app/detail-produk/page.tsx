"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { auth } from "@/app/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

function DetailContent() {
  const searchParams = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Tambah id dari searchParams
  const id = searchParams.get("id") || "";
  const nama = searchParams.get("nama") || "Aset Nusantara";
  const harga = searchParams.get("harga") || "Rp 70k";
  const desc =
    searchParams.get("desc") ||
    "Aset berkualitas tinggi dari kebudayaan Nusantara.";

  const isTrial = searchParams.get("isTrial") === "true";
  const fileUrl = searchParams.get("fileUrl") || "";

  return (
    <main
      style={{ backgroundColor: "#0f172a", minHeight: "100vh", color: "white" }}
    >
      {/* ===== NAVBAR FIXED + MOBILE MENU DROPDOWN ===== */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <nav id="navbar" className="navbar">
          <div
            className="logo-wrapper"
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            <img
              src="/img/logo.png"
              alt="Logo N"
              style={{ height: "40px", width: "auto", objectFit: "contain" }}
            />
            <div
              className="logo"
              style={{ fontSize: "1.5rem", fontWeight: "bold" }}
            >
              Nusantara<span style={{ color: "#ffd700" }}>Assets</span>
            </div>
          </div>

          <div className="nav-menu desktop-menu">
            <ul>
              <li style={{ listStyle: "none" }}>
                <a
                  href="/katalog"
                  style={{
                    color: "white",
                    textDecoration: "none",
                    fontWeight: "bold",
                  }}
                >
                  Kembali ke Katalog
                </a>
              </li>
            </ul>
          </div>

          <div
            className="hamburger"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className={`bar ${isMobileMenuOpen ? "open" : ""}`}></span>
            <span className={`bar ${isMobileMenuOpen ? "open" : ""}`}></span>
            <span className={`bar ${isMobileMenuOpen ? "open" : ""}`}></span>
          </div>
        </nav>

        {isMobileMenuOpen && (
          <div className="mobile-menu">
            <ul>
              <li style={{ listStyle: "none" }}>
                <a
                  href="/katalog"
                  style={{
                    color: "white",
                    textDecoration: "none",
                    fontWeight: "bold",
                  }}
                >
                  Kembali ke Katalog
                </a>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Konten Detail (padding-top cukup agar tidak tertutup navbar) */}
      <div
        className="detail-wrapper"
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "120px 20px",
          textAlign: "center",
        }}
      >
        {/* ... sisa konten tidak berubah ... */}
        <div
          style={{
            width: "100%",
            maxWidth: "600px",
            aspectRatio: "16/9",
            background: "#1e293b",
            borderRadius: "25px",
            border: "2px solid #ffd700",
            margin: "0 auto 30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src="/img/logo-preview.jpg"
            alt="Preview"
            style={{ width: "100%", borderRadius: "23px" }}
          />
        </div>

        <h1
          style={{ fontSize: "2.5rem", color: "#ffd700", marginBottom: "10px" }}
        >
          {nama}
        </h1>
        <p
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            marginBottom: "20px",
          }}
        >
          {harga}
        </p>

        <p
          style={{
            color: "#94a3b8",
            lineHeight: "1.6",
            marginBottom: "40px",
            maxWidth: "700px",
            margin: "0 auto 40px",
          }}
        >
          {desc}
        </p>

        <div
          style={{
            display: "flex",
            gap: "20px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {isTrial && (
            <button
              className="btn-trial"
              style={{
                padding: "15px 40px",
                background: "#10b981",
                color: "white",
                borderRadius: "15px",
                fontWeight: "bold",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 6px rgba(16, 185, 129, 0.3)",
                transition: "all 0.3s ease",
              }}
              onClick={() => {
                if (!isLoggedIn) {
                  alert(
                    "Ups! Kamu harus login dulu untuk klaim free trial 2D pixel art ini.",
                  );
                  window.location.href = "/login";
                  return;
                }

                if (fileUrl) {
                  alert("Yay! File 2D pixel art sedang diunduh! 🎁");
                  window.open(fileUrl, "_blank");
                } else {
                  alert("Maaf, file trial untuk aset ini belum tersedia.");
                }
              }}
            >
              🎁 Try for Free
            </button>
          )}

          <button
            className="btn-cart"
            style={{
              padding: "15px 40px",
              background: "transparent",
              border: "2px solid #ffd700",
              color: "#ffd700",
              borderRadius: "15px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onClick={() => {
              const keranjang = JSON.parse(
                localStorage.getItem("nusantaraCart") || "[]",
              );
              keranjang.push({ nama, harga });
              localStorage.setItem("nusantaraCart", JSON.stringify(keranjang));
              alert("Berhasil masuk keranjang! 🛒");
              window.location.href = "/keranjang";
            }}
          >
            🛒 + Keranjang
          </button>

          <button
            className="btn-buy"
            style={{
              padding: "15px 40px",
              background: "#ffd700",
              color: "#0f172a",
              borderRadius: "15px",
              fontWeight: "bold",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onClick={() => {
              if (!isLoggedIn) {
                alert("Ups! Kamu harus login dulu sebelum membeli.");
                window.location.href = "/login";
                return;
              }

              // ✅ Sekarang id ikut dikirim ke halaman pembayaran
              window.location.href = `/pembayaran?id=${encodeURIComponent(id)}&nama=${encodeURIComponent(nama)}&harga=${encodeURIComponent(harga)}`;
            }}
          >
            Beli Sekarang
          </button>
        </div>
      </div>

      <style jsx>{`
        /* ============ NAVBAR FIXED ============ */
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 5%;
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 215, 0, 0.15);
        }

        /* Hamburger */
        .hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          z-index: 50;
        }

        .hamburger .bar {
          width: 25px;
          height: 3px;
          background-color: white;
          transition: all 0.3s ease;
          border-radius: 5px;
        }

        .hamburger .bar.open:nth-child(1) {
          transform: translateY(8px) rotate(45deg);
        }
        .hamburger .bar.open:nth-child(2) {
          opacity: 0;
        }
        .hamburger .bar.open:nth-child(3) {
          transform: translateY(-8px) rotate(-45deg);
        }

        /* Dropdown mobile */
        .mobile-menu {
          background: #1e293b;
          padding: 15px 5%;
          border-bottom: 1px solid rgba(255, 215, 0, 0.2);
          animation: slideDown 0.3s ease;
        }
        .mobile-menu ul {
          margin: 0;
          padding: 0;
        }
        .mobile-menu a {
          display: block;
          padding: 10px 0;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Tombol hover glow */
        .btn-trial:hover {
          box-shadow: 0 0 15px #10b981, 0 0 30px #10b981 !important;
          transform: translateY(-3px);
        }
        .btn-cart:hover {
          background: #ffd700 !important;
          color: #0f172a !important;
          box-shadow: 0 0 15px #ffd700, 0 0 30px #ffd700 !important;
          transform: translateY(-3px);
        }
        .btn-buy:hover {
          box-shadow: 0 0 15px #ffd700, 0 0 30px #ffd700 !important;
          transform: translateY(-3px);
        }

        @media (max-width: 768px) {
          .desktop-menu {
            display: none;
          }
          .hamburger {
            display: flex;
          }
        }
      `}</style>
    </main>
  );
}

export default function DetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DetailContent />
    </Suspense>
  );
}