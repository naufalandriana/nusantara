// app/admin/dashboard/customers/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowser } from "@/app/lib/supabase/client"; // ⬅️ sesuaikan dengan file client kamu
import {
  Search,
  RefreshCw,
  UserPlus,
  X,
  Users,
  Pencil,
  Trash2,
  Mail,
  CheckCircle,
  Image,
} from "lucide-react";

/* ─── Types ─── */
type CustomerRow = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type FormState = {
  email: string;
  full_name: string;
  avatar_url: string;
};

/* ─── Constants ─── */
const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "24px",
};

const EMPTY_FORM: FormState = {
  email: "",
  full_name: "",
  avatar_url: "",
};

/* ─── Helpers ─── */
const getInitial = (text: string) => text?.[0]?.toUpperCase() ?? "?";

const avatarHue = (text: string) => {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360;
  return h;
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const TABLE = "customers";

/* ════════════════════════════════════════════
   PAGE
════════════════════════════════════════════ */
export default function CustomersPage() {
  /* table state */
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  /* modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CustomerRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  /* delete confirm */
  const [deleteTarget, setDeleteTarget] = useState<CustomerRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ─── Fetch from Supabase ─── */
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await createSupabaseBrowser ()
        .from(TABLE)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data as CustomerRow[]);
    } catch (err) {
      console.error("Gagal fetch customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (modalOpen) setTimeout(() => emailRef.current?.focus(), 80);
  }, [modalOpen]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
        setDeleteTarget(null);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  /* ─── Filtered list ─── */
  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.email.toLowerCase().includes(q) ||
      (c.full_name ?? "").toLowerCase().includes(q);
    return matchSearch;
  });

  /* ─── Modal helpers ─── */
  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormSuccess(false);
    setModalOpen(true);
  };

  const openEdit = (c: CustomerRow) => {
    setEditTarget(c);
    setForm({
      email: c.email,
      full_name: c.full_name ?? "",
      avatar_url: c.avatar_url ?? "",
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
    if (!form.email.trim()) return setFormError("Email wajib diisi.");
    if (!/\S+@\S+\.\S+/.test(form.email))
      return setFormError("Format email tidak valid.");

    setSubmitting(true);
    try {
      const payload = {
        email: form.email.trim(),
        full_name: form.full_name.trim() || null,
        avatar_url: form.avatar_url.trim() || null,
      };

      if (editTarget) {
        // Update
        const { error } = await createSupabaseBrowser()
          .from(TABLE)
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editTarget.id);

        if (error) throw error;
      } else {
        // Insert – generate UUID v4
        const newId = crypto.randomUUID();
        const { error } = await createSupabaseBrowser().from(TABLE).insert({
          id: newId,
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
      }

      setFormSuccess(true);
      await fetchCustomers();
      setTimeout(closeModal, 1400);
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Terjadi kesalahan."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Delete ─── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await createSupabaseBrowser ()
        .from(TABLE)
        .delete()
        .eq("id", deleteTarget.id);

      if (error) throw error;
      await fetchCustomers();
      setDeleteTarget(null);
    } catch (err) {
      console.error("Gagal hapus:", err);
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

        .cust-header-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 28px; border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-wrap: wrap; gap: 14px;
        }
        .cust-controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

        .cust-search-wrap {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: 0 14px; height: 38px; min-width: 210px;
          transition: border-color 0.2s;
        }
        .cust-search-wrap:focus-within { border-color: rgba(255,215,0,0.35); }
        .cust-search-input {
          background: transparent; border: none; outline: none;
          color: #f8fafc; font-size: 13px; font-family: inherit; width: 100%;
        }
        .cust-search-input::placeholder { color: #475569; }

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

        .add-cust-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 18px; border-radius: 12px; font-size: 13px; font-weight: 700;
          background: #ffd700; color: #0f172a; border: none; cursor: pointer;
          font-family: inherit; transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 3px 12px rgba(255,215,0,0.25);
        }
        .add-cust-btn:hover  { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(255,215,0,0.35); }
        .add-cust-btn:active { transform: translateY(0); }

        .cust-th {
          padding: 13px 20px; text-align: left;
          font-size: 10px; font-weight: 700; color: #475569;
          text-transform: uppercase; letter-spacing: 1.5px; white-space: nowrap;
        }
        .cust-td { padding: 14px 20px; }

        .action-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 30px; height: 30px; border-radius: 9px; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03);
          transition: all 0.2s; color: #64748b;
        }
        .action-btn.edit:hover { color: #ffd700; border-color: rgba(255,215,0,0.3); background: rgba(255,215,0,0.07); }
        .action-btn.del:hover  { color: #f87171; border-color: rgba(248,113,113,0.3); background: rgba(248,113,113,0.07); }

        .skeleton-bar {
          background: rgba(255,255,255,0.06); border-radius: 6px;
          animation: shimmer 1.5s ease-in-out infinite;
        }

        .modal-label {
          font-size: 12px; font-weight: 600; color: #94a3b8;
          display: block; margin-bottom: 7px;
        }
        .required-star { color: #f87171; }

        /* responsive */
        @media (max-width: 1024px) {
          .col-date { display: none; }
        }
        @media (max-width: 768px) {
          .cust-header-bar { padding: 16px; }
          .cust-th { padding: 10px 12px; font-size: 9px; }
          .cust-td { padding: 12px 12px; }
          .col-updated { display: none; }
        }
        @media (max-width: 640px) {
          .col-fullname { display: none; }
          .cust-search-wrap { min-width: 140px; }
        }
      `}</style>

      {/* ─────────────────────────────────────
          ADD / EDIT MODAL
      ───────────────────────────────────── */}
      {modalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(2,6,23,0.78)",
            backdropFilter: "blur(7px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.15s ease",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "480px",
              background: "rgba(15,23,42,0.98)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "24px",
              padding: "32px",
              boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
              position: "relative",
              margin: "auto",
              animation: "modalIn 0.25s cubic-bezier(0.16,1,0.3,1)",
              fontFamily: "'Plus Jakarta Sans', Poppins, sans-serif",
            }}
          >
            {/* Gold shimmer */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "20%",
                right: "20%",
                height: "1px",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,215,0,0.4), transparent)",
                borderRadius: "99px",
              }}
            />

            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "28px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: "rgba(255,215,0,0.08)",
                    border: "1px solid rgba(255,215,0,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffd700",
                  }}
                >
                  {editTarget ? <Pencil size={17} /> : <UserPlus size={18} />}
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: "17px",
                      fontWeight: 800,
                      color: "#fff",
                      margin: 0,
                    }}
                  >
                    {editTarget ? "Edit Customer" : "Tambah Customer"}
                  </h2>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#475569",
                      margin: "2px 0 0",
                    }}
                  >
                    {editTarget
                      ? `ID: ${editTarget.id.slice(0, 12)}…`
                      : "Daftarkan customer baru ke sistem"}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748b",
                  transition: "color 0.2s, background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.background = "rgba(255,255,255,0.09)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#64748b";
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Success */}
            {formSuccess ? (
              <div
                style={{
                  padding: "28px 0",
                  textAlign: "center",
                  animation: "fadeSlideUp 0.3s ease",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "rgba(74,222,128,0.1)",
                    border: "1px solid rgba(74,222,128,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    color: "#4ade80",
                  }}
                >
                  <CheckCircle size={26} />
                </div>
                <p
                  style={{
                    color: "#4ade80",
                    fontWeight: 700,
                    fontSize: "15px",
                    margin: 0,
                  }}
                >
                  Customer berhasil {editTarget ? "diperbarui" : "ditambahkan"}!
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Email */}
                <div>
                  <label className="modal-label">
                    Email <span className="required-star">*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      ref={emailRef}
                      className="modal-input"
                      type="email"
                      placeholder="email@domain.com"
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      style={{ paddingLeft: "38px" }}
                    />
                    <Mail
                      size={13}
                      color="#475569"
                      style={{
                        position: "absolute",
                        left: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="modal-label">Nama Lengkap</label>
                  <input
                    className="modal-input"
                    placeholder="Contoh: Budi Santoso"
                    value={form.full_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, full_name: e.target.value }))
                    }
                  />
                </div>

                {/* Avatar URL */}
                <div>
                  <label className="modal-label">Avatar URL</label>
                  <div style={{ position: "relative" }}>
                    <input
                      className="modal-input"
                      type="url"
                      placeholder="https://example.com/avatar.jpg"
                      value={form.avatar_url}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, avatar_url: e.target.value }))
                      }
                      style={{ paddingLeft: "38px" }}
                    />
                    <Image
                      size={13}
                      color="#475569"
                      style={{
                        position: "absolute",
                        left: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Error */}
                {formError && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "#f87171",
                      fontSize: "12px",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      animation: "shake 0.3s ease",
                    }}
                  >
                    ⚠ {formError}
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    marginTop: "4px",
                    width: "100%",
                    height: "48px",
                    background: submitting ? "rgba(255,215,0,0.5)" : "#ffd700",
                    color: "#0f172a",
                    border: "none",
                    borderRadius: "14px",
                    fontSize: "14px",
                    fontWeight: 800,
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    boxShadow: "0 4px 14px rgba(255,215,0,0.3)",
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting)
                      e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {submitting ? (
                    <>
                      <span
                        style={{
                          width: "16px",
                          height: "16px",
                          border: "2px solid rgba(15,23,42,0.25)",
                          borderTopColor: "#0f172a",
                          borderRadius: "50%",
                          animation: "spinAnim 0.8s linear infinite",
                          display: "inline-block",
                        }}
                      />
                      Menyimpan...
                    </>
                  ) : editTarget ? (
                    <>
                      <Pencil size={15} /> Simpan Perubahan
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} /> Tambah Customer
                    </>
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
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteTarget(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(2,6,23,0.78)",
            backdropFilter: "blur(7px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.15s ease",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "390px",
              background: "rgba(15,23,42,0.98)",
              border: "1px solid rgba(248,113,113,0.2)",
              borderRadius: "24px",
              padding: "32px",
              boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
              animation: "modalIn 0.25s cubic-bezier(0.16,1,0.3,1)",
              fontFamily: "'Plus Jakarta Sans', Poppins, sans-serif",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "1px",
                marginBottom: "24px",
                background:
                  "linear-gradient(90deg, transparent, rgba(248,113,113,0.4), transparent)",
              }}
            />
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  background: "rgba(248,113,113,0.1)",
                  border: "1px solid rgba(248,113,113,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  color: "#f87171",
                }}
              >
                <Trash2 size={22} />
              </div>
              <h2
                style={{
                  fontSize: "17px",
                  fontWeight: 800,
                  color: "#fff",
                  margin: "0 0 8px",
                }}
              >
                Hapus Customer?
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  margin: "0 0 4px",
                }}
              >
                Kamu yakin mau hapus:
              </p>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#e2e8f0",
                  margin: "0 0 24px",
                }}
              >
                “{deleteTarget.full_name || deleteTarget.email}”
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: "#475569",
                  margin: "0 0 28px",
                }}
              >
                Tindakan ini tidak bisa dibatalkan.
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setDeleteTarget(null)}
                  style={{
                    flex: 1,
                    height: "44px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#94a3b8",
                    fontSize: "13px",
                    fontWeight: 700,
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.09)";
                    e.currentTarget.style.color = "#e2e8f0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.color = "#94a3b8";
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    height: "44px",
                    borderRadius: "12px",
                    cursor: deleting ? "not-allowed" : "pointer",
                    background: deleting ? "rgba(239,68,68,0.4)" : "#ef4444",
                    border: "none",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 700,
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "7px",
                    transition: "all 0.2s",
                  }}
                >
                  {deleting ? (
                    <span
                      style={{
                        width: "14px",
                        height: "14px",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "spinAnim 0.8s linear infinite",
                        display: "inline-block",
                      }}
                    />
                  ) : (
                    <>
                      <Trash2 size={14} /> Hapus
                    </>
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
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.5px",
                margin: 0,
              }}
            >
              Manajemen Customers
            </h1>
            <p style={{ color: "#64748b", fontSize: "14px", margin: "6px 0 0" }}>
              Kelola semua data pelanggan yang terdaftar.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              className="refresh-btn"
              onClick={fetchCustomers}
              disabled={loading}
            >
              <RefreshCw
                size={13}
                className={loading ? "spinning" : ""}
              />
              Refresh
            </button>
            <button className="add-cust-btn" onClick={openAdd}>
              <UserPlus size={15} />
              Tambah Customer
            </button>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "14px",
          }}
        >
          <div
            style={{
              ...card,
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                fontWeight: 700,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Total Customer
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "26px",
                fontWeight: 800,
                color: "#ffd700",
                lineHeight: 1,
              }}
            >
              {loading ? "—" : customers.length}
            </p>
          </div>
        </div>

        {/* ── Table card ── */}
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          {/* Bar */}
          <div className="cust-header-bar">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "4px",
                  height: "24px",
                  background: "#ffd700",
                  borderRadius: "4px",
                }}
              />
              <h3
                style={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "17px",
                  margin: 0,
                }}
              >
                Daftar Customer
              </h3>
              <span
                style={{
                  background: "rgba(255,215,0,0.1)",
                  color: "#ffd700",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: "8px",
                }}
              >
                {loading ? "…" : filtered.length}
              </span>
            </div>

            <div className="cust-controls">
              <div className="cust-search-wrap">
                <Search size={13} color="#475569" style={{ flexShrink: 0 }} />
                <input
                  className="cust-search-input"
                  placeholder="Cari email / nama..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <th className="cust-th">Customer</th>
                  <th className="cust-th">Email</th>
                  <th className="cust-th col-fullname">Nama Lengkap</th>
                  <th className="cust-th col-date">Bergabung</th>
                  <th className="cust-th col-updated">Diperbarui</th>
                  <th className="cust-th" style={{ textAlign: "center" }}>
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Skeleton */}
                {loading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <td className="cust-td">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            className="skeleton-bar"
                            style={{
                              width: 38,
                              height: 38,
                              minWidth: 38,
                              borderRadius: 12,
                            }}
                          />
                          <div>
                            <div
                              className="skeleton-bar"
                              style={{ width: 120, height: 13, marginBottom: 6 }}
                            />
                            <div
                              className="skeleton-bar"
                              style={{ width: 70, height: 11 }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="cust-td">
                        <div
                          className="skeleton-bar"
                          style={{ width: 130, height: 13 }}
                        />
                      </td>
                      <td className="cust-td col-fullname">
                        <div
                          className="skeleton-bar"
                          style={{ width: 100, height: 13 }}
                        />
                      </td>
                      <td className="cust-td col-date">
                        <div
                          className="skeleton-bar"
                          style={{ width: 80, height: 13 }}
                        />
                      </td>
                      <td className="cust-td col-updated">
                        <div
                          className="skeleton-bar"
                          style={{ width: 80, height: 13 }}
                        />
                      </td>
                      <td className="cust-td">
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            justifyContent: "center",
                          }}
                        >
                          <div
                            className="skeleton-bar"
                            style={{ width: 30, height: 30, borderRadius: 9 }}
                          />
                          <div
                            className="skeleton-bar"
                            style={{ width: 30, height: 30, borderRadius: 9 }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}

                {/* Empty state */}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: "56px 32px",
                        textAlign: "center",
                      }}
                    >
                      <Users
                        size={36}
                        color="#1e293b"
                        style={{ margin: "0 auto 12px", display: "block" }}
                      />
                      <p
                        style={{
                          color: "#475569",
                          fontSize: "14px",
                          margin: 0,
                        }}
                      >
                        {search
                          ? "Tidak ada customer yang cocok."
                          : "Belum ada customer terdaftar."}
                      </p>
                      {search && (
                        <button
                          onClick={() => setSearch("")}
                          style={{
                            marginTop: "12px",
                            background: "none",
                            border: "none",
                            color: "#ffd700",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          Reset filter →
                        </button>
                      )}
                    </td>
                  </tr>
                )}

                {/* Data rows */}
                {!loading &&
                  filtered.map((c, i) => {
                    const displayName = c.full_name || c.email;
                    const hue = avatarHue(displayName);
                    const initial = getInitial(displayName);
                    return (
                      <tr
                        key={c.id}
                        style={{
                          borderBottom:
                            i < filtered.length - 1
                              ? "1px solid rgba(255,255,255,0.04)"
                              : "none",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(255,255,255,0.02)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        {/* Customer */}
                        <td className="cust-td">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            {c.avatar_url ? (
                              <img
                                src={c.avatar_url}
                                alt={displayName}
                                style={{
                                  width: "38px",
                                  height: "38px",
                                  borderRadius: "12px",
                                  objectFit: "cover",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                }}
                                onError={(e) => {
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    const fallback = document.createElement("div");
                                    fallback.style.cssText = `
                                      width: 38px; height: 38px; min-width: 38px;
                                      border-radius: 12px;
                                      background: hsla(${hue}, 60%, 40%, 0.15);
                                      border: 1px solid hsla(${hue}, 60%, 55%, 0.2);
                                      display: flex; align-items: center; justify-content: center;
                                      color: hsl(${hue}, 60%, 70%);
                                      font-weight: 800; font-size: 15px; flex-shrink: 0;
                                    `;
                                    fallback.textContent = initial;
                                    parent.replaceChild(fallback, e.currentTarget);
                                  }
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "38px",
                                  height: "38px",
                                  minWidth: "38px",
                                  borderRadius: "12px",
                                  background: `hsla(${hue}, 60%, 40%, 0.15)`,
                                  border: `1px solid hsla(${hue}, 60%, 55%, 0.2)`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: `hsl(${hue}, 60%, 70%)`,
                                  fontWeight: 800,
                                  fontSize: "15px",
                                  flexShrink: 0,
                                }}
                              >
                                {initial}
                              </div>
                            )}
                            <div style={{ minWidth: 0 }}>
                              <p
                                style={{
                                  fontWeight: 700,
                                  color: "#fff",
                                  fontSize: "14px",
                                  margin: 0,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: "180px",
                                }}
                              >
                                {displayName}
                              </p>
                              <p
                                style={{
                                  fontSize: "11px",
                                  color: "#334155",
                                  margin: "2px 0 0",
                                  fontFamily: "monospace",
                                }}
                              >
                                {c.id.slice(0, 10)}…
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="cust-td">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            <Mail size={11} color="#475569" />
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#64748b",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: "180px",
                                display: "block",
                              }}
                            >
                              {c.email}
                            </span>
                          </div>
                        </td>

                        {/* Nama Lengkap */}
                        <td className="cust-td col-fullname">
                          <span style={{ fontSize: "13px", color: "#e2e8f0" }}>
                            {c.full_name ?? "—"}
                          </span>
                        </td>

                        {/* Bergabung */}
                        <td
                          className="cust-td col-date"
                          style={{ fontSize: "12px", color: "#64748b" }}
                        >
                          {formatDate(c.created_at)}
                        </td>

                        {/* Diperbarui */}
                        <td
                          className="cust-td col-updated"
                          style={{ fontSize: "12px", color: "#64748b" }}
                        >
                          {formatDate(c.updated_at)}
                        </td>

                        {/* Aksi */}
                        <td className="cust-td">
                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              justifyContent: "center",
                            }}
                          >
                            <button
                              className="action-btn edit"
                              onClick={() => openEdit(c)}
                              title="Edit"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              className="action-btn del"
                              onClick={() => setDeleteTarget(c)}
                              title="Hapus"
                            >
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

          {/* Footer */}
          {!loading && customers.length > 0 && (
            <div
              style={{
                padding: "13px 28px",
                borderTop: "1px solid rgba(255,255,255,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "12px", color: "#334155" }}>
                Menampilkan{" "}
                <span style={{ color: "#64748b", fontWeight: 600 }}>
                  {filtered.length}
                </span>{" "}
                dari{" "}
                <span style={{ color: "#64748b", fontWeight: 600 }}>
                  {customers.length}
                </span>{" "}
                customer
              </span>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ffd700",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    padding: 0,
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