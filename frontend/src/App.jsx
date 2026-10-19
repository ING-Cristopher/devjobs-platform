/**
 * Archivo: App.jsx
 * Propósito: Componente raíz. Enruta las páginas y provee el contexto de autenticación.
 */

import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import JobDetailPage from "./pages/JobDetailPage";
import AuthModal from "./components/AuthModal";
import { Briefcase, Plus, LogIn, LogOut, User } from "lucide-react";

function NavigationBar({ onOpenCreateModal, onOpenAuthModal }) {
  const { user, isAuthenticated, isRecruiter, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Briefcase className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-lg tracking-tight">DevJobs</span>
        </Link>

        {/* Acciones de usuario y navegación */}
        <div className="flex items-center gap-3">
          {/* Botón de Publicar Empleo: Solo disponible si es Reclutador */}
          {isRecruiter && (
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Publicar Empleo
            </button>
          )}

          {isAuthenticated ? (
            /* Menú de usuario conectado */
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-blue-600">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="font-semibold leading-tight">{user.name}</div>
                  <div className="text-[10px] text-slate-400 capitalize">{user.role}</div>
                </div>
              </div>

              <button
                onClick={logout}
                title="Cerrar sesión"
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Botón para abrir modal de login/registro si es visitante */
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Acceder</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <NavigationBar
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />

          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  isModalOpen={isCreateModalOpen}
                  setIsModalOpen={setIsCreateModalOpen}
                />
              }
            />
            <Route path="/jobs/:id" element={<JobDetailPage />} />
          </Routes>

          {/* Modal Global de Autenticación */}
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}