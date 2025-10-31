'use client';

import * as React from 'react';

import type { User } from '@/types/user';
import { authClient } from '@/lib/auth/client';
import { logger } from '@/lib/default-logger';

export interface UserContextValue {
  user: User | null;
  error: string | null;
  isLoading: boolean;
  checkSession?: () => Promise<void>;
}

export const UserContext = React.createContext<UserContextValue | undefined>(undefined);

export function useUser(): UserContextValue {
  const context = React.useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export interface UserProviderProps {
  children: React.ReactNode;
}

export function UserProvider({ children }: UserProviderProps): React.JSX.Element {
  const [state, setState] = React.useState<{ user: User | null; error: string | null; isLoading: boolean }>({
    user: null,
    error: null,
    isLoading: true,
  });

  // Load user from localStorage on mount
  React.useEffect(() => {
    if (globalThis.window !== undefined) {
      try {
        const storedUser = globalThis.localStorage.getItem('user_data');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setState((prev) => ({ ...prev, user, isLoading: false }));
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
      }
    }
  }, []);

  const checkSession = React.useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await authClient.getUser();

      if (error) {
        // Only log actual errors, not token expiration which is normal
        if (error !== 'Invalid or expired token') {
          logger.error(error);
        }
        setState((prev) => ({ ...prev, user: null, error: null, isLoading: false }));
        // Clear localStorage on error
        if (globalThis.window) {
          globalThis.localStorage.removeItem('user_data');
        }
        return;
      }

      const userData = data ?? null;
      setState((prev) => ({ ...prev, user: userData, error: null, isLoading: false }));
      
      // Save user data to localStorage
      if (globalThis.window && userData) {
        globalThis.localStorage.setItem('user_data', JSON.stringify(userData));
      }
    } catch (error) {
      logger.error(error);
      setState((prev) => ({ ...prev, user: null, error: null, isLoading: false }));
      // Clear localStorage on error
      if (globalThis.window) {
        globalThis.localStorage.removeItem('user_data');
      }
    }
  }, []);

  React.useEffect(() => {
    checkSession().catch((error) => {
      logger.error(error);
      // noop
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Expected
  }, []);

  return <UserContext.Provider value={{ ...state, checkSession }}>{children}</UserContext.Provider>;
}

export const UserConsumer = UserContext.Consumer;
