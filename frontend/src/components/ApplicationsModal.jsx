import { X, Mail, Calendar, User, MessageSquare } from "lucide-react";

export default function ApplicationsModal({ job, isOpen, onClose }) {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-xl relative max-h-[85vh] flex flex-col">
        {/* Encabezado */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Postulantes ({job.applications ? job.applications.length : 0})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Vacante: <span className="font-semibold text-blue-600">{job.title}</span> — {job.company}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de candidatos */}
        <div className="overflow-y-auto py-4 space-y-3 flex-1 pr-1">
          {!job.applications || job.applications.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <User className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">Aún no hay candidatos postulados</p>
            </div>
          ) : (
            job.applications.map((app) => (
              <div
                key={app.id}
                className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                      {app.candidate_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {app.candidate_name}
                      </h4>
                      <a
                        href={`mailto:${app.candidate_email}`}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600"
                      >
                        <Mail className="w-3 h-3" />
                        {app.candidate_email}
                      </a>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(app.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>

                {app.message && (
                  <div className="mt-3 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="whitespace-pre-line leading-relaxed">{app.message}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pie del modal */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}