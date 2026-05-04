// app/admin/dashboard/transactions/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
  X,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  CreditCard,
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { createSupabaseBrowser } from "@/app/lib/supabase/client";

/* ─── Types ─── */
// ✅ Diubah: waiting_verification → pending
type OrderStatus = "pending" | "approved" | "rejected";

type Order = {
  id: string;
  created_at: string;
  customer_id: string;
  product_id: number;
  metode_pembayaran: string | null;
  bukti_transfer_url: string | null;
  is_approved: boolean;
  status: OrderStatus;
  customer_name?: string;
  product_name?: string;
};

type OrderRow = {
  id: string;
  created_at: string;
  customer_id: string;
  product_id: number;
  metode_pembayaran: string | null;
  bukti_transfer_url: string | null;
  is_approved: boolean | null;
  status: string | null;
  customers: { full_name: string | null } | null;
  product: { nama: string | null } | null;
};

/* ─── Constants ─── */
const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "24px",
};

// ✅ Diubah: key waiting_verification → pending
const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:  { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",   label: "Menunggu Verifikasi" },
  approved: { color: "#4ade80", bg: "rgba(74,222,128,0.1)",   label: "Disetujui"           },
  rejected: { color: "#f87171", bg: "rgba(248,113,113,0.1)", label: "Ditolak"             },
};

// ✅ Bucket sesuai payment page (upload ke bucket "pembayaran", path "bukti-bayar/xxx")
const STORAGE_BUCKET = "pembayaran";

const FILTER_STATUS = [
  { value: "all",      label: "Semua"               },
  { value: "pending",  label: "Menunggu Verifikasi" },
  { value: "approved", label: "Disetujui"           },
  { value: "rejected", label: "Ditolak"             },
];

/* ─── Helpers ─── */
const shortId = (uuid: string) => uuid.split("-")[0].toUpperCase();

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

