import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getJobById } from "../services/api";
import ApplyModal from "../components/ApplyModal";
import {
  ArrowLeft,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Share2,
  Check,
  Loader2,
} from "lucide-react";

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

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
    setTimeout(() => setCopied(false), 2000);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-2" />
        <span>Cargando detalle de la vacante...</span>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Oferta no encontrada</h2>
        <p className="text-slate-500 mt-2 mb-6">
          La vacante que buscas no existe o ha sido dada de baja.
        </p>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al listado
        </button>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Botón Volver */}
      <button
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a todas las vacantes
      </button>

      {/* Tarjeta principal de la vacante */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {job.title}
            </h1>
            <div className="flex items-center gap-2 text-slate-600 mt-2 font-medium">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span className="text-lg">{job.company}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleShare}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600">¡Enlace copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Compartir</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsApplyOpen(true)}
              className="flex-1 md:flex-initial bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
            >
              Postularme ahora
            </button>
          </div>
        </div>

        {/* Metadatos rápidos */}
        <div className="flex flex-wrap gap-3 py-6 border-b border-slate-100">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getBadgeStyle(job.job_type)}`}>
            {job.job_type || "Remoto"}
          </span>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full text-xs text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>{job.location}</span>
          </div>

          {job.salary && (
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full font-medium text-xs">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{job.salary}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-auto">
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
          <h2 className="text-lg font-bold text-slate-900 mb-3">Descripción de la vacante</h2>
          <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line bg-slate-50/50 p-6 rounded-xl border border-slate-100">
            {job.description}
          </div>
        </div>

        {/* Botón flotante al final */}
        <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-500">¿Cumples con el perfil?</p>
            <p className="text-sm font-semibold text-slate-800">No dejes pasar esta oportunidad</p>
          </div>
          <button
            onClick={() => setIsApplyOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
          >
            Postularme ahora
          </button>
        </div>
      </div>

      <ApplyModal
        job={job}
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
      />
    </main>
  );
}