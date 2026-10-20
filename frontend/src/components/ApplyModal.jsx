import { useState, useEffect } from "react";
import { Send, CheckCircle2, Upload, Check, ShieldCheck } from "lucide-react";
import { applyToJob } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function ApplyModal({ job, isOpen, onClose, onSuccess }) {
  const { user, token } = useAuth();
  const [formData, setFormData] = useState({
    candidate_name: "",
    candidate_email: "",
    message: "",
  });
  const [cvFile, setCvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        candidate_name: user.name || "",
        candidate_email: user.email || "",
        message: "",
      });
    }
  }, [user, isOpen]);

  if (!isOpen || !job) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
      ) {
        alert("Por favor selecciona un archivo PDF válido.");
        e.target.value = "";
        setCvFile(null);
        return;
      }
      setCvFile(file);
    } else {
      setCvFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append("candidate_name", formData.candidate_name);
      data.append("candidate_email", formData.candidate_email);
      if (formData.message) {
        data.append("message", formData.message);
      }
      if (cvFile) {
        data.append("cv_file", cvFile);
      }

      await applyToJob(job.id, data, token);

      if (onSuccess) onSuccess(job.company);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ candidate_name: user?.name || "", candidate_email: user?.email || "", message: "" });
        setCvFile(null);
        onClose();
      }, 1800);
    } catch (err) {
      alert(err.message || "Hubo un error al enviar tu postulación");
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
        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2
              className="w-16 h-16 mx-auto animate-bounce"
              style={{ color: "var(--mint)" }}
            />
            <h3 className="text-xl font-extrabold">
              ¡Postulación enviada con éxito!
            </h3>
            <p className="meta">
              {job.company} revisará tus datos y CV en breve.
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-extrabold">
                  Postularme a {job.title}
                </h2>
                <p
                  className="text-sm font-bold mt-1"
                  style={{ color: "var(--blue)" }}
                >
                  {job.company}
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

            {/* Banner de identidad autenticada */}
            <div
              className="p-3 mb-4 rounded-xl flex items-center justify-between text-xs"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--line)",
              }}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" style={{ color: "var(--mint)" }} />
                <span>Postulando como: <strong>{user?.name}</strong></span>
              </div>
              <span className="tag on" style={{ padding: "2px 7px", fontSize: "10px" }}>
                Verificado
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  className="block text-xs font-bold mb-1"
                  style={{ color: "var(--muted)" }}
                >
                  Nombre Completo
                </label>
                <input
                  required
                  readOnly
                  name="candidate_name"
                  value={formData.candidate_name}
                  className="chamba-input opacity-80 cursor-not-allowed"
                />
              </div>

              <div>
                <label
                  className="block text-xs font-bold mb-1"
                  style={{ color: "var(--muted)" }}
                >
                  Correo Electrónico
                </label>
                <input
                  required
                  readOnly
                  type="email"
                  name="candidate_email"
                  value={formData.candidate_email}
                  className="chamba-input opacity-80 cursor-not-allowed"
                />
              </div>

              <div>
                <label
                  className="block text-xs font-bold mb-1"
                  style={{ color: "var(--muted)" }}
                >
                  Mensaje / Enlace de Portafolio
                </label>
                <textarea
                  rows={2}
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Escribe un breve mensaje o notas sobre tu perfil..."
                  className="chamba-input"
                />
              </div>

              {/* CAMPO DE SUBIDA DE CV EN PDF */}
              <div>
                <label
                  className="block text-xs font-bold mb-1"
                  style={{ color: "var(--muted)" }}
                >
                  Currículum Vitae (PDF opcional)
                </label>
                <div
                  className="chamba-input flex items-center gap-2"
                  style={{ padding: "8px 12px" }}
                >
                  <Upload
                    className="w-4 h-4 shrink-0"
                    style={{ color: "var(--muted)" }}
                  />
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="w-full text-xs cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="btn ghost">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="btn">
                  <Send className="w-4 h-4" />
                  <span>{loading ? "Enviando..." : "Enviar postulación"}</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
