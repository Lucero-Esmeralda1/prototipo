import { Search, Filter } from "lucide-react";

export default function SearchBar({ query, setQuery, onSearch, loading }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="search-row">
      <button className="filter-btn">
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

// function SearchBar({ query, setQuery, onSearch, loading }) {
//   return (
//     <div className="search-bar">
//       <input
//         type="text"
//         placeholder="Buscar papers, autores o temas..."
//         value={query}
//         onChange={(e) => setQuery(e.target.value)}
//       />

//       <button onClick={onSearch} disabled={loading}>
//         {loading ? "Buscando..." : "Buscar"}
//       </button>
//     </div>
//   );
// }

// export default SearchBar;