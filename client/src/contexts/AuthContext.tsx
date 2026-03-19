import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { authApi, type User } from "../lib/api-client";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authApi.signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
    }
  };

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      // We'll use getSecurityInfo or health as a way to check if current session cookie is valid
      // But actually, we need an endpoint that returns the current user.
      // Looking at auth.yaml, we don't have a direct /api/auth/me. 
      // Let's use getSecurityInfo for now as it requires cookieAuth.
      const response = await authApi.getSecurityInfo();
      if (response.success) {
        // If we had a /me endpoint, we'd set the user here. 
        // For now, let's assume if this succeeds, we are authenticated.
        // We'll set a placeholder user if we don't have user info from this call.
        // In a real app, you'd want the user object.
        // Let's check the signin response format again.
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
