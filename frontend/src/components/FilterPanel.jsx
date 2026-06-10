import { X } from "lucide-react";

export default function FilterPanel({ filters, onChange, onApply, onReset, onClose, t }) {
  return (
    <aside className="filter-panel">
      <div className="filter-panel-inner">
        <div className="filter-header">
          <h3>{t.filtersButton}</h3>

          <button className="filter-close-btn" type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="filter-group">
          <label>{t.filterYearRange || "Año de publicación"}</label>
          <div className="filter-years">
            <input
              type="number"
              placeholder="2014"
              value={filters.yearFrom}
              onChange={(e) => onChange("yearFrom", e.target.value)}
            />
            <span>{t.of}</span>
            <input
              type="number"
              placeholder={String(new Date().getFullYear())}
              value={filters.yearTo}
              onChange={(e) => onChange("yearTo", e.target.value)}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>{t.filterAuthor || "Autor"}</label>
          <input
            type="text"
            placeholder="Ej. Smith"
            value={filters.author}
            onChange={(e) => onChange("author", e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>{t.filterArea || "Área"}</label>
          <select
            value={filters.area}
            onChange={(e) => onChange("area", e.target.value)}
          >
            <option value="all">{t.filterAllAreas || "Todas las áreas"}</option>
            <option value="machine learning">Machine Learning</option>
            <option value="artificial intelligence">Artificial Intelligence</option>
            <option value="computer vision">Computer Vision</option>
            <option value="natural language processing">Natural Language Processing</option>
            <option value="data science">Data Science</option>
          </select>
        </div>

        <div className="filter-group">
          <label>{t.filterMinCitations || "Citas mínimas"}</label>
          <input
            type="number"
            min="0"
            value={filters.minCitations}
            onChange={(e) => onChange("minCitations", e.target.value)}
          />
        </div>

        <button className="apply-filters-btn" type="button" onClick={onApply}>
          {t.filterApply || "Aplicar filtros"}
        </button>

        <button className="reset-filters-btn" type="button" onClick={onReset}>
          {t.filterReset || "Restablecer"}
        </button>
      </div>
    </aside>
  );
}
