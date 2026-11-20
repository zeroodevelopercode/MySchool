import { useEffect, useMemo, useState } from "react";
import FloatingNav from "../components/FloatingNav.jsx";
import { Home, ClipboardCheck, CalendarDays, UserRound, GraduationCap, BookOpen, Clock3, Mail, Cake, Users, CalendarPlus, Bell, ArrowLeft, School, Megaphone } from "lucide-react";
import { useAuth } from "../auth/AuthProvider.jsx";
import { supabase } from "../lib/supabase.js";

const navigation = [
  { id: "Beranda", label: "Beranda", icon: Home },
  { id: "Absensi kelas", label: "Absensi", icon: ClipboardCheck },
  { id: "Event sekolah", label: "Event", icon: CalendarDays },
  { id: "Profile siswa", label: "Profil", icon: UserRound }
];

function calculateAge(dateString) {
  if (!dateString) return null;
  const birth = new Date(dateString + "T00:00:00");
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

function formatBirthDate(dateString) {
  if (!dateString) return "Belum diisi";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(dateString + "T00:00:00"));
}

function formatAnnouncementDate(dateString) {
  if (!dateString) return "";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(dateString));
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [page, setPage] = useState("Beranda");
  const [classInfo, setClassInfo] = useState(null);
  const [classmates, setClassmates] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [classLoading, setClassLoading] = useState(true);
  const [classError, setClassError] = useState("");
  const displayName = profile?.full_name || "Siswa";
  const email = user?.email || "Email tidak tersedia";
  const age = useMemo(() => calculateAge(profile?.birth_date), [profile?.birth_date]);
  const role = profile?.role || "student";
  const isSchoolStaff = role === "teacher" || role === "admin" || role === "principal" || role === "headmaster";

  useEffect(() => {
    let active = true;
    async function loadClassData() {
      if (!user?.id || !supabase) {
        if (active) setClassLoading(false);
        return;
      }
      setClassLoading(true);
      setClassError("");
      const { data: membership, error: membershipError } = await supabase
        .from("class_members")
        .select("class_id")
        .eq("student_id", user.id)
        .maybeSingle();
      if (membershipError) {
        if (active) {
          setClassError("Informasi kelas belum dapat dimuat.");
          setClassLoading(false);
        }
        return;
      }
      if (!membership) {
        if (active) {
          setClassInfo(null);
          setClassmates([]);
          setAnnouncements([]);
          setClassLoading(false);
        }
        return;
      }
      const [classResult, rosterResult, announcementResult] = await Promise.all([
        supabase.from("classes").select("id,name").eq("id", membership.class_id).maybeSingle(),
        supabase.rpc("get_my_class_roster"),
        supabase.from("class_announcements").select("id,title,body,created_at,author_id").eq("class_id", membership.class_id).order("created_at", { ascending: false })
      ]);
      if (!active) return;
      if (classResult.error || rosterResult.error || announcementResult.error) {
        setClassError("Sebagian informasi kelas belum dapat dimuat.");
      }
      setClassInfo(classResult.data || null);
      setClassmates((rosterResult.data || []).filter((student) => student.student_id !== user.id));
      setAnnouncements(announcementResult.data || []);
      setClassLoading(false);
    }
    loadClassData();
    return () => { active = false; };
  }, [user?.id]);

  return <div className="student-app">
    <header className={page === "Notifikasi kelas" ? "student-topbar student-detail-topbar" : "student-topbar"}>
      {page === "Notifikasi kelas" ? <>
        <button className="student-back-button" onClick={() => setPage("Beranda")} aria-label="Kembali ke beranda"><ArrowLeft size={21}/></button>
        <div className="student-header-title"><strong>Notification your class</strong><small>PENGUMUMAN KELAS</small></div>
      </> : <>
        <span className="student-brand-icon" aria-label="Logo SekolahKu"><GraduationCap size={22}/></span>
        <div className="student-header-title"><strong>SekolahKu</strong><small>RUANG BELAJAR SISWA</small></div>
      </>}
    </header>

    <main className="student-main" key={page}>
      {page === "Beranda" && <section className="student-home">
        <div className="student-hero">
          <div className="student-eyebrow">RUANG BELAJAR PRIBADI</div>
          <h1>Halo, {displayName.split(/\s+/)[0]}!</h1>
          <p>Selamat datang di SekolahKu. Semua informasi sekolahmu akan tampil di sini.</p>
          <div className="student-hero-mark"><GraduationCap size={36}/></div>
        </div>

        <div className="student-class-grid">
          <article className="student-info-card">
            <div className="student-info-card-head">
              <span className="student-info-icon classmates"><Users size={19}/></span>
              <div><span>LINGKUNGAN BELAJAR</span><h2>Murid kelasmu</h2></div>
            </div>
            {classLoading ? <p className="student-card-muted">Memuat daftar murid...</p> : classInfo ? <>
              <div className="student-classmate-list">
                {classmates.length ? classmates.slice(0, 4).map((student) => <div className="student-classmate" key={student.student_id}>
                  <span className="student-mini-avatar">{student.avatar_url ? <img src={student.avatar_url} alt=""/> : (student.full_name || "S").split(/\s+/).slice(0,2).map((part) => part[0]).join("").toUpperCase()}</span>
                  <span>{student.full_name || "Nama siswa"}</span>
                </div>) : <p className="student-card-muted">Belum ada murid lain di kelasmu.</p>}
              </div>
              {classmates.length > 4 && <small className="student-card-foot">+{classmates.length - 4} murid lainnya</small>}
            </> : <p className="student-card-muted">Daftar murid akan muncul setelah kamu dimasukkan ke kelas.</p>}
          </article>

          <article className="student-info-card">
            <div className="student-info-card-head">
              <span className="student-info-icon classroom"><School size={19}/></span>
              <div><span>INFORMASI KELAS</span><h2>Kelasmu</h2></div>
            </div>
            {classLoading ? <p className="student-card-muted">Memuat informasi kelas...</p> : classInfo ? <div className="student-class-name">{classInfo.name}</div> : <p className="student-card-muted">Kamu belum dimasukan ke kelas manapun di sini.</p>}
          </article>
        </div>
        {classError && <p className="student-class-error">{classError}</p>}

        <button className="student-notification-card" onClick={() => setPage("Notifikasi kelas")}>
          <span className="student-notification-icon"><Bell size={21}/></span>
          <span className="student-notification-copy"><strong>Notifikasi kelasmu</strong><small>{classLoading ? "Memeriksa pengumuman..." : announcements.length ? announcements.length + " pengumuman dari guru" : "Lihat pengumuman dan informasi dari guru"}</small></span>
          {announcements.length > 0 && <span className="student-notification-count">{announcements.length > 99 ? "99+" : announcements.length}</span>}
          <span className="student-notification-arrow">›</span>
        </button>

        <div className="student-section-title"><div><span>MENU SISWA</span><h2>Akses cepat</h2></div></div>
        <div className="student-shortcuts">
          <button onClick={() => setPage("Absensi kelas")}><span className="shortcut-icon violet"><ClipboardCheck size={21}/></span><strong>Absensi kelas</strong><small>Lihat kehadiranmu</small></button>
          <button onClick={() => setPage("Event sekolah")}><span className="shortcut-icon blue"><CalendarDays size={21}/></span><strong>Event sekolah</strong><small>Agenda dan kegiatan</small></button>
          <button onClick={() => setPage("Profile siswa")}><span className="shortcut-icon green"><UserRound size={21}/></span><strong>Profile siswa</strong><small>Informasi akunmu</small></button>
        </div>
      </section>}

      {page === "Notifikasi kelas" && <section className="student-page student-announcements-page">
        <div className="student-announcement-intro"><span className="student-info-icon classroom"><Megaphone size={20}/></span><div><span>PUSAT INFORMASI</span><h1>Pengumuman kelas</h1><p>Informasi dan pengumuman yang dibagikan oleh guru untuk kelasmu.</p></div></div>
        {classLoading ? <div className="student-announcement-empty"><Clock3 size={25}/><h2>Memuat pengumuman</h2><p>Sedang mengambil informasi kelasmu.</p></div> : !classInfo ? <div className="student-announcement-empty"><School size={27}/><h2>Kamu belum memiliki kelas</h2><p>Pengumuman dari guru akan muncul setelah kamu dimasukkan ke kelas.</p></div> : announcements.length === 0 ? <div className="student-announcement-empty"><Bell size={27}/><h2>Belum ada pengumuman</h2><p>Jika guru membagikan pengumuman baru, informasinya akan tampil di halaman ini.</p></div> : <div className="student-announcement-list">
          {announcements.map((announcement) => <article className="student-announcement" key={announcement.id}>
            <div className="student-announcement-top"><span className="student-announcement-tag"><Megaphone size={13}/> Pengumuman guru</span><time>{formatAnnouncementDate(announcement.created_at)}</time></div>
            <h2>{announcement.title}</h2>
            <p>{announcement.body}</p>
          </article>)}
        </div>}
      </section>}

      {page === "Absensi kelas" && <section className="student-page">
        <div className="student-page-heading"><span className="student-page-icon violet"><ClipboardCheck size={23}/></span><div><span>KEGIATAN BELAJAR</span><h1>Absensi kelas</h1></div></div>
        <div className="student-empty-state"><span className="empty-state-icon"><Users size={27}/></span><h2>Kamu belum terdaftar di kelas</h2><p>Absensi akan tersedia setelah guru memasukkan akunmu ke kelas. Fitur pengelolaan kelas sedang dalam pengembangan.</p><span className="student-feature-tag"><Clock3 size={13}/> Menunggu penempatan kelas</span></div>
      </section>}

      {page === "Event sekolah" && <section className="student-page">
        <div className="student-page-heading"><span className="student-page-icon blue"><CalendarDays size={23}/></span><div><span>AGENDA SEKOLAH</span><h1>Event sekolah</h1></div></div>
        <div className="student-empty-state"><span className="empty-state-icon"><CalendarPlus size={27}/></span><h2>Belum ada event sekolah</h2><p>Event yang dibuat oleh guru dan kepala sekolah akan ditampilkan di halaman ini.</p><span className="student-feature-tag"><CalendarDays size={13}/> Menunggu event berikutnya</span></div>
        {isSchoolStaff && <p className="student-staff-note">Akun dengan akses staf sekolah dapat menjadi pengelola event saat fitur pembuatan event tersedia.</p>}
      </section>}

      {page === "Profile siswa" && <section className="student-page">
        <div className="student-page-heading"><span className="student-page-icon green"><UserRound size={23}/></span><div><span>IDENTITAS AKUN</span><h1>Profile siswa</h1></div></div>
        <div className="student-profile-card">
          <div className="student-profile-head"><div className="student-avatar">{profile?.avatar_url ? <img src={profile.avatar_url} alt="Foto profil"/> : displayName.split(/\s+/).slice(0,2).map(part => part[0]).join("").toUpperCase()}</div><div><h2>{displayName}</h2><span>Profil akun SekolahKu</span></div></div>
          <div className="student-profile-details">
            <div><span><UserRound size={16}/> Nama lengkap</span><strong>{displayName}</strong></div>
            <div><span><Cake size={16}/> Tanggal lahir</span><strong>{formatBirthDate(profile?.birth_date)}</strong></div>
            <div><span><Clock3 size={16}/> Umur</span><strong>{age === null ? "Belum tersedia" : age + " tahun"}</strong></div>
            <div><span><Mail size={16}/> Gmail</span><strong className="student-email">{email}</strong></div>
            <div><span><GraduationCap size={16}/> Kelas</span><strong>{classInfo?.name || "Belum dimasukkan ke kelas"}</strong></div>
          </div>
          <p className="student-profile-note">Data identitas tersimpan pada profil akunmu. Informasi kelas akan diperbarui setelah guru menempatkanmu ke kelas.</p>
        </div>
      </section>}
    </main>

    {page !== "Notifikasi kelas" && <FloatingNav active={page} onChange={setPage} />}
  </div>;
}
