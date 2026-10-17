import { useState } from "react";
import { X } from "lucide-react";

export default function JobFormModal({ isOpen, onClose, onJobCreated }) {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    job_type: "Remoto",
    salary: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onJobCreated(formData);
      onClose();
      setFormData({
        title: "",
        company: "",
        location: "",
        job_type: "Remoto",
        salary: "",
        description: "",
      });
    } catch (error) {
      alert("Hubo un error al guardar el empleo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-slate-800 mb-4">Publicar un nuevo empleo</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Título del puesto *</label>
            <input
              required
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ej: Desarrollador Backend Python"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Empresa *</label>
              <input
                required
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Ej: Microsoft, TechCorp"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Ubicación *</label>
              <input
                required
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ej: Bogotá, Madrid, Global"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Modalidad *</label>
              <select
                name="job_type"
                value={formData.job_type}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Remoto">Remoto 🌐</option>
                <option value="Presencial">Presencial 🏢</option>
                <option value="Híbrido">Híbrido 🔄</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Salario (opcional)</label>
              <input
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                placeholder="Ej: $3,000 USD"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción del rol *</label>
            <textarea
              required
              rows={4}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detalla las responsabilidades, tecnologías y requisitos..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              {loading ? "Publicando..." : "Publicar Empleo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}