/* ════════════════════════════════════════════
   PAGE
════════════════════════════════════════════ */
export default function TransactionsPage() {
  const supabase = createSupabaseBrowser();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [sortBy, setSortBy] = useState<keyof Order | null>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [detailTarget, setDetailTarget] = useState<Order | null>(null);

  // ✅ State untuk image preview di modal
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  /* ─── Fetch dari Supabase ─── */
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("orders")
      .select(`
        id,
        created_at,
        customer_id,
        product_id,
        metode_pembayaran,
        bukti_transfer_url,
        is_approved,
        status,
        customers ( full_name ),
        product ( nama )
      `)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const mapped: Order[] = (data as unknown as OrderRow[]).map((row) => {
      // ✅ Fix: path dari DB adalah "bukti-bayar/TRNSKSI-xxx.png"
      // Bucket: "pembayaran", path di dalam bucket sudah include folder "bukti-bayar/"
      let buktiUrl: string | null = null;
      if (row.bukti_transfer_url) {
        if (row.bukti_transfer_url.startsWith("http")) {
          buktiUrl = row.bukti_transfer_url;
        } else {
          const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(row.bukti_transfer_url);
          buktiUrl = urlData.publicUrl;
        }
      }

      return {
        id: row.id,
        created_at: row.created_at,
        customer_id: row.customer_id,
        product_id: row.product_id,
        metode_pembayaran: row.metode_pembayaran,
        bukti_transfer_url: buktiUrl,
        is_approved: row.is_approved ?? false,
        status: (row.status as OrderStatus) ?? "pending",
        customer_name: row.customers?.full_name ?? undefined,
        product_name: row.product?.nama ?? undefined,
      };
    });

    setOrders(mapped);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /* ─── Refresh ─── */
  const refresh = () => {
    setSearch("");
    setStatusFilter("all");
    setSortBy("created_at");
    setSortOrder("desc");
    fetchOrders();
  };

  /* ─── Sort ─── */
  const handleSort = (column: keyof Order) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  /* ─── Approve ─── */
  const handleApprove = async (o: Order) => {
    const { error: updateError } = await supabase
      .from("orders")
      .update({ is_approved: true, status: "approved" })
      .eq("id", o.id);

    if (updateError) {
      alert("Gagal menyetujui order: " + updateError.message);
      return;
    }

    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === o.id ? { ...ord, is_approved: true, status: "approved" as OrderStatus } : ord
      )
    );
    setDetailTarget(null);
  };

  /* ─── Reject ─── */
  const handleReject = async (o: Order) => {
    const { error: updateError } = await supabase
      .from("orders")
      .update({ is_approved: false, status: "rejected" })
      .eq("id", o.id);

    if (updateError) {
      alert("Gagal menolak order: " + updateError.message);
      return;
    }

    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === o.id ? { ...ord, is_approved: false, status: "rejected" as OrderStatus } : ord
      )
    );
    setDetailTarget(null);
  };

  /* ─── Filter + Sort (client-side) ─── */
  const filtered = orders
    .filter((o) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        (o.customer_name ?? "").toLowerCase().includes(q) ||
        (o.product_name ?? "").toLowerCase().includes(q) ||
        o.customer_id.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (!sortBy) return 0;
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortOrder === "asc" ? -1 : 1;
      if (bVal == null) return sortOrder === "asc" ? 1 : -1;
      let cmp = 0;
      if (typeof aVal === "string" && typeof bVal === "string") {
        cmp = aVal.localeCompare(bVal);
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else if (typeof aVal === "boolean" && typeof bVal === "boolean") {
        cmp = Number(aVal) - Number(bVal);
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

  const renderSortIcon = (column: keyof Order) => {
    if (sortBy !== column) return <ArrowUpDown size={10} color="#475569" />;
    if (sortOrder === "asc") return <ArrowUp size={10} color="#ffd700" />;
    return <ArrowDown size={10} color="#ffd700" />;
  };

  return (
    <>
      {/* CSS */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }

        * { box-sizing: border-box; }

        .page-wrapper {
          display: flex; flex-direction: column; gap: 28px;
          max-width: 1400px;
          animation: fadeSlideUp 0.5s ease both;
          font-family: 'Plus Jakarta Sans', Poppins, sans-serif;
        }

        .trx-header-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 28px; border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-wrap: wrap; gap: 14px;
        }
        .trx-controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

        .trx-search-wrap {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: 0 14px; height: 38px; min-width: 200px;
          transition: border-color 0.2s;
        }
        .trx-search-wrap:focus-within { border-color: rgba(255,215,0,0.35); }
        .trx-search-input {
          background: transparent; border: none; outline: none;
          color: #f8fafc; font-size: 13px; font-family: inherit; width: 100%;
        }
        .trx-search-input::placeholder { color: #475569; }

        .filter-pill {
          padding: 6px 13px; border-radius: 10px; font-size: 12px; font-weight: 600;
          border: 1px solid rgba(255,255,255,0.08); cursor: pointer; font-family: inherit;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
          white-space: nowrap;
        }
        .filter-pill.active            { background: rgba(255,215,0,0.1); border-color: rgba(255,215,0,0.3); color: #ffd700; }
        .filter-pill:not(.active)      { background: rgba(255,255,255,0.03); color: #64748b; }
        .filter-pill:not(.active):hover{ background: rgba(255,255,255,0.06); color: #e2e8f0; }

        .refresh-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 13px; border-radius: 10px; font-size: 12px; font-weight: 600;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          color: #64748b; cursor: pointer; font-family: inherit;
          transition: color 0.2s, border-color 0.2s, background 0.2s;
        }
        .refresh-btn:hover { color: #ffd700; border-color: rgba(255,215,0,0.25); background: rgba(255,215,0,0.05); }

        .trx-th {
          padding: 13px 20px; text-align: left;
          font-size: 10px; font-weight: 700; color: #475569;
          text-transform: uppercase; letter-spacing: 1.5px; white-space: nowrap;
          cursor: default;
        }
        .trx-th.sortable { cursor: pointer; user-select: none; transition: color 0.2s; }
        .trx-th.sortable:hover { color: #e2e8f0; }
        .trx-td { padding: 14px 20px; }

        .status-badge {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9px;
          white-space: nowrap;
        }

        .action-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 30px; height: 30px; border-radius: 9px; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03);
          transition: all 0.2s; color: #64748b;
        }
        .action-btn.view:hover { color: #60a5fa; border-color: rgba(96,165,250,0.3); background: rgba(96,165,250,0.07); }

        .modal-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(2,6,23,0.78);
          backdrop-filter: blur(7px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: fadeIn 0.15s ease;
          overflow-y: auto;
        }
        .modal-content {
          width: 100%; max-width: 520px;
          background: rgba(15,23,42,0.98);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.6);
          position: relative;
          animation: modalIn 0.25s cubic-bezier(0.16,1,0.3,1);
          font-family: 'Plus Jakarta Sans', Poppins, sans-serif;
          margin: auto;
        }

        .detail-row label {
          font-size: 10px; color: #475569; text-transform: uppercase;
          letter-spacing: 1px; font-weight: 700;
        }
        .detail-row p { margin: 4px 0 0; color: #e2e8f0; font-size: 14px; font-weight: 600; }

        /* ✅ Skeleton shimmer untuk gambar loading */
        .img-skeleton {
          width: 100%; height: 200px; border-radius: 12px;
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 400px 100%;
          animation: shimmer 1.4s infinite;
          margin-top: 8px;
        }

        @media (max-width: 1024px) { .col-id { display: none; } }
        @media (max-width: 768px) {
          .trx-header-bar { padding: 16px; }
          .trx-th { padding: 10px 12px; font-size: 9px; }
          .trx-td { padding: 12px 12px; }
          .col-date { display: none; }
        }
        @media (max-width: 640px) {
          .col-product, .col-customer { display: none; }
          .trx-search-wrap { min-width: 140px; }
        }
      `}</style>

      {/* ─── Detail Modal ─── */}
      {detailTarget && (
        <div className="modal-overlay" onClick={() => setDetailTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setDetailTarget(null)}
              style={{
                position: "absolute", top: "20px", right: "20px",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px", width: "32px", height: "32px",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#64748b",
              }}
            >
              <X size={15} />
            </button>

            <h2 style={{ color: "#fff", fontSize: "18px", fontWeight: 800, margin: "0 0 24px" }}>
              Detail Transaksi
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="detail-row">
                <label>Order ID</label>
                <p style={{ fontFamily: "monospace", color: "#ffd700", fontSize: "13px" }}>{detailTarget.id}</p>
              </div>

              <div className="detail-row">
                <label>Pelanggan</label>
                <p>{detailTarget.customer_name ?? detailTarget.customer_id}</p>
              </div>

              <div className="detail-row">
                <label>Produk</label>
                <p>{detailTarget.product_name ?? `Product #${detailTarget.product_id}`}</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="detail-row">
                  <label>Metode Pembayaran</label>
                  <p style={{ color: detailTarget.metode_pembayaran ? "#e2e8f0" : "#475569" }}>
                    {detailTarget.metode_pembayaran ?? "—"}
                  </p>
                </div>
                <div className="detail-row">
                  <label>Status Approved</label>
                  <p style={{ color: detailTarget.is_approved ? "#4ade80" : "#f87171" }}>
                    {detailTarget.is_approved ? "✓ Approved" : "✗ Belum"}
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="detail-row">
                  <label>Status</label>
                  <p style={{ marginTop: "4px" }}>
                    <span
                      className="status-badge"
                      style={{
                        background: STATUS_CONFIG[detailTarget.status].bg,
                        color: STATUS_CONFIG[detailTarget.status].color,
                      }}
                    >
                      {detailTarget.status === "pending" ? (
                        <Clock size={12} />
                      ) : detailTarget.status === "approved" ? (
                        <CheckCircle size={12} />
                      ) : (
                        <XCircle size={12} />
                      )}
                      {STATUS_CONFIG[detailTarget.status].label}
                    </span>
                  </p>
                </div>
                <div className="detail-row">
                  <label>Tanggal Order</label>
                  <p style={{ color: "#94a3b8", fontSize: "13px" }}>{formatDate(detailTarget.created_at)}</p>
                </div>
              </div>

              {/* ✅ Bukti Transfer dengan skeleton loading + error fallback */}
              <div>
                <label style={{
                  fontSize: "10px", color: "#475569", textTransform: "uppercase",
                  letterSpacing: "1px", fontWeight: 700,
                }}>
                  Bukti Transfer
                </label>

                {detailTarget.bukti_transfer_url ? (
                  <div style={{ marginTop: "8px" }}>
                    {imgLoading && <div className="img-skeleton" />}

                    {imgError && (
                      <div style={{
                        padding: "20px", borderRadius: "12px",
                        background: "rgba(248,113,113,0.08)", border: "1px dashed rgba(248,113,113,0.3)",
                        textAlign: "center",
                      }}>
                        <p style={{ color: "#f87171", fontSize: "13px", margin: "0 0 8px" }}>
                          ⚠️ Gagal memuat gambar
                        </p>
                        <a
                          href={detailTarget.bukti_transfer_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#60a5fa", fontSize: "12px", textDecoration: "underline" }}
                        >
                          Buka URL langsung →
                        </a>
                      </div>
                    )}

                    <img
                      src={detailTarget.bukti_transfer_url}
                      alt="Bukti Transfer"
                      style={{
                        width: "100%",
                        maxHeight: "280px",
                        objectFit: "contain",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        display: imgLoading || imgError ? "none" : "block",
                        background: "rgba(255,255,255,0.02)",
                        cursor: "pointer",
                      }}
                      onLoadStart={() => { setImgLoading(true); setImgError(false); }}
                      onLoad={() => setImgLoading(false)}
                      onError={() => { setImgLoading(false); setImgError(true); }}
                      onClick={() => window.open(detailTarget.bukti_transfer_url!, "_blank")}
                      title="Klik untuk buka di tab baru"
                    />

                    {!imgError && !imgLoading && (
                      <a
                        href={detailTarget.bukti_transfer_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "block", textAlign: "center", marginTop: "6px",
                          color: "#60a5fa", fontSize: "11px", textDecoration: "none", opacity: 0.7,
                        }}
                      >
                        🔗 Buka di tab baru
                      </a>
                    )}
                  </div>
                ) : (
                  <p style={{ margin: "4px 0 0", color: "#475569", fontSize: "13px", fontStyle: "italic" }}>
                    Tidak ada bukti transfer
                  </p>
                )}
              </div>
            </div>

            {/* ✅ Action buttons: muncul untuk status "pending" */}
            {detailTarget.status === "pending" && (
              <div style={{ display: "flex", gap: "10px", marginTop: "28px" }}>
                <button
                  onClick={() => handleApprove(detailTarget)}
                  style={{
                    flex: 1, height: "44px", borderRadius: "12px", cursor: "pointer",
                    background: "#4ade80", border: "none", color: "#0f172a",
                    fontSize: "14px", fontWeight: 800, fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    boxShadow: "0 4px 14px rgba(74,222,128,0.3)",
                  }}
                >
                  <CheckCircle size={16} /> Setujui
                </button>
                <button
                  onClick={() => handleReject(detailTarget)}
                  style={{
                    flex: 1, height: "44px", borderRadius: "12px", cursor: "pointer",
                    background: "#ef4444", border: "none", color: "#fff",
                    fontSize: "14px", fontWeight: 800, fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    boxShadow: "0 4px 14px rgba(239,68,68,0.3)",
                  }}
                >
                  <XCircle size={16} /> Tolak
                </button>
              </div>
            )}

            {detailTarget.status !== "pending" && (
              <div style={{ marginTop: "28px" }}>
                <button
                  onClick={() => setDetailTarget(null)}
                  style={{
                    width: "100%", height: "44px", borderRadius: "12px", cursor: "pointer",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#94a3b8", fontSize: "14px", fontWeight: 700, fontFamily: "inherit",
                  }}
                >
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────
          MAIN CONTENT
      ───────────────────────────────────── */}
      <div className="page-wrapper">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", margin: 0 }}>
              Manajemen Transaksi
            </h1>
            <p style={{ color: "#64748b", fontSize: "14px", margin: "6px 0 0" }}>
              Pantau dan kelola semua transaksi pembelian produk.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button className="refresh-btn" onClick={refresh} disabled={loading}>
              <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "12px", padding: "14px 18px", color: "#f87171", fontSize: "13px",
          }}>
            ⚠️ Gagal memuat data: {error}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px" }}>
          {[
            { label: "Total Order", value: orders.length,                                        color: "#ffd700" },
            { label: "Menunggu",    value: orders.filter((o) => o.status === "pending").length,  color: "#fbbf24" },
            { label: "Disetujui",   value: orders.filter((o) => o.status === "approved").length, color: "#4ade80" },
            { label: "Ditolak",     value: orders.filter((o) => o.status === "rejected").length, color: "#f87171" },
          ].map((s) => (
            <div key={s.label} style={{ ...card, padding: "18px 20px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "1px" }}>
                {s.label}
              </p>
              <p style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: loading ? "#334155" : s.color, lineHeight: 1 }}>
                {loading ? "—" : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <div className="trx-header-bar">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "4px", height: "24px", background: "#ffd700", borderRadius: "4px" }} />
              <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "17px", margin: 0 }}>Daftar Order</h3>
              <span style={{
                background: "rgba(255,215,0,0.1)", color: "#ffd700",
                fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "8px",
              }}>
                {loading ? "..." : filtered.length}
              </span>
            </div>
            <div className="trx-controls">
              <div className="trx-search-wrap">
                <Search size={13} color="#475569" style={{ flexShrink: 0 }} />
                <input
                  className="trx-search-input"
                  placeholder="Cari ID, pembeli, produk..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {FILTER_STATUS.map((s) => (
                <button
                  key={s.value}
                  className={`filter-pill${statusFilter === s.value ? " active" : ""}`}
                  onClick={() => setStatusFilter(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th className="trx-th sortable col-id" onClick={() => handleSort("id")}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      Order ID {renderSortIcon("id")}
                    </div>
                  </th>
                  <th className="trx-th sortable col-customer" onClick={() => handleSort("customer_id")}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      Pelanggan {renderSortIcon("customer_id")}
                    </div>
                  </th>
                  <th className="trx-th sortable col-product" onClick={() => handleSort("product_id")}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      Produk {renderSortIcon("product_id")}
                    </div>
                  </th>
                  <th className="trx-th">Metode Bayar</th>
                  <th className="trx-th sortable" onClick={() => handleSort("status")}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      Status {renderSortIcon("status")}
                    </div>
                  </th>
                  <th className="trx-th sortable" onClick={() => handleSort("is_approved")}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      Approved {renderSortIcon("is_approved")}
                    </div>
                  </th>
                  <th className="trx-th sortable col-date" onClick={() => handleSort("created_at")}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      Tanggal {renderSortIcon("created_at")}
                    </div>
                  </th>
                  <th className="trx-th" style={{ textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {/* Loading skeleton */}
                {loading && (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="trx-td">
                          <div style={{
                            height: "14px", borderRadius: "6px",
                            background: "rgba(255,255,255,0.05)",
                            width: j === 0 ? "60px" : j === 7 ? "30px" : "80%",
                          }} />
                        </td>
                      ))}
                    </tr>
                  ))
                )}

                {/* Empty state */}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: "56px 32px", textAlign: "center" }}>
                      <CreditCard size={36} color="#1e293b" style={{ margin: "0 auto 12px", display: "block" }} />
                      <p style={{ color: "#475569", fontSize: "14px", margin: 0 }}>
                        {search || statusFilter !== "all"
                          ? "Tidak ada transaksi yang cocok."
                          : "Belum ada transaksi."}
                      </p>
                    </td>
                  </tr>
                )}

                {/* Data rows */}
                {!loading && filtered.map((o, i) => {
                  const statusCfg = STATUS_CONFIG[o.status];
                  return (
                    <tr
                      key={o.id}
                      style={{
                        borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td className="trx-td col-id" style={{ fontFamily: "monospace", color: "#ffd700", fontSize: "12px" }}>
                        {shortId(o.id)}…
                      </td>
                      <td className="trx-td col-customer">
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <User size={13} color="#475569" />
                          <span style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: 600 }}>
                            {o.customer_name ?? o.customer_id}
                          </span>
                        </div>
                      </td>
                      <td
                        className="trx-td col-product"
                        style={{
                          color: "#cbd5e1", fontSize: "13px",
                          maxWidth: "180px", overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}
                      >
                        {o.product_name ?? `#${o.product_id}`}
                      </td>
                      <td className="trx-td" style={{ color: o.metode_pembayaran ? "#94a3b8" : "#334155", fontSize: "13px" }}>
                        {o.metode_pembayaran ?? "—"}
                      </td>
                      <td className="trx-td">
                        <span className="status-badge" style={{ background: statusCfg.bg, color: statusCfg.color }}>
                          {o.status === "pending" ? (
                            <Clock size={12} />
                          ) : o.status === "approved" ? (
                            <CheckCircle size={12} />
                          ) : (
                            <XCircle size={12} />
                          )}
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="trx-td">
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          fontSize: "11px", fontWeight: 700,
                          color: o.is_approved ? "#4ade80" : "#475569",
                        }}>
                          {o.is_approved ? <CheckCircle size={12} /> : <Clock size={12} />}
                          {o.is_approved ? "Ya" : "Belum"}
                        </span>
                      </td>
                      <td className="trx-td col-date" style={{ fontSize: "12px", color: "#64748b" }}>
                        {formatDate(o.created_at)}
                      </td>
                      <td className="trx-td">
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button
                            className="action-btn view"
                            title="Lihat Detail"
                            onClick={() => {
                              setImgLoading(true);
                              setImgError(false);
                              setDetailTarget(o);
                            }}
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!loading && orders.length > 0 && (
            <div style={{
              padding: "13px 28px", borderTop: "1px solid rgba(255,255,255,0.04)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: "12px", color: "#334155" }}>
                Menampilkan{" "}
                <span style={{ color: "#64748b", fontWeight: 600 }}>{filtered.length}</span> dari{" "}
                <span style={{ color: "#64748b", fontWeight: 600 }}>{orders.length}</span> transaksi
              </span>
              {(search || statusFilter !== "all") && (
                <button
                  onClick={() => { setSearch(""); setStatusFilter("all"); }}
                  style={{
                    background: "none", border: "none", color: "#ffd700",
                    fontSize: "12px", fontWeight: 600, cursor: "pointer",
                    fontFamily: "inherit", padding: 0,
                  }}
                >
                  Reset filter ×
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}