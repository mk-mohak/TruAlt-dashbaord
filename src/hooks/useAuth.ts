import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, AuthState, LoginCredentials, SignUpCredentials } from '../types/auth';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    role: undefined,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchUserProfile = async (user: User) => {
      try {
        const { data: profile, error } = await supabase
          .from('Profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          return 'operator';
        }
        return profile?.role || 'operator';
      } catch (err) {
        console.error('Unexpected error fetching profile:', err);
        return 'operator';
      }
    };

    const handleSession = async (session: any) => {
      if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          created_at: session.user.created_at,
          last_sign_in_at: session.user.last_sign_in_at,
        };
        const role = await fetchUserProfile(user);
        setAuthState({ user, role, isLoading: false, error: null });
      } else {
        setAuthState({ user: null, role: undefined, isLoading: false, error: null });
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        handleSession(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const signIn = async (credentials: LoginCredentials) => {
    return supabase.auth.signInWithPassword(credentials);
  };
  
  const signUp = async (credentials: SignUpCredentials) => {
    if (credentials.password !== credentials.confirmPassword) {
      return { data: null, error: { message: 'Passwords do not match' } as any };
    }
    return supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
    });
  };

  // This function is now simplified. It only handles the Supabase sign-out.
  const signOut = async () => {
    return supabase.auth.signOut();
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
  };
}
