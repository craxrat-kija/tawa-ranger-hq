import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from "react";
import React from "react";
import { authApi, setAuthToken, removeAuthToken } from "@/lib/api";

export type UserRole = "admin" | "instructor" | "trainee" | "doctor" | "super_admin";

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
  enrolled_courses?: { id: number; name: string; code: string }[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User }>;
  superAdminLogin: (email: string, password: string) => Promise<{ success: boolean; user?: User }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

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
              enrolled_courses: user.enrolled_courses || [],
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

  const login = useCallback(async (email: string, password: string, courseId?: number): Promise<{
    success: boolean;
    requires_course_selection?: boolean;
    courses?: any[];
    user?: User
  }> => {
    try {
      const response = await authApi.login(email, password, courseId);

      if (response.requires_course_selection) {
        return {
          success: true,
          requires_course_selection: true,
          courses: response.data.courses,
          user: response.data.user
        };
      }

      // Handle normal login response
      const loginData = response.data || response;
      if (!loginData || !loginData.token || !loginData.user) {
        console.error('Invalid login response:', response);
        return { success: false };
      }

      setAuthToken(loginData.token);

      // Store course ID if present
      if (loginData.user.course_id) {
        localStorage.setItem('active_course_id', loginData.user.course_id.toString());
      } else {
        localStorage.removeItem('active_course_id');
      }

      const userData: User = {
        id: loginData.user.id.toString(),
        user_id: loginData.user.user_id || loginData.user.id.toString(),
        name: loginData.user.name,
        email: loginData.user.email,
        role: loginData.user.role,
        avatar: loginData.user.avatar,
        phone: loginData.user.phone,
        department: loginData.user.department,
        course_id: loginData.user.course_id,
        course_name: loginData.user.course_name || null,
        enrolled_courses: loginData.user.enrolled_courses || [],
      };
      setUser(userData);
      return { success: true, user: userData };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false };
    }
  }, []);

  const superAdminLogin = useCallback(async (email: string, password: string): Promise<{ success: boolean; user?: User }> => {
    try {
      const response = await authApi.superAdminLogin(email, password);

      const loginData = response.data || response;
      if (!loginData || !loginData.token || !loginData.user) {
        console.error('Invalid login response:', response);
        return { success: false };
      }

      // Verify it's actually a super admin
      if (loginData.user.role !== 'super_admin') {
        throw new Error('This login page is only for Super Administrators.');
      }

      setAuthToken(loginData.token);
      localStorage.removeItem('active_course_id'); // Super admin has no active course

      const userData: User = {
        id: loginData.user.id.toString(),
        user_id: loginData.user.user_id || loginData.user.id.toString(),
        name: loginData.user.name,
        email: loginData.user.email,
        role: loginData.user.role,
        avatar: loginData.user.avatar,
        phone: loginData.user.phone,
        department: loginData.user.department,
        course_id: null,
        course_name: null,
        enrolled_courses: loginData.user.enrolled_courses || [],
      };
      setUser(userData);
      return { success: true, user: userData };
    } catch (error: any) {
      console.error('Super admin login error:', error);
      throw error;
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
            enrolled_courses: user.enrolled_courses || [],
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
      superAdminLogin,
      logout,
      refreshUser,
      isAuthenticated: !!user,
      isLoading,
    }),
    [user, isLoading, login, superAdminLogin, logout, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
