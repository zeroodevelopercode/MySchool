import { useMemo, useState } from "react";
import {
  Home, BookOpen, CalendarDays, ClipboardList, Users, Bell, Search,
  ChevronRight, Clock, ArrowUpRight, Menu, X, GraduationCap,
  BookmarkCheck, LogOut, UserCircle
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider.jsx";

const nav = [["Beranda", Home], ["Pelajaran", BookOpen], ["Jadwal", CalendarDays], ["Tugas", ClipboardList], ["Kelas", Users]];
const tasks = [
  ["Rangkuman Sistem Pernapasan", "Biologi · X IPA 2", "Hari ini, 15:00", "Segera", "orange", 65],
  ["Latihan Persamaan Kuadrat", "Matematika · X IPA 2", "Besok, 10:00", "Berlangsung", "blue", 25],
  ["Analisis Teks Eksplanasi", "Bahasa Indonesia · X IPA 2", "Jumat, 23:59", "Baru", "green", 0]
];
const schedule = [["07:30","Matematika","Ibu Ratna","Ruang X-2","purple"],["09:15","Bahasa Indonesia","Pak Dimas","Ruang X-2","blue"],["11:00","Biologi","Ibu Sari","Laboratorium","green"]];

export default function DashboardPage() {
  const { user, profile, profileLoading, signOut } = useAuth();
  const [page, setPage] = useState("Beranda");
  const [mobile, setMobile] = useState(false);
  const [query, setQuery] = useState("");
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Pengguna";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const initials = displayName.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  const filtered = useMemo(() => tasks.filter(task => (task[0] + task[1]).toLowerCase().includes(query.toLowerCase())), [query]);
  const go = (name) => { setPage(name); setMobile(false); };

  const handleLogout = async () => {
    setLogoutBusy(true);
    setNotice("");
    try { await signOut(); }
    catch (error) { setNotice(error.message || "Logout gagal. Coba lagi."); setLogoutBusy(false); }
  };

  return <div className="shell">
    <aside className={"sidebar " + (mobile ? "show" : "")}>
      <div className="brand"><div className="brand-icon"><GraduationCap size={22}/></div><div><strong>SekolahKu</strong><small>LEARNING SPACE</small></div><button className="icon-btn close-menu" onClick={() => setMobile(false)} aria-label="Tutup menu"><X size={19}/></button></div>
      <div className="school-switch"><div className="school-mark">S</div><div><strong>SekolahKu</strong><small>Portal pembelajaran</small></div><ChevronRight size={16}/></div>
      <p className="nav-label">MENU UTAMA</p>
      <nav>{nav.map(([name, Icon]) => <button key={name} onClick={() => go(name)} className={"nav-item " + (page === name ? "active" : "")}><Icon size={19}/><span>{name}</span>{name === "Tugas" && <i>3</i>}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="help-card"><BookmarkCheck size={18}/><strong>Belajar lebih teratur</strong><small>Atur tugas dan jadwalmu dalam satu tempat.</small></div>
        <div className="profile">
          {avatarUrl ? <img className="avatar profile-photo" src={avatarUrl} alt="" /> : <div className="avatar">{initials}</div>}
          <div className="profile-copy"><strong>{displayName}</strong><small>{profile?.role === "teacher" ? "Guru" : profile?.role === "admin" ? "Administrator" : "Siswa"}</small></div>
          <button className="logout-btn" onClick={handleLogout} disabled={logoutBusy} title="Keluar" aria-label="Keluar"><LogOut size={17}/></button>
        </div>
      </div>
    </aside>
    {mobile && <button className="scrim" onClick={() => setMobile(false)} aria-label="Tutup menu"/>}
    <main className="main">
      <header className="topbar">
        <button className="icon-btn mobile-menu" onClick={() => setMobile(true)} aria-label="Buka menu"><Menu size={21}/></button>
        <div className="breadcrumb">SekolahKu <ChevronRight size={15}/> <strong>{page}</strong></div>
        <div className="top-actions">
          <label className="search-box"><Search size={17}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari tugas..."/></label>
          <button className="icon-btn" aria-label="Notifikasi"><Bell size={19}/></button>
          {avatarUrl ? <img className="top-avatar profile-photo" src={avatarUrl} alt="" /> : <div className="top-avatar">{initials}</div>}
        </div>
      </header>
      <div className="page-content" key={page}>
        {page === "Beranda" ? <>
          <section className="welcome-row"><div><p className="eyebrow">RUANG BELAJAR PRIBADI</p><h1>Selamat datang, {displayName.split(" ")[0]}! <span>✦</span></h1><p className="muted">Siap untuk belajar hal baru hari ini?</p></div><div className="welcome-art"><GraduationCap size={42}/></div></section>
          <section className="stats-grid">
            <div className="stat-card"><div className="stat-icon purple"><BookOpen size={19}/></div><small>Total pelajaran</small><strong>8</strong><span>Mata pelajaran aktif</span></div>
            <div className="stat-card"><div className="stat-icon orange"><ClipboardList size={19}/></div><small>Tugas belum selesai</small><strong>3</strong><span>Perlu diperhatikan</span></div>
            <div className="stat-card"><div className="stat-icon green"><CalendarDays size={19}/></div><small>Kelas hari ini</small><strong>4</strong><span>Jadwal pembelajaran</span></div>
            <div className="stat-card"><div className="stat-icon blue"><Clock size={19}/></div><small>Jam belajar</small><strong>6j</strong><span>Minggu ini</span></div>
          </section>
          <section className="content-grid">
            <div className="panel"><div className="panel-heading"><div><p className="eyebrow">YANG PERLU DISELESAIKAN</p><h2>Tugas terbaru</h2></div><button className="text-btn" onClick={() => go("Tugas")}>Lihat semua <ArrowUpRight size={15}/></button></div><div className="task-list">{filtered.map(task => <article className="task-row" key={task[0]}><div className={"task-dot " + task[4]}/><div className="task-info"><strong>{task[0]}</strong><small>{task[1]}</small><div className="progress"><span style={{width: task[5] + "%"}}/></div></div><div className="task-meta"><span className={"status " + task[4]}>{task[3]}</span><small><Clock size={13}/> {task[2]}</small></div></article>)}</div></div>
            <div className="panel"><div className="panel-heading"><div><p className="eyebrow">JADWAL HARI INI</p><h2>Jadwal belajar</h2></div><button className="icon-btn" onClick={() => go("Jadwal")} aria-label="Buka jadwal"><ArrowUpRight size={17}/></button></div><div className="schedule-list">{schedule.map(item => <div className="schedule-row" key={item[1]}><time>{item[0]}</time><div className={"schedule-bar " + item[4]}/><div><strong>{item[1]}</strong><small>{item[2]} · {item[3]}</small></div></div>)}</div><button className="outline-btn" onClick={() => go("Jadwal")}>Lihat jadwal lengkap <ChevronRight size={15}/></button></div>
          </section>
        </> : <section className="panel placeholder-page"><div className="placeholder-icon"><ClipboardList size={28}/></div><p className="eyebrow">MY SCHOOL WORKSPACE</p><h1>{page}</h1><p className="muted">Halaman {page.toLowerCase()} siap dikembangkan. Navigasi sudah terhubung.</p>{page === "Tugas" && <div className="task-list full">{filtered.map(task => <article className="task-row" key={task[0]}><div className={"task-dot " + task[4]}/><div className="task-info"><strong>{task[0]}</strong><small>{task[1]}</small></div><span className={"status " + task[4]}>{task[3]}</span></article>)}</div>}<button className="primary-btn" onClick={() => go("Beranda")}>Kembali ke beranda</button></section>}
        {notice && <p className="auth-notice dashboard-notice" role="alert">{notice}</p>}
        {profileLoading && <p className="muted profile-sync"><UserCircle size={14}/> Menyinkronkan profil...</p>}
        <footer>© 2026 SekolahKu <span>Belajar, tumbuh, dan berkembang.</span></footer>
      </div>
    </main>
  </div>;
}
