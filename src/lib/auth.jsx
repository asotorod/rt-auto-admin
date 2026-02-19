import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [dealership, setDealership] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setDealership(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    try {
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (prof) {
        setProfile(prof);
        const { data: dealer } = await supabase
          .from('dealerships')
          .select('*')
          .eq('id', prof.dealership_id)
          .single();
        setDealership(dealer);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setDealership(null);
  }

  const value = {
    session,
    user: session?.user || null,
    profile,
    dealership,
    loading,
    signIn,
    signOut,
    role: profile?.role || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function RequireAuth({ children, minRole = 'viewer' }) {
  const { session, loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-brand-dark">
        <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    window.location.href = '/login';
    return null;
  }

  return children;
}
