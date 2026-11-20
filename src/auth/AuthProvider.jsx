import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (!error) setSession(data.session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? null;

  useEffect(() => {
    if (!user?.id || !supabaseConfigured) {
      setProfile(null);
      return undefined;
    }

    let active = true;
    (async () => {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, created_at, updated_at")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Gagal memuat profil SekolahKu:", error.message);
        if (active) setProfile(null);
      } else if (data) {
        if (active) setProfile(data);
      } else {
        const metadata = user.user_metadata ?? {};
        const fullName = metadata.full_name || metadata.name || user.email?.split("@")[0] || "Pengguna";
        const avatarUrl = metadata.avatar_url || metadata.picture || null;
        const { data: created, error: createError } = await supabase
          .from("profiles")
          .upsert({ id: user.id, full_name: fullName, avatar_url: avatarUrl }, { onConflict: "id" })
          .select("id, full_name, avatar_url, role, created_at, updated_at")
          .single();

        if (active) {
          if (createError) console.error("Gagal menyimpan profil:", createError.message);
          else setProfile(created);
        }
      }

      if (active) setProfileLoading(false);
    })();

    return () => { active = false; };
  }, [user?.id]);

  const value = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    profileLoading,
    supabaseConfigured,
    async signInWithProvider(provider) {
      if (!supabaseConfigured) throw new Error("Konfigurasi Supabase belum tersedia. Tambahkan environment variable VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY.");
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setProfile(null);
    }
  }), [session, user, profile, loading, profileLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth harus digunakan di dalam AuthProvider");
  return context;
}
