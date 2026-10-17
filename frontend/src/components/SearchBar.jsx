import { Search, MapPin } from "lucide-react";

export default function SearchBar({
  searchTerm,
  setSearchTerm,
  locationFilter,
  setLocationFilter,
  selectedType,
  setSelectedType,
}) {
  const jobTypes = ["Todos", "Remoto", "Híbrido", "Presencial"];

  return (
    <div className="space-y-4 mb-8">
      {/* Campos de texto */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
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

        <div className="flex items-center gap-3 w-full">
          <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            placeholder="Filtrar por ciudad o país..."
            className="w-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Botones de Modalidad (Pills) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-slate-500 mr-1">Modalidad:</span>
        {jobTypes.map((type) => {
          const isActive = selectedType === type;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {type}
            </button>
          );
        })}
      </div>
    </div>
  );
}