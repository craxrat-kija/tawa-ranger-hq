import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "admin" | "instructor" | "trainee";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication - role is determined by email domain for security
    if (password === "tawa2024") {
      // Determine role based on email pattern (in real app, this comes from backend)
      let role: UserRole;
      let name: string;
      
      if (email.includes("admin")) {
        role = "admin";
        name = "System Administrator";
      } else if (email.includes("instructor") || email.includes("teacher")) {
        role = "instructor";
        name = "Instructor";
      } else {
        role = "trainee";
        name = "Trainee";
      }
      
      const mockUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        role,
      };
      setUser(mockUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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
