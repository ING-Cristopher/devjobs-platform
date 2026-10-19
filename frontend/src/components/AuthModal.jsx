/**
 * Archivo: AuthModal.jsx
 * Propósito: Formulario modal conmutable para iniciar sesión o registrarse.
 */

import { useState } from "react";
import { X, Lock, Mail, User, Briefcase, AlertCircle } from "lucide-react";
import { registerUser, loginUser } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function AuthModal({ isOpen, onClose }) {
  const { login } = useAuth();
  // Estado para alternar entre login y registro
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "candidato", // Por defecto candidato
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Limpia el error al escribir
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        // 1. Registro en la base de datos
        await registerUser(formData);
        // 2. Login automático tras registrarse
        const authData = await loginUser({
          email: formData.email,
          password: formData.password,
        });
        login(authData.access_token, authData.user);
      } else {
        // Inicio de sesión normal
        const authData = await loginUser({
          email: formData.email,
          password: formData.password,
        });
        login(authData.access_token, authData.user);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-slate-800 mb-1">
          {isRegister ? "Crear una cuenta" : "Iniciar Sesión"}
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          {isRegister
            ? "Únete para publicar vacantes o gestionar tu carrera."
            : "Ingresa tus credenciales para acceder a DevJobs."}
        </p>

        {error && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej: Laura Martínez"
                  className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                required
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                ¿Cuál es tu objetivo?
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "candidato" })}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                    formData.role === "candidato"
                      ? "border-blue-600 bg-blue-50 text-blue-700 font-bold"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Buscar Empleo
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "reclutador" })}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                    formData.role === "reclutador"
                      ? "border-blue-600 bg-blue-50 text-blue-700 font-bold"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Publicar Empleos
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {loading
              ? "Procesando..."
              : isRegister
              ? "Registrarme"
              : "Ingresar"}
          </button>
        </form>

        {/* Alternar entre login y registro */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
          {isRegister ? (
            <span>
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError("");
                }}
                className="text-blue-600 font-bold hover:underline"
              >
                Inicia sesión aquí
              </button>
            </span>
          ) : (
            <span>
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError("");
                }}
                className="text-blue-600 font-bold hover:underline"
              >
                Crea una gratis
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}