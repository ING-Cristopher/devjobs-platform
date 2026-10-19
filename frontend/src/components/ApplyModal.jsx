import { useState } from "react";
import { X, Send, CheckCircle2, Upload } from "lucide-react";
import { applyToJob } from "../services/api";

export default function ApplyModal({ job, isOpen, onClose }) {
  const [formData, setFormData] = useState({
    candidate_name: "",
    candidate_email: "",
    message: "",
  });
  const [cvFile, setCvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !job) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
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
      // Usamos FormData para enviar texto y archivo binario juntos
      const data = new FormData();
      data.append("candidate_name", formData.candidate_name);
      data.append("candidate_email", formData.candidate_email);
      if (formData.message) {
        data.append("message", formData.message);
      }
      if (cvFile) {
        data.append("cv_file", cvFile);
      }

      await applyToJob(job.id, data);

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ candidate_name: "", candidate_email: "", message: "" });
        setCvFile(null);
        onClose();
      }, 2000);
    } catch (err) {
      alert(err.message || "Hubo un error al enviar tu postulación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
            <h3 className="text-xl font-bold text-slate-800">¡Postulación enviada con éxito!</h3>
            <p className="text-sm text-slate-500">
              La empresa revisará tus datos y CV en breve.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-800">
                Postularme a {job.title}
              </h2>
              <p className="text-xs text-blue-600 font-medium">{job.company}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nombre Completo *
                </label>
                <input
                  required
                  name="candidate_name"
                  value={formData.candidate_name}
                  onChange={handleChange}
                  placeholder="Ej: Ana Pérez"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  required
                  type="email"
                  name="candidate_email"
                  value={formData.candidate_email}
                  onChange={handleChange}
                  placeholder="ana@ejemplo.com"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Mensaje / Enlace de Portafolio
                </label>
                <textarea
                  rows={2}
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Escribe un breve mensaje o notas sobre tu perfil..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* CAMPO DE SUBIDA DE CV EN PDF */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Currículum Vitae (PDF opcional)
                </label>
                <div className="relative border border-slate-300 rounded-lg p-2.5 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {loading ? "Enviando..." : "Enviar Postulación"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}