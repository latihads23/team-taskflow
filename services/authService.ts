import { supabase } from '../src/supabaseConfig';
import type { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url: string;
  role: 'admin' | 'manager' | 'user';
  department?: string;
  is_active: boolean;
  last_login?: string;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      daily_digest: boolean;
    };
  };
  created_at: string;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  username: string;
  full_name: string;
  department?: string;
}

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null,
  };
  private listeners: Array<(state: AuthState) => void> = [];

  private constructor() {
    this.initializeAuth();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize authentication state
   */
  private async initializeAuth() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        this.updateAuthState({ error: error.message, loading: false });
        return;
      }

      if (session) {
        await this.handleAuthStateChange(session, 'SIGNED_IN');
      } else {
        this.updateAuthState({ loading: false });
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        await this.handleAuthStateChange(session, event);
      });

    } catch (error) {
      console.error('Error initializing auth:', error);
      this.updateAuthState({
        error: error instanceof Error ? error.message : 'Failed to initialize authentication',
        loading: false,
      });
    }
  }

  private async handleAuthStateChange(session: Session | null, event: string) {
    console.log('Auth state changed:', event, session?.user?.email);

    if (session?.user) {
      try {
        const profile = await this.getUserProfile(session.user.id);
        
        if (event === 'SIGNED_IN') {
          await this.updateLastLogin();
        }

        this.updateAuthState({
          user: session.user,
          session,
          profile,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error loading user profile:', error);
        this.updateAuthState({
          user: session.user,
          session,
          profile: null,
          loading: false,
          error: 'Failed to load user profile',
        });
      }
    } else {
      this.updateAuthState({
        user: null,
        session: null,
        profile: null,
        loading: false,
        error: null,
      });
    }
  }

  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .rpc('get_user_profile', { user_uuid: userId })
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }

    return data;
  }

  private async updateLastLogin() {
    try {
      await supabase.rpc('update_last_login');
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  private updateAuthState(updates: Partial<AuthState>) {
    this.authState = { ...this.authState, ...updates };
    this.listeners.forEach(listener => listener(this.authState));
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    listener(this.authState);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  isAuthenticated(): boolean {
    return !!this.authState.user && !!this.authState.session;
  }

  hasRole(role: string): boolean {
    return this.authState.profile?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.includes(this.authState.profile?.role || '');
  }

  async signIn(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateAuthState({ loading: true, error: null });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        this.updateAuthState({ loading: false, error: error.message });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      this.updateAuthState({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async signUp(data: SignupData): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateAuthState({ loading: true, error: null });

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            full_name: data.full_name,
            department: data.department,
          },
        },
      });

      if (error) {
        this.updateAuthState({ loading: false, error: error.message });
        return { success: false, error: error.message };
      }

      if (authData.user && !authData.session) {
        this.updateAuthState({ loading: false });
        return {
          success: true,
          error: 'Please check your email to confirm your account',
        };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      this.updateAuthState({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      return { success: false, error: errorMessage };
    }
  }

  // Legacy methods for backward compatibility
  async login(credentials: LoginCredentials) {
    const result = await this.signIn(credentials);
    if (!result.success) {
      throw new Error(result.error || 'Login failed');
    }
    
    return {
      user: this.authState.user,
      token: this.authState.session?.access_token || ''
    };
  }

  async logout(): Promise<void> {
    await this.signOut();
  }

  getCurrentUser() {
    return this.authState.profile;
  }

  getToken(): string | null {
    return this.authState.session?.access_token || null;
  }
}

export const authService = AuthService.getInstance();
