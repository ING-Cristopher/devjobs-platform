/**
 * Archivo: JobCard.jsx
 * Propósito: Tarjeta de presentación de una vacante. Adapta los botones según
 * el rol del usuario autenticado (reclutador vs candidato) y permite exportar postulantes a CSV.
 */

import { Link } from "react-router-dom";
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Users, 
  Trash2, 
  Download 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { downloadApplicationsCSV } from "../services/api";

export default function JobCard({ job, onApply, onViewApplications, onDelete }) {
  const { user, token } = useAuth();

  const dateFormatted = new Date(job.created_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });

  const applicantCount = job.applications ? job.applications.length : 0;
  // Comprobamos si el usuario actual es el dueño de esta vacante
  const isOwner = user && job.recruiter_id === user.id;

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar la vacante "${job.title}"?`
    );
    if (confirmDelete) {
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

  const getBadgeStyle = (type) => {
    switch (type) {
      case "Remoto":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Híbrido":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Presencial":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow flex flex-col justify-between relative group">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="pr-4">
            <Link
              to={`/jobs/${job.id}`}
              className="text-xl font-bold text-slate-800 hover:text-blue-600 transition-colors block"
            >
              {job.title}
            </Link>
            <div className="flex items-center text-slate-600 gap-1 mt-1 font-medium text-sm">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>{job.company}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              {dateFormatted}
            </span>
            {/* Solo el reclutador dueño puede ver el botón de borrar */}
            {isOwner && (
              <button
                onClick={handleDeleteClick}
                title="Eliminar vacante"
                className="text-slate-300 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 my-4 text-sm items-center">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle(job.job_type)}`}>
            {job.job_type || "Remoto"}
          </span>

          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full text-xs text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>{job.location}</span>
          </div>

          {job.salary && (
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium text-xs">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{job.salary}</span>
            </div>
          )}

          {/* Opciones exclusivas del reclutador dueño */}
          {isOwner && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onViewApplications(job)}
                className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium text-xs transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{applicantCount} postulante{applicantCount !== 1 ? "s" : ""}</span>
              </button>

              {/* Botón para exportar CSV si hay candidatos */}
              {applicantCount > 0 && (
                <button
                  onClick={handleDownloadCSV}
                  title="Exportar postulantes a CSV"
                  className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium text-xs transition-colors cursor-pointer border border-emerald-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-slate-600 text-sm line-clamp-3 mb-5 whitespace-pre-line">
          {job.description}
        </p>
      </div>

      <div className="flex gap-2">
        <Link
          to={`/jobs/${job.id}`}
          className="flex-1 text-center border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2 px-3 rounded-lg transition-colors text-sm"
        >
          Ver detalles
        </Link>
        <button
          onClick={() => onApply(job)}
          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm cursor-pointer"
        >
          Postularme
        </button>
      </div>
    </div>
  );
}