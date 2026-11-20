import { useState } from "react";
import { Github, GraduationCap, ArrowUpRight } from "lucide-react";
import "./WelcomePage.css";

export default function WelcomePage() {
  const [notice, setNotice] = useState("");

  const showSetupNotice = (provider) => {
    setNotice(`Login ${provider} belum diaktifkan. Konfigurasi OAuth perlu diselesaikan terlebih dahulu.`);
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
        <button className="auth-provider google-provider" onClick={() => showSetupNotice("Google")}>
          <span className="google-g" aria-hidden="true">G</span>
          <span>Continue with Google</span>
          <ArrowUpRight size={17} className="provider-arrow" />
        </button>
        <button className="auth-provider github-provider" onClick={() => showSetupNotice("GitHub")}>
          <Github size={19} />
          <span>Continue with GitHub</span>
          <ArrowUpRight size={17} className="provider-arrow" />
        </button>
        {notice && <p className="auth-notice" role="status">{notice}</p>}
        <p className="auth-terms">Dengan melanjutkan, kamu menyetujui ketentuan penggunaan SekolahKu.</p>
      </section>
    </main>
  );
}
