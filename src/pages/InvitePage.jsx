import { useEffect, useState } from "react";
import { GraduationCap, School, CheckCircle2, LoaderCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "../auth/AuthProvider.jsx";
import { supabase } from "../lib/supabase.js";

export default function InvitePage({ classId }) {
  const { user, profile, signInWithProvider } = useAuth();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

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

  return <main className="student-invite-page">
    <section className="student-invite-card">
      <div className="student-invite-mark"><GraduationCap size={29}/></div>
      <small>SEKOLAHKU • CLASS INVITATION</small>
      <h1>Accept invite to class</h1>
      {loading ? <p><LoaderCircle size={17}/> Memeriksa undangan...</p> : !user ? <><p>Masuk ke SekolahKu terlebih dahulu untuk melihat detail dan menerima undangan kelas ini.</p><button className="student-invite-action" onClick={acceptInvite} disabled={busy}>Continue with Google</button></> : error && !invite ? <p>{error}</p> : <>
        <p>Kamu diundang untuk bergabung ke kelas berikut. Pastikan kamu masuk menggunakan akun murid yang benar.</p>
        <div className="student-invite-class"><small>NAMA KELAS</small><strong>{invite?.class_name}</strong></div>
        {invite?.homeroom_teacher && <p>Wali kelas: <strong>{invite.homeroom_teacher}</strong></p>}
        {<button className="student-invite-action" onClick={acceptInvite} disabled={busy || profile?.role !== "student"}>{busy ? "Memproses..." : notice ? "Undangan diterima" : "Accept invite to class"}</button>}
        {profile && profile.role !== "student" && <p className="student-invite-note">Akun dengan role {profile.role} tidak dapat bergabung sebagai murid.</p>}
        {notice && <p className="student-form-success"><CheckCircle2 size={15}/> {notice}</p>}
        {error && <p className="student-form-error">{error}</p>}
        {notice && <button className="student-invite-action" onClick={() => window.location.assign("/")}>Masuk ke SekolahKu</button>}
      </>}
      <p className="student-invite-note">Link undangan ini khusus untuk pendaftaran anggota kelas SekolahKu.</p>
    </section>
  </main>;
}
