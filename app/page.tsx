"use client";

import { useState, useEffect } from "react";
import Navbar from "@/app/components/Navbar";
import { auth, db } from "@/app/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Swal from "sweetalert2";

export default function Home() {
  const [user, setUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    pesan: "",
  });

  // ✅ GANTI localStorage dengan Firebase onAuthStateChanged
  useEffect(() => {
    console.log("[page.tsx] onAuthStateChanged: mulai listen...");
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("[page.tsx] Auth state:", currentUser ? `LOGIN: ${currentUser.email}` : "TIDAK ADA USER (logout)");
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const kirimSaran = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "saran"), {
        nama: formData.nama,
        email: formData.email,
        pesan: formData.pesan,
        createdAt: serverTimestamp(),
      });

      Swal.fire({
        title: "Terkirim!",
        text: "Saran kamu sudah masuk, terimakasih!",
        icon: "success",
        confirmButtonColor: "#ffd700",
        background: "#1e293b",
        color: "#fff",
      });

      setFormData({ nama: "", email: "", pesan: "" });
    } catch (error) {
      console.error("Error: ", error);
      Swal.fire("Gagal!", "Ada masalah pas kirim data, coba lagi ya.", "error");
    }
  };

  return (
    <main>
      <Navbar />

      {/* --- HERO SECTION --- */}
      <header className="hero">
        <h1>Bawa Budaya Lokal ke Game Global</h1>
        <p>
          E-commerce aset game 2D bertema Nusantara yang teroptimasi untuk
          performa game multi-platform.
        </p>
        <div className="hero-buttons">
          <a href="/katalog" className="btn-jelajahi">
            Jelajahi Aset
          </a>
        </div>
      </header>

      {/* --- KATALOG ASET TERPOPULER --- */}
      <h2 className="katalog-judul">Aset Terpopuler</h2>
      <section className="featured-products">
        <div className="grid-aset">
          {/* Aset 1: Jawa Tengah */}
          <div className="card-aset">
            <div className="preview-container">
              <span className="badge">JAWA TENGAH</span>
              <img src="/img/logo-preview.jpg" className="img-produk" alt="Wayang Kulit" />
            </div>
            <div className="card-content">
              <h3>Wayang Kulit Sprite Sheet</h3>
              <p>Karakter pixel terinspirasi Gatotkaca dengan detail sendi untuk animasi side-scroller.</p>
            </div>
            <div className="harga-kontainer">
              <div className="harga">Rp 70k</div>
              <button
                className="btn-detail"
                onClick={() => {
                  const url = `/detail-produk?nama=${encodeURIComponent("Wayang Kulit Sprite Sheet")}&harga=Rp 70k&desc=${encodeURIComponent("Karakter pixel terinspirasi Gatotkaca dengan detail sendi untuk animasi side-scroller.")}`;
                  window.location.href = url;
                }}
              >
                Detail
              </button>
            </div>
          </div>

          {/* Aset 2: Jawa Barat */}
          <div className="card-aset">
            <div className="preview-container">
              <span className="badge">JAWA BARAT</span>
              <img src="/img/logo-preview.jpg" className="img-produk" alt="Mega Mendung" />
            </div>
            <div className="card-content">
              <h3>Mega Mendung Sky Set</h3>
              <p>Tile awan berlapis khas Cirebon dengan gradasi biru untuk level atmosferik.</p>
            </div>
            <div className="harga-kontainer">
              <div className="harga">Rp 70k</div>
              <button
                className="btn-detail"
                onClick={() => {
                  const url = `/detail-produk?nama=${encodeURIComponent("Mega Mendung Sky Set")}&harga=Rp 70k&desc=${encodeURIComponent("Tile awan berlapis khas Cirebon dengan gradasi biru untuk level atmosferik.")}`;
                  window.location.href = url;
                }}
              >
                Detail
              </button>
            </div>
          </div>

          {/* Aset 3: Jawa Timur */}
          <div className="card-aset">
            <div className="preview-container">
              <span className="badge">JAWA TIMUR</span>
              <img src="/img/logo-preview.jpg" className="img-produk" alt="Reog Mask" />
            </div>
            <div className="card-content">
              <h3>Reog Ponorogo Mask</h3>
              <p>Aset headgear bos musuh detail, menampilkan kepala singa dan bulu merak.</p>
            </div>
            <div className="harga-kontainer">
              <div className="harga">Rp 70k</div>
              <button
                className="btn-detail"
                onClick={() => {
                  const url = `/detail-produk?nama=${encodeURIComponent("Reog Ponorogo Mask")}&harga=Rp 70k&desc=${encodeURIComponent("Aset headgear bos musuh detail, menampilkan kepala singa dan bulu merak.")}`;
                  window.location.href = url;
                }}
              >
                Detail
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- KOTAK SARAN --- */}
      <section id="kotak-saran" className="saran-section">
        <div className="saran-container">
          <h2>Punya Ide Aset Baru?</h2>
          <p>Kasih tahu kami apa yang kamu butuhkan!</p>
          <form className="saran-form" onSubmit={kirimSaran}>
            <input
              type="text"
              placeholder="Nama kamu"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email kamu"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <textarea
              placeholder="Contoh: Buatkan aset Candi Prambanan..."
              rows={5}
              required
              value={formData.pesan}
              onChange={(e) => setFormData({ ...formData, pesan: e.target.value })}
            ></textarea>
            <button type="submit" className="btn-utama">
              Kirim Saran
            </button>
          </form>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer>
        <div style={{ marginBottom: "25px" }}>
          <a
            href="https://instagram.com/nusantaraassets5"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#ffd700", textDecoration: "none", fontWeight: "600" }}
          >
            <span>Follow us on Instagram</span>
          </a>
        </div>
        <p>&copy; 2026 NusantaraAssets - Oleh FantasticFive</p>
        <p style={{ fontSize: "12px", marginTop: "10px" }}>
          Informatics | Universitas Jenderal Soedirman
        </p>
      </footer>
    </main>
  );
}