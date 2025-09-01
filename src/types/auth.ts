export interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  role?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  role?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends LoginCredentials {
  confirmPassword: string;
}