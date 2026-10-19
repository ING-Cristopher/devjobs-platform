/**
 * Archivo: App.jsx
 * Propósito: Componente raíz. Enruta las páginas, gestiona el tema claro/oscuro
 * con estética Chamba y provee el contexto de autenticación.
 */

import { useState, useRef } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import JobDetailPage from "./pages/JobDetailPage";
import AuthModal from "./components/AuthModal";
import { LogIn, LogOut } from "lucide-react";

function NavigationBar({ onOpenCreateModal, onOpenAuthModal, showToast }) {
  const { user, isAuthenticated, isRecruiter, logout } = useAuth();

  const toggleTheme = () => {
    const root = document.documentElement;
    const isDark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = isDark ? "light" : "dark";
  };

  const handlePostVacancy = () => {
    if (!isAuthenticated) {
      showToast("Inicia sesión como reclutador para publicar vacantes");
      onOpenAuthModal();
      return;
    }
    if (!isRecruiter) {
      showToast("Tu cuenta es de candidato. Usa una cuenta de reclutador para publicar.");
      return;
    }
    onOpenCreateModal();
  };

  return (
    <div className="wrap">
      <header className="chamba-header">
        {/* Logo Chamba */}
        <Link to="/" className="logo">
          chamba<i></i>
        </Link>

        {/* Navegación y acciones */}
        <nav className="chamba-nav">
          <button
            className="btn ghost"
            onClick={toggleTheme}
            aria-label="Cambiar tema"
          >
            Tema
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span
                className="chip"
                style={{ cursor: "default", fontWeight: 700 }}
                title={`Rol: ${user.role}`}
              >
                {user.name} · <span className="capitalize">{user.role}</span>
              </span>
              <button
                onClick={() => {
                  logout();
                  showToast("Sesión cerrada");
                }}
                title="Cerrar sesión"
                className="btn ghost"
                style={{ padding: "10px 14px" }}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuthModal} className="btn ghost">
              <LogIn className="w-4 h-4" />
              <span>Acceder</span>
            </button>
          )}

          <button className="btn" onClick={handlePostVacancy}>
            Publicar vacante
          </button>
        </nav>
      </header>
    </div>
  );
}

export default function App() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 2400);
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen">
          <NavigationBar
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            showToast={showToast}
          />

          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  isModalOpen={isCreateModalOpen}
                  setIsModalOpen={setIsCreateModalOpen}
                  showToast={showToast}
                />
              }
            />
            <Route
              path="/jobs/:id"
              element={<JobDetailPage showToast={showToast} />}
            />
          </Routes>

          {/* Modal Global de Autenticación */}
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
          />

          {/* Toast Global estilo Chamba */}
          <div
            className={`toast ${toastVisible ? "show" : ""}`}
            role="status"
            aria-live="polite"
          >
            {toastMsg}
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}