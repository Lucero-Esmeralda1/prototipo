import { Search, Filter } from "lucide-react";

export default function SearchBar({
  query,
  setQuery,
  onSearch,
  loading,
  onToggleFilters,
  t,
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") onSearch();
  };

  return (
    <div className="search-row">
      <button
        className="filter-btn"
        type="button"
        onClick={onToggleFilters}
        title={t.filtersButton}
      >
        <Filter size={24} />
      </button>

      <div className="search-input-box">
        <Search size={22} />
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <button className="search-btn" onClick={onSearch} disabled={loading}>
        {loading ? t.searchingButton : t.searchButton}
      </button>
    </div>
  );
}
