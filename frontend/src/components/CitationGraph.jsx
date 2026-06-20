import { useEffect, useRef } from "react";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";

cytoscape.use(fcose);

export default function CitationGraph({ graphData, onNodeClick, t }) {
  const graphRef = useRef(null);
  const cyRef = useRef(null);

  useEffect(() => {
    if (!graphData || !graphData.nodes || !graphData.edges) return;
    if (!graphRef.current) return;

    const elements = [
      ...graphData.nodes.map((node) => ({
        data: {
          id: node.id,
          label: node.label,
          type: node.type,
          year: node.year,
          citation_count: node.citation_count,
        },
      })),

      ...graphData.edges.map((edge, index) => ({
        data: {
          id: `edge-${index}`,
          source: edge.source,
          target: edge.target,
          relationship: edge.relationship,
        },
      })),
    ];

    const cy = cytoscape({
      container: graphRef.current,
      elements,

      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            color: "#e2e8f0",
            "background-color": "#8b5cf6",
            width: 40,
            height: 40,
            "font-size": 9,
            "font-family": "system-ui, sans-serif",
            "font-weight": 500,
            "text-wrap": "wrap",
            "text-max-width": 120,
            "text-valign": "bottom",
            "text-halign": "center",
            "text-margin-y": 6,
            "border-width": 2,
            "border-color": "#a78bfa",
            "transition-property": "border-width, background-color",
            "transition-duration": 120,
          },
        },
        {
          selector: 'node[type = "main_paper"]',
          style: {
            "background-color": "#2563eb",
            "border-color": "#60a5fa",
            "border-width": 3,
            width: 88,
            height: 88,
            color: "#ffffff",
            "font-size": 11,
            "font-weight": 700,
            "text-valign": "center",
            "text-halign": "center",
            "text-margin-y": 0,
            "text-max-width": 100,
            "z-index": 10,
          },
        },
        {
          selector: 'node[type = "reference"]',
          style: {
            "background-color": "#10b981",
            "border-color": "#34d399",
          },
        },
        {
          selector: 'node[type = "citing_paper"]',
          style: {
            "background-color": "#f59e0b",
            "border-color": "#fbbf24",
          },
        },
        {
          selector: "node:active",
          style: {
            "overlay-opacity": 0,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1.4,
            "line-color": "#475569",
            "target-arrow-color": "#475569",
            "target-arrow-shape": "triangle",
            "arrow-scale": 0.8,
            "curve-style": "bezier",
            opacity: 0.5,
            "transition-property": "opacity, line-color, width",
            "transition-duration": 120,
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-width": 4,
            "border-color": "#ffffff",
            "z-index": 999,
          },
        },
        {
          selector: "node.hovered",
          style: {
            "border-width": 4,
            "z-index": 998,
          },
        },
        {
          selector: "edge.highlighted",
          style: {
            "line-color": "#93c5fd",
            "target-arrow-color": "#93c5fd",
            opacity: 1,
            width: 2.2,
          },
        },
      ],

      layout: {
        name: "preset",
        fit: false,
      },

      minZoom: 0.15,
      maxZoom: 3,
      wheelSensitivity: 0.25,
    });

    cyRef.current = cy;

    cy.on("mouseover", "node", (event) => {
      const node = event.target;
      node.addClass("hovered");
      node.connectedEdges().addClass("highlighted");
    });

    cy.on("mouseout", "node", (event) => {
      const node = event.target;
      node.removeClass("hovered");
      node.connectedEdges().removeClass("highlighted");
    });

    cy.on("tap", "node", (event) => {
      const node = event.target;
      const nativeEvent = event.originalEvent;

      cy.nodes().unselect();
      node.select();

      const nodeData = node.data();

      const openInNewTab = Boolean(
        nativeEvent && (nativeEvent.ctrlKey || nativeEvent.metaKey)
      );

      if (onNodeClick) {
        onNodeClick(nodeData, { openInNewTab });
      }
    });

    const layoutInstance = cy.layout({
      name: "fcose",
      quality: "default",
      randomize: true,
      animate: false,
      fit: false,
      nodeRepulsion: 9000,
      idealEdgeLength: 130,
      edgeElasticity: 0.45,
      nestingFactor: 0.1,
      gravity: 0.35,
      numIter: 2500,
      fixedNodeConstraint: graphData.nodes
        .filter((node) => node.type === "main_paper")
        .map((node) => ({ nodeId: node.id, position: { x: 0, y: 0 } })),
    });

    layoutInstance.run();

    const timeoutId = setTimeout(() => {
      if (!cy || cy.destroyed()) return;

      cy.resize();
      cy.fit(cy.elements(), 60);
      cy.center(cy.elements());
    }, 80);

    return () => {
      clearTimeout(timeoutId);

      if (cy && !cy.destroyed()) {
        cy.destroy();
      }
    };
  }, [graphData, onNodeClick]);

  return (
    <div className="graph-section-wrapper">
      <div className="graph-legend-outside">
        <h4>{t.graphLegend || "Legend"}</h4>

        <div className="legend-items">
          <span>
            <i className="dot blue"></i> {t.selectedPaper}
          </span>

          <span>
            <i className="dot green"></i> {t.references}
          </span>

          <span>
            <i className="dot orange"></i> {t.citingPapers}
          </span>
        </div>
      </div>

      <div className="graph-tools-outside">
        {t.graphTools ||
          "Arrastra para mover · Scroll para zoom · Clic en un nodo para explorar su grafo · Ctrl/Cmd+clic para abrir en pestaña nueva"}
      </div>

      <div className="graph-container" ref={graphRef}></div>
    </div>
  );
}