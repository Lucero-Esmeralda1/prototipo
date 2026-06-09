import { X } from "lucide-react";

export default function FilterPanel({
  filters,
  onChange,
  onApply,
  onReset,
  onClose,
}) {
  return (
    <aside className="filter-panel">
      <div className="filter-panel-inner">
        <div className="filter-header">
          <h3>Filters</h3>

          <button className="filter-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="filter-group">
          <label>Publication Year</label>

          <div className="filter-years">
            <input
              type="number"
              value={filters.yearFrom}
              onChange={(e) => onChange("yearFrom", e.target.value)}
            />

            <span>to</span>

            <input
              type="number"
              value={filters.yearTo}
              onChange={(e) => onChange("yearTo", e.target.value)}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Author</label>

          <input
            type="text"
            placeholder="Search by author name"
            value={filters.author}
            onChange={(e) => onChange("author", e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Research Area</label>

          <select
            value={filters.area}
            onChange={(e) => onChange("area", e.target.value)}
          >
            <option value="all">All areas</option>
            <option value="machine learning">Machine Learning</option>
            <option value="natural language processing">
              Natural Language Processing
            </option>
            <option value="computer vision">Computer Vision</option>
            <option value="knowledge graph">Knowledge Graph</option>
            <option value="citation network">Citation Network</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Min. Citations</label>

          <input
            type="number"
            min="0"
            value={filters.minCitations}
            onChange={(e) => onChange("minCitations", e.target.value)}
          />
        </div>

        <button className="apply-filters-btn" onClick={onApply}>
          Apply Filters
        </button>

        <button className="reset-filters-btn" onClick={onReset}>
          Reset Filters
        </button>
      </div>
    </aside>
  );
}