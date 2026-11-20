import { Download, GraduationCap, Smartphone } from "lucide-react";

const APK_URL = "https://github.com/zeroodevelopercode/MySchool/releases/latest/download/SekolahKu.apk";

export default function InstallPage() {
  return <main className="student-invite-page">
    <section className="student-invite-card">
      <div className="student-invite-mark"><GraduationCap size={29}/></div>
      <small>SEKOLAHKU • ANDROID APP</small>
      <h1>Gunakan aplikasi SekolahKu</h1>
      <p>Untuk membuka undangan kelas, pasang aplikasi SekolahKu terlebih dahulu di perangkat Android kamu.</p>
      <div className="student-invite-class">
        <Smartphone size={20}/>
        <strong>Aplikasi SekolahKu untuk Android</strong>
      </div>
      <a className="student-invite-action" href={APK_URL}>
        <Download size={18}/> Download APK SekolahKu
      </a>
      <p className="student-invite-note">Setelah unduhan selesai, buka file APK dan ikuti petunjuk pemasangan Android. Jika Android menampilkan peringatan, pastikan file berasal dari rilis resmi SekolahKu.</p>
      <a href="/" className="student-invite-note">Kembali ke website</a>
    </section>
  </main>;
}
