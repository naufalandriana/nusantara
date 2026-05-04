// app/admin/dashboard/users/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowser } from "@/app/lib/supabase/client";
import { Search, RefreshCw, UserPlus, X, Users, Eye, EyeOff } from "lucide-react";

/* ─── Types ─── */
type UserRow = {
  id: string;
  email?: string;
  full_name?: string;
  role: string;
  created_at?: string;
};

type FormState = {
  email: string;
  password: string;
  full_name: string;
  role: "admin" | "keuangan" | "user";
};

/* ─── Constants ─── */
const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "24px",
};

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  admin:    { label: "Admin",    color: "#ffd700",  bg: "rgba(255,215,0,0.1)"   },
  keuangan: { label: "Keuangan", color: "#60a5fa",  bg: "rgba(96,165,250,0.1)"  },
  user:     { label: "User",     color: "#4ade80",  bg: "rgba(74,222,128,0.1)"  },
};

const EMPTY_FORM: FormState = { email: "", password: "", full_name: "", role: "user" };

/* ─── Helpers ─── */
const getInitial = (u: UserRow) => {
  if (u.full_name) return u.full_name[0].toUpperCase();
  if (u.email)     return u.email[0].toUpperCase();
  return "?";
};

const formatDate = (s?: string) => {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
};

