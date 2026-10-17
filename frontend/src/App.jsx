import { useEffect, useState } from "react";
import { getJobs, createJob, deleteJob } from "./services/api";
import JobCard from "./components/JobCard";
import JobFormModal from "./components/JobFormModal";
import SearchBar from "./components/SearchBar";
import ApplyModal from "./components/ApplyModal";
import ApplicationsModal from "./components/ApplicationsModal";
import { Briefcase, Plus, Loader2 } from "lucide-react";

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedJobToApply, setSelectedJobToApply] = useState(null);
  const [selectedJobToViewApps, setSelectedJobToViewApps] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

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
    const created = await createJob(newJobData);
    setJobs([created, ...jobs]);
  };

  // Manejo de eliminación en cliente
  const handleDeleteJob = async (jobId) => {
    try {
      await deleteJob(jobId);
      // Filtramos el empleo eliminado para removerlo del estado inmediatamente
      setJobs(jobs.filter((j) => j.id !== jobId));
    } catch (error) {
      alert("Hubo un error al eliminar la oferta.");
    }
  };

  const handleApplicationSuccess = () => {
    fetchJobs();
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesTitleOrCompany =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation = job.location
      .toLowerCase()
      .includes(locationFilter.toLowerCase());

    return matchesTitleOrCompany && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight">DevJobs</span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Publicar Empleo
          </button>
        </div>
      </header>

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
              Prueba cambiando los términos de búsqueda o ubicación.
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
      </main>

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
          handleApplicationSuccess();
        }}
      />

      <ApplicationsModal
        job={selectedJobToViewApps}
        isOpen={!!selectedJobToViewApps}
        onClose={() => setSelectedJobToViewApps(null)}
      />
    </div>
  );
}