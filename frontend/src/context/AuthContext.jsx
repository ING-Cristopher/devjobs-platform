/**
 * Archivo: AuthContext.jsx
 * Propósito: Gestionar el estado global de autenticación y roles ('candidato', 'reclutador', 'admin')
 * en toda la aplicación React.
 */

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("devjobs_token");
    const savedUser = localStorage.getItem("devjobs_user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (authToken, userData) => {
    setToken(authToken);
    setUser(userData);
    localStorage.setItem("devjobs_token", authToken);
    localStorage.setItem("devjobs_user", JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("devjobs_token");
    localStorage.removeItem("devjobs_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isRecruiter: user?.role === "reclutador" || user?.role === "admin",
        isAdmin: user?.role === "admin",
        login,
        logout,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
