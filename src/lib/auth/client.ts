'use client';

import type { User } from '@/types/user';
import { apiClient } from '@/lib/api-client';

export interface SignInWithPasswordParams {
  email: string;
  password: string;
}

export interface ResetPasswordParams {
  email: string;
}

interface UserResponse {
  user: {
    _id: string;
    name: string;
    email: string;
    roles: string[];
  };
}

class AuthClient {
  async signInWithPassword(params: SignInWithPasswordParams): Promise<{ error?: string }> {
    const result = await apiClient.login(params);
    
    if (result.error) {
      return { error: result.error };
    }

    return {};
  }

  async resetPassword(params: ResetPasswordParams): Promise<{ error?: string }> {
    const result = await apiClient.request('/auth?action=forgot-password', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    
    if (result.error) {
      return { error: result.error };
    }

    return {};
  }

  async updatePassword(_params: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: 'Update password not implemented' };
  }

  async getUser(): Promise<{ data?: User | null; error?: string }> {
    // Check if we have a token
    const token = globalThis.window?.localStorage.getItem('accessToken');
    
    if (token === null) {
      return { data: null };
    }

    try {
      // Decode the JWT token to get user information
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Check if token is expired
      if (payload.exp && payload.exp < Date.now() / 1000) {
        // Token is expired, try to refresh
        const refreshResult = await apiClient.refreshToken();
        if (refreshResult.error) {
          this.clearAccessToken();
          return { data: null };
        }
        // Retry with new token
        const newToken = globalThis.window?.localStorage.getItem('accessToken');
        if (newToken !== null) {
          const newPayload = JSON.parse(atob(newToken.split('.')[1]));
          const result = await apiClient.request(`/users/${newPayload.sub}`);
          
          if (result.error) {
            return { data: null, error: result.error };
          }
          
          return { 
            data: {
              id: (result.data as UserResponse).user._id,
              avatar: '/assets/avatar.png',
              firstName: (result.data as UserResponse).user.name.split(' ')[0] || 'User',
              lastName: (result.data as UserResponse).user.name.split(' ').slice(1).join(' ') || '',
              email: (result.data as UserResponse).user.email,
              roles: (result.data as UserResponse).user.roles,
            } as User
          };
        }
      }
      
      // Get user details from the database
      const result = await apiClient.request(`/users/${payload.sub}`);
      
      if (result.error) {
        return { data: null, error: result.error };
      }
      
      return { 
        data: {
          id: (result.data as UserResponse).user._id,
          avatar: '/assets/avatar.png',
          firstName: (result.data as UserResponse).user.name.split(' ')[0] || 'User',
          lastName: (result.data as UserResponse).user.name.split(' ').slice(1).join(' ') || '',
          email: (result.data as UserResponse).user.email,
          roles: (result.data as UserResponse).user.roles,
        } as User
      };
    } catch {
      // If token is invalid, clear it
      this.clearAccessToken();
      return { data: null };
    }
  }

  clearAccessToken() {
    if (globalThis.window !== undefined) {
      globalThis.window.localStorage.removeItem('accessToken');
      globalThis.window.localStorage.removeItem('refreshToken');
    }
  }

  async signOut(): Promise<{ error?: string }> {
    await apiClient.logout();
    return {};
  }
}

export const authClient = new AuthClient();
