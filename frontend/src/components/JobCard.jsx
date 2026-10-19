/**
 * Archivo: JobCard.jsx
 * Propósito: Tarjeta de vacante con diseño Chamba (logo inicial en color pastel,
 * metadatos en línea, etiquetas de habilidades con resaltado de compatibilidad,
 * barra de porcentaje de match y acciones para el reclutador dueño).
 */

import { Users, Trash2, Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { downloadApplicationsCSV } from "../services/api";
import { getJobColor, getJobSkills, getMatchScore } from "../utils/skills";

export default function JobCard({
  job,
  onSelect,
  onApply,
  onViewApplications,
  onDelete,
  selectedSkills = new Set(),
  isSaved = false,
}) {
  const { user, token } = useAuth();

  const applicantCount = job.applications ? job.applications.length : 0;
  const isOwner = user && job.recruiter_id === user.id;

  const skills = getJobSkills(job);
  const hasSelectedSkills = selectedSkills && selectedSkills.size > 0;
  const matchScore = getMatchScore(job, selectedSkills);
  const logoColor = getJobColor(job);
  const companyInitial = (job.company || "C").trim().charAt(0).toUpperCase();

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar la vacante "${job.title}"?`
    );
    if (confirmDelete && onDelete) {
      onDelete(job.id);
    }
  };

  const handleDownloadCSV = async (e) => {
    e.stopPropagation();
    try {
      await downloadApplicationsCSV(job.id, token);
    } catch (err) {
      alert(err.message || "Error al descargar el archivo CSV");
    }
  };

  const handleViewAppsClick = (e) => {
    e.stopPropagation();
    if (onViewApplications) onViewApplications(job);
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(job);
    } else if (onApply) {
      onApply(job);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className="job"
    >
      {/* Cuadrado con inicial de la empresa */}
      <div className="logo-sq" style={{ background: logoColor }}>
        {companyInitial}
      </div>

      {/* Información central */}
      <div>
        <h3>{job.title}</h3>
        <div className="meta">
          {job.company} · {job.location} · {job.job_type || "Remoto"}
          {job.salary ? ` · ${job.salary}` : ""}
        </div>

        <div className="tags">
          {skills.map((skill) => {
            const isMatched = hasSelectedSkills && selectedSkills.has(skill);
            return (
              <span key={skill} className={`tag ${isMatched ? "on" : ""}`}>
                {skill}
              </span>
            );
          })}

          {isSaved && <span className="tag">Guardada</span>}

          {/* Controles exclusivos del reclutador creador de la vacante */}
          {isOwner && (
            <>
              <button
                type="button"
                onClick={handleViewAppsClick}
                className="tag"
                style={{
                  background: "var(--blue)",
                  color: "var(--blue-ink)",
                  fontWeight: 700,
                  border: 0,
                }}
                title="Ver lista de postulantes"
              >
                <Users className="w-3 h-3" />
                <span>
                  {applicantCount} postulante{applicantCount !== 1 ? "s" : ""}
                </span>
              </button>

              {applicantCount > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="tag on"
                  style={{ border: 0 }}
                  title="Exportar postulantes a CSV"
                >
                  <Download className="w-3 h-3" />
                  <span>CSV</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDeleteClick}
                className="tag"
                style={{
                  background: "#ff8f7a",
                  color: "#0e1330",
                  fontWeight: 700,
                  border: 0,
                }}
                title="Eliminar vacante"
              >
                <Trash2 className="w-3 h-3" />
                <span>Eliminar</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Indicador de compatibilidad (Match %) */}
      <div className={`match ${hasSelectedSkills ? "" : "off"}`}>
        <b>{matchScore}%</b>
        <div className="track">
          <div className="fill" style={{ width: `${matchScore}%` }} />
        </div>
      </div>
    </div>
  );
}