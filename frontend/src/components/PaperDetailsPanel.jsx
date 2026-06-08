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


// function PaperDetailsPanel({ paper, selectedNode }) {
//   if (!paper && !selectedNode) {
//     return (
//       <div className="details-panel">
//         <h2>Detalles</h2>
//         <p>Selecciona un paper o un nodo del grafo.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="details-panel">
//       <h2>Detalles del paper</h2>

//       {selectedNode && (
//         <>
//           <h3>{selectedNode.label}</h3>
//           <p>
//             <strong>Tipo:</strong> {selectedNode.type}
//           </p>
//           <p>
//             <strong>Año:</strong> {selectedNode.year || "No disponible"}
//           </p>
//           <p>
//             <strong>Citas:</strong> {selectedNode.citation_count || 0}
//           </p>
//         </>
//       )}

//       {paper && (
//         <>
//           <hr />

//           <h3>Paper principal</h3>

//           <p>
//             <strong>Título:</strong> {paper.title}
//           </p>

//           <p>
//             <strong>DOI:</strong> {paper.doi || "No disponible"}
//           </p>

//           <p>
//             <strong>Año:</strong> {paper.year}
//           </p>

//           <p>
//             <strong>Autores:</strong>{" "}
//             {paper.authors?.length > 0
//               ? paper.authors.join(", ")
//               : "No disponible"}
//           </p>

//           <p>
//             <strong>Citas:</strong> {paper.citation_count}
//           </p>

//           <p>
//             <strong>Referencias:</strong> {paper.references_count}
//           </p>

//           <p>
//             <strong>Abstract:</strong>
//           </p>

//           <p className="abstract">{paper.abstract || "No disponible"}</p>
//         </>
//       )}
//     </div>
//   );
// }

// export default PaperDetailsPanel;