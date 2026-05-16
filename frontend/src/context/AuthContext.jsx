import { createContext, useContext, useState } from "react";

// Create the Auth Context
const AuthContext = createContext();

// AuthProvider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom Hook for Using Auth Context
export function useAuth() {
  return useContext(AuthContext);
}
