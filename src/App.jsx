import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthProvider.jsx";
import WelcomePage from "./pages/WelcomePage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import InvitePage from "./pages/InvitePage.jsx";
import InstallPage from "./pages/InstallPage.jsx";
import { App as NativeApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { supabase } from "./lib/supabase.js";

function AppContent() {
  const { loading, user, profile, profileLoading } = useAuth();
  const ApkUpdate = registerPlugin("ApkUpdate");
  const [path, setPath] = useState(window.location.pathname);
  const [appUpdate, setAppUpdate] = useState(null);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateBusy, setUpdateBusy] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const subscriptions = [];
    ApkUpdate.addListener("downloadProgress", event => {
      setUpdateProgress(Math.max(0, Math.min(100, Number(event.percent) || 0)));
    }).then(handle => subscriptions.push(handle));
    ApkUpdate.addListener("installPermissionRequired", () => {
      setUpdateBusy(false);
      setUpdateMessage("Izinkan SekolahKu memasang aplikasi dari sumber ini, lalu tekan Install update here lagi.");
    }).then(handle => subscriptions.push(handle));
    ApkUpdate.addListener("updateError", event => {
      setUpdateBusy(false);
      setUpdateMessage(event.message || "Pembaruan gagal diproses.");
    }).then(handle => subscriptions.push(handle));
    NativeApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive) setUpdateBusy(false);
    }).then(handle => subscriptions.push(handle));
    return () => { subscriptions.forEach(handle => handle.remove()); };
  }, []);

  const installAppUpdate = async () => {
    if (!appUpdate || updateBusy) return;
    setUpdateBusy(true);
    setUpdateMessage("");
    try {
      await ApkUpdate.downloadAndInstall({ url: appUpdate.url });
      setUpdateMessage("Mengunduh pembaruan SekolahKu...");
    } catch (error) {
      setUpdateMessage(error?.message || "Pembaruan gagal diproses. Coba lagi.");
      setUpdateBusy(false);
    }
  };

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let active = true;
    const currentBuild = Number(import.meta.env.VITE_ANDROID_BUILD_NUMBER || 0);
    fetch("https://api.github.com/repos/zeroodevelopercode/MySchool/releases/latest", {
      headers: { Accept: "application/vnd.github+json" }
    })
      .then(response => {
        if (!response.ok) throw new Error("Gagal memeriksa versi aplikasi");
        return response.json();
      })
      .then(release => {
        const match = String(release.tag_name || "").match(/^android-build-(\d+)$/);
        const latestBuild = match ? Number(match[1]) : 0;
        const apk = release.assets?.find(asset => asset.name === "SekolahKu.apk");
        if (active && latestBuild > currentBuild && apk) {
          setAppUpdate({ version: latestBuild, url: apk.browser_download_url });
        }
      })
      .catch(error => console.warn("Pemeriksaan update SekolahKu:", error));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (user?.id) {
      const savedPath = sessionStorage.getItem("sekolahku_post_auth_path");
      if (savedPath) {
        sessionStorage.removeItem("sekolahku_post_auth_path");
        window.history.replaceState(null, "", savedPath);
        setPath(savedPath);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    const syncPath = () => setPath(window.location.pathname);
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, []);

  useEffect(() => {
    let listener;
    let active = true;
    const handleAuthUrl = async (url) => {
      try {
        const incoming = new URL(url);
        if (incoming.protocol !== "com.zeroodev.sekolahku:") return;
        const code = incoming.searchParams.get("code");
        if (code) {
          await Browser.close().catch(() => {});
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          const hash = new URLSearchParams(incoming.hash.replace(/^#/, ""));
          const access_token = hash.get("access_token");
          const refresh_token = hash.get("refresh_token");
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;
          } else {
            throw new Error("Callback login tidak membawa authorization code atau session token.");
          }
        }
      } catch (error) {
        console.error("Callback login SekolahKu gagal:", error);
      }
    };

    NativeApp.addListener("appUrlOpen", ({ url }) => handleAuthUrl(url))
      .then(value => { listener = value; });
    NativeApp.getLaunchUrl().then(result => {
      if (active && result?.url) handleAuthUrl(result.url);
    }).catch(error => console.warn("Gagal membaca deep link awal:", error));

    return () => {
      active = false;
      listener?.remove();
    };
  }, []);

  if (loading || (user && profileLoading)) {
    return <main className="session-loading"><div className="session-spinner" /><p>Memulihkan sesi SekolahKu...</p></main>;
  }
  if (path === "/install" || path === "/install/") return <InstallPage />;
  const inviteMatch = path.match(/^\/invite\/([0-9a-f-]{36})\/?$/i);
  if (inviteMatch && (!user || (profile?.full_name && profile?.birth_date))) return <InvitePage classId={inviteMatch[1]} />;
  if (!user) return <WelcomePage />;
  if (!profile?.full_name || !profile?.birth_date) return <OnboardingPage />;
  return <>
    <DashboardPage />
    {appUpdate && (
      <aside className="app-update-sheet" role="status">
        <div className="app-update-copy">
          <strong>Pembaruan SekolahKu tersedia</strong>
          <span>Versi build {appUpdate.version} siap dipasang.</span>
        </div>
        <div className="app-update-actions">
          <button type="button" onClick={installAppUpdate} disabled={updateBusy}>
            {updateBusy ? "Downloading..." : "Install update here"}
          </button>
          {updateBusy && <div className="app-update-progress"><span style={{ width: updateProgress + "%" }} /></div>}
          {updateBusy && <small className="app-update-percent">{updateProgress}%</small>}
          {updateMessage && <small className="app-update-message">{updateMessage}</small>}
        </div>
        <button className="app-update-dismiss" type="button" aria-label="Tutup pemberitahuan" onClick={() => setAppUpdate(null)}>×</button>
      </aside>
    )}
  </>;
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
