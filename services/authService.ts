import { AuthUser, LoginCredentials } from '../types';

// Test accounts - in production, this would be replaced with real authentication
const TEST_ACCOUNTS: Array<{ email: string; password: string; user: AuthUser }> = [
  {
    email: 'latihads@gmail.com',
    password: '123',
    user: {
      id: 'auth1',
      email: 'latihads@gmail.com',
      name: 'Administrator',
      avatarUrl: 'https://i.pravatar.cc/150?u=admin',
      role: 'admin'
    }
  },
  {
    email: 'alex.johnson@example.com',
    password: 'password123',
    user: {
      id: 'auth2',
      email: 'alex.johnson@example.com',
      name: 'Alex Johnson',
      avatarUrl: 'https://i.pravatar.cc/150?u=alex',
      role: 'user'
    }
  },
  {
    email: 'maria.garcia@example.com',
    password: 'password123',
    user: {
      id: 'auth3',
      email: 'maria.garcia@example.com',
      name: 'Maria Garcia',
      avatarUrl: 'https://i.pravatar.cc/150?u=maria',
      role: 'user'
    }
  }
];

// Storage keys
const AUTH_STORAGE_KEY = 'team_taskflow_auth_user';
const AUTH_TOKEN_KEY = 'team_taskflow_auth_token';

export class AuthService {
  private static instance: AuthService;
  
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }
  
  /**
   * Simulate login with test accounts
   */
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const account = TEST_ACCOUNTS.find(
      acc => acc.email.toLowerCase() === credentials.email.toLowerCase() && 
             acc.password === credentials.password
    );
    
    if (!account) {
      throw new Error('Invalid email or password');
    }
    
    // Generate a simple token (in production, this would be a JWT from backend)
    const token = this.generateToken(account.user);
    
    // Store in localStorage
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(account.user));
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    
    return {
      user: account.user,
      token
    };
  }
  
  /**
   * Logout user and clear storage
   */
  async logout(): Promise<void> {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
  
  /**
   * Get current authenticated user from storage
   */
  getCurrentUser(): AuthUser | null {
    try {
      const userData = localStorage.getItem(AUTH_STORAGE_KEY);
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      
      if (!userData || !token) return null;
      
      const user: AuthUser = JSON.parse(userData);
      
      // Validate token (simple check - in production, verify JWT)
      if (!this.isValidToken(token)) {
        this.logout();
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      this.logout();
      return null;
    }
  }
  
  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
  
  /**
   * Get current auth token
   */
  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  
  /**
   * Generate a simple token (in production, use proper JWT)
   */
  private generateToken(user: AuthUser): string {
    const payload = {
      userId: user.id,
      email: user.email,
      timestamp: Date.now()
    };
    
    // Simple base64 encoding (NOT secure for production)
    return btoa(JSON.stringify(payload));
  }
  
  /**
   * Validate token (simple check - in production, verify JWT properly)
   */
  private isValidToken(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token));
      
      // Check if token is not older than 24 hours
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      const isExpired = Date.now() - payload.timestamp > maxAge;
      
      return !isExpired;
    } catch {
      return false;
    }
  }
  
  /**
   * Get available test accounts (for demo purposes)
   */
  getTestAccounts(): Array<{ email: string; password: string; name: string; role: string }> {
    return TEST_ACCOUNTS.map(acc => ({
      email: acc.email,
      password: acc.password,
      name: acc.user.name,
      role: acc.user.role || 'user'
    }));
  }
}

export const authService = AuthService.getInstance();
