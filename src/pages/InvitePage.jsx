import { useEffect, useState } from "react";
import { GraduationCap, CheckCircle2, LoaderCircle } from "lucide-react";
import { useAuth } from "../auth/AuthProvider.jsx";
import { supabase } from "../lib/supabase.js";
import { Capacitor } from "@capacitor/core";

export default function InvitePage({ classId }) {
  const { user, profile, signInWithProvider } = useAuth();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const isNativeApp = Capacitor.isNativePlatform();

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error: fetchError } = await supabase.rpc("get_class_invite_details", { p_class_id: classId });
      if (!active) return;
      if (fetchError || !data) setError("Undangan kelas tidak ditemukan atau sudah tidak tersedia.");
      else setInvite(data);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [classId, user?.id]);

  const acceptInvite = async () => {
    if (!user?.id) {
      try { await signInWithProvider("google"); } catch (err) { setError(err.message || "Login gagal dimulai."); }
      return;
    }
    if (profile?.role !== "student") {
      setError("Undangan kelas ini hanya dapat diterima oleh akun murid.");
      return;
    }
    setBusy(true); setError(""); setNotice("");
    const { data, error: acceptError } = await supabase.rpc("accept_class_invite", { p_class_id: classId });
    setBusy(false);
    if (acceptError) setError(acceptError.message?.includes("already") ? "Akunmu sudah terdaftar di kelas lain." : "Undangan gagal diterima. Coba lagi atau hubungi wali kelas.");
    else setNotice(data?.message || "Berhasil bergabung ke kelas " + (invite?.class_name || "") + ".");
  };

  if (!isNativeApp) return <main className="student-invite-page">\n    <section className="student-invite-card">\n      <div className="student-invite-mark"><GraduationCap size={29}/></div>\n      <small>SEKOLAHKU • UNDANGAN KELAS</small>\n      <h1>Buka undangan di aplikasi</h1>\n      <p>Link undangan kelas hanya bisa dibuka melalui aplikasi SekolahKu. Website tidak dapat menerima undangan kelas.</p>\n      <div className="student-invite-class"><strong>Kenapa link ditolak?</strong><span> Aplikasi SekolahKu belum terdeteksi di perangkat ini, atau link dibuka melalui browser.</span></div>\n      <a className="student-invite-action" href="https://github.com/zeroodevelopercode/MySchool/releases/latest/download/SekolahKu.apk">Download / Install SekolahKu</a>\n      <p className="student-invite-note">Setelah aplikasi terpasang, buka kembali link undangan yang sama. Android akan mengarahkannya ke aplikasi jika App Links sudah terverifikasi.</p>\n    </section>\n  </main>;\n\n  return <main className="student-invite-page">
    <section className="student-invite-card">
      <div className="student-invite-mark"><GraduationCap size={29}/></div>
      <small>SEKOLAHKU • CLASS INVITATION</small>
      <h1>Accept invite to class</h1>
      {loading ? <p><LoaderCircle size={17}/> Memeriksa undangan...</p> : error && !invite ? <p>{error}</p> : <>
        <p>Kamu diundang untuk bergabung ke kelas berikut. Pastikan kamu masuk menggunakan akun murid yang benar.</p>
        <div className="student-invite-class"><small>NAMA KELAS</small><strong>{invite?.class_name}</strong></div>
        {invite?.homeroom_teacher && <p>Wali kelas: <strong>{invite.homeroom_teacher}</strong></p>}
        {!user ? <button className="student-invite-action" onClick={acceptInvite} disabled={busy}>Daftar / masuk untuk menerima undangan</button> : <button className="student-invite-action" onClick={acceptInvite} disabled={busy || profile?.role !== "student"}>{busy ? "Memproses..." : notice ? "Undangan diterima" : "Accept invite to class"}</button>}
        {profile && profile.role !== "student" && <p className="student-invite-note">Akun dengan role {profile.role} tidak dapat bergabung sebagai murid.</p>}
        {notice && <p className="student-form-success"><CheckCircle2 size={15}/> {notice}</p>}
        {error && <p className="student-form-error">{error}</p>}
        {notice && <button className="student-invite-action" onClick={() => window.location.assign("/")}>Masuk ke SekolahKu</button>}
      </>}
      {!user && <p className="student-invite-note">Belum punya akun SekolahKu? Daftar terlebih dahulu. Undangan tidak dapat diterima sebelum pendaftaran dan login selesai.</p>}\n      <p className="student-invite-note">Link undangan ini khusus untuk pendaftaran anggota kelas SekolahKu.</p>
    </section>
  </main>;
}
