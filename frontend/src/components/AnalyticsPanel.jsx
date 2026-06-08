import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function AnalyticsPanel({ papers, graphData, selectedPaper }) {
  const graphNodes = graphData?.nodes || [];

  const mainPaper = graphData?.main_paper || selectedPaper || null;

  const sourcePapers = graphNodes.length > 0 ? graphNodes : papers;

  const referencePapers = graphNodes.filter(
    (paper) => paper.type === "reference"
  );

  const citingPapers = graphNodes.filter(
    (paper) => paper.type === "citing_paper"
  );

  const totalPapers = sourcePapers.length || 0;

  const totalCitations = Number(mainPaper?.citation_count || 0);

  const influentialPapers = sourcePapers.filter(
    (paper) => Number(paper.citation_count || 0) >= 500
  ).length;

  const publicationsByYear = Object.values(
    sourcePapers.reduce((acc, paper) => {
      const year = paper.year || "Unknown";

      if (!acc[year]) {
        acc[year] = {
          year,
          total: 0,
          selectedPaper: 0,
          references: 0,
          citingPapers: 0,
          searchResults: 0,
        };
      }

      acc[year].total += 1;

      if (paper.type === "main_paper") {
        acc[year].selectedPaper += 1;
      } else if (paper.type === "reference") {
        acc[year].references += 1;
      } else if (paper.type === "citing_paper") {
        acc[year].citingPapers += 1;
      } else {
        acc[year].searchResults += 1;
      }

      return acc;
    }, {})
  )
    .filter((item) => item.year !== "Unknown")
    .sort((a, b) => Number(a.year) - Number(b.year));

  const topPapers = [...sourcePapers]
    .sort((a, b) => Number(b.citation_count || 0) - Number(a.citation_count || 0))
    .slice(0, 8);

  return (
    <div className="analytics-content">
      <div className="analytics-header">
        <h2>Timeline & Analytics</h2>
        <p>
          Indicadores calculados a partir del paper seleccionado y su red de
          citaciones.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total Papers</span>
          <strong>{totalPapers}</strong>
        </div>

        <div className="stat-card">
          <span>Total Citations</span>
          <strong>{totalCitations.toLocaleString()}</strong>
        </div>

        <div className="stat-card">
          <span>Citing Papers</span>
          <strong>{citingPapers.length}</strong>
        </div>

        <div className="stat-card">
          <span>Influential Papers</span>
          <strong>{influentialPapers}</strong>
        </div>
      </div>

      <div className="chart-card">
        <h3>Publications by Year</h3>
        <p className="chart-description">
          Muestra la distribución temporal del paper principal, sus referencias y
          los papers que lo citan.
        </p>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={publicationsByYear}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="year" stroke="#93c5fd" />
            <YAxis stroke="#93c5fd" />
            <Tooltip />

            <Bar
              dataKey="selectedPaper"
              name="Selected paper"
              stackId="a"
              fill="#2563eb"
            />

            <Bar
              dataKey="references"
              name="References"
              stackId="a"
              fill="#10b981"
            />

            <Bar
              dataKey="citingPapers"
              name="Citing papers"
              stackId="a"
              fill="#f59e0b"
            />

            <Bar
              dataKey="searchResults"
              name="Search results"
              stackId="a"
              fill="#8b5cf6"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3>Network Composition</h3>

        <div className="composition-grid">
          <div>
            <span>References</span>
            <strong>{referencePapers.length}</strong>
          </div>

          <div>
            <span>Citing Papers</span>
            <strong>{citingPapers.length}</strong>
          </div>

          <div>
            <span>Main Paper Citations</span>
            <strong>{totalCitations.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      <div className="chart-card">
        <h3>Most Influential Papers in Network</h3>

        <div className="ranking-list">
          {topPapers.map((paper, index) => (
            <div className="ranking-item" key={paper.id || paper.paper_id}>
              <span className="rank-number">{index + 1}</span>

              <div>
                <strong>{paper.label || paper.title}</strong>
                <p>
                  {paper.year || "N/A"} · {paper.citation_count || 0} citations
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

