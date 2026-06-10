export default function PaperDetailsPanel({ paper, selectedNode, t }) {
  const currentPaper = selectedNode || paper;

  if (!currentPaper) {
    return (
      <aside className="details-panel">
        <h2>{t.paperDetails || "Paper Details"}</h2>
        <p className="muted-text">{t.selectNodeDetails || "Select a node to see details."}</p>
      </aside>
    );
  }

  const title = currentPaper.title || currentPaper.label || t.noTitle;
  const authors = Array.isArray(currentPaper.authors)
    ? currentPaper.authors.join(", ")
    : currentPaper.authors || t.unknownAuthors || "Unknown authors";
  const topics = Array.isArray(currentPaper.topics)
    ? currentPaper.topics.join(", ")
    : currentPaper.topics || t.noTopics || "No topics";

  const openAlexUrl = currentPaper.paper_id || currentPaper.id;

  return (
    <aside className="details-panel">
      <h2>{t.paperDetails || "Paper Details"}</h2>
      <h3>{title}</h3>

      <p className="muted-text">{authors}</p>

      <div className="detail-grid">
        <div>
          <span>{t.year || "Year"}</span>
          <strong>{currentPaper.year || t.noYear}</strong>
        </div>

        <div>
          <span>{t.citations}</span>
          <strong>{Number(currentPaper.citation_count || 0).toLocaleString()}</strong>
        </div>

        <div>
          <span>{t.type || "Type"}</span>
          <strong>{currentPaper.type || "N/A"}</strong>
        </div>

        <div>
          <span>DOI</span>
          <strong>{currentPaper.doi || "N/A"}</strong>
        </div>
      </div>

      <div className="detail-block">
        <h4>Abstract</h4>
        <div className="abstract-box">
          <p>{currentPaper.abstract || t.noAbstract || "No abstract available."}</p>
        </div>
      </div>

      <div className="detail-block">
        <h4>{t.topics || "Topics"}</h4>
        <p>{topics}</p>
      </div>

      {openAlexUrl && String(openAlexUrl).startsWith("http") && (
        <a className="openalex-link" href={openAlexUrl} target="_blank" rel="noreferrer">
          {t.openInOpenAlex || "Open in OpenAlex"}
        </a>
      )}
    </aside>
  );
}
