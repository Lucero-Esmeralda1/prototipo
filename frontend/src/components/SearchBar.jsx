import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Search, Filter, Loader2 } from "lucide-react";

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

export default function SearchBar({
  query,
  setQuery,
  onSearch,
  onSelectSuggestion,
  loading,
  onToggleFilters,
  apiUrl,
  t,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debounceTimer = useRef(null);
  const requestRef = useRef(null);
  const wrapperRef = useRef(null);

  // Cierra el dropdown al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce: espera a que el usuario deje de escribir antes de pedir sugerencias
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    const trimmed = query.trim();

    if (trimmed.length < MIN_CHARS) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoadingSuggestions(false);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(trimmed);
    }, DEBOUNCE_MS);

    return () => clearTimeout(debounceTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const fetchSuggestions = async (text) => {
    if (!apiUrl) return;

    // Cancela la petición anterior si todavía estaba en curso
    if (requestRef.current) requestRef.current.abort();

    const controller = new AbortController();
    requestRef.current = controller;

    setLoadingSuggestions(true);

    try {
      const response = await axios.get(`${apiUrl}/api/suggestions`, {
        params: { query: text, limit: 6 },
        signal: controller.signal,
      });

      setSuggestions(response.data?.suggestions || []);
      setShowSuggestions(true);
      setActiveIndex(-1);
    } catch (error) {
      if (axios.isCancel(error) || error.name === "CanceledError") return;
      console.error("Error obteniendo sugerencias:", error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handlePickSuggestion = (suggestion) => {
    setQuery(suggestion.title);
    setShowSuggestions(false);
    setSuggestions([]);

    if (onSelectSuggestion) {
      onSelectSuggestion(suggestion.title);
    } else {
      onSearch();
    }
  };

  const handleKeyDown = (e) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
        return;
      }

      if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        handlePickSuggestion(suggestions[activeIndex]);
        return;
      }

      if (e.key === "Escape") {
        setShowSuggestions(false);
        return;
      }
    }

    if (e.key === "Enter") {
      setShowSuggestions(false);
      onSearch();
    }
  };

  return (
    <div className="search-row" ref={wrapperRef}>
      <button
        className="filter-btn"
        type="button"
        onClick={onToggleFilters}
        title={t.filtersButton}
      >
        <Filter size={24} />
      </button>

      <div className="search-input-box search-input-box-wrapper">
        <Search size={22} />
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          autoComplete="off"
        />

        {loadingSuggestions && (
          <Loader2 size={18} className="suggestions-spinner" />
        )}

        {showSuggestions && suggestions.length > 0 && (
          <ul className="suggestions-dropdown">
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.paper_id || `${suggestion.title}-${index}`}
                className={
                  index === activeIndex
                    ? "suggestion-item suggestion-item-active"
                    : "suggestion-item"
                }
                onMouseDown={() => handlePickSuggestion(suggestion)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <span className="suggestion-title">{suggestion.title}</span>

                <span className="suggestion-meta">
                  {suggestion.hint && <span>{suggestion.hint}</span>}
                  {suggestion.year && <span>{suggestion.year}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button className="search-btn" onClick={() => { setShowSuggestions(false); onSearch(); }} disabled={loading}>
        {loading ? t.searchingButton : t.searchButton}
      </button>
    </div>
  );
}