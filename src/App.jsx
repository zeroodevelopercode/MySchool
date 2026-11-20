import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthProvider.jsx";
import WelcomePage from "./pages/WelcomePage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import InvitePage from "./pages/InvitePage.jsx";
import InstallPage from "./pages/InstallPage.jsx";
import { App as NativeApp } from "@capacitor/app";
import { supabase } from "./lib/supabase.js";

function AppContent() {
  const { loading, user, profile, profileLoading } = useAuth();
  const [path, setPath] = useState(window.location.pathname);

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
    NativeApp.addListener("appUrlOpen", async ({ url }) => {
      try {
        const incoming = new URL(url);
        const code = incoming.searchParams.get("code");
        if (code) await supabase?.auth.exchangeCodeForSession(code);
        const hash = new URLSearchParams(incoming.hash.replace(/^#/, ""));
        const access_token = hash.get("access_token");
        const refresh_token = hash.get("refresh_token");
        if (access_token && refresh_token) {
          await supabase?.auth.setSession({ access_token, refresh_token });
        }
        const nextPath = incoming.pathname + incoming.search + incoming.hash;
        window.history.replaceState(null, "", nextPath);
        setPath(incoming.pathname);
      } catch (error) {
        console.error("Deep link SekolahKu tidak dapat diproses:", error);
      }
    }).then(value => { listener = value; });
    return () => { listener?.remove(); };
  }, []);

  if (loading || (user && profileLoading)) {
    return <main className="session-loading"><div className="session-spinner" /><p>Memulihkan sesi SekolahKu...</p></main>;
  }
  if (path === "/install" || path === "/install/") return <InstallPage />;
  const inviteMatch = path.match(/^\/invite\/([0-9a-f-]{36})\/?$/i);
  if (inviteMatch && (!user || (profile?.full_name && profile?.birth_date))) return <InvitePage classId={inviteMatch[1]} />;
  if (!user) return <WelcomePage />;
  if (!profile?.full_name || !profile?.birth_date) return <OnboardingPage />;
  return <DashboardPage />;
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
