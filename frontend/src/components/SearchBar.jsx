import { Search, MapPin } from "lucide-react";

export default function SearchBar({ searchTerm, setSearchTerm, locationFilter, setLocationFilter }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4 items-center">
      {/* Campo para buscar por puesto o empresa */}
      <div className="flex items-center gap-3 w-full border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 md:pr-4">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por puesto o empresa..."
          className="w-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Campo para filtrar por ubicación */}
      <div className="flex items-center gap-3 w-full">
        <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          type="text"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          placeholder="Filtrar por ubicación (ej. Colombia, Remoto)..."
          className="w-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>
    </div>
  );
}