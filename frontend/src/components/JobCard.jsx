import { Building2, MapPin, DollarSign, Calendar, Users, Trash2, Globe2 } from "lucide-react";

export default function JobCard({ job, onApply, onViewApplications, onDelete }) {
  const dateFormatted = new Date(job.created_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });

  const applicantCount = job.applications ? job.applications.length : 0;

  const handleDeleteClick = () => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar la oferta "${job.title}"? También se eliminarán sus postulaciones.`
    );
    if (confirmDelete) {
      onDelete(job.id);
    }
  };

  // Estilo visual del badge según la modalidad
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
            <h3 className="text-xl font-bold text-slate-800">{job.title}</h3>
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
            <button
              onClick={handleDeleteClick}
              title="Eliminar vacante"
              className="text-slate-300 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 my-4 text-sm">
          {/* Badge de Modalidad */}
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

          <button
            onClick={() => onViewApplications(job)}
            className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium text-xs transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{applicantCount} postulante{applicantCount !== 1 ? "s" : ""}</span>
          </button>
        </div>

        <p className="text-slate-600 text-sm line-clamp-3 mb-5 whitespace-pre-line">
          {job.description}
        </p>
      </div>

      <button
        onClick={() => onApply(job)}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm cursor-pointer"
      >
        Postularme
      </button>
    </div>
  );
}