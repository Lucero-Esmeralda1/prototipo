function PaperCard({ paper, onSelect }) {
  return (
    <div className="paper-card" onClick={() => onSelect(paper)}>
      <h3>{paper.title}</h3>

      <p>
        <strong>Año:</strong> {paper.year || "No disponible"}
      </p>

      <p>
        <strong>Citas:</strong> {paper.citation_count}
      </p>

      <p>
        <strong>Autores:</strong>{" "}
        {paper.authors?.length > 0
          ? paper.authors.join(", ")
          : "No disponible"}
      </p>

      <p>
        <strong>Topics:</strong>{" "}
        {paper.topics?.length > 0
          ? paper.topics.slice(0, 3).join(", ")
          : "No disponible"}
      </p>
    </div>
  );
}

export default PaperCard;