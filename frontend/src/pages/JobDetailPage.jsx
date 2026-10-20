import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getJobById } from "../services/api";
import ApplyModal from "../components/ApplyModal";
import { getJobColor, getJobSkills } from "../utils/skills";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  Calendar,
  Share2,
  Check,
  Loader2,
} from "lucide-react";

export default function JobDetailPage({ onOpenAuthModal, showToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchJobDetail = async () => {
      try {
        setLoading(true);
        const data = await getJobById(id);
        setJob(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetail();
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    if (showToast) showToast("¡Enlace copiado al portapapeles!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      if (showToast) showToast("Debes iniciar sesión para postularte a esta vacante");
      if (onOpenAuthModal) onOpenAuthModal("Debes iniciar sesión para postularte a esta vacante");
      return;
    }
    if (user?.role === "reclutador") {
      if (showToast) showToast("Solo los candidatos pueden postularse. Tu cuenta tiene rol de reclutador.");
      return;
    }
    setIsApplyOpen(true);
  };

  if (loading) {
    return (
      <div className="wrap py-20">
        <div className="empty flex justify-center items-center gap-2">
          <Loader2
            className="w-6 h-6 animate-spin"
            style={{ color: "var(--blue)" }}
          />
          <span>Cargando detalle de la vacante...</span>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="wrap py-20">
        <div className="empty space-y-4">
          <h2 className="text-2xl font-extrabold" style={{ color: "var(--ink)" }}>
            Oferta no encontrada
          </h2>
          <p>La vacante que buscas no existe o ha sido dada de baja.</p>
          <button onClick={() => navigate("/")} className="btn ghost">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al listado</span>
          </button>
        </div>
      </div>
    );
  }

  const skills = getJobSkills(job);
  const logoColor = getJobColor(job);
  const companyInitial = (job.company || "C").trim().charAt(0).toUpperCase();

  return (
    <main className="wrap py-6 pb-16">
      <button
        onClick={() => navigate("/")}
        className="btn ghost mb-6"
        style={{ padding: "8px 16px", fontSize: "14px" }}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a todas las vacantes</span>
      </button>

      <div
        className="panel"
        style={{ position: "static", padding: "32px", borderRadius: "24px" }}
      >
        <div
          className="flex flex-col md:flex-row justify-between items-start gap-6 pb-6"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          <div className="flex items-start gap-4">
            <div
              className="logo-sq"
              style={{
                background: logoColor,
                width: "60px",
                height: "60px",
                fontSize: "26px",
              }}
            >
              {companyInitial}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold">{job.title}</h1>
              <div className="meta mt-2" style={{ fontSize: "16px" }}>
                {job.company} · {job.location} · {job.job_type || "Remoto"}
              </div>
              {job.salary && (
                <div className="mt-2">
                  <b
                    style={{
                      font: "800 22px 'Bricolage Grotesque', sans-serif",
                      color: "var(--mint)",
                    }}
                  >
                    {job.salary}
                  </b>{" "}
                  <span className="meta">al mes</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={handleShare} className="btn ghost flex-1 md:flex-initial">
              {copied ? (
                <>
                  <Check className="w-4 h-4" style={{ color: "var(--mint)" }} />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Compartir</span>
                </>
              )}
            </button>

            <button
              onClick={handleApplyClick}
              className="btn flex-1 md:flex-initial"
            >
              Postularme ahora
            </button>
          </div>
        </div>

        {/* Habilidades y fecha */}
        <div
          className="flex flex-wrap items-center justify-between gap-4 py-5"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          <div className="tags" style={{ marginTop: 0 }}>
            {skills.map((skill) => (
              <span key={skill} className="tag on">
                {skill}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs meta">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              Publicado el{" "}
              {new Date(job.created_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Descripción completa */}
        <div className="py-6">
          <h2 className="text-xl font-extrabold mb-3">
            Descripción de la vacante
          </h2>
          <div
            className="p-6 rounded-2xl whitespace-pre-line leading-relaxed"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
            }}
          >
            {job.description}
          </div>
        </div>

        {/* Pie de tarjeta */}
        <div
          className="pt-6 flex flex-wrap justify-between items-center gap-4"
          style={{ borderTop: "1px solid var(--line)" }}
        >
          <div>
            <p className="meta" style={{ margin: 0 }}>
              ¿Cumples con el perfil?
            </p>
            <p className="font-bold">No dejes pasar esta oportunidad</p>
          </div>
          <button onClick={handleApplyClick} className="btn">
            Postularme ahora
          </button>
        </div>
      </div>

      <ApplyModal
        job={job}
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        onSuccess={(companyName) => {
          if (showToast) showToast(`Postulación enviada a ${companyName}`);
        }}
      />
    </main>
  );
}
