import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from "react";
import React from "react";
import { authApi, setAuthToken, removeAuthToken } from "@/lib/api";

export type UserRole = "admin" | "instructor" | "trainee" | "doctor";

interface User {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  department?: string;
  course_id?: number | null;
  course_name?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const userData = await authApi.getCurrentUser();
          // Handle response structure - apiRequest returns data.data || data
          const user = userData.user || userData;
          if (user && user.id) {
            setUser({
              id: user.id.toString(),
              user_id: user.user_id || user.id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
              avatar: user.avatar,
              phone: user.phone,
              department: user.department,
              course_id: user.course_id,
              course_name: user.course_name || null,
            });
            setIsLoading(false);
            return; // Exit early if successful
          }
        } catch (error: any) {
          console.error('Error checking auth:', error);
          // Only remove token if it's a 401/403 (unauthorized) or if error message indicates invalid token
          // Don't logout on network errors or temporary server issues
          if (error.response?.status === 401 || error.response?.status === 403 || 
              error.message?.includes('Unauthorized') || error.message?.includes('Invalid token')) {
            console.log('Token is invalid, removing from storage');
            removeAuthToken();
          } else {
            // For other errors, keep the token but log the error
            console.warn('Auth check failed but keeping token:', error.message);
          }
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = useCallback(async (userId: string, password: string): Promise<{ success: boolean; user?: User }> => {
    try {
      const response = await authApi.login(userId, password);
      
      // Handle response structure - backend returns { success: true, data: { user: ..., token: ... } }
      // apiRequest returns data.data || data, so response should be { user: ..., token: ... }
      if (!response || !response.token || !response.user) {
        console.error('Invalid login response:', response);
        return { success: false };
      }
      
      setAuthToken(response.token);
      const userData = {
        id: response.user.id.toString(),
        user_id: response.user.user_id || response.user.id.toString(),
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
        avatar: response.user.avatar,
        phone: response.user.phone,
        department: response.user.department,
        course_id: response.user.course_id,
        course_name: response.user.course_name || null,
      };
      setUser(userData);
      return { success: true, user: userData };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeAuthToken();
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const userData = await authApi.getCurrentUser();
        const user = userData.user || userData;
        if (user && user.id) {
          setUser({
            id: user.id.toString(),
            user_id: user.user_id || user.id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            phone: user.phone,
            department: user.department,
            course_id: user.course_id,
            course_name: user.course_name || null,
          });
        }
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      refreshUser,
      isAuthenticated: !!user,
      isLoading,
    }),
    [user, isLoading, login, logout, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
