import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface RouteInfo {
  routeId: string;
  routeName: string;
  assistantName: string;
  startMileage: string;
}

interface AuthContextType {
  user: User | null;
  routeInfo: RouteInfo | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setRouteInfo: (info: RouteInfo) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [routeInfo, setRouteInfoState] = useState<RouteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored authentication data
    const storedUser = localStorage.getItem("user");
    const storedRouteId = localStorage.getItem("routeId");
    const storedRouteName = localStorage.getItem("routeName");
    const storedAssistantName = localStorage.getItem("assistantName");
    const storedStartMileage = localStorage.getItem("startMileage");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem("user");
      }
    }

    if (storedRouteId && storedAssistantName) {
      setRouteInfoState({
        routeId: storedRouteId,
        routeName: storedRouteName || "",
        assistantName: storedAssistantName,
        startMileage: storedStartMileage || "",
      });
    }

    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const response = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error("Invalid credentials");
    }

    const { user } = await response.json();
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const logout = async () => {
    await apiRequest("/api/auth/logout", {
      method: "POST",
    });

    setUser(null);
    setRouteInfoState(null);
    localStorage.removeItem("user");
    localStorage.removeItem("routeId");
    localStorage.removeItem("routeName");
    localStorage.removeItem("assistantName");
    localStorage.removeItem("startMileage");
  };

  const setRouteInfo = (info: RouteInfo) => {
    setRouteInfoState(info);
    localStorage.setItem("routeId", info.routeId);
    localStorage.setItem("routeName", info.routeName);
    localStorage.setItem("assistantName", info.assistantName);
    localStorage.setItem("startMileage", info.startMileage);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        routeInfo,
        isLoading,
        login,
        logout,
        setRouteInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};