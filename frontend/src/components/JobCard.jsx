import { Building2, MapPin, DollarSign, Calendar } from "lucide-react";

export default function JobCard({ job }) {
  // Formatear la fecha que viene del backend
  const dateFormatted = new Date(job.created_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-xl font-bold text-slate-800">{job.title}</h3>
          <div className="flex items-center text-slate-600 gap-1 mt-1 font-medium text-sm">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>{job.company}</span>
          </div>
        </div>
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          {dateFormatted}
        </span>
      </div>

      <div className="flex flex-wrap gap-4 my-4 text-sm text-slate-600">
        <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full">
          <MapPin className="w-4 h-4 text-slate-500" />
          <span>{job.location}</span>
        </div>
        {job.salary && (
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium">
            <DollarSign className="w-4 h-4" />
            <span>{job.salary}</span>
          </div>
        )}
      </div>

      <p className="text-slate-600 text-sm line-clamp-3 mb-5">
        {job.description}
      </p>

      <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
        Postularme
      </button>
    </div>
  );
}