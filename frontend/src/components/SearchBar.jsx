import { Search, Filter } from "lucide-react";

export default function SearchBar({ query, setQuery, onSearch, loading }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="search-row">
      <button className="filter-btn" type="button">
        <Filter size={24} />
      </button>

      <div className="search-input-box">
        <Search size={22} />

        <input
          type="text"
          placeholder="Search by title, DOI, author, keywords, or year..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <button className="search-btn" onClick={onSearch} disabled={loading}>
        {loading ? "Searching..." : "Search"}
      </button>
    </div>
  );
}
