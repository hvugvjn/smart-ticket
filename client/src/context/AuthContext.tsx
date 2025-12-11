/**
 * AuthContext.tsx
 * Modifications:
 * - Created new file for authentication state management
 * - Provides isAuthenticated, currentUser, loginWithOtpFlow, logout
 * - Manages pending booking state for resuming after login
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { api } from "@/lib/api";

interface User {
  id: number;
  phoneNumber: string;
}

interface PendingBooking {
  showId: number;
  seatIds: number[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  token: string | null;
  pendingBooking: PendingBooking | null;
  setPendingBooking: (booking: PendingBooking | null) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  showOtpModal: boolean;
  setShowOtpModal: (show: boolean) => void;
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  });
  const [pendingBooking, setPendingBooking] = useState<PendingBooking | null>(() => {
    const pending = localStorage.getItem("pendingBooking");
    return pending ? JSON.parse(pending) : null;
  });
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("+15551234599");

  const isAuthenticated = !!token && !!currentUser;

  const login = (newToken: string, user: User) => {
    setToken(newToken);
    setCurrentUser(user);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(user));
    setShowOtpModal(false);
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("pendingBooking");
    setPendingBooking(null);
  };

  useEffect(() => {
    if (pendingBooking) {
      localStorage.setItem("pendingBooking", JSON.stringify(pendingBooking));
    } else {
      localStorage.removeItem("pendingBooking");
    }
  }, [pendingBooking]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        token,
        pendingBooking,
        setPendingBooking,
        login,
        logout,
        showOtpModal,
        setShowOtpModal,
        phoneNumber,
        setPhoneNumber,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
