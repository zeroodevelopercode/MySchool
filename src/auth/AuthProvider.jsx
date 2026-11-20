import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase.js";
import { Capacitor } from "@capacitor/core";

const AuthContext = createContext(null);
const PROFILE_FIELDS = "id, full_name, avatar_url, birth_date, role, created_at, updated_at";

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
      setProfileLoading(false);
      return undefined;
    }
    let active = true;
    (async () => {
      setProfileLoading(true);
      const { data, error } = await supabase.from("profiles").select(PROFILE_FIELDS).eq("id", user.id).maybeSingle();
      if (!active) return;
      if (error) {
        console.error("Gagal memuat profil SekolahKu:", error.message);
        setProfile(null);
      } else if (data) {
        const metadata = user.user_metadata ?? {};
        const patch = {};
        if (!data.full_name) patch.full_name = metadata.full_name || metadata.name || metadata.user_name || user.email?.split("@")[0] || "Pengguna";
        if (!data.avatar_url) patch.avatar_url = metadata.avatar_url || metadata.picture || null;
        if (Object.keys(patch).length) {
          const { data: updated, error: updateError } = await supabase.from("profiles").update(patch).eq("id", user.id).select(PROFILE_FIELDS).single();
          if (active) setProfile(updateError ? data : updated);
        } else {
          setProfile(data);
        }
      } else {
        const metadata = user.user_metadata ?? {};
        const { data: created, error: createError } = await supabase.from("profiles").upsert({
          id: user.id,
          full_name: metadata.full_name || metadata.name || user.email?.split("@")[0] || "Pengguna",
          avatar_url: metadata.avatar_url || metadata.picture || null
        }, { onConflict: "id" }).select(PROFILE_FIELDS).single();
        if (active) {
          if (createError) console.error("Gagal membuat profil:", createError.message);
          else setProfile(created);
        }
      }
      if (active) setProfileLoading(false);
    })();
    return () => { active = false; };
  }, [user?.id]);

  const value = useMemo(() => ({
    session, user, profile, loading, profileLoading, supabaseConfigured,
    async saveProfile({ full_name, birth_date }) {
      if (!user?.id) throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");
      const { data, error } = await supabase.from("profiles")
        .update({ full_name: full_name.trim(), birth_date })
        .eq("id", user.id)
        .select(PROFILE_FIELDS)
        .single();
      if (error) throw error;
      setProfile(data);
      return data;
    },
    async signInWithProvider(provider) {
      if (window.location.pathname.startsWith("/invite/")) sessionStorage.setItem("sekolahku_post_auth_path", window.location.pathname);
      if (!supabaseConfigured) throw new Error("Konfigurasi Supabase belum tersedia. Tambahkan environment variable VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY.");
      const redirectTo = Capacitor.isNativePlatform() ? "https://myschool-umber.vercel.app" : window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
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
