export default function PaperCard({ paper, onSelect }) {
  const isInfluential = Number(paper.citation_count || 0) >= 500;

  return (
    <article className="paper-card" onClick={() => onSelect(paper)}>
      <div className="paper-card-top">
        <h3>{paper.title || "Untitled paper"}</h3>

        {isInfluential && (
          <span className="influential-badge">Highly Influential</span>
        )}
      </div>

      <p className="paper-meta">
        {(paper.authors || []).slice(0, 3).join(", ") || "Unknown authors"} ·{" "}
        {paper.year || "No year"}
      </p>

      <p className="paper-abstract">
        {paper.abstract
          ? paper.abstract.slice(0, 260) + "..."
          : "No abstract available."}
      </p>

      <div className="paper-footer">
        <span>{paper.citation_count || 0} citations</span>
        <span>•</span>
        <span>
          {paper.topics?.length > 0
            ? paper.topics.slice(0, 2).join(", ")
            : "No topics"}
        </span>
      </div>
    </article>
  );
}
