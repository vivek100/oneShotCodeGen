"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isCloudMode: boolean;
  signIn: (provider: 'github' | 'google') => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null; success: boolean; data?: any }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null; success: boolean; data?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Debug logging for environment variables
  console.log("Environment Variables Debug:");
  console.log("Raw NEXT_PUBLIC_CLOUD_MODE:", process.env.NEXT_PUBLIC_CLOUD_MODE);
  console.log("Type of NEXT_PUBLIC_CLOUD_MODE:", typeof process.env.NEXT_PUBLIC_CLOUD_MODE);
  
  // Check for string comparison instead of boolean comparison
  const isCloudMode = process.env.NEXT_PUBLIC_CLOUD_MODE === 'true';
  console.log("Calculated isCloudMode:", isCloudMode);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (provider: 'github' | 'google') => {
    await supabase.auth.signInWithOAuth({ provider });
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { error, success: false };
      }
      
      return { error: null, success: true, data };
    } catch (err) {
      console.error("Error in signInWithEmail:", err);
      return { 
        error: new Error(err instanceof Error ? err.message : "An unknown error occurred"), 
        success: false 
      };
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        return { error, success: false };
      }
      
      return { error: null, success: true, data };
    } catch (err) {
      console.error("Error in signUpWithEmail:", err);
      return { 
        error: new Error(err instanceof Error ? err.message : "An unknown error occurred"), 
        success: false 
      };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      isLoading, 
      isCloudMode, 
      signIn, 
      signInWithEmail,
      signUpWithEmail,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
