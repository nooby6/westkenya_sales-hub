import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { authApi } from '@/lib/api/auth';
import { clearApiAccessToken, setApiAccessToken } from '@/lib/api/client';

type AppRole = 'ceo' | 'manager' | 'supervisor' | 'sales_rep' | 'driver';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  // Role checks
  isCeo: boolean;
  isManager: boolean;
  isSupervisor: boolean;
  isSalesRep: boolean;
  isDriver: boolean;
  // Permission checks
  isManagerOrHigher: boolean;
  isSupervisorOrHigher: boolean;
  isSalesRepOrHigher: boolean;
  canManageUsers: boolean;
  canManageInventory: boolean;
  canManageOrders: boolean;
  canViewReports: boolean;
  canViewFinancials: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (data && !error) {
      setRole(data.role as AppRole);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error };
    }

    try {
      const token = await authApi.login({ email, password });
      setApiAccessToken(token.access_token);
      return { error: null };
    } catch (backendError) {
      await supabase.auth.signOut();
      clearApiAccessToken();

      const normalizedError =
        backendError instanceof Error
          ? backendError
          : new Error('Signed in to Supabase but backend login failed');

      return { error: normalizedError };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearApiAccessToken();
    setRole(null);
  };

  // Role checks
  const isCeo = role === 'ceo';
  const isManager = role === 'manager';
  const isSupervisor = role === 'supervisor';
  const isSalesRep = role === 'sales_rep';
  const isDriver = role === 'driver';

  // Permission hierarchy
  const isManagerOrHigher = role === 'ceo' || role === 'manager';
  const isSupervisorOrHigher = role === 'ceo' || role === 'manager' || role === 'supervisor';
  const isSalesRepOrHigher = role === 'ceo' || role === 'manager' || role === 'supervisor' || role === 'sales_rep';

  // Feature permissions
  const canManageUsers = isManagerOrHigher;
  const canManageInventory = isSupervisorOrHigher;
  const canManageOrders = isSalesRepOrHigher;
  const canViewReports = isSupervisorOrHigher;
  const canViewFinancials = isManagerOrHigher;

  return (
    <AuthContext.Provider value={{
      user,
      session,
      role,
      loading,
      signIn,
      signUp,
      signOut,
      isCeo,
      isManager,
      isSupervisor,
      isSalesRep,
      isDriver,
      isManagerOrHigher,
      isSupervisorOrHigher,
      isSalesRepOrHigher,
      canManageUsers,
      canManageInventory,
      canManageOrders,
      canViewReports,
      canViewFinancials,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
