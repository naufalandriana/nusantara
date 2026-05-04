// app/admin/dashboard/product/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowser } from "@/app/lib/supabase/client";
import {
  Search,
  RefreshCw,
  Plus,
  X,
  Package,
  Pencil,
  Trash2,
  Tag,
  MapPin,
  CheckCircle,
  Image as ImageIcon,
} from "lucide-react";

/* ─── Types ─── */
type ProductRow = {
  id: number;
  created_at: string;
  nama: string;
  deskripsi: string | null;
  provinsi: string | null;
  kategori: string | null;
  harga: number | null;
  gambar_url: string | null;
  image_preview: string | null;
  is_free_trial: boolean;
};

type FormState = {
  nama: string;
  deskripsi: string;
  provinsi: string;
  kategori: string;
  harga: string;
  gambar_url: string;
  image_preview: string;
  is_free_trial: boolean;
};

/* ─── Constants ─── */
const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "24px",
};

const KATEGORI_CONFIG: Record<string, { color: string; bg: string }> = {
  "Jawa Tengah":    { color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  "Jawa Barat":      { color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  "Jawa Timur":   { color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  "Banten":       { color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
  "Bali":   { color: "#f87171", bg: "rgba(248,113,113,0.1)" },
  "Lainnya":     { color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
};

const KATEGORI_LIST = ["Jawa Tengah", "Jawa Barat", "Jawa Timur", "Banten", "Bali", "Lainnya"];

const EMPTY_FORM: FormState = {
  nama: "",
  deskripsi: "",
  provinsi: "",
  kategori: "",
  harga: "",
  gambar_url: "",
  image_preview: "",
  is_free_trial: false,
};

/* ─── Helpers ─── */
const formatRupiah = (n: number | null) => {
  if (n === null || n === 0) return "Gratis";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
};

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

const getKategoriCfg = (k: string | null) =>
  KATEGORI_CONFIG[k ?? ""] ?? { color: "#94a3b8", bg: "rgba(148,163,184,0.1)" };

/* ════════════════════════════════════════════
   PAGE
════════════════════════════════════════════ */
export default function ProductPage() {
  const supabase = createSupabaseBrowser();

  /* table state */
  const [products, setProducts]       = useState<ProductRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("all");

  /* modal state */
  const [modalOpen, setModalOpen]     = useState(false);
  const [editTarget, setEditTarget]   = useState<ProductRow | null>(null);
  const [form, setForm]               = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const namaRef = useRef<HTMLInputElement>(null);

  /* delete confirm state */
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [deleting, setDeleting]         = useState(false);

  /* ─── Fetch ─── */
  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("product")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setProducts(data as ProductRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (modalOpen) setTimeout(() => namaRef.current?.focus(), 80);
  }, [modalOpen]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") { closeModal(); setDeleteTarget(null); } };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  /* ─── Filtered list ─── */
  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.nama.toLowerCase().includes(q) ||
      (p.provinsi ?? "").toLowerCase().includes(q) ||
      (p.kategori ?? "").toLowerCase().includes(q) ||
      (p.deskripsi ?? "").toLowerCase().includes(q);
    const matchKat = kategoriFilter === "all" || p.kategori === kategoriFilter;
    return matchSearch && matchKat;
  });

  /* ─── Modal helpers ─── */
  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormSuccess(false);
    setModalOpen(true);
  };

  const openEdit = (p: ProductRow) => {
    setEditTarget(p);
    setForm({
      nama: p.nama,
      deskripsi: p.deskripsi ?? "",
      provinsi: p.provinsi ?? "",
      kategori: p.kategori ?? "",
      harga: p.harga !== null ? String(p.harga) : "",
      gambar_url: p.gambar_url ?? "",
      image_preview: p.image_preview ?? "",
      is_free_trial: p.is_free_trial,
    });
    setFormError("");
    setFormSuccess(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormSuccess(false);
  };

  /* ─── Submit (Add / Edit) ─── */
  const handleSubmit = async () => {
    setFormError("");
    if (!form.nama.trim()) return setFormError("Nama produk wajib diisi.");

    setSubmitting(true);
    try {
      const payload = {
        nama: form.nama.trim(),
        deskripsi: form.deskripsi.trim() || null,
        provinsi: form.provinsi.trim() || null,
        kategori: form.kategori || null,
        harga: form.harga ? parseInt(form.harga.replace(/\D/g, ""), 10) : null,
        gambar_url: form.gambar_url.trim() || null,
        image_preview: form.image_preview.trim() || null,
        is_free_trial: form.is_free_trial,
      };

      if (editTarget) {
        const { error } = await supabase.from("product").update(payload).eq("id", editTarget.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("product").insert(payload);
        if (error) throw new Error(error.message);
      }

      setFormSuccess(true);
      await fetchProducts();
      setTimeout(closeModal, 1400);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Delete ─── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("product").delete().eq("id", deleteTarget.id);
      if (error) throw new Error(error.message);
      await fetchProducts();
      setDeleteTarget(null);
    } catch {
      // silent — optionally show toast
    } finally {
      setDeleting(false);
    }
  };

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    <>
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
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25%     { transform: translateX(-5px); }
          75%     { transform: translateX(5px); }
        }
        @keyframes spinAnim { to { transform: rotate(360deg); } }
        @keyframes shimmer  {
          0%,100% { opacity: 0.35; }
          50%     { opacity: 0.7; }
        }

        * { box-sizing: border-box; }

        .page-wrapper {
          display: flex; flex-direction: column; gap: 28px;
          max-width: 1400px;
          animation: fadeSlideUp 0.5s ease both;
          font-family: 'Plus Jakarta Sans', Poppins, sans-serif;
        }

        .modal-input {
          width: 100%; height: 44px; padding: 0 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px; color: #f8fafc; font-size: 14px;
          font-family: 'Plus Jakarta Sans', Poppins, sans-serif;
          outline: none; transition: border-color 0.2s, background 0.2s;
        }
        .modal-input::placeholder { color: #475569; }
        .modal-input:focus {
          border-color: rgba(255,215,0,0.4);
          background: rgba(255,255,255,0.06);
        }
        .modal-textarea {
          width: 100%; padding: 12px 14px; min-height: 88px; resize: vertical;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px; color: #f8fafc; font-size: 14px;
          font-family: 'Plus Jakarta Sans', Poppins, sans-serif;
          outline: none; transition: border-color 0.2s, background 0.2s;
        }
        .modal-textarea::placeholder { color: #475569; }
        .modal-textarea:focus {
          border-color: rgba(255,215,0,0.4);
          background: rgba(255,255,255,0.06);
        }
        .modal-select {
          width: 100%; height: 44px; padding: 0 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px; color: #f8fafc; font-size: 14px;
          font-family: 'Plus Jakarta Sans', Poppins, sans-serif;
          outline: none; cursor: pointer; appearance: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .modal-select:focus {
          border-color: rgba(255,215,0,0.4);
          background: rgba(255,255,255,0.06);
        }
        .modal-select option { background: #0f172a; color: #f8fafc; }

        .prod-header-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 28px; border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-wrap: wrap; gap: 14px;
        }
        .prod-controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

        .prod-search-wrap {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: 0 14px; height: 38px; min-width: 200px;
          transition: border-color 0.2s;
        }
        .prod-search-wrap:focus-within { border-color: rgba(255,215,0,0.35); }
        .prod-search-input {
          background: transparent; border: none; outline: none;
          color: #f8fafc; font-size: 13px; font-family: inherit; width: 100%;
        }
        .prod-search-input::placeholder { color: #475569; }

        .filter-pill {
          padding: 6px 13px; border-radius: 10px; font-size: 12px; font-weight: 600;
          border: 1px solid rgba(255,255,255,0.08); cursor: pointer; font-family: inherit;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
          white-space: nowrap;
        }
        .filter-pill.active  { background: rgba(255,215,0,0.1); border-color: rgba(255,215,0,0.3); color: #ffd700; }
        .filter-pill:not(.active)       { background: rgba(255,255,255,0.03); color: #64748b; }
        .filter-pill:not(.active):hover { background: rgba(255,255,255,0.06); color: #e2e8f0; }

        .refresh-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 13px; border-radius: 10px; font-size: 12px; font-weight: 600;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          color: #64748b; cursor: pointer; font-family: inherit;
          transition: color 0.2s, border-color 0.2s, background 0.2s;
        }
        .refresh-btn:hover { color: #ffd700; border-color: rgba(255,215,0,0.25); background: rgba(255,215,0,0.05); }
        .refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .spinning { animation: spinAnim 0.8s linear infinite; }

        .add-prod-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 18px; border-radius: 12px; font-size: 13px; font-weight: 700;
          background: #ffd700; color: #0f172a; border: none; cursor: pointer;
          font-family: inherit; transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 3px 12px rgba(255,215,0,0.25);
        }
        .add-prod-btn:hover  { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(255,215,0,0.35); }
        .add-prod-btn:active { transform: translateY(0); }

        .prod-th {
          padding: 13px 20px; text-align: left;
          font-size: 10px; font-weight: 700; color: #475569;
          text-transform: uppercase; letter-spacing: 1.5px; white-space: nowrap;
        }
        .prod-td { padding: 14px 20px; }

        .kat-badge {
          display: inline-flex; align-items: center;
          font-size: 11px; font-weight: 700; padding: 4px 11px; border-radius: 9px;
          white-space: nowrap;
        }
        .free-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 8px;
          background: rgba(74,222,128,0.1); color: #4ade80;
          white-space: nowrap;
        }

        .action-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 30px; height: 30px; border-radius: 9px; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03);
          transition: all 0.2s; color: #64748b;
        }
        .action-btn.edit:hover  { color: #ffd700; border-color: rgba(255,215,0,0.3); background: rgba(255,215,0,0.07); }
        .action-btn.del:hover   { color: #f87171; border-color: rgba(248,113,113,0.3); background: rgba(248,113,113,0.07); }

        .skeleton-bar {
          background: rgba(255,255,255,0.06); border-radius: 6px;
          animation: shimmer 1.5s ease-in-out infinite;
        }

        .toggle-track {
          width: 42px; height: 24px; border-radius: 99px; cursor: pointer; position: relative;
          transition: background 0.25s; border: none; padding: 0;
          flex-shrink: 0;
        }
        .toggle-thumb {
          position: absolute; top: 3px; width: 18px; height: 18px;
          border-radius: 50%; background: #fff; transition: left 0.25s;
        }

        .modal-label {
          font-size: 12px; font-weight: 600; color: #94a3b8;
          display: block; margin-bottom: 7px;
        }
        .required-star { color: #f87171; }

        /* responsive */
        @media (max-width: 1024px) { .col-id { display: none; } }
        @media (max-width: 900px)  { .col-deskripsi { display: none; } }
        @media (max-width: 768px) {
          .prod-header-bar { padding: 16px 16px; }
          .prod-th  { padding: 10px 12px; font-size: 9px; }
          .prod-td  { padding: 12px 12px; }
          .col-provinsi { display: none; }
          .col-date     { display: none; }
        }
        @media (max-width: 640px) {
          .col-harga { display: none; }
          .prod-search-wrap { min-width: 140px; }
        }
      `}</style>

      {/* ─────────────────────────────────────
          ADD / EDIT MODAL
      ───────────────────────────────────── */}
      {modalOpen && (
        <div
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(2,6,23,0.78)",
            backdropFilter: "blur(7px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.15s ease",
            overflowY: "auto",
          }}
        >
          <div style={{
            width: "100%", maxWidth: "560px",
            background: "rgba(15,23,42,0.98)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "24px",
            padding: "32px",
            boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
            position: "relative",
            animation: "modalIn 0.25s cubic-bezier(0.16,1,0.3,1)",
            fontFamily: "'Plus Jakarta Sans', Poppins, sans-serif",
            margin: "auto",
          }}>
            {/* Gold shimmer */}
            <div style={{
              position: "absolute", top: 0, left: "20%", right: "20%", height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.4), transparent)",
              borderRadius: "99px",
            }} />

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "12px",
                  background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#ffd700",
                }}>
                  {editTarget ? <Pencil size={17} /> : <Plus size={18} />}
                </div>
                <div>
                  <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#fff", margin: 0 }}>
                    {editTarget ? "Edit Produk" : "Tambah Produk"}
                  </h2>
                  <p style={{ fontSize: "12px", color: "#475569", margin: "2px 0 0" }}>
                    {editTarget ? `ID #${editTarget.id}` : "Daftarkan produk baru ke sistem"}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                style={{
                  width: "32px", height: "32px", borderRadius: "10px",
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#64748b", transition: "color 0.2s, background 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.09)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Success */}
            {formSuccess ? (
              <div style={{ padding: "28px 0", textAlign: "center", animation: "fadeSlideUp 0.3s ease" }}>
                <div style={{
                  width: "56px", height: "56px", borderRadius: "50%",
                  background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px", fontSize: "22px", color: "#4ade80",
                }}>
                  <CheckCircle size={26} />
                </div>
                <p style={{ color: "#4ade80", fontWeight: 700, fontSize: "15px", margin: 0 }}>
                  Produk berhasil {editTarget ? "diperbarui" : "ditambahkan"}!
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                {/* Nama */}
                <div>
                  <label className="modal-label">
                    Nama Produk <span className="required-star">*</span>
                  </label>
                  <input
                    ref={namaRef}
                    className="modal-input"
                    placeholder="Contoh: Tanah Kavling Serpong"
                    value={form.nama}
                    onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                  />
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="modal-label">Deskripsi</label>
                  <textarea
                    className="modal-textarea"
                    placeholder="Deskripsi singkat produk..."
                    value={form.deskripsi}
                    onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))}
                  />
                </div>

                {/* Row: Provinsi + Kategori */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="modal-label">Provinsi</label>
                    <input
                      className="modal-input"
                      placeholder="Contoh: Banten"
                      value={form.provinsi}
                      onChange={e => setForm(f => ({ ...f, provinsi: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="modal-label">Kategori</label>
                    <div style={{ position: "relative" }}>
                      <select
                        className="modal-select"
                        value={form.kategori}
                        onChange={e => setForm(f => ({ ...f, kategori: e.target.value }))}
                      >
                        <option value="">Pilih kategori</option>
                        {KATEGORI_LIST.map(k => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                      <Tag size={13} color="#475569" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    </div>
                  </div>
                </div>

                {/* Harga */}
                <div>
                  <label className="modal-label">
                    Harga{" "}
                    <span style={{ color: "#475569", fontWeight: 400 }}>(kosongkan jika gratis)</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
                      color: "#475569", fontSize: "13px", fontWeight: 600, pointerEvents: "none",
                    }}>Rp</span>
                    <input
                      className="modal-input"
                      placeholder="0"
                      value={form.harga}
                      onChange={e => setForm(f => ({ ...f, harga: e.target.value.replace(/\D/g, "") }))}
                      style={{ paddingLeft: "36px" }}
                    />
                  </div>
                </div>

                {/* Row: Gambar URL + Preview URL */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="modal-label">URL Gambar</label>
                    <div style={{ position: "relative" }}>
                      <input
                        className="modal-input"
                        placeholder="https://..."
                        value={form.gambar_url}
                        onChange={e => setForm(f => ({ ...f, gambar_url: e.target.value }))}
                        style={{ paddingRight: "36px" }}
                      />
                      <ImageIcon size={13} color="#475569" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    </div>
                  </div>
                  <div>
                    <label className="modal-label">URL Preview</label>
                    <div style={{ position: "relative" }}>
                      <input
                        className="modal-input"
                        placeholder="https://..."
                        value={form.image_preview}
                        onChange={e => setForm(f => ({ ...f, image_preview: e.target.value }))}
                        style={{ paddingRight: "36px" }}
                      />
                      <ImageIcon size={13} color="#475569" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    </div>
                  </div>
                </div>

                {/* Free Trial toggle */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px", padding: "14px 16px",
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#e2e8f0" }}>Free Trial</p>
                    <p style={{ margin: "3px 0 0", fontSize: "11px", color: "#475569" }}>Produk dapat dicoba gratis</p>
                  </div>
                  <button
                    type="button"
                    className="toggle-track"
                    onClick={() => setForm(f => ({ ...f, is_free_trial: !f.is_free_trial }))}
                    style={{ background: form.is_free_trial ? "#4ade80" : "rgba(255,255,255,0.1)" }}
                  >
                    <div className="toggle-thumb" style={{ left: form.is_free_trial ? "21px" : "3px" }} />
                  </button>
                </div>

                {/* Error */}
                {formError && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                    color: "#f87171", fontSize: "12px", padding: "10px 14px", borderRadius: "10px",
                    animation: "shake 0.3s ease",
                  }}>
                    ⚠ {formError}
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    marginTop: "4px", width: "100%", height: "48px",
                    background: submitting ? "rgba(255,215,0,0.5)" : "#ffd700",
                    color: "#0f172a", border: "none", borderRadius: "14px",
                    fontSize: "14px", fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer",
                    fontFamily: "inherit", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: "8px", transition: "transform 0.2s, box-shadow 0.2s",
                    boxShadow: "0 4px 14px rgba(255,215,0,0.3)",
                  }}
                  onMouseEnter={e => { if (!submitting) e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  {submitting ? (
                    <>
                      <span style={{
                        width: "16px", height: "16px",
                        border: "2px solid rgba(15,23,42,0.25)", borderTopColor: "#0f172a",
                        borderRadius: "50%", animation: "spinAnim 0.8s linear infinite", display: "inline-block",
                      }} />
                      Menyimpan...
                    </>
                  ) : editTarget ? (
                    <><Pencil size={15} /> Simpan Perubahan</>
                  ) : (
                    <><Plus size={16} /> Tambah Produk</>
                  )}
                </button>

              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────
          DELETE CONFIRM MODAL
      ───────────────────────────────────── */}
      {deleteTarget && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(2,6,23,0.78)",
            backdropFilter: "blur(7px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.15s ease",
          }}
        >
          <div style={{
            width: "100%", maxWidth: "400px",
            background: "rgba(15,23,42,0.98)",
            border: "1px solid rgba(248,113,113,0.2)",
            borderRadius: "24px", padding: "32px",
            boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
            animation: "modalIn 0.25s cubic-bezier(0.16,1,0.3,1)",
            fontFamily: "'Plus Jakarta Sans', Poppins, sans-serif",
          }}>
            {/* Red shimmer */}
            <div style={{
              width: "100%", height: "1px", marginBottom: "24px",
              background: "linear-gradient(90deg, transparent, rgba(248,113,113,0.4), transparent)",
            }} />

            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "52px", height: "52px", borderRadius: "50%",
                background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px", color: "#f87171",
              }}>
                <Trash2 size={22} />
              </div>
              <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>
                Hapus Produk?
              </h2>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 4px" }}>
                Kamu yakin mau hapus:
              </p>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#e2e8f0", margin: "0 0 24px" }}>
                &ldquo;{deleteTarget.nama}&rdquo;
              </p>
              <p style={{ fontSize: "11px", color: "#475569", margin: "0 0 28px" }}>
                Tindakan ini tidak bisa dibatalkan.
              </p>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setDeleteTarget(null)}
                  style={{
                    flex: 1, height: "44px", borderRadius: "12px", cursor: "pointer",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#94a3b8", fontSize: "13px", fontWeight: 700, fontFamily: "inherit",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "#e2e8f0"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#94a3b8"; }}
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    flex: 1, height: "44px", borderRadius: "12px", cursor: deleting ? "not-allowed" : "pointer",
                    background: deleting ? "rgba(239,68,68,0.4)" : "#ef4444",
                    border: "none", color: "#fff",
                    fontSize: "13px", fontWeight: 700, fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                    transition: "all 0.2s",
                  }}
                >
                  {deleting ? (
                    <span style={{
                      width: "14px", height: "14px",
                      border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
                      borderRadius: "50%", animation: "spinAnim 0.8s linear infinite", display: "inline-block",
                    }} />
                  ) : (
                    <><Trash2 size={14} /> Hapus</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────
          MAIN PAGE
      ───────────────────────────────────── */}
      <div className="page-wrapper">

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", margin: 0 }}>
              Manajemen Produk
            </h1>
            <p style={{ color: "#64748b", fontSize: "14px", margin: "6px 0 0" }}>
              Kelola semua produk yang tersedia di platform.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button className="refresh-btn" onClick={fetchProducts} disabled={loading}>
              <RefreshCw size={13} className={loading ? "spinning" : ""} />
              Refresh
            </button>
            <button className="add-prod-btn" onClick={openAdd}>
              <Plus size={15} />
              Tambah Produk
            </button>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px" }}>
          {[
            { label: "Total Produk",   value: products.length,                           color: "#ffd700" },
            { label: "Free Trial",     value: products.filter(p => p.is_free_trial).length, color: "#4ade80" },
            { label: "Berbayar",       value: products.filter(p => !p.is_free_trial && p.harga).length, color: "#60a5fa" },
            { label: "Tanpa Harga",    value: products.filter(p => !p.harga).length,      color: "#a78bfa" },
          ].map(s => (
            <div key={s.label} style={{
              ...card, padding: "18px 20px",
              display: "flex", flexDirection: "column", gap: "6px",
            }}>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "1px" }}>
                {s.label}
              </p>
              <p style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: s.color, lineHeight: 1 }}>
                {loading ? "—" : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Table card ── */}
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>

          {/* Bar: title + controls */}
          <div className="prod-header-bar">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "4px", height: "24px", background: "#ffd700", borderRadius: "4px" }} />
              <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "17px", margin: 0 }}>Daftar Produk</h3>
              <span style={{
                background: "rgba(255,215,0,0.1)", color: "#ffd700",
                fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "8px",
              }}>
                {loading ? "…" : filtered.length}
              </span>
            </div>

            <div className="prod-controls">
              <div className="prod-search-wrap">
                <Search size={13} color="#475569" style={{ flexShrink: 0 }} />
                <input
                  className="prod-search-input"
                  placeholder="Cari nama / provinsi / kategori..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <button className={`filter-pill${kategoriFilter === "all" ? " active" : ""}`} onClick={() => setKategoriFilter("all")}>
                Semua
              </button>
              {KATEGORI_LIST.map(k => (
                <button
                  key={k}
                  className={`filter-pill${kategoriFilter === k ? " active" : ""}`}
                  onClick={() => setKategoriFilter(k)}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th className="prod-th">Produk</th>
                  <th className="prod-th col-provinsi">Provinsi</th>
                  <th className="prod-th">Kategori</th>
                  <th className="prod-th col-harga">Harga</th>
                  <th className="prod-th col-deskripsi">Deskripsi</th>
                  <th className="prod-th col-date">Dibuat</th>
                  <th className="prod-th" style={{ textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>

                {/* Skeleton */}
                {loading && Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="prod-td">
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div className="skeleton-bar" style={{ width: 38, height: 38, minWidth: 38, borderRadius: 10 }} />
                        <div>
                          <div className="skeleton-bar" style={{ width: 140, height: 13, marginBottom: 6 }} />
                          <div className="skeleton-bar" style={{ width: 80, height: 11 }} />
                        </div>
                      </div>
                    </td>
                    <td className="prod-td col-provinsi"><div className="skeleton-bar" style={{ width: 80, height: 13 }} /></td>
                    <td className="prod-td"><div className="skeleton-bar" style={{ width: 70, height: 22, borderRadius: 9 }} /></td>
                    <td className="prod-td col-harga"><div className="skeleton-bar" style={{ width: 90, height: 13 }} /></td>
                    <td className="prod-td col-deskripsi"><div className="skeleton-bar" style={{ width: 160, height: 13 }} /></td>
                    <td className="prod-td col-date"><div className="skeleton-bar" style={{ width: 80, height: 13 }} /></td>
                    <td className="prod-td"><div style={{ display: "flex", gap: "6px", justifyContent: "center" }}><div className="skeleton-bar" style={{ width: 30, height: 30, borderRadius: 9 }} /><div className="skeleton-bar" style={{ width: 30, height: 30, borderRadius: 9 }} /></div></td>
                  </tr>
                ))}

                {/* Empty state */}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: "56px 32px", textAlign: "center" }}>
                      <Package size={36} color="#1e293b" style={{ margin: "0 auto 12px", display: "block" }} />
                      <p style={{ color: "#475569", fontSize: "14px", margin: 0 }}>
                        {search || kategoriFilter !== "all"
                          ? "Tidak ada produk yang cocok."
                          : "Belum ada produk terdaftar."}
                      </p>
                      {(search || kategoriFilter !== "all") && (
                        <button
                          onClick={() => { setSearch(""); setKategoriFilter("all"); }}
                          style={{
                            marginTop: "12px", background: "none", border: "none",
                            color: "#ffd700", fontSize: "12px", fontWeight: 600,
                            cursor: "pointer", fontFamily: "inherit",
                          }}
                        >
                          Reset filter →
                        </button>
                      )}
                    </td>
                  </tr>
                )}

                {/* Data rows */}
                {!loading && filtered.map((p, i) => {
                  const katCfg = getKategoriCfg(p.kategori);
                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Produk */}
                      <td className="prod-td">
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {/* Thumbnail */}
                          <div style={{
                            width: "38px", height: "38px", minWidth: "38px", borderRadius: "10px",
                            background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.12)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            overflow: "hidden", flexShrink: 0,
                          }}>
                            {p.image_preview || p.gambar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.image_preview ?? p.gambar_url ?? ""}
                                alt={p.nama}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={e => { e.currentTarget.style.display = "none"; }}
                              />
                            ) : (
                              <Package size={16} color="#ffd700" />
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{
                              fontWeight: 700, color: "#fff", fontSize: "14px", margin: 0,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              maxWidth: "200px",
                            }}>
                              {p.nama}
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "3px" }}>
                              <span style={{ fontSize: "11px", color: "#475569" }}>ID #{p.id}</span>
                              {p.is_free_trial && (
                                <span className="free-badge">
                                  <CheckCircle size={9} /> FREE
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Provinsi */}
                      <td className="prod-td col-provinsi">
                        {p.provinsi ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <MapPin size={11} color="#475569" />
                            <span style={{ fontSize: "13px", color: "#64748b" }}>{p.provinsi}</span>
                          </div>
                        ) : (
                          <span style={{ color: "#334155", fontSize: "13px" }}>—</span>
                        )}
                      </td>

                      {/* Kategori */}
                      <td className="prod-td">
                        {p.kategori ? (
                          <span className="kat-badge" style={{ background: katCfg.bg, color: katCfg.color }}>
                            {p.kategori}
                          </span>
                        ) : (
                          <span style={{ color: "#334155", fontSize: "12px" }}>—</span>
                        )}
                      </td>

                      {/* Harga */}
                      <td className="prod-td col-harga">
                        <span style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: p.harga ? "#e2e8f0" : "#4ade80",
                        }}>
                          {formatRupiah(p.harga)}
                        </span>
                      </td>

                      {/* Deskripsi */}
                      <td className="prod-td col-deskripsi">
                        <span style={{
                          fontSize: "12px", color: "#475569",
                          display: "block", maxWidth: "200px",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {p.deskripsi ?? "—"}
                        </span>
                      </td>

                      {/* Dibuat */}
                      <td className="prod-td col-date" style={{ fontSize: "12px", color: "#64748b" }}>
                        {formatDate(p.created_at)}
                      </td>

                      {/* Aksi */}
                      <td className="prod-td">
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button className="action-btn edit" onClick={() => openEdit(p)} title="Edit">
                            <Pencil size={13} />
                          </button>
                          <button className="action-btn del" onClick={() => setDeleteTarget(p)} title="Hapus">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {!loading && products.length > 0 && (
            <div style={{
              padding: "13px 28px", borderTop: "1px solid rgba(255,255,255,0.04)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: "12px", color: "#334155" }}>
                Menampilkan{" "}
                <span style={{ color: "#64748b", fontWeight: 600 }}>{filtered.length}</span>
                {" "}dari{" "}
                <span style={{ color: "#64748b", fontWeight: 600 }}>{products.length}</span>
                {" "}produk
              </span>
              {(search || kategoriFilter !== "all") && (
                <button
                  onClick={() => { setSearch(""); setKategoriFilter("all"); }}
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