function PaperDetailsPanel({ paper, selectedNode }) {
  if (!paper && !selectedNode) {
    return (
      <div className="details-panel">
        <h2>Detalles</h2>
        <p>Selecciona un paper o un nodo del grafo.</p>
      </div>
    );
  }

  return (
    <div className="details-panel">
      <h2>Detalles del paper</h2>

      {selectedNode && (
        <>
          <h3>{selectedNode.label}</h3>
          <p>
            <strong>Tipo:</strong> {selectedNode.type}
          </p>
          <p>
            <strong>Año:</strong> {selectedNode.year || "No disponible"}
          </p>
          <p>
            <strong>Citas:</strong> {selectedNode.citation_count || 0}
          </p>
        </>
      )}

      {paper && (
        <>
          <hr />

          <h3>Paper principal</h3>

          <p>
            <strong>Título:</strong> {paper.title}
          </p>

          <p>
            <strong>DOI:</strong> {paper.doi || "No disponible"}
          </p>

          <p>
            <strong>Año:</strong> {paper.year}
          </p>

          <p>
            <strong>Autores:</strong>{" "}
            {paper.authors?.length > 0
              ? paper.authors.join(", ")
              : "No disponible"}
          </p>

          <p>
            <strong>Citas:</strong> {paper.citation_count}
          </p>

          <p>
            <strong>Referencias:</strong> {paper.references_count}
          </p>

          <p>
            <strong>Abstract:</strong>
          </p>

          <p className="abstract">{paper.abstract || "No disponible"}</p>
        </>
      )}
    </div>
  );
}

export default PaperDetailsPanel;