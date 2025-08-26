import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, AuthState, LoginCredentials, SignUpCredentials } from '../types/auth';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setAuthState(prev => ({ ...prev, error: error.message, isLoading: false }));
          return;
        }

        setAuthState(prev => ({
          ...prev,
          user: session?.user ? {
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at,
            last_sign_in_at: session.user.last_sign_in_at,
          } : null,
          isLoading: false,
        }));
      } catch (err) {
        console.error('Unexpected error getting session:', err);
        setAuthState(prev => ({ 
          ...prev, 
          error: 'Failed to initialize authentication', 
          isLoading: false 
        }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setAuthState(prev => ({
          ...prev,
          user: session?.user ? {
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at,
            last_sign_in_at: session.user.last_sign_in_at,
          } : null,
          error: null,
          isLoading: false,
        }));
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, isLoading: false }));
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setAuthState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (credentials: SignUpCredentials): Promise<{ success: boolean; error?: string }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    if (credentials.password !== credentials.confirmPassword) {
      const error = 'Passwords do not match';
      setAuthState(prev => ({ ...prev, error, isLoading: false }));
      return { success: false, error };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, isLoading: false }));
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      setAuthState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        setAuthState(prev => ({ ...prev, error: error.message, isLoading: false }));
      }
    } catch (err) {
      console.error('Unexpected sign out error:', err);
      setAuthState(prev => ({ 
        ...prev, 
        error: 'Failed to sign out', 
        isLoading: false 
      }));
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
  };
}