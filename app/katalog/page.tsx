"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { createSupabaseBrowser } from "@/app/lib/supabase/client";

export default function Katalog() {
  const [user, setUser] = useState<{ name: string; pic: string } | null>(null);
  const [kategori, setKategori] = useState("semua");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- DATA CADANGAN (Fallback jika database kosong) ---
  const daftarAsetManual = [
    {
      id: 1,
      nama: "Mega Mendung Sky Set",
      provinsi: "JAWA BARAT",
      kategori: "jawa-barat",
      deskripsi:
        "Background & tile awan Cirebon gradasi biru untuk level atmosferik.",
      harga: "70k",
    },
    {
      id: 2,
      nama: "Angklung Rhythm Kit",
      provinsi: "JAWA BARAT",
      kategori: "jawa-barat",
      deskripsi:
        "Instrumen angklung berbagai ukuran untuk item pick-up/power-up.",
      harga: "70k",
    },
    {
      id: 3,
      nama: "Kujang Warrior Blades",
      provinsi: "JAWA BARAT",
      kategori: "jawa-barat",
      deskripsi:
        "Koleksi senjata tradisional Kujang variasi warna emas, perak, & baja.",
      harga: "70k",
    },
    {
      id: 4,
      nama: "Wayang Kulit Sprite Sheet",
      provinsi: "JAWA TENGAH",
      kategori: "jawa-tengah",
      deskripsi:
        "Karakter pixel Gatotkaca dengan detail sendi untuk animasi side-scroller.",
      harga: "70k",
    },
    {
      id: 5,
      nama: "Borobudur Stone Tiles",
      provinsi: "JAWA TENGAH",
      kategori: "jawa-tengah",
      deskripsi:
        "Ground tiles & struktur stupa mini untuk petualangan reruntuhan kuno.",
      harga: "70k",
    },
    {
      id: 6,
      nama: "Reog Ponorogo Mask",
      provinsi: "JAWA TIMUR",
      kategori: "jawa-timur",
      deskripsi:
        "Aset headgear bos musuh detail, resolusi pixel yang bold & eksotis.",
      harga: "70k",
    },
    {
      id: 7,
      nama: "Bromo Volcanic Biome",
      provinsi: "JAWA TIMUR",
      kategori: "jawa-timur",
      deskripsi:
        "Paket lingkungan gunung berapi, pasir berbisik, & kawah berasap.",
      harga: "70k",
    },
    {
      id: 8,
      nama: "Gapura Candi Bentar",
      provinsi: "BALI",
      kategori: "bali",
      deskripsi:
        "Struktur gerbang khas Bali untuk checkpoint atau pintu masuk area.",
      harga: "70k",
    },
    {
      id: 9,
      nama: "Frangipani Decor",
      provinsi: "BALI",
      kategori: "bali",
      deskripsi:
        "Elemen dekoratif bunga kamboja & sesajen untuk detail lingkungan.",
      harga: "70k",
    },
  ];

  useEffect(() => {
    // Cek status login
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (loggedIn) {
      setUser({
        name: localStorage.getItem("userName") || "",
        pic: localStorage.getItem("userPic") || "",
      });
    }

    // AMBIL DATA DARI SUPABASE (Table: product)
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const supabase = createSupabaseBrowser();
        const { data, error } = await supabase.from("product").select("*");

        if (error) throw error;

        if (data && data.length > 0) {
          setProducts(data);
        } else {
          setProducts(daftarAsetManual);
        }
      } catch (err) {
        console.error("Gagal ambil data:", err);
        setProducts(daftarAsetManual);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const asetFiltered =
    kategori === "semua"
      ? products
      : products.filter((item) => (item.kategori || item.cat) === kategori);

  return (
    <main
      style={{ backgroundColor: "#0f172a", minHeight: "100vh", color: "white" }}
    >
      <Navbar />

      <div style={{ textAlign: "center", padding: "120px 20px 20px" }}>
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 2.5rem)",
            color: "#ffd700",
            fontWeight: "800",
          }}
        >
          Eksplorasi Aset Nusantara
        </h1>
        <p style={{ color: "#94a3b8", marginTop: "10px" }}>
          Cari aset game bertema kebudayaan Indonesia dari{" "}
          {kategori === "semua"
            ? "seluruh wilayah"
            : kategori.replace("-", " ")}
        </p>
      </div>

      <div
        className="filter-provinsi"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "40px",
        }}
      >
        {["semua", "jawa-tengah", "jawa-barat", "jawa-timur", "bali"].map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setKategori(cat)}
              className={`btn-filter ${kategori === cat ? "active" : ""}`}
              style={{
                padding: "10px 25px",
                borderRadius: "50px",
                border:
                  kategori === cat ? "none" : "1px solid rgba(255,255,255,0.1)",
                background:
                  kategori === cat ? "#ffd700" : "rgba(255,255,255,0.05)",
                color: kategori === cat ? "#0f172a" : "white",
                cursor: "pointer",
                fontWeight: "bold",
                textTransform: "capitalize",
              }}
            >
              {cat.replace("-", " ")}
            </button>
          ),
        )}
      </div>

      <section
        className="featured-products"
        style={{ padding: "0 5%", paddingBottom: "80px" }}
      >
        <div
          className="grid-aset"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "30px",
          }}
        >
          {asetFiltered.map((item) => (
            <div
              key={item.id}
              className="card-aset"
              style={{
                background: "#1e293b",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                position: "relative",
              }}
            >
              <div
                className="preview-container"
                style={{ position: "relative", width: "100%" }}
              >
                <span
                  className="badge"
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    background: "#ffd700",
                    color: "#0f172a",
                    padding: "4px 12px",
                    borderRadius: "8px",
                    fontSize: "10px",
                    fontWeight: "900",
                    zIndex: "10",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                    width: "fit-content",
                    display: "inline-block",
                  }}
                >
                  {item.provinsi || item.prov}
                </span>
                <img
                  src={
                    item.image_preview ||
                    item.gambar_url ||
                    "/img/logo-preview.jpg"
                  }
                  className="img-produk"
                  alt={item.nama}
                  style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    objectFit: "cover",
                    display: "block",
                    imageRendering: "pixelated",
                  }}
                />
              </div>

              <div
                className="card-content"
                style={{
                  padding: "20px 20px 0",
                  flex: "1 0 auto",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.2rem",
                    marginBottom: "10px",
                    color: "#fff",
                    fontWeight: "700",
                  }}
                >
                  {item.nama}
                </h3>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#94a3b8",
                    lineHeight: "1.5",
                    marginBottom: "20px",
                  }}
                >
                  {item.deskripsi || item.desc}
                </p>
              </div>

              <div
                className="harga-kontainer"
                style={{
                  padding: "0 20px 40px",
                  marginTop: "auto",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  className="harga"
                  style={{
                    fontWeight: "800",
                    fontSize: "1.3rem",
                    color: "#ffd700",
                  }}
                >
                  Rp{" "}
                  {item.harga
                    ? typeof item.harga === "number"
                      ? item.harga.toLocaleString("id-ID")
                      : item.harga
                    : "70k"}
                </div>
                <button
                  className="btn-detail"
                  style={{
                    padding: "10px 22px",
                    fontSize: "0.85rem",
                    background: "transparent",
                    border: "1.5px solid #ffd700",
                    color: "#ffd700",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                  onClick={() => {
                    // ✅ FIX: item.id sekarang ikut dikirim ke detail-produk
                    const url = `/detail-produk?id=${encodeURIComponent(item.id)}&nama=${encodeURIComponent(item.nama)}&harga=${encodeURIComponent(item.harga || "70k")}&desc=${encodeURIComponent(item.deskripsi || item.desc || "")}`;
                    window.location.href = url;
                  }}
                >
                  Detail
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer
        style={{
          textAlign: "center",
          padding: "60px 20px",
          background: "rgba(0,0,0,0.2)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <a
            href="https://instagram.com/nusantaraassets5"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#ffd700",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Follow us on Instagram
          </a>
        </div>
        <p style={{ color: "#64748b", fontSize: "14px" }}>
          &copy; 2026 NusantaraAssets - Oleh FantasticFive
        </p>
        <p style={{ fontSize: "11px", marginTop: "8px", color: "#475569" }}>
          Informatics | Universitas Jenderal Soedirman
        </p>
      </footer>
    </main>
  );
}