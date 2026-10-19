/**
 * Archivo: HomePage.jsx
 * Propósito: Página de inicio con estética Chamba (hero con efecto máquina de escribir,
 * panel interactivo de habilidades con ordenamiento por compatibilidad, buscador,
 * pestañas de modalidad, drawer lateral de detalle y modales de postulación/reclutamiento).
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getJobs, createJob, deleteJob } from "../services/api";
import { useAuth } from "../context/AuthContext";
import JobCard from "../components/JobCard";
import JobFormModal from "../components/JobFormModal";
import SearchBar from "../components/SearchBar";
import ApplyModal from "../components/ApplyModal";
import ApplicationsModal from "../components/ApplicationsModal";
import { Loader2, ExternalLink, Users } from "lucide-react";
import {
  BASE_SKILLS,
  getJobColor,
  getJobSkills,
  getMatchScore,
} from "../utils/skills";

const HERO_ROLES = [
  "desarrollador/a",
  "analista de datos",
  "DevOps",
  "ciberseguridad",
  "full-stack",
];

export default function HomePage({ isModalOpen, setIsModalOpen, showToast }) {
  const { user, token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modales existentes del flujo de negocio
  const [selectedJobToApply, setSelectedJobToApply] = useState(null);
  const [selectedJobToViewApps, setSelectedJobToViewApps] = useState(null);

  // Drawer lateral de detalle rápido estilo Chamba
  const [drawerJob, setDrawerJob] = useState(null);

  // Filtros de búsqueda y modalidad
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedType, setSelectedType] = useState("Todos");

  // Habilidades seleccionadas por el usuario
  const [selectedSkills, setSelectedSkills] = useState(() => new Set());

  // Vacantes guardadas en localStorage
  const [savedIds, setSavedIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("chamba-saved") || "[]"));
    } catch {
      return new Set();
    }
  });

  // Efecto máquina de escribir en el Hero
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    let roleIdx = 0;
    let charIdx = 0;
    let deleting = false;
    let timerId;

    const tick = () => {
      const currentWord = HERO_ROLES[roleIdx];
      charIdx += deleting ? -1 : 1;
      setTypedText(currentWord.slice(0, charIdx));

      let delay = deleting ? 35 : 80;
      if (!deleting && charIdx === currentWord.length) {
        deleting = true;
        delay = 1400;
      } else if (deleting && charIdx === 0) {
        deleting = false;
        roleIdx = (roleIdx + 1) % HERO_ROLES.length;
        delay = 300;
      }
      timerId = setTimeout(tick, delay);
    };

    timerId = setTimeout(tick, 80);
    return () => clearTimeout(timerId);
  }, []);

  useEffect(() => {
    fetchJobs();
  }, []);

  // Cerrar el drawer con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && drawerJob) {
        setDrawerJob(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [drawerJob]);

  const notify = (msg) => {
    if (showToast) showToast(msg);
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await getJobs();
      setJobs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (newJobData) => {
    const created = await createJob(newJobData, token);
    setJobs([created, ...jobs]);
    notify("Vacante publicada con éxito");
  };

  const handleDeleteJob = async (jobId) => {
    try {
      await deleteJob(jobId, token);
      setJobs(jobs.filter((j) => j.id !== jobId));
      if (drawerJob && drawerJob.id === jobId) {
        setDrawerJob(null);
      }
      notify("Vacante eliminada");
    } catch (error) {
      alert(error.message);
    }
  };

  // Catálogo dinámico de habilidades (une BASE_SKILLS con las detectadas en las vacantes)
  const allSkills = useMemo(() => {
    const skillSet = new Set(BASE_SKILLS);
    jobs.forEach((job) => {
      getJobSkills(job).forEach((s) => skillSet.add(s));
    });
    return Array.from(skillSet).sort();
  }, [jobs]);

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) {
        next.delete(skill);
      } else {
        next.add(skill);
      }
      return next;
    });
  };

  const resetSkills = () => {
    setSelectedSkills(new Set());
  };

  const toggleSaveJob = (jobId) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      const willSave = !next.has(jobId);
      if (willSave) {
        next.add(jobId);
      } else {
        next.delete(jobId);
      }
      try {
        localStorage.setItem("chamba-saved", JSON.stringify([...next]));
      } catch {
        // Ignorar errores de almacenamiento
      }
      notify(willSave ? "Vacante guardada" : "Vacante quitada");
      return next;
    });
  };

  // Filtrado y ordenamiento por compatibilidad
  const filteredJobs = useMemo(() => {
    const filtered = jobs.filter((job) => {
      const matchesTitleOrCompany =
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLocation = job.location
        .toLowerCase()
        .includes(locationFilter.toLowerCase());

      const matchesType =
        selectedType === "Todos" || job.job_type === selectedType;

      return matchesTitleOrCompany && matchesLocation && matchesType;
    });

    if (selectedSkills.size > 0) {
      return [...filtered].sort(
        (a, b) =>
          getMatchScore(b, selectedSkills) - getMatchScore(a, selectedSkills) ||
          b.id - a.id
      );
    }

    return filtered;
  }, [jobs, searchTerm, locationFilter, selectedType, selectedSkills]);

  const drawerSkills = drawerJob ? getJobSkills(drawerJob) : [];
  const drawerScore = drawerJob ? getMatchScore(drawerJob, selectedSkills) : 0;
  const isDrawerJobOwner =
    drawerJob && user && drawerJob.recruiter_id === user.id;

  return (
    <div className="wrap">
      {/* Sección Hero estilo Chamba */}
      <section className="hero">
        <h1>
          Encuentra trabajo como <span className="typed">{typedText}</span>
        </h1>
        <p>
          Marca lo que sabes hacer y ordenamos las vacantes de tech según qué
          tanto encajas.
        </p>
        <div className="stats">
          <div>
            <b>{jobs.length > 0 ? `${jobs.length}+` : "320+"}</b>
            vacantes activas
          </div>
          <div>
            <b>
              {jobs.length > 0
                ? new Set(jobs.map((j) => j.company)).size
                : "85"}
            </b>
            empresas
          </div>
          <div>
            <b>48 h</b>
            respuesta promedio
          </div>
        </div>
      </section>

      {/* Layout de 2 columnas: Panel de habilidades + Listado */}
      <div className="layout">
        <aside className="panel">
          <h2>Tus habilidades</h2>
          <p>Elige las que dominas y mira cómo cambian los resultados.</p>
          <div className="chips">
            {allSkills.map((skill) => {
              const pressed = selectedSkills.has(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  className="chip"
                  aria-pressed={pressed}
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                </button>
              );
            })}
          </div>
          <button type="button" className="reset" onClick={resetSkills}>
            Limpiar selección
          </button>
        </aside>

        <main>
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            locationFilter={locationFilter}
            setLocationFilter={setLocationFilter}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
          />

          {!loading && filteredJobs.length > 0 && (
            <p className="count" aria-live="polite">
              {filteredJobs.length} vacante
              {filteredJobs.length > 1 ? "s" : ""}
              {selectedSkills.size > 0
                ? " ordenadas por compatibilidad"
                : ""}
            </p>
          )}

          {loading ? (
            <div className="empty flex justify-center items-center gap-2">
              <Loader2
                className="w-6 h-6 animate-spin"
                style={{ color: "var(--blue)" }}
              />
              <span>Cargando ofertas...</span>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="empty">
              No hay vacantes con esos filtros. Quita una habilidad o cambia la
              modalidad.
            </div>
          ) : (
            <div id="list">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  selectedSkills={selectedSkills}
                  isSaved={savedIds.has(job.id)}
                  onSelect={(targetJob) => setDrawerJob(targetJob)}
                  onApply={(targetJob) => setSelectedJobToApply(targetJob)}
                  onViewApplications={(targetJob) =>
                    setSelectedJobToViewApps(targetJob)
                  }
                  onDelete={handleDeleteJob}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Scrim y Drawer lateral de detalle estilo Chamba */}
      <div
        className={`scrim ${drawerJob ? "open" : ""}`}
        onClick={() => setDrawerJob(null)}
      />
      <aside
        className={`drawer ${drawerJob ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de la vacante"
        aria-hidden={!drawerJob}
      >
        {drawerJob && (
          <>
            <button
              type="button"
              className="x"
              aria-label="Cerrar"
              onClick={() => setDrawerJob(null)}
            >
              ✕
            </button>

            <div
              className="logo-sq"
              style={{ background: getJobColor(drawerJob) }}
            >
              {(drawerJob.company || "C").trim().charAt(0).toUpperCase()}
            </div>

            <h2>{drawerJob.title}</h2>
            <div className="meta">
              {drawerJob.company} · {drawerJob.location} ·{" "}
              {drawerJob.job_type || "Remoto"}
            </div>

            {drawerJob.salary && (
              <div>
                <b
                  style={{
                    font: "800 22px 'Bricolage Grotesque', sans-serif",
                  }}
                >
                  {drawerJob.salary}
                </b>{" "}
                <span className="meta">al mes</span>
              </div>
            )}

            {selectedSkills.size > 0 && (
              <div className="meta">
                Encajas <b>{drawerScore}%</b> con esta vacante.
              </div>
            )}

            <h3 style={{ fontSize: "18px" }}>Lo que necesitas</h3>
            <div className="tags">
              {drawerSkills.map((skill) => (
                <span
                  key={skill}
                  className={`tag ${selectedSkills.has(skill) ? "on" : ""}`}
                >
                  {skill}
                </span>
              ))}
            </div>

            <h3 style={{ fontSize: "18px" }}>Qué harás</h3>
            <div
              className="meta"
              style={{ whiteSpace: "pre-line", lineHeight: 1.6 }}
            >
              {drawerJob.description}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to={`/jobs/${drawerJob.id}`}
                className="meta inline-flex items-center gap-1 hover:underline"
                style={{ color: "var(--blue)", fontWeight: 700 }}
              >
                <span>Ver página completa</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              {isDrawerJobOwner && (
                <button
                  type="button"
                  onClick={() => {
                    const target = drawerJob;
                    setDrawerJob(null);
                    setSelectedJobToViewApps(target);
                  }}
                  className="meta inline-flex items-center gap-1 hover:underline"
                  style={{
                    color: "var(--mint)",
                    fontWeight: 700,
                    background: "none",
                    border: 0,
                    padding: 0,
                  }}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    Ver postulantes (
                    {drawerJob.applications ? drawerJob.applications.length : 0}
                    )
                  </span>
                </button>
              )}
            </div>

            <div className="row">
              <button
                type="button"
                className="btn ghost"
                onClick={() => toggleSaveJob(drawerJob.id)}
              >
                {savedIds.has(drawerJob.id)
                  ? "Quitar de guardadas"
                  : "Guardar"}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const target = drawerJob;
                  setDrawerJob(null);
                  setSelectedJobToApply(target);
                }}
              >
                Postularme
              </button>
            </div>
          </>
        )}
      </aside>

      {/* Modales del flujo completo (Crear Vacante, Postular con PDF, Ver Postulantes) */}
      <JobFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onJobCreated={handleCreateJob}
      />

      <ApplyModal
        job={selectedJobToApply}
        isOpen={!!selectedJobToApply}
        onClose={() => {
          setSelectedJobToApply(null);
          fetchJobs();
        }}
        onSuccess={(companyName) =>
          notify(`Postulación enviada a ${companyName}`)
        }
      />

      <ApplicationsModal
        job={selectedJobToViewApps}
        isOpen={!!selectedJobToViewApps}
        onClose={() => setSelectedJobToViewApps(null)}
      />
    </div>
  );
}