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
    <div className="bar">
      <input
        className="search"
        type="search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Busca por cargo o empresa"
        aria-label="Buscar vacantes"
      />
      {typeof setLocationFilter === "function" && (
        <input
          className="search"
          style={{ flex: "0 1 180px" }}
          type="search"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          placeholder="Ciudad o país"
          aria-label="Filtrar por ubicación"
        />
      )}
      <div className="tabs" role="tablist">
        {jobTypes.map((type) => (
          <button
            key={type}
            type="button"
            className="tab"
            role="tab"
            aria-selected={selectedType === type}
            onClick={() => setSelectedType(type)}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
}