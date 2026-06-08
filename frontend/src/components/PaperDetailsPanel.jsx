export default function PaperDetailsPanel({ paper, selectedNode }) {
  const title = selectedNode?.label || paper?.title || "No paper selected";

  return (
    <aside className="details-panel">
      <h2>Paper Details</h2>

      {!paper && !selectedNode ? (
        <p className="muted-text">
          Select a paper or graph node to see details.
        </p>
      ) : (
        <>
          <h3>{title}</h3>

          <div className="detail-grid">
            <div>
              <span>Type</span>
              <strong>{selectedNode?.type || paper?.type || "Paper"}</strong>
            </div>

            <div>
              <span>Year</span>
              <strong>{selectedNode?.year || paper?.year || "N/A"}</strong>
            </div>

            <div>
              <span>Citations</span>
              <strong>
                {selectedNode?.citation_count || paper?.citation_count || 0}
              </strong>
            </div>

            <div>
              <span>References</span>
              <strong>{paper?.references_count || 0}</strong>
            </div>
          </div>

          {paper?.authors?.length > 0 && (
            <div className="detail-block">
              <h4>Authors</h4>
              <p>{paper.authors.join(", ")}</p>
            </div>
          )}

          {paper?.topics?.length > 0 && (
            <div className="detail-block">
              <h4>Topics</h4>
              <div className="topic-list small">
                {paper.topics.slice(0, 5).map((topic) => (
                  <span className="topic-chip small" key={topic}>
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {paper?.abstract && (
            <div className="detail-block">
              <h4>Abstract</h4>
              <p className="abstract-box">{paper.abstract}</p>
            </div>
          )}

          {paper?.paper_id && (
            <a
              className="openalex-link"
              href={paper.paper_id}
              target="_blank"
              rel="noreferrer"
            >
              View in OpenAlex
            </a>
          )}
        </>
      )}
    </aside>
  );
}

