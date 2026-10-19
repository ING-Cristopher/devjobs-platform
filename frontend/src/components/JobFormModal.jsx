import { useState } from "react";
import { BASE_SKILLS } from "../utils/skills";

export default function JobFormModal({ isOpen, onClose, onJobCreated }) {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    job_type: "Remoto",
    salary: "",
    description: "",
  });
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalDescription = formData.description.trim();
      if (
        selectedSkills.length > 0 &&
        !/habilidades\s*:/i.test(finalDescription)
      ) {
        finalDescription = `${finalDescription}\n\nHabilidades: ${selectedSkills.join(", ")}`;
      }

      await onJobCreated({
        ...formData,
        description: finalDescription,
      });
      onClose();
      setFormData({
        title: "",
        company: "",
        location: "",
        job_type: "Remoto",
        salary: "",
        description: "",
      });
      setSelectedSkills([]);
    } catch (error) {
      alert(error.message || "Hubo un error al guardar el empleo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chamba-modal-backdrop" onClick={onClose}>
      <div
        className="chamba-modal max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-extrabold">Publicar vacante</h2>
          <button
            type="button"
            onClick={onClose}
            className="x"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: "var(--muted)" }}>
              Título del puesto *
            </label>
            <input
              required
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ej: Desarrollador/a Frontend"
              className="chamba-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: "var(--muted)" }}>
                Empresa *
              </label>
              <input
                required
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Ej: Banreservas Digital"
                className="chamba-input"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: "var(--muted)" }}>
                Ubicación *
              </label>
              <input
                required
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ej: Santo Domingo, Remoto"
                className="chamba-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: "var(--muted)" }}>
                Modalidad *
              </label>
              <select
                name="job_type"
                value={formData.job_type}
                onChange={handleChange}
                className="chamba-input"
              >
                <option value="Remoto">Remoto</option>
                <option value="Híbrido">Híbrido</option>
                <option value="Presencial">Presencial</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: "var(--muted)" }}>
                Salario (opcional)
              </label>
              <input
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                placeholder="Ej: RD$ 85–110 mil"
                className="chamba-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--muted)" }}>
              Habilidades clave (opcional)
            </label>
            <div className="chips">
              {BASE_SKILLS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  className="chip"
                  style={{ padding: "4px 10px", fontSize: "12px" }}
                  aria-pressed={selectedSkills.includes(skill)}
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: "var(--muted)" }}>
              Descripción del rol *
            </label>
            <textarea
              required
              rows={4}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detalla las responsabilidades, tecnologías y requisitos..."
              className="chamba-input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn ghost">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn">
              {loading ? "Publicando..." : "Publicar vacante"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}