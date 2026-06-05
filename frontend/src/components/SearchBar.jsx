function SearchBar({ query, setQuery, onSearch, loading }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Buscar papers, autores o temas..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <button onClick={onSearch} disabled={loading}>
        {loading ? "Buscando..." : "Buscar"}
      </button>
    </div>
  );
}

export default SearchBar;