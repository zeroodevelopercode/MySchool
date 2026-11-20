import { useState } from "react";
import { Github, GraduationCap, ArrowUpRight } from "lucide-react";
import { useAuth } from "../auth/AuthProvider.jsx";
import "./WelcomePage.css";

export default function WelcomePage() {
  const { signInWithProvider, supabaseConfigured } = useAuth();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");

  const signIn = async (provider) => {
    setNotice("");
    setBusy(provider);
    try {
      await signInWithProvider(provider);
    } catch (error) {
      setNotice(error.message || "Login gagal dimulai. Coba lagi.");
      setBusy("");
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />
      <header className="auth-brand">
        <div className="auth-brand-icon"><GraduationCap size={23} strokeWidth={2.2} /></div>
        <span>SekolahKu</span>
      </header>
      <section className="auth-welcome" aria-labelledby="welcome-title">
        <div className="welcome-mark"><GraduationCap size={34} strokeWidth={1.8} /></div>
        <p className="auth-eyebrow">YOUR LEARNING SPACE</p>
        <h1 id="welcome-title">Welcome to <span>SekolahKu</span></h1>
        <p className="auth-subtitle">Satu ruang untuk belajar, berkembang, dan meraih hal baru.</p>
      </section>
      <section className="auth-actions" aria-label="Pilihan login">
        <p className="auth-prompt">Pilih login di bawah ini</p>
        <button className="auth-provider google-provider" onClick={() => signIn("google")} disabled={Boolean(busy) || !supabaseConfigured}>
          <span className="google-g" aria-hidden="true">G</span>
          <span>{busy === "google" ? "Menghubungkan..." : "Continue with Google"}</span>
          <ArrowUpRight size={17} className="provider-arrow" />
        </button>
        <button className="auth-provider github-provider" onClick={() => signIn("github")} disabled={Boolean(busy) || !supabaseConfigured}>
          <Github size={19} />
          <span>{busy === "github" ? "Menghubungkan..." : "Continue with GitHub"}</span>
          <ArrowUpRight size={17} className="provider-arrow" />
        </button>
        {!supabaseConfigured && <p className="auth-notice" role="status">Supabase belum dikonfigurasi pada environment aplikasi.</p>}
        {notice && <p className="auth-notice" role="alert">{notice}</p>}
        <p className="auth-terms">Dengan melanjutkan, kamu menyetujui ketentuan penggunaan SekolahKu.</p>
      </section>
    </main>
  );
}
