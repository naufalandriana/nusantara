"use client";

import { useState, useEffect, Suspense } from "react";
import Navbar from "@/app/components/Navbar";
import Swal from "sweetalert2";
import { useSearchParams } from "next/navigation";
import emailjs from "@emailjs/browser";
// --- FIREBASE IMPORT (dipertahankan untuk real-time status cek) ---
import { db } from "@/app/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
// --- SUPABASE IMPORT ---
import { createSupabaseBrowser } from "@/app/lib/supabase/client";

// ✅ Generate Transaction ID format: TRNSKSI-xxxxxxxx
function generateTransactionId(): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let random = "";
  for (let i = 0; i < 8; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TRNSKSI-${random}`;
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const [metode, setMetode] = useState("qris");
  const [totalTagihan, setTotalTagihan] = useState(0);

  // ✅ Status dipisah jadi isApproved & isRejected
  const [isApproved, setIsApproved] = useState(false);
  const [isRejected, setIsRejected] = useState(false);

  // State untuk menyimpan URL file asli dari database
  const [downloadUrl, setDownloadUrl] = useState<string>("");

  const [buktiPembayaran, setBuktiPembayaran] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // 1. Logika Hitung Harga
    const hargaParams = searchParams.get("harga") || "";
    if (hargaParams) {
      const angkaSaja = parseInt(hargaParams.replace(/[^0-9]/g, "")) || 0;
      const totalDirect = hargaParams.toLowerCase().includes("k")
        ? angkaSaja * 1000
        : angkaSaja;
      setTotalTagihan(totalDirect);
    } else {
      const savedCart = JSON.parse(
        localStorage.getItem("nusantaraCart") || "[]",
      );
      const totalKeranjang = savedCart.reduce((acc: number, item: any) => {
        const hargaStr = String(item.harga || "0");
        const angkaSaja = parseInt(hargaStr.replace(/[^0-9]/g, "")) || 0;
        const hargaFinal = hargaStr.toLowerCase().includes("k")
          ? angkaSaja * 1000
          : angkaSaja;
        return acc + hargaFinal;
      }, 0);
      setTotalTagihan(totalKeranjang);
    }

    // 2. RADAR REAL-TIME — cek status approved & rejected
    const userEmail = localStorage.getItem("userEmail");
    if (userEmail) {
      // --- Listener: APPROVED ---
      const qApproved = query(
        collection(db, "transactions"),
        where("email_pembeli", "==", userEmail),
        where("status", "==", "approved"),
      );

      const unsubscribeApproved = onSnapshot(qApproved, (snapshot) => {
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();

          if (docData.download_link) {
            setDownloadUrl(docData.download_link);
          }

          const timeConfirmed =
            docData.verifiedAt?.toDate() || docData.createdAt?.toDate();
          if (timeConfirmed) {
            const sekarang = new Date();
            const selisihJam =
              (sekarang.getTime() - timeConfirmed.getTime()) / (1000 * 60 * 60);
            if (selisihJam < 3) {
              setIsApproved(true);
              setIsRejected(false);
            } else {
              setIsApproved(false);
            }
          }
        } else {
          setIsApproved(false);
        }
      });

      // --- Listener: REJECTED ---
      const qRejected = query(
        collection(db, "transactions"),
        where("email_pembeli", "==", userEmail),
        where("status", "==", "rejected"),
      );

      const unsubscribeRejected = onSnapshot(qRejected, (snapshot) => {
        if (!snapshot.empty) {
          setIsRejected(true);
          setIsApproved(false);
        } else {
          setIsRejected(false);
        }
      });

      return () => {
        unsubscribeApproved();
        unsubscribeRejected();
      };
    }
  }, [searchParams]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 700 * 1024;
      if (file.size > maxSize) {
        Swal.fire({
          title: "File Terlalu Besar!",
          text: "Maksimal ukuran file adalah 700KB agar transaksi lancar.",
          icon: "warning",
          confirmButtonColor: "#ffd700",
          background: "#1e293b",
          color: "#fff",
        });
        e.target.value = "";
        setBuktiPembayaran(null);
        setPreviewUrl(null);
        return;
      }
      setBuktiPembayaran(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const dataNomor: any = {
    qris: "Scan QR Code di bawah",
    dana: "+62 821-3753-4026 (Nova Chauliyatul Faizah)",
    shopeepay: "+62 821-3753-4026 (NOVA CHAULIYATUL FAIZAH)",
    gopay: "+62 821-3753-4026 (NOVA CHAULIYATUL FAIZAH)",
    ovo: "+62 821-3753-4026 (Nova Chauliyatul Faizah)",
  };

  const selectMetode = (m: string) => {
    setMetode(m);
    if (m !== "qris") {
      Swal.fire({
        title: `Metode ${m.toUpperCase()}`,
        html: `<div style="text-align: center; padding: 10px;"><p style="color: #94a3b8;">Transfer ke:</p><h2 style="color: #ffd700;">${dataNomor[m]}</h2></div>`,
        icon: "info",
        confirmButtonColor: "#ffd700",
        background: "#1e293b",
        color: "#fff",
      });
    }
  };

  const handleKonfirmasi = async () => {
    // STEP 1A: Validasi product_id dari URL params
    const productIdParam = searchParams.get("id");
    if (!productIdParam) {
      Swal.fire({
        title: "Produk Tidak Ditemukan!",
        text: "Kembali ke halaman produk dan coba lagi.",
        icon: "error",
        confirmButtonColor: "#ffd700",
        background: "#1e293b",
        color: "#fff",
      });
      return;
    }

    // STEP 1B: Validasi file ada
    if (!buktiPembayaran) {
      Swal.fire({
        title: "Bukti Pembayaran Belum Dipilih!",
        text: "Silakan upload bukti pembayaran terlebih dahulu.",
        icon: "warning",
        confirmButtonColor: "#ffd700",
        background: "#1e293b",
        color: "#fff",
      });
      return;
    }

    // STEP 1C: Validasi tipe file (hanya PNG & JPEG)
    const allowedTypes = ["image/png", "image/jpeg"];
    if (!allowedTypes.includes(buktiPembayaran.type)) {
      Swal.fire({
        title: "Format File Tidak Didukung!",
        text: "Hanya file PNG dan JPG/JPEG yang diperbolehkan.",
        icon: "error",
        confirmButtonColor: "#ffd700",
        background: "#1e293b",
        color: "#fff",
      });
      return;
    }

    setIsUploading(true);
    Swal.fire({
      title: "Mengirim...",
      text: "Sedang memproses bukti pembayaran dan notifikasi admin",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const supabase = createSupabaseBrowser();

      // STEP 2: Generate Transaction ID
      const transactionId = generateTransactionId();

      // STEP 3: Tentukan ekstensi file dari file.type
      const extMap: Record<string, string> = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
      };
      const ext = extMap[buktiPembayaran.type];
      const filePath = `bukti-bayar/${transactionId}${ext}`;

      // STEP 4: Upload file asli ke Supabase Storage (bucket: pembayaran)
      const { error: uploadError } = await supabase.storage
        .from("pembayaran")
        .upload(filePath, buktiPembayaran, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // STEP 5: Insert ke table orders
      // ✅ Status di-set "pending" — TIDAK bisa diubah user karena RLS Supabase
      // hanya admin (service role) yang bisa UPDATE status
      const customerId =
        localStorage.getItem("userId") ||
        localStorage.getItem("userUid") ||
        "";

      const { error: dbError } = await supabase.from("orders").insert({
        customer_id: customerId,
        product_id: parseInt(productIdParam),
        metode_pembayaran: metode,
        bukti_transfer_url: filePath,
        status: "pending", // ✅ Diubah dari "waiting_verification" → "pending"
      });

      if (dbError) throw dbError;

      // Kirim notifikasi EmailJS ke admin
      const emailParams = {
        from_name: localStorage.getItem("userName") || "Pembeli",
        user_email:
          localStorage.getItem("userEmail") || "Tidak ada email",
        product_name: searchParams.get("nama") || "Aset Nusantara",
        total_price: totalTagihan.toLocaleString("id-ID"),
        payment_method: metode.toUpperCase(),
        order_id: transactionId,
      };

      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        emailParams,
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!,
      );

      Swal.fire({
        title: "Berhasil!",
        text: "Silakan tunggu, tampilan akan berubah otomatis jika sudah dikonfirmasi admin.",
        icon: "success",
        confirmButtonColor: "#ffd700",
        background: "#1e293b",
        color: "#fff",
      });
    } catch (error: any) {
      console.error(error);
      Swal.fire({
        title: "Error!",
        text: error?.message || "Gagal mengirim data, coba lagi.",
        icon: "error",
        confirmButtonColor: "#ffd700",
        background: "#1e293b",
        color: "#fff",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const listMetode = [
    { id: "qris", logo: "/img/logo-qris.png" },
    { id: "dana", logo: "/img/logo-dana.png" },
    { id: "shopeepay", logo: "/img/logo-spay.png" },
    { id: "gopay", logo: "/img/logo-gopay.png" },
    { id: "ovo", logo: "/img/logo-ovo.png" },
  ];

  // ✅ UI: Pembayaran APPROVED
  if (isApproved) {
    return (
      <main className="payment-page">
        <Navbar />
        <div className="payment-container">
          <div className="payment-box">
            <div style={{ fontSize: "60px", marginBottom: "20px" }}>✅</div>
            <h2 className="payment-title">
              Pembayaran <span>Berhasil!</span>
            </h2>
            <p className="payment-sub">Aset kamu sudah siap diunduh.</p>
            <div
              style={{
                background: "rgba(255, 215, 0, 0.1)",
                padding: "15px",
                borderRadius: "15px",
                marginTop: "20px",
                border: "1px dashed #ffd700",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: "#ffd700",
                  lineHeight: "1.6",
                }}
              >
                "Halaman ini akan hilang setelah 3 jam, pastikan kamu sudah
                mengunduh assets mu ya! Terimakasih"
              </p>
            </div>

            <button
              className="btn-confirm"
              style={{ marginTop: "30px" }}
              onClick={() => {
                if (downloadUrl) {
                  window.open(downloadUrl);
                } else {
                  Swal.fire(
                    "Sabar ya!",
                    "Admin sedang menyiapkan link download untukmu.",
                    "info",
                  );
                }
              }}
            >
              DOWNLOAD ASSET SEKARANG
            </button>
          </div>
        </div>
        <style jsx>{`
          .payment-page {
            background: #0f172a;
            min-height: 100vh;
            color: white;
          }
          .payment-container {
            padding: 120px 5% 40px;
            display: flex;
            justify-content: center;
          }
          .payment-box {
            background: #1e293b;
            padding: 40px;
            border-radius: 30px;
            max-width: 480px;
            width: 100%;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.05);
          }
          .payment-title span {
            color: #ffd700;
          }
          .btn-confirm {
            background: #ffd700;
            color: #000;
            border: none;
            width: 100%;
            padding: 18px;
            border-radius: 50px;
            font-weight: 800;
            cursor: pointer;
          }
        `}</style>
      </main>
    );
  }

  // ✅ UI: Pembayaran REJECTED
  if (isRejected) {
    return (
      <main className="payment-page">
        <Navbar />
        <div className="payment-container">
          <div className="payment-box">
            <div style={{ fontSize: "60px", marginBottom: "20px" }}>❌</div>
            <h2 className="payment-title">
              Pembayaran <span style={{ color: "#f87171" }}>Ditolak</span>
            </h2>
            <p className="payment-sub">
              Maaf, bukti pembayaran kamu tidak dapat diverifikasi oleh admin.
            </p>
            <div
              style={{
                background: "rgba(248, 113, 113, 0.1)",
                padding: "15px",
                borderRadius: "15px",
                marginTop: "20px",
                border: "1px dashed #f87171",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: "#f87171",
                  lineHeight: "1.6",
                }}
              >
                Kemungkinan bukti tidak valid atau nominal tidak sesuai.
                Silakan hubungi admin atau coba lagi dengan bukti yang benar.
              </p>
            </div>

            <button
              className="btn-confirm"
              style={{
                marginTop: "30px",
                background: "#f87171",
                color: "#fff",
              }}
              onClick={() => window.location.reload()}
            >
              COBA LAGI
            </button>

            <button
              style={{
                marginTop: "12px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#94a3b8",
                width: "100%",
                padding: "14px",
                borderRadius: "50px",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "13px",
              }}
              onClick={() =>
                window.open("https://wa.me/6282137534026", "_blank")
              }
            >
              HUBUNGI ADMIN
            </button>
          </div>
        </div>
        <style jsx>{`
          .payment-page {
            background: #0f172a;
            min-height: 100vh;
            color: white;
          }
          .payment-container {
            padding: 120px 5% 40px;
            display: flex;
            justify-content: center;
          }
          .payment-box {
            background: #1e293b;
            padding: 40px;
            border-radius: 30px;
            max-width: 480px;
            width: 100%;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.05);
          }
          .payment-title span {
            color: #ffd700;
          }
          .payment-sub {
            color: #94a3b8;
            font-size: 14px;
            margin-top: 8px;
          }
          .btn-confirm {
            background: #ffd700;
            color: #000;
            border: none;
            width: 100%;
            padding: 18px;
            border-radius: 50px;
            font-weight: 800;
            cursor: pointer;
          }
        `}</style>
      </main>
    );
  }

  // ✅ UI: Form Pembayaran (default)
  return (
    <main className="payment-page">
      <Navbar />
      <div className="payment-container">
        <div className="payment-box">
          <h2 className="payment-title">
            Checkout <span>Aset</span>
          </h2>
          <p className="payment-sub">Total Tagihan Kamu:</p>
          <h1 className="payment-amount">
            Rp {totalTagihan.toLocaleString("id-ID")}
          </h1>

          <div className="method-grid">
            {listMetode.map((m) => (
              <button
                key={m.id}
                className={`method-btn ${metode === m.id ? "active" : ""}`}
                onClick={() => selectMetode(m.id)}
              >
                <div className="method-left">
                  <img
                    src={m.logo}
                    alt={m.id}
                    className="method-logo-img"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                  <span className="method-name">{m.id.toUpperCase()}</span>
                </div>
                <span className="method-arrow">›</span>
              </button>
            ))}
          </div>

          {metode === "qris" && (
            <div className="qr-area">
              <p>Silakan Scan QRIS:</p>
              <img src="/img/qriss-na.png" alt="QR" className="qr-img" />
            </div>
          )}

          <div className="upload-section">
            <p className="upload-label">Wajib Upload Bukti Pembayaran:</p>
            <input
              type="file"
              accept="image/*"
              id="file-upload"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <label htmlFor="file-upload" className="custom-upload-btn">
              {buktiPembayaran ? "Ganti Gambar" : "Pilih File Bukti"}
            </label>
            <p
              style={{
                fontSize: "10px",
                color: "#f87171",
                fontStyle: "italic",
                marginTop: "10px",
              }}
            >
              *Maksimal ukuran file adalah 700KB!
            </p>
            {previewUrl && (
              <img src={previewUrl} alt="Preview" className="img-preview" />
            )}
          </div>

          <button
            onClick={handleKonfirmasi}
            className={`btn-confirm ${!buktiPembayaran || isUploading ? "disabled" : ""}`}
            disabled={!buktiPembayaran || isUploading}
          >
            {isUploading ? "MENGIRIM..." : "KONFIRMASI PEMBAYARAN"}
          </button>
        </div>
      </div>
      <style jsx>{`
        .payment-page {
          background: #0f172a;
          min-height: 100vh;
          color: white;
        }
        .payment-container {
          padding: 120px 5% 40px;
          display: flex;
          justify-content: center;
        }
        .payment-box {
          background: #1e293b;
          padding: 40px;
          border-radius: 30px;
          max-width: 480px;
          width: 100%;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .payment-title span {
          color: #ffd700;
        }
        .payment-amount {
          color: #ffd700;
          font-size: 38px;
          margin: 10px 0 30px;
          font-weight: 800;
        }
        .payment-sub {
          color: #94a3b8;
          font-size: 14px;
          margin-top: 8px;
        }
        .method-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 25px;
        }
        .method-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: white;
          padding: 15px 20px;
          border-radius: 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: 0.3s;
        }
        .method-btn.active {
          background: #ffd700;
          color: #000;
        }
        .method-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .method-logo-img {
          height: 22px;
          width: auto;
          object-fit: contain;
        }
        .qr-area {
          background: white;
          padding: 20px;
          border-radius: 20px;
          color: black;
          margin-bottom: 30px;
        }
        .qr-img {
          width: 180px;
        }
        .upload-section {
          margin-bottom: 25px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 20px;
          border: 1px dashed rgba(255, 215, 0, 0.3);
        }
        .upload-label {
          font-size: 13px;
          color: #94a3b8;
          margin-bottom: 12px;
        }
        .custom-upload-btn {
          display: inline-block;
          padding: 10px 20px;
          background: #334155;
          color: #fff;
          border-radius: 10px;
          cursor: pointer;
          font-size: 12px;
        }
        .img-preview {
          max-width: 100%;
          margin-top: 15px;
          border-radius: 10px;
          border: 2px solid #ffd700;
        }
        .btn-confirm {
          background: #ffd700;
          color: #000;
          border: none;
          width: 100%;
          padding: 18px;
          border-radius: 50px;
          font-weight: 800;
          cursor: pointer;
        }
        .btn-confirm.disabled {
          background: #475569;
          color: #94a3b8;
          cursor: not-allowed;
        }
      `}</style>
    </main>
  );
}

export default function PembayaranPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{ color: "white", textAlign: "center", marginTop: "100px" }}
        >
          Memuat...
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}