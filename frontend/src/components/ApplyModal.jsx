import { useState } from "react";
import { X, Send, CheckCircle2 } from "lucide-react";
import { applyToJob } from "../services/api";

export default function ApplyModal({ job, isOpen, onClose }) {
  const [formData, setFormData] = useState({
    candidate_name: "",
    candidate_email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !job) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await applyToJob(job.id, formData);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ candidate_name: "", candidate_email: "", message: "" });
        onClose();
      }, 2000);
    } catch (err) {
      alert("Hubo un error al enviar tu postulación");
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

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
            <h3 className="text-xl font-bold text-slate-800">¡Postulación enviada con éxito!</h3>
            <p className="text-sm text-slate-500">
              La empresa revisará tus datos en breve.
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
                  Mensaje / Enlace a CV o LinkedIn
                </label>
                <textarea
                  rows={3}
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Escribe brevemente tu experiencia o pega un enlace a tu CV..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
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