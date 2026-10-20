/**
 * Archivo: AuthModal.jsx
 * Propósito: Formulario modal conmutable para iniciar sesión, registrarse con política
 * de contraseña sólida (OWASP) y confirmar correo electrónico por token.
 */

import { useState } from "react";
import { AlertCircle, CheckCircle2, MailCheck } from "lucide-react";
import {
  registerUser,
  loginUser,
  verifyEmailToken,
  resendVerificationEmail,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function AuthModal({ isOpen, onClose, showToast }) {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "candidato",
  });

  if (!isOpen) return null;

  const pwd = formData.password;
  const owaspChecks = [
    { label: "Mínimo 8 caracteres", valid: pwd.length >= 8 },
    { label: "Una mayúscula (A-Z)", valid: /[A-Z]/.test(pwd) },
    { label: "Una minúscula (a-z)", valid: /[a-z]/.test(pwd) },
    { label: "Un número (0-9)", valid: /\d/.test(pwd) },
    { label: "Un carácter especial (!@#$...)", valid: /[^A-Za-z0-9\s]/.test(pwd) },
  ];
  const isPasswordStrong = owaspChecks.every((c) => c.valid);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setInfoMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMsg("");

    if (isRegister && !isPasswordStrong) {
      setError(
        "La contraseña debe cumplir todos los requisitos de seguridad OWASP."
      );
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        const regRes = await registerUser(formData);
        setPendingVerificationEmail(formData.email);
        if (regRes?.dev_verification_token) {
          setManualToken(regRes.dev_verification_token);
          setInfoMsg(
            "Modo Local detectado (sin servidor SMTP): Tu cuenta ha sido creada y tu token está listo para activar al instante."
          );
        } else {
          setInfoMsg(
            "Hemos enviado un enlace de verificación a tu correo. Confirma tu cuenta para poder iniciar sesión."
          );
        }
      } else {
        const authData = await loginUser({
          email: formData.email,
          password: formData.password,
        });
        login(authData.access_token, authData.user);
        if (showToast) showToast(`¡Bienvenido/a, ${authData.user.name}!`);
        onClose();
      }
    } catch (err) {
      setError(err.message);
      if (
        err.message &&
        err.message.toLowerCase().includes("confirmar tu correo")
      ) {
        setPendingVerificationEmail(formData.email);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async (e) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    setLoading(true);
    setError("");
    try {
      await verifyEmailToken(manualToken.trim());
      setPendingVerificationEmail("");
      setManualToken("");
      setIsRegister(false);
      setInfoMsg("¡Correo verificado con éxito! Ya puedes iniciar sesión.");
      if (showToast) showToast("Correo confirmado con éxito");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!pendingVerificationEmail) return;
    setLoading(true);
    setError("");
    try {
      const res = await resendVerificationEmail(pendingVerificationEmail);
      if (res?.dev_verification_token) {
        setManualToken(res.dev_verification_token);
      }
      setInfoMsg(res.message || "Enlace de verificación reenviado.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chamba-modal-backdrop" onClick={onClose}>
      <div
        className="chamba-modal max-w-md max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-extrabold">
              {pendingVerificationEmail
                ? "Verifica tu correo"
                : isRegister
                ? "Crear una cuenta"
                : "Iniciar sesión"}
            </h2>
            <p className="meta mt-1">
              {pendingVerificationEmail
                ? `Cuenta pendiente de activación: ${pendingVerificationEmail}`
                : isRegister
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

        {infoMsg && (
          <div
            className="mb-4 text-xs p-3 rounded-xl flex items-center gap-2"
            style={{
              background: "var(--mint)",
              color: "#06231d",
              fontWeight: 700,
            }}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {pendingVerificationEmail ? (
          <div className="space-y-4">
            <div
              className="p-4 rounded-2xl text-sm space-y-2"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--line)",
              }}
            >
              <div className="flex items-center gap-2 font-bold">
                <MailCheck
                  className="w-5 h-5"
                  style={{ color: "var(--blue)" }}
                />
                <span>Revisa tu bandeja de entrada</span>
              </div>
              <p className="meta text-xs">
                Haz clic en el enlace enviado a{" "}
                <b>{pendingVerificationEmail}</b> (en desarrollo local también
                aparece impreso en la consola del servidor FastAPI).
              </p>
            </div>

            {manualToken && (
              <button
                type="button"
                onClick={handleVerifyToken}
                disabled={loading}
                className="btn w-full"
                style={{
                  background: "var(--mint)",
                  color: "#06231d",
                  fontWeight: 800,
                  fontSize: "14px",
                }}
              >
                ⚡ Activar cuenta al instante (Modo Local)
              </button>
            )}

            <form onSubmit={handleVerifyToken} className="space-y-2">
              <label
                className="block text-xs font-bold"
                style={{ color: "var(--muted)" }}
              >
                ¿Tienes el token de verificación? Pégalo aquí:
              </label>
              <div className="flex gap-2">
                <input
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Pegar token de verificación..."
                  className="chamba-input"
                />
                <button type="submit" disabled={loading} className="btn">
                  Verificar
                </button>
              </div>
            </form>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={loading}
                className="btn ghost text-xs"
                style={{ padding: "8px 14px" }}
              >
                Reenviar correo
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingVerificationEmail("");
                  setIsRegister(false);
                  setError("");
                }}
                className="reset"
                style={{ marginTop: 0 }}
              >
                Volver a iniciar sesión
              </button>
            </div>
          </div>
        ) : (
          <>
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

              {/* Indicador interactivo de requisitos OWASP durante el registro */}
              {isRegister && (
                <div
                  className="p-3 rounded-xl space-y-1"
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <div className="text-[11px] font-bold meta">
                    Requisitos de seguridad (OWASP):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1">
                    {owaspChecks.map((item) => (
                      <div
                        key={item.label}
                        className="text-[11px] flex items-center gap-1.5"
                        style={{
                          color: item.valid ? "var(--mint)" : "var(--muted)",
                          fontWeight: item.valid ? 700 : 400,
                        }}
                      >
                        <span>{item.valid ? "✓" : "○"}</span>
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                      setInfoMsg("");
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
                      setInfoMsg("");
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
          </>
        )}
      </div>
    </div>
  );
}
