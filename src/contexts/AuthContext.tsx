import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { Profile } from "@/types";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Wipe all client-side caches so no stale data leaks between users */
function clearClientCaches(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.cancelQueries();
  queryClient.clear();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const prevUserIdRef = useRef<string | null>(null);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error) {
      console.error("Failed to load profile:", error.message);
      setProfile(null);
    } else {
      setProfile(data);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        const newUser = session?.user ?? null;
        setUser(newUser);

        // Detect user switch or logout — clear everything
        const newId = newUser?.id ?? null;
        if (prevUserIdRef.current && prevUserIdRef.current !== newId) {
          clearClientCaches(queryClient);
          setProfile(null);
        }
        prevUserIdRef.current = newId;

        if (newUser) {
          setTimeout(() => fetchProfile(newUser.id), 0);
        } else {
          setProfile(null);
        }

        // Handle token refresh failures
        if (event === "TOKEN_REFRESHED" && !session) {
          clearClientCaches(queryClient);
          setProfile(null);
        }

        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const u = session?.user ?? null;
      setUser(u);
      prevUserIdRef.current = u?.id ?? null;
      if (u) {
        fetchProfile(u.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const signUp = async (email: string, password: string, username: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name: displayName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    // Clear previous user's data before signing in
    clearClientCaches(queryClient);
    setProfile(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearClientCaches(queryClient);
    setProfile(null);
    setUser(null);
    setSession(null);

    // Nuke all browser storage to prevent any data leakage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Storage may be unavailable in some contexts
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
