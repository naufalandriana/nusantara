"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/app/lib/supabase/client"; // Update import ini
import "./global.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showPass, setShowPass] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email dan password wajib diisi!");
      return;
    }

    setError("");
    setLoading(true);

    const supabase = createSupabaseBrowser();

    // LOGIKA SUPABASE AUTH REAL
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Kredensial salah atau user tidak terdaftar.");
      setLoading(false);
    } else {
      // Refresh perlu dilakukan agar server-side session ter-update
      router.push("/admin/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="admin-root">
      <div className="bg-mesh" />
      <div className="bg-glow" />

      <div className="glass-card">
        <div className="brand-header">
          <div className="brand-icon animate-float">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffd700" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 12l10 5 10-5M2 17l10 5 10-5" />
            </svg>
          </div>
          <h1 className="brand-title">Nusa<span>Assets</span></h1>
          <p className="brand-sub">Management Portal <span className="brand-version">v2.0</span></p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="field-wrapper">
            <span className="field-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input
              type="email"
              placeholder="Email Admin"
              className="input-modern"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field-wrapper">
            <span className="field-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              type={showPass ? "text" : "password"}
              placeholder="Kata Sandi"
              className="input-modern"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>
              {showPass ? "Hide" : "Show"}
            </button>
          </div>

          {error && <div className="error-box"><span>{error}</span></div>}

          <button type="submit" className="btn-modern" disabled={loading}>
            {loading ? <span className="spinner" /> : "Masuk Sekarang"}
          </button>
        </form>
        <p className="admin-footer">&copy; 2026 PT. Nusa Digital Aset</p>
      </div>
    </div>
  );
}