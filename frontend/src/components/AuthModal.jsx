/**
 * Archivo: AuthModal.jsx
 * Propósito: Formulario modal conmutable para iniciar sesión, registrarse con política
 * de contraseña sólida (OWASP) y confirmar correo mediante código numérico de 6 dígitos.
 */

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, ShieldCheck, Mail, KeyRound } from "lucide-react";
import {
  registerUser,
  loginUser,
  verifyCode,
  resendCode,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function AuthModal({ isOpen, onClose, showToast, initialMessage = "" }) {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const [sixDigitCode, setSixDigitCode] = useState("");
  const [devCodeHint, setDevCodeHint] = useState("");
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "candidato",
  });

  useEffect(() => {
    if (initialMessage && isOpen) {
      setInfoMsg(initialMessage);
    }
  }, [initialMessage, isOpen]);

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

  const handleCodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setSixDigitCode(val);
    setError("");
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
        setSixDigitCode("");
        if (regRes?.dev_verification_code) {
          setDevCodeHint(regRes.dev_verification_code);
          setInfoMsg("Hemos enviado un código numérico de 6 dígitos a tu correo.");
        } else {
          setDevCodeHint("");
          setInfoMsg("Hemos enviado un código numérico de 6 dígitos a tu correo.");
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
      // Si la cuenta no está verificada, redirigir a la vista de código
      if (
        err.message &&
        (err.message.toLowerCase().includes("verificar") ||
          err.message.toLowerCase().includes("código") ||
          err.message.toLowerCase().includes("confirmar"))
      ) {
        setPendingVerificationEmail(formData.email);
        setInfoMsg("Tu cuenta no está verificada. Ingresa el código de 6 dígitos enviado a tu correo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCodeSubmit = async (e) => {
    e.preventDefault();
    if (sixDigitCode.length !== 6) {
      setError("Por favor ingresa los 6 dígitos numéricos del código.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await verifyCode(pendingVerificationEmail, sixDigitCode);
      setPendingVerificationEmail("");
      setSixDigitCode("");
      setDevCodeHint("");
      setIsRegister(false);
      setInfoMsg("¡Cuenta verificada con éxito! Ya puedes iniciar sesión.");
      if (showToast) showToast("Cuenta activada exitosamente");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!pendingVerificationEmail) return;
    setLoading(true);
    setError("");
    try {
      const res = await resendCode(pendingVerificationEmail);
      if (res?.dev_verification_code) {
        setDevCodeHint(res.dev_verification_code);
      }
      setInfoMsg(res.message || "Nuevo código de 6 dígitos enviado.");
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
                ? "Código de verificación"
                : isRegister
                ? "Crear una cuenta"
                : "Iniciar sesión"}
            </h2>
            <p className="meta mt-1 text-xs">
              {pendingVerificationEmail
                ? `Ingresa el código de 6 dígitos enviado a ${pendingVerificationEmail}`
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
          /* ======================================================== */
          /* PASO 2: VISTA DE CÓDIGO DE VERIFICACIÓN NUMÉRICO DE 6 DÍGITOS */
          /* ======================================================== */
          <div className="space-y-4">
            <div
              className="p-4 rounded-2xl text-sm space-y-2 text-center"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--line)",
              }}
            >
              <div className="flex justify-center items-center gap-2 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" style={{ color: "var(--blue)" }} />
                <span>Confirmación de seguridad</span>
              </div>
              <p className="meta text-xs">
                Hemos enviado un código numérico de 6 dígitos con vigencia de 15 minutos a tu correo.
              </p>
            </div>

            {/* Aviso especial para desarrollo local */}
            {devCodeHint && (
              <div
                className="p-3 rounded-xl text-xs flex items-center justify-between"
                style={{
                  background: "var(--chip)",
                  color: "var(--ink)",
                  border: "1px dashed var(--blue)",
                }}
              >
                <span>💡 Modo Local (sin SMTP):</span>
                <span className="font-extrabold tracking-widest text-sm" style={{ color: "var(--blue)" }}>
                  {devCodeHint}
                </span>
                <button
                  type="button"
                  onClick={() => setSixDigitCode(devCodeHint)}
                  className="tag on"
                  style={{ border: 0, padding: "3px 8px", fontSize: "11px" }}
                >
                  Rellenar
                </button>
              </div>
            )}

            <form onSubmit={handleVerifyCodeSubmit} className="space-y-4">
              <div>
                <label
                  className="block text-xs font-bold text-center mb-2"
                  style={{ color: "var(--muted)" }}
                >
                  CÓDIGO DE 6 DÍGITOS
                </label>
                <div className="flex justify-center">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={sixDigitCode}
                    onChange={handleCodeChange}
                    placeholder="• • • • • •"
                    className="chamba-input text-center text-2xl font-extrabold tracking-[10px]"
                    style={{
                      maxWidth: "240px",
                      height: "54px",
                      letterSpacing: "12px",
                      color: "var(--blue)",
                    }}
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || sixDigitCode.length !== 6}
                className="btn w-full font-bold"
                style={{ height: "46px" }}
              >
                {loading ? "Validando..." : "Confirmar cuenta"}
              </button>
            </form>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="btn ghost text-xs"
                style={{ padding: "8px 14px" }}
              >
                Reenviar código
              </button>

              <button
                type="button"
                onClick={() => {
                  setPendingVerificationEmail("");
                  setIsRegister(false);
                  setError("");
                  setInfoMsg("");
                }}
                className="reset"
                style={{ marginTop: 0 }}
              >
                Volver a iniciar sesión
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* PASO 1: FORMULARIO DE INICIO DE SESIÓN / REGISTRO         */
          /* ======================================================== */
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
