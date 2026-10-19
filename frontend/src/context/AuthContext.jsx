/**
 * Archivo: AuthContext.jsx
 * Propósito: Gestionar el estado global de autenticación en toda la aplicación React.
 * Persistencia: Guarda el token JWT y los datos del usuario en localStorage para que
 * la sesión no se pierda al recargar la página.
 */

import { createContext, useContext, useState, useEffect } from "react";

// Creamos el contexto
const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Estado para el usuario autenticado (null si es visitante)
  const [user, setUser] = useState(null);
  // Estado para el token JWT
  const [token, setToken] = useState(null);
  // Estado de carga inicial mientras comprobamos el almacenamiento local
  const [loading, setLoading] = useState(true);

  // Al cargar la app por primera vez, leemos si ya había una sesión guardada
  useEffect(() => {
    const savedToken = localStorage.getItem("devjobs_token");
    const savedUser = localStorage.getItem("devjobs_user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  /**
   * Guarda las credenciales tras un inicio de sesión o registro exitoso.
   */
  const login = (authToken, userData) => {
    setToken(authToken);
    setUser(userData);
    localStorage.setItem("devjobs_token", authToken);
    localStorage.setItem("devjobs_user", JSON.stringify(userData));
  };

  /**
   * Elimina la sesión y limpia el almacenamiento del navegador.
   */
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
        isRecruiter: user?.role === "reclutador",
        login,
        logout,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para acceder fácilmente a la sesión en cualquier componente
export function useAuth() {
  return useContext(AuthContext);
}