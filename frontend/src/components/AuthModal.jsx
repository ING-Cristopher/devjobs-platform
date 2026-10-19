/**
 * Archivo: AuthModal.jsx
 * Propósito: Formulario modal conmutable para iniciar sesión o registrarse con estética Chamba.
 */

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { registerUser, loginUser } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function AuthModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "candidato",
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        await registerUser(formData);
        const authData = await loginUser({
          email: formData.email,
          password: formData.password,
        });
        login(authData.access_token, authData.user);
      } else {
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
    <div className="chamba-modal-backdrop" onClick={onClose}>
      <div
        className="chamba-modal max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-extrabold">
              {isRegister ? "Crear una cuenta" : "Iniciar sesión"}
            </h2>
            <p className="meta mt-1">
              {isRegister
                ? "Únete a Chamba para publicar vacantes o postularte."
                : "Ingresa tus credenciales para acceder a Chamba."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="x"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {error && (
          <div
            className="mb-4 text-xs p-3 rounded-xl flex items-center gap-2"
            style={{
              background: "#ff8f7a",
              color: "#0e1330",
              fontWeight: 700,
            }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegister && (
            <div>
              <label
                className="block text-xs font-bold mb-1"
                style={{ color: "var(--muted)" }}
              >
                Nombre Completo
              </label>
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Laura Martínez"
                className="chamba-input"
              />
            </div>
          )}

          <div>
            <label
              className="block text-xs font-bold mb-1"
              style={{ color: "var(--muted)" }}
            >
              Correo Electrónico
            </label>
            <input
              required
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              className="chamba-input"
            />
          </div>

          <div>
            <label
              className="block text-xs font-bold mb-1"
              style={{ color: "var(--muted)" }}
            >
              Contraseña
            </label>
            <input
              required
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="chamba-input"
            />
          </div>

          {isRegister && (
            <div>
              <label
                className="block text-xs font-bold mb-1.5"
                style={{ color: "var(--muted)" }}
              >
                ¿Cuál es tu objetivo?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={formData.role === "candidato"}
                  onClick={() =>
                    setFormData({ ...formData, role: "candidato" })
                  }
                  className="chip text-center"
                >
                  Buscar Empleo
                </button>
                <button
                  type="button"
                  aria-pressed={formData.role === "reclutador"}
                  onClick={() =>
                    setFormData({ ...formData, role: "reclutador" })
                  }
                  className="chip text-center"
                >
                  Publicar Vacantes
                </button>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button type="submit" disabled={loading} className="btn w-full">
              {loading
                ? "Procesando..."
                : isRegister
                ? "Registrarme"
                : "Ingresar"}
            </button>
          </div>
        </form>

        <div
          className="mt-4 pt-3 text-center text-xs meta"
          style={{ borderTop: "1px solid var(--line)" }}
        >
          {isRegister ? (
            <span>
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError("");
                }}
                style={{
                  color: "var(--blue)",
                  fontWeight: 700,
                  background: "none",
                  border: 0,
                  textDecoration: "underline",
                }}
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
                style={{
                  color: "var(--blue)",
                  fontWeight: 700,
                  background: "none",
                  border: 0,
                  textDecoration: "underline",
                }}
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