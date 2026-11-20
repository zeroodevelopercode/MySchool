import { useMemo, useState } from "react";
import { CalendarDays, GraduationCap, Sparkles, UserRound } from "lucide-react";
import { useAuth } from "../auth/AuthProvider.jsx";

function getAge(dateString) {
  if (!dateString) return null;
  const birth = new Date(dateString + "T00:00:00");
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday = today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : null;
}

export default function OnboardingPage() {
  const { user, profile, saveProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "");
  const [birthDate, setBirthDate] = useState(profile?.birth_date || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const age = useMemo(() => getAge(birthDate), [birthDate]);
  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const cleanName = fullName.trim().replace(/\s+/g, " ");
    if (cleanName.length < 3) return setError("Masukkan nama lengkap minimal 3 karakter.");
    if (!birthDate || birthDate > today || age === null) return setError("Pilih tanggal lahir yang valid.");
    setBusy(true);
    try {
      await saveProfile({ full_name: cleanName, birth_date: birthDate });
    } catch (err) {
      setError(err.message || "Profil belum berhasil disimpan. Coba lagi.");
      setBusy(false);
    }
  }

  return <main className="onboarding-screen">
    <div className="onboarding-glow onboarding-glow-one" />
    <div className="onboarding-glow onboarding-glow-two" />
    <header className="onboarding-brand"><div className="onboarding-logo"><GraduationCap size={24}/></div><span>SekolahKu</span></header>
    <section className="onboarding-card">
      <div className="onboarding-step"><Sparkles size={15}/> LANGKAH PERTAMA</div>
      <div className="onboarding-icon"><UserRound size={27}/></div>
      <h1>Kenalan dulu, yuk!</h1>
      <p className="onboarding-description">Lengkapi informasi dasar dirimu untuk menyiapkan ruang belajar pribadi di SekolahKu.</p>
      <form onSubmit={handleSubmit} className="onboarding-form">
        <label htmlFor="onboarding-name">Nama lengkap</label>
        <div className="onboarding-input-wrap"><UserRound size={18}/><input id="onboarding-name" type="text" autoComplete="name" placeholder="Masukkan nama lengkapmu" value={fullName} onChange={e => setFullName(e.target.value)} maxLength={100} required /></div>
        <label htmlFor="onboarding-birth">Tanggal lahir</label>
        <div className="onboarding-input-wrap"><CalendarDays size={18}/><input id="onboarding-birth" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} max={today} min="1900-01-01" required /></div>
        <div className={"onboarding-age " + (age !== null ? "is-visible" : "")}>{age !== null ? <>Umur kamu sekarang <strong>{age} tahun</strong></> : "Umur akan dihitung otomatis dari tanggal lahir."}</div>
        {error && <p className="onboarding-error" role="alert">{error}</p>}
        <button className="onboarding-submit" type="submit" disabled={busy}>{busy ? "Menyimpan profil..." : "Simpan & lanjutkan"} <span>→</span></button>
      </form>
      <p className="onboarding-privacy">Informasi ini disimpan dengan aman di profil akunmu.</p>
    </section>
    <footer className="onboarding-footer">© 2026 SekolahKu <span>Belajar, tumbuh, dan berkembang.</span></footer>
  </main>;
}
