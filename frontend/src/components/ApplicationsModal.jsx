import {
  Mail,
  Calendar,
  User,
  MessageSquare,
  FileText,
  ExternalLink,
} from "lucide-react";

export default function ApplicationsModal({ job, isOpen, onClose }) {
  if (!isOpen || !job) return null;

  // URL base para construir el enlace directo al archivo estático en el backend
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  return (
    <div className="chamba-modal-backdrop" onClick={onClose}>
      <div
        className="chamba-modal max-w-xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div
          className="flex justify-between items-start pb-4"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          <div>
            <h2 className="text-xl font-extrabold">
              Postulantes ({job.applications ? job.applications.length : 0})
            </h2>
            <p className="meta mt-1">
              Vacante:{" "}
              <span style={{ color: "var(--blue)", fontWeight: 700 }}>
                {job.title}
              </span>{" "}
              — {job.company}
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

        {/* Lista de candidatos */}
        <div className="overflow-y-auto py-4 space-y-3 flex-1 pr-1">
          {!job.applications || job.applications.length === 0 ? (
            <div className="empty">
              <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">
                Aún no hay candidatos postulados
              </p>
            </div>
          ) : (
            job.applications.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-2xl"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--line)",
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div
                      className="logo-sq"
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "10px",
                        fontSize: "16px",
                        background: "var(--sun)",
                      }}
                    >
                      {app.candidate_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{app.candidate_name}</h4>
                      <a
                        href={`mailto:${app.candidate_email}`}
                        className="flex items-center gap-1 text-xs hover:underline"
                        style={{ color: "var(--muted)" }}
                      >
                        <Mail className="w-3 h-3" />
                        {app.candidate_email}
                      </a>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-xs meta">
                    <Calendar className="w-3 h-3" />
                    {new Date(app.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>

                {app.message && (
                  <div
                    className="mt-3 text-xs p-3 rounded-xl flex items-start gap-2"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <MessageSquare
                      className="w-3.5 h-3.5 shrink-0 mt-0.5"
                      style={{ color: "var(--muted)" }}
                    />
                    <p className="whitespace-pre-line leading-relaxed">
                      {app.message}
                    </p>
                  </div>
                )}

                {/* VISUALIZACIÓN / DESCARGA DEL CV EN PDF */}
                <div
                  className="mt-3 pt-2.5 flex items-center justify-between"
                  style={{ borderTop: "1px solid var(--line)" }}
                >
                  {app.cv_url ? (
                    <a
                      href={`${API_URL}${app.cv_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tag on"
                      style={{
                        textDecoration: "none",
                        padding: "5px 12px",
                      }}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Ver CV Adjunto (PDF)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs italic meta">
                      Sin CV en PDF adjunto
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pie del modal */}
        <div
          className="pt-3 flex justify-end"
          style={{ borderTop: "1px solid var(--line)" }}
        >
          <button type="button" onClick={onClose} className="btn ghost">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}