/**
 * Archivo: HomePage.jsx
 * Propósito: Página de inicio con buscador, filtros y catálogo de vacantes.
 */

import { useEffect, useState } from "react";
import { getJobs, createJob, deleteJob } from "../services/api";
import { useAuth } from "../context/AuthContext";
import JobCard from "../components/JobCard";
import JobFormModal from "../components/JobFormModal";
import SearchBar from "../components/SearchBar";
import ApplyModal from "../components/ApplyModal";
import ApplicationsModal from "../components/ApplicationsModal";
import { Loader2, Briefcase } from "lucide-react";

export default function HomePage({ isModalOpen, setIsModalOpen }) {
  const { token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedJobToApply, setSelectedJobToApply] = useState(null);
  const [selectedJobToViewApps, setSelectedJobToViewApps] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedType, setSelectedType] = useState("Todos");

  useEffect(() => {
    fetchJobs();
  }, []);

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
    // Enviamos el token del reclutador
    const created = await createJob(newJobData, token);
    setJobs([created, ...jobs]);
  };

  const handleDeleteJob = async (jobId) => {
    try {
      // Enviamos el token para autenticar el borrado
      await deleteJob(jobId, token);
      setJobs(jobs.filter((j) => j.id !== jobId));
    } catch (error) {
      alert(error.message);
    }
  };

  const filteredJobs = jobs.filter((job) => {
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

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Encuentra tu próximo empleo tech
        </h1>
        <p className="text-slate-500 mt-2">
          Explora ofertas disponibles o publica vacantes para tu equipo.
        </p>
      </div>

      <SearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        locationFilter={locationFilter}
        setLocationFilter={setLocationFilter}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
      />

      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-2" />
          <span>Cargando ofertas...</span>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">No se encontraron ofertas</h3>
          <p className="text-slate-500 text-sm mt-1">
            Prueba cambiando la modalidad o los términos de búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onApply={(targetJob) => setSelectedJobToApply(targetJob)}
              onViewApplications={(targetJob) => setSelectedJobToViewApps(targetJob)}
              onDelete={handleDeleteJob}
            />
          ))}
        </div>
      )}

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
      />

      <ApplicationsModal
        job={selectedJobToViewApps}
        isOpen={!!selectedJobToViewApps}
        onClose={() => setSelectedJobToViewApps(null)}
      />
    </main>
  );
}