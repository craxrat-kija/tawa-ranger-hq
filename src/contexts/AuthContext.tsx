import { createContext, useContext, useState, ReactNode } from "react";
import React from "react";
import { authApi, setAuthToken, removeAuthToken } from "@/lib/api";

export type UserRole = "admin" | "instructor" | "trainee" | "doctor";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User }>;
  logout: () => void;
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
              name: user.name,
              email: user.email,
              role: user.role,
              avatar: user.avatar,
              phone: user.phone,
              department: user.department,
            });
          }
        } catch (error) {
          console.error('Error checking auth:', error);
          // Token is invalid, remove it
          removeAuthToken();
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; user?: User }> => {
    try {
      const response = await authApi.login(email, password);
      
      // Handle response structure - backend returns { success: true, data: { user: ..., token: ... } }
      // apiRequest returns data.data || data, so response should be { user: ..., token: ... }
      if (!response || !response.token || !response.user) {
        console.error('Invalid login response:', response);
        return { success: false };
      }
      
      setAuthToken(response.token);
      const userData = {
        id: response.user.id.toString(),
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
        avatar: response.user.avatar,
        phone: response.user.phone,
        department: response.user.department,
      };
      setUser(userData);
      return { success: true, user: userData };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeAuthToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
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
