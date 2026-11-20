import { useEffect, useMemo, useState } from "react";
import FloatingNav from "../components/FloatingNav.jsx";
import { Home, ClipboardCheck, CalendarDays, UserRound, GraduationCap, Clock3, Mail, Cake, Users, CalendarPlus, Bell, ArrowLeft, School, Megaphone, UserCog, CheckCircle2, Send, LoaderCircle } from "lucide-react";
import { useAuth } from "../auth/AuthProvider.jsx";
import { supabase } from "../lib/supabase.js";

const DETAIL_PAGES = ["Notifikasi kelas", "Kelola guru", "Handle absensi murid", "Sampaikan pengumuman"];
const ROLE_LABELS = { developers: "Developers", teacher: "Teacher", leader_school: "Leader School", student: "Student" };

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
  const [history, setHistory] = useState([]);
  const [actionOpen, setActionOpen] = useState(false);
  const [classInfo, setClassInfo] = useState(null);
  const [classmates, setClassmates] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [classLoading, setClassLoading] = useState(true);
  const [classError, setClassError] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [staffClasses, setStaffClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [attendanceStudents, setAttendanceStudents] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState({});
  const [attendanceDate, setAttendanceDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageNotice, setPageNotice] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [saving, setSaving] = useState(false);

  const displayName = profile?.full_name || "Siswa";
  const email = user?.email || "Email tidak tersedia";
  const age = useMemo(() => calculateAge(profile?.birth_date), [profile?.birth_date]);
  const role = profile?.role || "student";
  const canManage = ["developers", "teacher", "leader_school"].includes(role);
  const isDetailPage = DETAIL_PAGES.includes(page);
  const navigate = (nextPage) => {
    setHistory((previous) => [...previous, page]);
    setPage(nextPage);
    setPageError("");
    setPageNotice("");
  };
  const goBack = () => {
    const previousPage = history[history.length - 1] || "Beranda";
    setHistory((previous) => previous.slice(0, -1));
    setPage(previousPage);
  };

  useEffect(() => {
    let active = true;
    async function loadClassData() {
      if (!user?.id || !supabase) { if (active) setClassLoading(false); return; }
      setClassLoading(true);
      setClassError("");
      const { data: membership, error: membershipError } = await supabase.from("class_members").select("class_id").eq("student_id", user.id).maybeSingle();
      if (membershipError) {
        if (active) { setClassError("Informasi kelas belum dapat dimuat."); setClassLoading(false); }
        return;
      }
      if (!membership) {
        if (active) { setClassInfo(null); setClassmates([]); setAnnouncements([]); setClassLoading(false); }
        return;
      }
      const [classResult, rosterResult, announcementResult] = await Promise.all([
        supabase.from("classes").select("id,name").eq("id", membership.class_id).maybeSingle(),
        supabase.rpc("get_my_class_roster"),
        supabase.from("class_announcements").select("id,title,body,created_at,author_id").eq("class_id", membership.class_id).order("created_at", { ascending: false })
      ]);
      if (!active) return;
      if (classResult.error || rosterResult.error || announcementResult.error) setClassError("Sebagian informasi kelas belum dapat dimuat.");
      setClassInfo(classResult.data || null);
      setClassmates((rosterResult.data || []).filter((student) => student.student_id !== user.id));
      setAnnouncements(announcementResult.data || []);
      setClassLoading(false);
    }
    loadClassData();
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    let active = true;
    async function loadStaffData() {
      if (!canManage || !supabase) return;
      setPageLoading(true);
      if (page === "Kelola guru") {
        const { data, error } = await supabase.from("profiles").select("id,full_name,avatar_url,created_at").eq("role", "teacher").order("full_name");
        if (active) {
          setTeachers(data || []);
          setPageError(error ? "Daftar guru belum dapat dimuat." : "");
          setPageLoading(false);
        }
      } else if (["Handle absensi murid", "Sampaikan pengumuman"].includes(page)) {
        const { data, error } = await supabase.from("classes").select("id,name").eq("created_by", user.id).order("name");
        if (active) {
          setStaffClasses(data || []);
          setPageError(error ? "Daftar kelas belum dapat dimuat." : "");
          if (data?.length && !data.some((item) => item.id === selectedClass)) setSelectedClass(data[0].id);
          if (!data?.length) setSelectedClass("");
          setPageLoading(false);
        }
      }
    }
    loadStaffData();
    return () => { active = false; };
  }, [page, canManage, user?.id]);

  useEffect(() => {
    let active = true;
    async function loadAttendance() {
      if (page !== "Handle absensi murid" || !selectedClass || !supabase) return;
      setPageLoading(true);
      const { data: members, error: memberError } = await supabase.from("class_members").select("student_id").eq("class_id", selectedClass);
      if (memberError) {
        if (active) { setPageError("Daftar murid tidak dapat dimuat."); setPageLoading(false); }
        return;
      }
      const ids = (members || []).map((item) => item.student_id);
      const [profileResult, attendanceResult] = ids.length ? await Promise.all([
        supabase.from("profiles").select("id,full_name").in("id", ids).order("full_name"),
        supabase.from("class_attendance").select("student_id,status,note").eq("class_id", selectedClass).eq("attendance_date", attendanceDate)
      ]) : [{ data: [], error: null }, { data: [], error: null }];
      if (!active) return;
      setAttendanceStudents(profileResult.data || []);
      const map = {};
      (attendanceResult.data || []).forEach((row) => { map[row.student_id] = row.status; });
      setAttendanceRows(map);
      setPageError(profileResult.error || attendanceResult.error ? "Data absensi tidak lengkap." : "");
      setPageLoading(false);
    }
    loadAttendance();
    return () => { active = false; };
  }, [page, selectedClass, attendanceDate]);

  const saveAttendance = async () => {
    if (!selectedClass || !attendanceStudents.length) return;
    setSaving(true); setPageError(""); setPageNotice("");
    const rows = attendanceStudents.map((student) => ({
      class_id: selectedClass, student_id: student.id, attendance_date: attendanceDate,
      status: attendanceRows[student.id] || "present", recorded_by: user.id
    }));
    const { error } = await supabase.from("class_attendance").upsert(rows, { onConflict: "class_id,student_id,attendance_date" });
    setSaving(false);
    if (error) setPageError("Absensi gagal disimpan. Pastikan kamu pengelola kelas tersebut.");
    else setPageNotice("Absensi berhasil disimpan.");
  };

  const publishAnnouncement = async (event) => {
    event.preventDefault();
    if (!selectedClass || !announcementTitle.trim() || !announcementBody.trim()) return;
    setSaving(true); setPageError(""); setPageNotice("");
    const { error } = await supabase.from("class_announcements").insert({
      class_id: selectedClass, author_id: user.id,
      title: announcementTitle.trim(), body: announcementBody.trim()
    });
    setSaving(false);
    if (error) setPageError("Pengumuman gagal diterbitkan. Pastikan kamu pengelola kelas tersebut.");
    else { setAnnouncementTitle(""); setAnnouncementBody(""); setPageNotice("Pengumuman berhasil disampaikan ke kelas."); }
  };

  return <div className="student-app">
    <header className={isDetailPage ? "student-topbar student-detail-topbar" : "student-topbar"}>
      {isDetailPage ? <>
        <button className="student-back-button" onClick={goBack} aria-label="Kembali"><ArrowLeft size={21}/></button>
        <div className="student-header-title"><strong>{page === "Notifikasi kelas" ? "Notification your class" : page}</strong><small>{page === "Notifikasi kelas" ? "PENGUMUMAN KELAS" : "PANEL PENGELOLAAN SEKOLAH"}</small></div>
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
          <article className="student-info-card"><div className="student-info-card-head"><span className="student-info-icon classmates"><Users size={19}/></span><div><span>LINGKUNGAN BELAJAR</span><h2>Murid kelasmu</h2></div></div>
            {classLoading ? <p className="student-card-muted">Memuat daftar murid...</p> : classInfo ? <><div className="student-classmate-list">{classmates.length ? classmates.slice(0,4).map((student) => <div className="student-classmate" key={student.student_id}><span className="student-mini-avatar">{student.avatar_url ? <img src={student.avatar_url} alt=""/> : (student.full_name || "S").split(/\s+/).slice(0,2).map((part) => part[0]).join("").toUpperCase()}</span><span>{student.full_name || "Nama siswa"}</span></div>) : <p className="student-card-muted">Belum ada murid lain di kelasmu.</p>}</div>{classmates.length > 4 && <small className="student-card-foot">+{classmates.length - 4} murid lainnya</small>}</> : <p className="student-card-muted">Daftar murid akan muncul setelah kamu dimasukkan ke kelas.</p>}
          </article>
          <article className="student-info-card"><div className="student-info-card-head"><span className="student-info-icon classroom"><School size={19}/></span><div><span>INFORMASI KELAS</span><h2>Kelasmu</h2></div></div>
            {classLoading ? <p className="student-card-muted">Memuat informasi kelas...</p> : classInfo ? <div className="student-class-name">{classInfo.name}</div> : <p className="student-card-muted">Kamu belum dimasukan ke kelas manapun di sini.</p>}
          </article>
        </div>
        {classError && <p className="student-class-error">{classError}</p>}
        <button className="student-notification-card" onClick={() => navigate("Notifikasi kelas")}><span className="student-notification-icon"><Bell size={21}/></span><span className="student-notification-copy"><strong>Notifikasi kelasmu</strong><small>{classLoading ? "Memeriksa pengumuman..." : announcements.length ? announcements.length + " pengumuman dari guru" : "Lihat pengumuman dan informasi dari guru"}</small></span>{announcements.length > 0 && <span className="student-notification-count">{announcements.length > 99 ? "99+" : announcements.length}</span>}<span className="student-notification-arrow">›</span></button>
        <div className="student-section-title"><div><span>MENU SISWA</span><h2>Akses cepat</h2></div></div>
        <div className="student-shortcuts">
          <button onClick={() => navigate("Absensi kelas")}><span className="shortcut-icon violet"><ClipboardCheck size={21}/></span><strong>Absensi kelas</strong><small>Lihat kehadiranmu</small></button>
          <button onClick={() => navigate("Event sekolah")}><span className="shortcut-icon blue"><CalendarDays size={21}/></span><strong>Event sekolah</strong><small>Agenda dan kegiatan</small></button>
          <button onClick={() => navigate("Profile siswa")}><span className="shortcut-icon green"><UserRound size={21}/></span><strong>Profile siswa</strong><small>Informasi akunmu</small></button>
        </div>
      </section>}

      {page === "Notifikasi kelas" && <section className="student-page student-announcements-page">
        <div className="student-announcement-intro"><span className="student-info-icon classroom"><Megaphone size={20}/></span><div><span>PUSAT INFORMASI</span><h1>Pengumuman kelas</h1><p>Informasi dan pengumuman yang dibagikan oleh guru untuk kelasmu.</p></div></div>
        {classLoading ? <div className="student-announcement-empty"><Clock3 size={25}/><h2>Memuat pengumuman</h2><p>Sedang mengambil informasi kelasmu.</p></div> : !classInfo ? <div className="student-announcement-empty"><School size={27}/><h2>Kamu belum memiliki kelas</h2><p>Pengumuman dari guru akan muncul setelah kamu dimasukkan ke kelas.</p></div> : announcements.length === 0 ? <div className="student-announcement-empty"><Bell size={27}/><h2>Belum ada pengumuman</h2><p>Jika guru membagikan pengumuman baru, informasinya akan tampil di halaman ini.</p></div> : <div className="student-announcement-list">{announcements.map((announcement) => <article className="student-announcement" key={announcement.id}><div className="student-announcement-top"><span className="student-announcement-tag"><Megaphone size={13}/> Pengumuman guru</span><time>{formatAnnouncementDate(announcement.created_at)}</time></div><h2>{announcement.title}</h2><p>{announcement.body}</p></article>)}</div>}
      </section>}

      {page === "Kelola guru" && <section className="student-page student-manage-page">
        <div className="student-page-heading"><span className="student-page-icon violet"><UserCog size={23}/></span><div><span>AKUN SEKOLAH</span><h1>Kelola guru</h1></div></div>
        <p className="student-manage-description">Daftar akun yang memiliki role Teacher di SekolahKu.</p>
        {pageLoading ? <div className="student-announcement-empty"><LoaderCircle size={24}/><h2>Memuat akun guru</h2></div> : pageError ? <p className="student-form-error">{pageError}</p> : teachers.length ? <div className="student-teacher-list">{teachers.map((teacher) => <article className="student-teacher-row" key={teacher.id}><span className="student-teacher-avatar">{teacher.avatar_url ? <img src={teacher.avatar_url} alt=""/> : (teacher.full_name || "G").slice(0,1).toUpperCase()}</span><span><strong>{teacher.full_name || "Guru tanpa nama"}</strong><small>Role: Teacher</small></span><span className="student-role-pill">TEACHER</span></article>)}</div> : <div className="student-announcement-empty"><Users size={25}/><h2>Belum ada akun guru</h2><p>Akun yang sudah diberi role Teacher akan tampil di sini.</p></div>}
        <p className="student-manage-footnote">Pengubahan role dan pembuatan akun dikelola secara aman melalui administrasi database.</p>
      </section>}

      {page === "Handle absensi murid" && <section className="student-page student-manage-page">
        <div className="student-page-heading"><span className="student-page-icon blue"><ClipboardCheck size={23}/></span><div><span>KEHADIRAN SISWA</span><h1>Handle absensi murid</h1></div></div>
        {staffClasses.length > 0 && <div className="student-form-field"><label>Pilih kelas</label><select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>{staffClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>}
        <div className="student-form-field student-date-field"><label>Tanggal absensi</label><input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)}/></div>
        {pageLoading ? <p className="student-card-muted">Memuat daftar murid...</p> : staffClasses.length === 0 ? <div className="student-announcement-empty"><School size={25}/><h2>Belum ada kelas yang dikelola</h2><p>Kelas yang kamu kelola akan tampil di sini untuk dicatat kehadirannya.</p></div> : attendanceStudents.length ? <div className="student-attendance-list">{attendanceStudents.map((student) => <div className="student-attendance-row" key={student.id}><strong>{student.full_name || "Nama siswa"}</strong><select aria-label={"Status kehadiran " + student.full_name} value={attendanceRows[student.id] || "present"} onChange={(e) => setAttendanceRows((current) => ({...current,[student.id]:e.target.value}))}><option value="present">Hadir</option><option value="late">Terlambat</option><option value="excused">Izin</option><option value="absent">Tidak hadir</option></select></div>)}</div> : <div className="student-announcement-empty"><Users size={25}/><h2>Belum ada murid di kelas ini</h2><p>Tambahkan anggota kelas terlebih dahulu.</p></div>}
        {attendanceStudents.length > 0 && <button className="student-primary-action" onClick={saveAttendance} disabled={saving}>{saving ? "Menyimpan..." : <><CheckCircle2 size={17}/> Simpan absensi</>}</button>}
        {pageNotice && <p className="student-form-success">{pageNotice}</p>}
        {pageError && <p className="student-form-error">{pageError}</p>}
      </section>}

      {page === "Sampaikan pengumuman" && <section className="student-page student-manage-page">
        <div className="student-page-heading"><span className="student-page-icon green"><Megaphone size={23}/></span><div><span>INFORMASI KELAS</span><h1>Sampaikan pengumuman</h1></div></div>
        {staffClasses.length === 0 && !pageLoading ? <div className="student-announcement-empty"><School size={25}/><h2>Belum ada kelas yang dikelola</h2><p>Buat atau kelola kelas terlebih dahulu untuk menyampaikan pengumuman.</p></div> : <form className="student-announcement-form" onSubmit={publishAnnouncement}>
          <div className="student-form-field"><label>Tujuan kelas</label><select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} required>{staffClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          <div className="student-form-field"><label>Judul pengumuman</label><input value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} placeholder="Contoh: Jadwal ujian tengah semester" maxLength={160} required/></div>
          <div className="student-form-field"><label>Isi pengumuman</label><textarea value={announcementBody} onChange={(e) => setAnnouncementBody(e.target.value)} placeholder="Tulis informasi untuk murid di kelas ini..." rows={6} maxLength={10000} required/></div>
          <button className="student-primary-action" type="submit" disabled={saving || pageLoading || !staffClasses.length}>{saving ? "Mengirim..." : <><Send size={17}/> Terbitkan pengumuman</>}</button>
        </form>}
        {pageNotice && <p className="student-form-success">{pageNotice}</p>}
        {pageError && <p className="student-form-error">{pageError}</p>}
      </section>}

      {page === "Absensi kelas" && <section className="student-page"><div className="student-page-heading"><span className="student-page-icon violet"><ClipboardCheck size={23}/></span><div><span>KEGIATAN BELAJAR</span><h1>Absensi kelas</h1></div></div><div className="student-empty-state"><span className="empty-state-icon"><Users size={27}/></span><h2>Kamu belum terdaftar di kelas</h2><p>Absensi akan tersedia setelah guru memasukkan akunmu ke kelas.</p><span className="student-feature-tag"><Clock3 size={13}/> Menunggu penempatan kelas</span></div></section>}

      {page === "Event sekolah" && <section className="student-page"><div className="student-page-heading"><span className="student-page-icon blue"><CalendarDays size={23}/></span><div><span>AGENDA SEKOLAH</span><h1>Event sekolah</h1></div></div><div className="student-empty-state"><span className="empty-state-icon"><CalendarPlus size={27}/></span><h2>Belum ada event sekolah</h2><p>Event yang dibuat oleh guru dan kepala sekolah akan ditampilkan di halaman ini.</p><span className="student-feature-tag"><CalendarDays size={13}/> Menunggu event berikutnya</span></div></section>}

      {page === "Profile siswa" && <section className="student-page"><div className="student-page-heading"><span className="student-page-icon green"><UserRound size={23}/></span><div><span>IDENTITAS AKUN</span><h1>Profile siswa</h1></div></div><div className="student-profile-card"><div className="student-profile-head"><div className="student-avatar">{profile?.avatar_url ? <img src={profile.avatar_url} alt="Foto profil"/> : displayName.split(/\s+/).slice(0,2).map(part => part[0]).join("").toUpperCase()}</div><div><h2>{displayName}</h2><span>{ROLE_LABELS[role] || "Student"}</span></div></div><div className="student-profile-details"><div><span><UserRound size={16}/> Nama lengkap</span><strong>{displayName}</strong></div><div><span><Cake size={16}/> Tanggal lahir</span><strong>{formatBirthDate(profile?.birth_date)}</strong></div><div><span><Clock3 size={16}/> Umur</span><strong>{age === null ? "Belum tersedia" : age + " tahun"}</strong></div><div><span><Mail size={16}/> Gmail</span><strong className="student-email">{email}</strong></div><div><span><GraduationCap size={16}/> Kelas</span><strong>{classInfo?.name || "Belum dimasukkan ke kelas"}</strong></div><div><span><UserCog size={16}/> Role</span><strong>{ROLE_LABELS[role] || "Student"}</strong></div></div><p className="student-profile-note">Data identitas tersimpan pada profil akunmu. Informasi kelas akan diperbarui setelah guru menempatkanmu ke kelas.</p></div></section>}
    </main>

    <FloatingNav active={page} onChange={navigate} role={role} actionOpen={actionOpen} onActionToggle={() => setActionOpen((open) => !open)}/>
    {!canManage && null}
  </div>;
}
