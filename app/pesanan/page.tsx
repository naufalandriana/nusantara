"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import { createSupabaseBrowser } from "@/app/lib/supabase/client";
import {
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  Calendar,
  CreditCard,
  CircleDollarSign,
} from "lucide-react";

interface Produk {
  id: number;
  name: string;
  harga?: number;
  file_path?: string;
}

interface Pesanan {
  id: string;
  created_at: string;
  product_id: number;
  metode_pembayaran: string;
  status: string;
  is_approved: boolean;
  produk?: Produk | null;
}

export default function PesananPage() {
  const [pesananList, setPesananList] = useState<Pesanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPesanan = async () => {
      try {
        const customerId =
          localStorage.getItem("userId") ||
          localStorage.getItem("userUid") ||
          "";

        if (!customerId) {
          setError("Anda belum login. Silakan login terlebih dahulu.");
          setLoading(false);
          return;
        }

        const supabase = createSupabaseBrowser();

        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false });

        if (ordersError) throw ordersError;
        if (!orders || orders.length === 0) {
          setPesananList([]);
          setLoading(false);
          return;
        }

        const productIds = orders.map((order) => order.product_id);
        const { data: products, error: productsError } = await supabase
          .from("product")
          .select("id, nama, harga, file_path") // tambah harga
          .in("id", productIds);

        const produkMap: Record<number, Produk> = {};
        if (!productsError && products) {
          products.forEach((p) => {
            produkMap[p.id] = {
              id: p.id,
              name: p.nama,
              harga: p.harga,
              file_path: p.file_path,
            };
          });
        }

        const merged: Pesanan[] = orders.map((order) => ({
          id: order.id,
          created_at: order.created_at,
          product_id: order.product_id,
          metode_pembayaran: order.metode_pembayaran,
          status: order.status || "pending",
          is_approved: order.is_approved || false,
          produk: produkMap[order.product_id] || null,
        }));

        setPesananList(merged);
      } catch (err: any) {
        console.error("Gagal mengambil pesanan:", err);
        setError(err.message || "Terjadi kesalahan saat memuat pesanan.");
      } finally {
        setLoading(false);
      }
    };

    fetchPesanan();
  }, []);

  const getDisplayStatus = (pesanan: Pesanan): "approved" | "declined" | "pending" => {
    if (pesanan.is_approved === true || pesanan.status === "approved") {
      return "approved";
    }
    if (pesanan.status === "declined") {
      return "declined";
    }
    return "pending";
  };

  const getStatusBadge = (statusDisplay: "approved" | "declined" | "pending") => {
    switch (statusDisplay) {
      case "approved":
        return (
          <span className="badge badge-approved">
            <CheckCircle size={14} /> Approved
          </span>
        );
      case "declined":
        return (
          <span className="badge badge-declined">
            <AlertCircle size={14} /> Declined
          </span>
        );
      case "pending":
      default:
        return (
          <span className="badge badge-pending">
            <Clock size={14} /> Pending
          </span>
        );
    }
  };

  const formatRupiah = (amount?: number) => {
    if (!amount) return "Gratis";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <main className="pesanan-page">
      <Navbar />
      <div className="pesanan-container">
        <div className="pesanan-header">
          <div className="header-icon">
            <ShoppingBag size={36} />
          </div>
          <h2>
            Pesanan <span>Saya</span>
          </h2>
          <p>Pantau semua transaksi aset digital Nusantara kamu</p>
        </div>

        {loading ? (
          <div className="loading-skeleton">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-line wide" />
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={48} />
            <p>{error}</p>
          </div>
        ) : pesananList.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={48} />
            <h3>Belum ada pesanan</h3>
            <p>Yuk, mulai jelajahi katalog aset menarik kami!</p>
          </div>
        ) : (
          <div className="pesanan-list">
            {pesananList.map((pesanan) => {
              const transactionCode = pesanan.id.slice(0, 8).toUpperCase();
              const statusDisplay = getDisplayStatus(pesanan);
              const isApproved = statusDisplay === "approved";

              return (
                <div key={pesanan.id} className="pesanan-card">
                  <div className="card-left">
                    <div className="product-avatar">
                      {pesanan.produk?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="card-info">
                      <div className="product-name">
                        {pesanan.produk?.name || `Produk #${pesanan.product_id}`}
                      </div>
                      <div className="transaction-code">
                        Kode Transaksi: <span>{transactionCode}</span>
                      </div>
                      <div className="order-meta">
                        <span className="meta-item">
                          <Calendar size={13} />
                          {new Date(pesanan.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {pesanan.metode_pembayaran && (
                          <span className="meta-item">
                            <CreditCard size={13} />
                            {pesanan.metode_pembayaran.toUpperCase()}
                          </span>
                        )}
                        <span className="meta-item">
                          <CircleDollarSign size={13} />
                          {formatRupiah(pesanan.produk?.harga)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="card-right">
                    {getStatusBadge(statusDisplay)}
                    {isApproved ? (
                      <Link href="/beranda" className="btn-download">
                        <Download size={16} /> Unduh Aset
                      </Link>
                    ) : (
                      <button className="btn-download disabled" disabled>
                        <Download size={16} /> Tidak Tersedia
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .pesanan-page {
          background: linear-gradient(135deg, #0b1120 0%, #0f172a 100%);
          min-height: 100vh;
          color: #e2e8f0;
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
        }
        .pesanan-container {
          max-width: 860px;
          margin: 0 auto;
          padding: 130px 24px 60px;
        }
        .pesanan-header {
          text-align: center;
          margin-bottom: 44px;
        }
        .header-icon {
          display: inline-flex;
          background: rgba(255, 215, 0, 0.08);
          padding: 16px;
          border-radius: 20px;
          color: #ffd700;
          margin-bottom: 20px;
          box-shadow: 0 8px 20px rgba(255, 215, 0, 0.1);
        }
        .pesanan-header h2 {
          font-size: 2.4rem;
          font-weight: 800;
          color: white;
          margin: 0 0 8px;
          letter-spacing: -0.5px;
        }
        .pesanan-header h2 span {
          color: #ffd700;
        }
        .pesanan-header p {
          color: #94a3b8;
          font-size: 1rem;
        }
        .loading-skeleton {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .skeleton-card {
          background: #1e293b;
          border-radius: 18px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          animation: pulse 1.6s infinite;
        }
        .skeleton-line {
          height: 12px;
          background: #334155;
          border-radius: 8px;
          margin-bottom: 12px;
          width: 100%;
        }
        .skeleton-line.wide {
          width: 50%;
          height: 16px;
        }
        .skeleton-line.short {
          width: 30%;
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        .error-state,
        .empty-state {
          text-align: center;
          padding: 64px 24px;
          background: rgba(30, 41, 59, 0.6);
          backdrop-filter: blur(16px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
        }
        .error-state svg,
        .empty-state svg {
          color: #ffd700;
          margin-bottom: 16px;
        }
        .empty-state h3 {
          font-size: 1.4rem;
          color: white;
          margin: 12px 0 6px;
        }
        .pesanan-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .pesanan-card {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(18px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 22px;
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          transition: all 0.25s ease;
          box-shadow: 0 10px 25px -8px rgba(0, 0, 0, 0.4);
        }
        .pesanan-card:hover {
          border-color: rgba(255, 215, 0, 0.25);
          box-shadow: 0 15px 35px -8px rgba(255, 215, 0, 0.08);
          transform: translateY(-2px);
        }
        .card-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          min-width: 240px;
        }
        .product-avatar {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: rgba(255, 215, 0, 0.1);
          border: 1px solid rgba(255, 215, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.2rem;
          color: #ffd700;
          flex-shrink: 0;
        }
        .product-name {
          font-weight: 700;
          color: #f1f5f9;
          font-size: 1rem;
          margin-bottom: 4px;
        }
        .transaction-code {
          font-size: 0.75rem;
          color: #a0aec0;
          margin-bottom: 4px;
        }
        .transaction-code span {
          font-family: monospace;
          font-weight: 600;
          color: #ffd700;
          background: rgba(255, 215, 0, 0.1);
          padding: 2px 6px;
          border-radius: 12px;
        }
        .order-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          color: #94a3b8;
          font-size: 0.8rem;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #94a3b8;
        }
        .card-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
          flex-shrink: 0;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .badge-approved {
          background: #10b98120;
          color: #10b981;
          border: 1px solid #10b98140;
        }
        .badge-pending {
          background: #f59e0b20;
          color: #f59e0b;
          border: 1px solid #f59e0b40;
        }
        .badge-declined {
          background: #ef444420;
          color: #ef4444;
          border: 1px solid #ef444440;
        }
        .btn-download {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #ffd700, #fbbf24);
          color: #0f172a;
          padding: 10px 20px;
          border-radius: 30px;
          font-weight: 700;
          text-decoration: none;
          border: none;
          cursor: pointer;
          font-size: 0.85rem;
          letter-spacing: -0.2px;
          transition: all 0.2s;
          box-shadow: 0 6px 18px rgba(255, 215, 0, 0.2);
        }
        .btn-download:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(255, 215, 0, 0.35);
        }
        .btn-download.disabled {
          background: #334155;
          color: #64748b;
          box-shadow: none;
          cursor: not-allowed;
          transform: none;
        }
        @media (max-width: 600px) {
          .pesanan-card {
            flex-direction: column;
            align-items: flex-start;
          }
          .card-right {
            width: 100%;
            flex-direction: row;
            justify-content: flex-end;
            align-items: center;
          }
        }
      `}</style>
    </main>
  );
}