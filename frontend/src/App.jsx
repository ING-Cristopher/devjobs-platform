import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import JobDetailPage from "./pages/JobDetailPage";
import { Briefcase, Plus } from "lucide-react";

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        {/* Barra de navegación común a todas las páginas */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 cursor-pointer">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg tracking-tight">DevJobs</span>
            </Link>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Publicar Empleo
            </button>
          </div>
        </header>

        {/* Sistema de Rutas */}
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
              />
            }
          />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}