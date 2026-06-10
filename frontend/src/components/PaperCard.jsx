export default function PaperCard({ paper, onSelect, t }) {
  const isInfluential = Number(paper.citation_count || 0) >= 500;

  return (
    <article className="paper-card" onClick={() => onSelect(paper)}>
      <div className="paper-card-top">
        <h3>{paper.title || t.noTitle}</h3>

        {isInfluential && (
          <span className="influential-badge">
            {t.highlyInfluential || "Highly Influential"}
          </span>
        )}
      </div>

      <p className="paper-meta">
        {(paper.authors || []).slice(0, 3).join(", ") ||
          t.unknownAuthors ||
          "Unknown authors"} · {paper.year || t.noYear}
      </p>

      <p className="paper-abstract">
        {paper.abstract
          ? paper.abstract.slice(0, 260) + "..."
          : t.noAbstract || "No abstract available."}
      </p>

      <div className="paper-footer">
        <span>
          {Number(paper.citation_count || 0).toLocaleString()} {t.citations}
        </span>
        <span>•</span>
        <span>
          {paper.topics?.length > 0
            ? paper.topics.slice(0, 2).join(", ")
            : t.noTopics || "No topics"}
        </span>
      </div>
    </article>
  );
}
