import { useState } from "react";
import { Home, BookOpen, CalendarDays, ClipboardList, Users, Bell, Search, ChevronRight, Clock, ArrowUpRight, Menu, X, GraduationCap, BookmarkCheck } from "lucide-react";

const nav = [["Beranda", Home], ["Pelajaran", BookOpen], ["Jadwal", CalendarDays], ["Tugas", ClipboardList], ["Kelas", Users]];
const tasks = [
  ["Rangkuman Sistem Pernapasan", "Biologi · X IPA 2", "Hari ini, 15:00", "Segera", "orange", 65],
  ["Latihan Persamaan Kuadrat", "Matematika · X IPA 2", "Besok, 10:00", "Berlangsung", "blue", 25],
  ["Analisis Teks Eksplanasi", "Bahasa Indonesia · X IPA 2", "Jumat, 23:59", "Baru", "green", 0]
];
const schedule = [["07:30","Matematika","Ibu Ratna","Ruang X-2","purple"],["09:15","Bahasa Indonesia","Pak Dimas","Ruang X-2","blue"],["11:00","Biologi","Ibu Sari","Laboratorium","green"]];

export default function App() {
  const [page,setPage] = useState("Beranda");
  const [mobile,setMobile] = useState(false);
  const [query,setQuery] = useState("");
  const go = (name) => { setPage(name); setMobile(false); };
  const filtered = tasks.filter(t => (t[0] + t[1]).toLowerCase().includes(query.toLowerCase()));
  return <div className="shell">
    <aside className={"sidebar " + (mobile ? "show" : "")}>
      <div className="brand"><div className="brand-icon"><GraduationCap size={22}/></div><div><strong>MySchool</strong><small>LEARNING SPACE</small></div><button className="icon-btn close-menu" onClick={() => setMobile(false)}><X size={19}/></button></div>
      <div className="school-switch"><div className="school-mark">S</div><div><strong>SMA Negeri 01</strong><small>Tahun ajaran 2026/2027</small></div><ChevronRight size={16}/></div>
      <p className="nav-label">MENU UTAMA</p>
      <nav>{nav.map(([name,Icon]) => <button key={name} onClick={() => go(name)} className={"nav-item " + (page === name ? "active" : "")}><Icon size={19}/><span>{name}</span>{name === "Tugas" && <i>3</i>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><BookmarkCheck size={18}/><strong>Belajar lebih teratur</strong><small>Atur tugas dan jadwalmu dalam satu tempat.</small></div><div className="profile"><div className="avatar">ZA</div><div><strong>Zeroo A.</strong><small>Siswa · X IPA 2</small></div></div></div>
    </aside>
    {mobile && <button className="scrim" onClick={() => setMobile(false)} aria-label="Tutup menu"/>}
    <main className="main">
      <header className="topbar"><button className="icon-btn mobile-menu" onClick={() => setMobile(true)}><Menu size={21}/></button><div className="breadcrumb">MySchool <ChevronRight size={15}/> <strong>{page}</strong></div><div className="top-actions"><label className="search-box"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari tugas..."/></label><button className="icon-btn"><Bell size={19}/></button><div className="top-avatar">ZA</div></div></header>
      <div className="page-content" key={page}>
        {page === "Beranda" ? <>
          <section className="welcome-row"><div><p className="eyebrow">KAMIS, 20 NOVEMBER 2026</p><h1>Selamat pagi, Zeroo! <span>✦</span></h1><p className="muted">Siap untuk belajar hal baru hari ini?</p></div><div className="welcome-art"><GraduationCap size={42}/></div></section>
          <section className="stats-grid"><div className="stat-card"><div className="stat-icon purple"><BookOpen size={19}/></div><small>Total pelajaran</small><strong>8</strong><span>Mata pelajaran aktif</span></div><div className="stat-card"><div className="stat-icon orange"><ClipboardList size={19}/></div><small>Tugas belum selesai</small><strong>3</strong><span>Perlu diperhatikan</span></div><div className="stat-card"><div className="stat-icon green"><CalendarDays size={19}/></div><small>Kelas hari ini</small><strong>4</strong><span>Jadwal pembelajaran</span></div><div className="stat-card"><div className="stat-icon blue"><Clock size={19}/></div><small>Jam belajar</small><strong>6j</strong><span>Minggu ini</span></div></section>
          <section className="content-grid"><div className="panel"><div className="panel-heading"><div><p className="eyebrow">YANG PERLU DISELESAIKAN</p><h2>Tugas terbaru</h2></div><button className="text-btn" onClick={() => go("Tugas")}>Lihat semua <ArrowUpRight size={15}/></button></div><div className="task-list">{filtered.map(t => <article className="task-row" key={t[0]}><div className={"task-dot " + t[4]}/><div className="task-info"><strong>{t[0]}</strong><small>{t[1]}</small><div className="progress"><span style={{width:t[5]+"%"}}/></div></div><div className="task-meta"><span className={"status " + t[4]}>{t[3]}</span><small><Clock size={13}/> {t[2]}</small></div></article>)}</div></div>
          <div className="panel"><div className="panel-heading"><div><p className="eyebrow">KAMIS, 20 NOV</p><h2>Jadwal hari ini</h2></div><button className="icon-btn" onClick={() => go("Jadwal")}><ArrowUpRight size={17}/></button></div><div className="schedule-list">{schedule.map(s => <div className="schedule-row" key={s[1]}><time>{s[0]}</time><div className={"schedule-bar " + s[4]}/><div><strong>{s[1]}</strong><small>{s[2]} · {s[3]}</small></div></div>)}</div><button className="outline-btn" onClick={() => go("Jadwal")}>Lihat jadwal lengkap <ChevronRight size={15}/></button></div></section>
        </> : <section className="panel placeholder-page"><div className="placeholder-icon"><ClipboardList size={28}/></div><p className="eyebrow">MY SCHOOL WORKSPACE</p><h1>{page}</h1><p className="muted">Halaman {page.toLowerCase()} siap dikembangkan. Navigasi sudah terhubung.</p>{page === "Tugas" && <div className="task-list full">{filtered.map(t => <article className="task-row" key={t[0]}><div className={"task-dot " + t[4]}/><div className="task-info"><strong>{t[0]}</strong><small>{t[1]}</small></div><span className={"status " + t[4]}>{t[3]}</span></article>)}</div>}<button className="primary-btn" onClick={() => go("Beranda")}>Kembali ke beranda</button></section>}
        <footer>© 2026 MySchool <span>Belajar, tumbuh, dan berkembang.</span></footer>
      </div>
    </main>
  </div>;
}