import { useMemo, useState } from "react";
import FloatingNav from "../components/FloatingNav.jsx";
import { Home, ClipboardCheck, CalendarDays, UserRound, GraduationCap, BookOpen, Clock3, Mail, Cake, Users, CalendarPlus } from "lucide-react";
import { useAuth } from "../auth/AuthProvider.jsx";

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

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [page, setPage] = useState("Beranda");
  const displayName = profile?.full_name || "Siswa";
  const email = user?.email || "Email tidak tersedia";
  const age = useMemo(() => calculateAge(profile?.birth_date), [profile?.birth_date]);
  const role = profile?.role || "student";
  const isSchoolStaff = role === "teacher" || role === "admin" || role === "principal" || role === "headmaster";

  return <div className="student-app">
    <header className="student-topbar">
      <span className="student-brand-icon" aria-label="Logo SekolahKu"><GraduationCap size={22}/></span>
      <div className="student-header-title"><strong>SekolahKu</strong><small>RUANG BELAJAR SISWA</small></div>
    </header>

    <main className="student-main" key={page}>
      {page === "Beranda" && <section className="student-home">
        <div className="student-hero">
          <div className="student-eyebrow">RUANG BELAJAR PRIBADI</div>
          <h1>Halo, {displayName.split(/\s+/)[0]}!</h1>
          <p>Selamat datang di SekolahKu. Semua informasi sekolahmu akan tampil di sini.</p>
          <div className="student-hero-mark"><GraduationCap size={36}/></div>
        </div>
        <div className="student-section-title"><div><span>MENU SISWA</span><h2>Akses cepat</h2></div></div>
        <div className="student-shortcuts">
          <button onClick={() => setPage("Absensi kelas")}><span className="shortcut-icon violet"><ClipboardCheck size={21}/></span><strong>Absensi kelas</strong><small>Lihat kehadiranmu</small></button>
          <button onClick={() => setPage("Event sekolah")}><span className="shortcut-icon blue"><CalendarDays size={21}/></span><strong>Event sekolah</strong><small>Agenda dan kegiatan</small></button>
          <button onClick={() => setPage("Profile siswa")}><span className="shortcut-icon green"><UserRound size={21}/></span><strong>Profile siswa</strong><small>Informasi akunmu</small></button>
        </div>
        <div className="student-empty-home"><BookOpen size={22}/><div><strong>Belum ada informasi kelas</strong><p>Informasi pelajaran, pengumuman, dan aktivitas akan muncul setelah kamu dimasukkan ke kelas oleh guru.</p></div></div>
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
            <div><span><GraduationCap size={16}/> Kelas</span><strong>Belum dimasukkan ke kelas</strong></div>
          </div>
          <p className="student-profile-note">Data identitas tersimpan pada profil akunmu. Informasi kelas akan diperbarui setelah guru menempatkanmu ke kelas.</p>
        </div>
      </section>}

    </main>

    <FloatingNav active={page} onChange={setPage} />
  </div>;
}
