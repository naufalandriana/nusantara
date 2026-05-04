"use client";

import { useState, useEffect } from "react";
import { auth } from "@/app/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/app/lib/supabase/client";
import "./../auth.css";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  const supabase = createSupabaseBrowser();
  const googleProvider = new GoogleAuthProvider();

  // ROUTE GUARD: kalau udah login, langsung redirect ke beranda
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        router.replace("/");
      } else {
        setCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSubmit(true);

    try {
      let user;

      if (isLogin) {
        const res = await signInWithEmailAndPassword(auth, email, password);
        user = res.user;
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        user = res.user;
      }

      const { error: dbError } = await supabase.from("customers").upsert({
        id: user.uid,
        email: user.email,
        updated_at: new Date(),
      });

      if (dbError) throw dbError;

      // ✅ Simpan UID & info user ke localStorage
      localStorage.setItem("userId", user.uid);
      localStorage.setItem("userEmail", user.email || "");
      localStorage.setItem("userName", user.displayName || user.email || "");
      localStorage.setItem("isLoggedIn", "true");

      if (!isLogin) {
        alert("Akun NusantaraAssets berhasil dibuat! Silakan masuk.");
        setIsLogin(true);
        setLoadingSubmit(false);
        return;
      }

      router.push("/");
    } catch (error: any) {
      alert("Waduh, ada masalah: " + error.message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoadingSubmit(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const { error: dbError } = await supabase.from("customers").upsert({
        id: user.uid,
        email: user.email,
        full_name: user.displayName,
        avatar_url: user.photoURL,
        updated_at: new Date(),
      });

      if (dbError) throw dbError;

      // ✅ Simpan UID & info user ke localStorage
      localStorage.setItem("userId", user.uid);
      localStorage.setItem("userEmail", user.email || "");
      localStorage.setItem("userName", user.displayName || user.email || "");
      localStorage.setItem("userPic", user.photoURL || "");
      localStorage.setItem("isLoggedIn", "true");

      router.push("/");
    } catch (error: any) {
      alert("Google Login Gagal: " + error.message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (checkingAuth) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d111a",
          color: "#94a3b8",
          fontSize: "14px",
        }}
      >
        Memuat...
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <h2 style={{ color: "#ffd700", marginBottom: "10px" }}>
          {isLogin ? "Selamat Datang" : "Buat Akun Baru"}
        </h2>
        <p style={{ color: "#94a3b8", marginBottom: "30px" }}>
          {isLogin
            ? "Silakan login untuk akses aset eksklusif"
            : "Gabung dengan komunitas NusantaraAssets"}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="contoh@unsoed.ac.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-utama"
            disabled={loadingSubmit}
            style={{
              width: "100%",
              marginBottom: "15px",
              borderRadius: "50px",
              padding: "15px",
              fontWeight: "bold",
              opacity: loadingSubmit ? 0.7 : 1,
              cursor: loadingSubmit ? "not-allowed" : "pointer",
            }}
          >
            {loadingSubmit ? "Memproses..." : isLogin ? "Masuk" : "Daftar Sekarang"}
          </button>
        </form>

        <div
          style={{
            margin: "25px 0",
            position: "relative",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: "-10px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "#1e293b",
              padding: "0 10px",
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            atau
          </span>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="btn-google"
          disabled={loadingSubmit}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "50px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            backgroundColor: "white",
            color: "#333",
            border: "none",
            cursor: loadingSubmit ? "not-allowed" : "pointer",
            fontWeight: "500",
            opacity: loadingSubmit ? 0.7 : 1,
          }}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            style={{ width: "18px" }}
          />
          Masuk dengan Google
        </button>

        <div style={{ marginTop: "25px", fontSize: "14px", color: "#94a3b8" }}>
          {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
          <span
            onClick={() => setIsLogin(!isLogin)}
            style={{ color: "#ffd700", cursor: "pointer", fontWeight: "bold" }}
          >
            {isLogin ? "Daftar Sekarang" : "Login di Sini"}
          </span>
        </div>

        <button
          onClick={() => router.push("/")}
          style={{
            display: "block",
            width: "100%",
            marginTop: "30px",
            color: "#64748b",
            background: "none",
            border: "none",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );
}