/* ════════════════════════════════════════════
   PAGE
════════════════════════════════════════════ */
export default function UsersPage() {
  const supabase = createSupabaseBrowser();

  /* table state */
  const [users,      setUsers]      = useState<UserRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  /* modal state */
  const [modalOpen,   setModalOpen]   = useState(false);
  const [form,        setForm]        = useState<FormState>(EMPTY_FORM);
  const [showPass,    setShowPass]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [formError,   setFormError]   = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  /* ─── Fetch ─── */
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setUsers(data as UserRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Focus email when modal opens */
  useEffect(() => {
    if (modalOpen) setTimeout(() => emailRef.current?.focus(), 80);
  }, [modalOpen]);

  /* Close on Escape */
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  /* ─── Filtered list ─── */
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (u.email     ?? "").toLowerCase().includes(q) ||
      (u.full_name ?? "").toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  /* ─── Modal helpers ─── */
  const closeModal = () => {
    setModalOpen(false);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormSuccess(false);
    setShowPass(false);
  };

  /* ─── Submit ─── */
  /*
    Flow:
    1. supabase.auth.signUp  → buat auth user
    2. upsert public.users   → simpan role & nama
    (Pastiin "Confirm email" di Supabase Auth Settings di-disable
     kalau mau langsung aktif tanpa konfirmasi email)
  */
  const handleSubmit = async () => {
    setFormError("");
    if (!form.email.trim())       return setFormError("Email wajib diisi.");
    if (form.password.length < 6) return setFormError("Password minimal 6 karakter.");

    setSubmitting(true);
    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email:    form.email.trim(),
        password: form.password,
        options: { data: { full_name: form.full_name.trim() || null } },
      });

      if (authErr)          throw new Error(authErr.message);
      if (!authData.user)   throw new Error("Gagal membuat user.");

      const { error: dbErr } = await supabase.from("users").upsert({
        id:        authData.user.id,
        email:     form.email.trim(),
        full_name: form.full_name.trim() || null,
        role:      form.role,
      });

      if (dbErr) throw new Error(dbErr.message);

      setFormSuccess(true);
      await fetchUsers();
      setTimeout(closeModal, 1400);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    <>
      {/* ─────────────────────────────────────
          ADD USER MODAL
      ───────────────────────────────────── */}
      {modalOpen && (
        <div
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(2,6,23,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.15s ease",
          }}
        >
          <div style={{
            width: "100%", maxWidth: "440px",
            background: "rgba(15,23,42,0.98)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "24px",
            padding: "32px",
            boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
            position: "relative",
            animation: "modalIn 0.25s cubic-bezier(0.16,1,0.3,1)",
            fontFamily: "'Plus Jakarta Sans', Poppins, sans-serif",
          }}>
            {/* Gold top shimmer */}
            <div style={{
              position: "absolute", top: 0, left: "20%", right: "20%", height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.4), transparent)",
              borderRadius: "99px",
            }} />

            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "12px",
                  background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#ffd700",
                }}>
                  <UserPlus size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#fff", margin: 0 }}>
                    Tambah Pengguna
                  </h2>
                  <p style={{ fontSize: "12px", color: "#475569", margin: "2px 0 0" }}>
                    Daftarkan akun baru ke sistem
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
                  ✓
                </div>
                <p style={{ color: "#4ade80", fontWeight: 700, fontSize: "15px", margin: 0 }}>
                  Pengguna berhasil ditambahkan!
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                {/* Full name */}
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "7px" }}>
                    Nama Lengkap <span style={{ color: "#475569", fontWeight: 400 }}>(opsional)</span>
                  </label>
                  <input
                    className="modal-input"
                    placeholder="contoh: Budi Santoso"
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "7px" }}>
                    Email <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <input
                    ref={emailRef}
                    className="modal-input"
                    type="email"
                    placeholder="email@nusaassets.id"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
                  />
                </div>

                {/* Password */}
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "7px" }}>
                    Password <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      className="modal-input"
                      type={showPass ? "text" : "password"}
                      placeholder="Min. 6 karakter"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
                      style={{ paddingRight: "44px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      style={{
                        position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer",
                        color: "#475569", padding: 0, display: "flex", alignItems: "center",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#ffd700")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Role selector */}
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "7px" }}>
                    Role
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {(["user", "keuangan", "admin"] as const).map(r => {
                      const cfg = ROLE_CONFIG[r];
                      const active = form.role === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, role: r }))}
                          style={{
                            flex: 1, padding: "10px 0", borderRadius: "12px", cursor: "pointer",
                            fontSize: "12px", fontWeight: 700, fontFamily: "inherit",
                            border: `1px solid ${active ? cfg.color + "50" : "rgba(255,255,255,0.08)"}`,
                            background: active ? cfg.bg : "rgba(255,255,255,0.03)",
                            color: active ? cfg.color : "#64748b",
                            transition: "all 0.2s",
                          }}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
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
                    background: "#ffd700", color: "#0f172a",
                    border: "none", borderRadius: "14px",
                    fontSize: "14px", fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer",
                    fontFamily: "inherit", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: "8px",
                    transition: "opacity 0.2s, transform 0.2s",
                    opacity: submitting ? 0.7 : 1,
                    boxShadow: "0 4px 16px rgba(255,215,0,0.25)",
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
                      Mendaftarkan...
                    </>
                  ) : (
                    <><UserPlus size={16} /> Tambah Pengguna</>
                  )}
                </button>

              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────
          MAIN PAGE
      ───────────────────────────────────── */}
      <div className="page-wrapper">
        <style>{`
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn   { from { opacity: 0; } to { opacity: 1; } }
          @keyframes modalIn  {
            from { opacity: 0; transform: translateY(18px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes shake {
            0%,100% { transform: translateX(0); }
            25%      { transform: translateX(-5px); }
            75%      { transform: translateX(5px); }
          }
          @keyframes spinAnim { to { transform: rotate(360deg); } }
          @keyframes shimmer  {
            0%,100% { opacity: 0.35; }
            50%      { opacity: 0.7; }
          }

          .page-wrapper {
            display: flex; flex-direction: column; gap: 28px;
            padding: 0 32px; max-width: 1400px; margin: 0 auto;
            animation: fadeSlideUp 0.5s ease both;
            font-family: 'Plus Jakarta Sans', Poppins, sans-serif;
          }

          .modal-input {
            width: 100%; height: 44px; padding: 0 14px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.09);
            border-radius: 12px; color: #f8fafc; font-size: 14px;
            font-family: 'Plus Jakarta Sans', Poppins, sans-serif;
            outline: none; box-sizing: border-box;
            transition: border-color 0.2s, background 0.2s;
          }
          .modal-input::placeholder { color: #475569; }
          .modal-input:focus {
            border-color: rgba(255,215,0,0.4);
            background: rgba(255,255,255,0.06);
          }

          .users-header-bar {
            display: flex; align-items: center; justify-content: space-between;
            padding: 22px 28px; border-bottom: 1px solid rgba(255,255,255,0.06);
            flex-wrap: wrap; gap: 14px;
          }
          .users-controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

          .users-search-wrap {
            display: flex; align-items: center; gap: 8px;
            background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
            border-radius: 12px; padding: 0 14px; height: 38px; min-width: 200px;
            transition: border-color 0.2s;
          }
          .users-search-wrap:focus-within { border-color: rgba(255,215,0,0.35); }
          .users-search-input {
            background: transparent; border: none; outline: none;
            color: #f8fafc; font-size: 13px; font-family: inherit; width: 100%;
          }
          .users-search-input::placeholder { color: #475569; }

          .filter-pill {
            padding: 6px 13px; border-radius: 10px; font-size: 12px; font-weight: 600;
            border: 1px solid rgba(255,255,255,0.08); cursor: pointer; font-family: inherit;
            transition: background 0.2s, color 0.2s, border-color 0.2s;
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

          .add-user-btn {
            display: flex; align-items: center; gap: 7px;
            padding: 9px 18px; border-radius: 12px; font-size: 13px; font-weight: 700;
            background: #ffd700; color: #0f172a; border: none; cursor: pointer;
            font-family: inherit; transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 3px 12px rgba(255,215,0,0.25);
          }
          .add-user-btn:hover  { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(255,215,0,0.35); }
          .add-user-btn:active { transform: translateY(0); }

          .users-th {
            padding: 13px 24px; text-align: left;
            font-size: 10px; font-weight: 700; color: #475569;
            text-transform: uppercase; letter-spacing: 1.5px;
          }
          .users-td { padding: 15px 24px; }

          .role-badge {
            display: inline-flex; align-items: center;
            font-size: 11px; font-weight: 700; padding: 4px 11px; border-radius: 9px;
          }

          .skeleton-bar {
            background: rgba(255,255,255,0.06); border-radius: 6px;
            animation: shimmer 1.5s ease-in-out infinite;
          }

          @media (max-width: 1024px) { .page-wrapper { padding: 0 20px; gap: 20px; } }
          @media (max-width: 768px) {
            .users-header-bar { padding: 18px; }
            .users-th { padding: 10px 12px; font-size: 9px; }
            .users-td { padding: 13px 12px; }
            .col-date { display: none; }
            .col-id   { display: none; }
          }
          @media (max-width: 640px) {
            .page-wrapper      { padding: 0 12px; gap: 16px; }
            .users-search-wrap { min-width: 150px; }
          }
        `}</style>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", margin: 0 }}>
              Manajemen Users
            </h1>
            <p style={{ color: "#64748b", fontSize: "14px", margin: "6px 0 0" }}>
              Kelola semua pengguna terdaftar di NusaAssets.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button className="refresh-btn" onClick={fetchUsers} disabled={loading}>
              <RefreshCw size={13} className={loading ? "spinning" : ""} />
              Refresh
            </button>
            <button className="add-user-btn" onClick={() => setModalOpen(true)}>
              <UserPlus size={15} />
              Tambah User
            </button>
          </div>
        </div>

        {/* ── Table card ── */}
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>

          {/* Bar: title + controls */}
          <div className="users-header-bar">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "4px", height: "24px", background: "#ffd700", borderRadius: "4px" }} />
              <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "17px", margin: 0 }}>Daftar Pengguna</h3>
              <span style={{
                background: "rgba(255,215,0,0.1)", color: "#ffd700",
                fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "8px",
              }}>
                {loading ? "…" : filtered.length}
              </span>
            </div>

            <div className="users-controls">
              <div className="users-search-wrap">
                <Search size={13} color="#475569" style={{ flexShrink: 0 }} />
                <input
                  className="users-search-input"
                  placeholder="Cari email / nama..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              {(["all", "admin", "keuangan", "user"] as const).map(r => (
                <button
                  key={r}
                  className={`filter-pill${roleFilter === r ? " active" : ""}`}
                  onClick={() => setRoleFilter(r)}
                >
                  {r === "all" ? "Semua" : r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th className="users-th">Pengguna</th>
                  <th className="users-th">Role</th>
                  <th className="users-th col-date">Bergabung</th>
                  <th className="users-th col-id">User ID</th>
                </tr>
              </thead>
              <tbody>

                {/* Skeleton rows */}
                {loading && Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="users-td">
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div className="skeleton-bar" style={{ width: 38, height: 38, minWidth: 38, borderRadius: 12 }} />
                        <div>
                          <div className="skeleton-bar" style={{ width: 130, height: 14, marginBottom: 7 }} />
                          <div className="skeleton-bar" style={{ width: 90,  height: 12 }} />
                        </div>
                      </div>
                    </td>
                    <td className="users-td"><div className="skeleton-bar" style={{ width: 64, height: 22, borderRadius: 9 }} /></td>
                    <td className="users-td col-date"><div className="skeleton-bar" style={{ width: 90, height: 14 }} /></td>
                    <td className="users-td col-id"><div className="skeleton-bar" style={{ width: 80, height: 14 }} /></td>
                  </tr>
                ))}

                {/* Empty state */}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: "52px 32px", textAlign: "center" }}>
                      <Users size={32} color="#1e293b" style={{ margin: "0 auto 12px", display: "block" }} />
                      <p style={{ color: "#475569", fontSize: "14px", margin: 0 }}>
                        {search || roleFilter !== "all"
                          ? "Tidak ada pengguna yang cocok."
                          : "Belum ada pengguna terdaftar."}
                      </p>
                      {(search || roleFilter !== "all") && (
                        <button
                          onClick={() => { setSearch(""); setRoleFilter("all"); }}
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
                {!loading && filtered.map((u, i) => {
                  const cfg = ROLE_CONFIG[u.role] ?? { label: u.role, color: "#94a3b8", bg: "rgba(148,163,184,0.1)" };
                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td className="users-td">
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            width: "38px", height: "38px", minWidth: "38px", borderRadius: "12px",
                            background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.13)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#ffd700", fontWeight: 800, fontSize: "14px", flexShrink: 0,
                          }}>
                            {getInitial(u)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{
                              fontWeight: 700, color: "#fff", fontSize: "14px", margin: 0,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {u.full_name ?? u.email ?? "—"}
                            </p>
                            {u.full_name && u.email && (
                              <p style={{ fontSize: "11px", color: "#475569", margin: "2px 0 0" }}>
                                {u.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="users-td">
                        <span className="role-badge" style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </td>

                      <td className="users-td col-date" style={{ fontSize: "13px", color: "#64748b" }}>
                        {formatDate(u.created_at)}
                      </td>

                      <td className="users-td col-id" style={{ fontSize: "11px", color: "#334155", fontFamily: "monospace" }}>
                        {u.id.slice(0, 8)}…
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {!loading && users.length > 0 && (
            <div style={{
              padding: "13px 28px", borderTop: "1px solid rgba(255,255,255,0.04)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: "12px", color: "#334155" }}>
                Menampilkan{" "}
                <span style={{ color: "#64748b", fontWeight: 600 }}>{filtered.length}</span>
                {" "}dari{" "}
                <span style={{ color: "#64748b", fontWeight: 600 }}>{users.length}</span>
                {" "}pengguna
              </span>
              {(search || roleFilter !== "all") && (
                <button
                  onClick={() => { setSearch(""); setRoleFilter("all"); }}
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