import { useEffect, useRef } from "react";
import cytoscape from "cytoscape";

export default function CitationGraph({ graphData, onNodeClick }) {
  const graphRef = useRef(null);

  useEffect(() => {
    if (!graphData || !graphData.nodes || !graphData.edges) return;
    if (!graphRef.current) return;

    const mainNodes = graphData.nodes.filter(
      (node) => node.type === "main_paper"
    );

    const referenceNodes = graphData.nodes.filter(
      (node) => node.type === "reference"
    );

    const citingNodes = graphData.nodes.filter(
      (node) => node.type === "citing_paper"
    );

    const positions = {};

    const mainNode = mainNodes[0];

    if (mainNode) {
      positions[mainNode.id] = { x: 0, y: 0 };
    }

    const placeVerticalSide = (nodes, side) => {
      const gapY = 120;
      const startY = -((nodes.length - 1) * gapY) / 2;

      nodes.forEach((node, index) => {
        positions[node.id] = {
          x: side * 520,
          y: startY + index * gapY,
        };
      });
    };

    placeVerticalSide(referenceNodes, -1);
    placeVerticalSide(citingNodes, 1);

    const realElements = [
      ...graphData.nodes.map((node) => ({
        data: {
          id: node.id,
          label: node.label,
          type: node.type,
          year: node.year,
          citation_count: node.citation_count,
        },
        position: positions[node.id] || { x: 0, y: 0 },
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

    /*
      Nodos invisibles para forzar el campo visual completo.
      No representan papers reales.
    */
    const viewportHelpers = [
      {
        data: { id: "__left_bound", type: "viewport_helper" },
        position: { x: -760, y: 0 },
        selectable: false,
        grabbable: false,
      },
      {
        data: { id: "__right_bound", type: "viewport_helper" },
        position: { x: 760, y: 0 },
        selectable: false,
        grabbable: false,
      },
      {
        data: { id: "__top_bound", type: "viewport_helper" },
        position: { x: 0, y: -620 },
        selectable: false,
        grabbable: false,
      },
      {
        data: { id: "__bottom_bound", type: "viewport_helper" },
        position: { x: 0, y: 620 },
        selectable: false,
        grabbable: false,
      },
    ];

    const cy = cytoscape({
      container: graphRef.current,
      elements: [...realElements, ...viewportHelpers],

      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            color: "#ffffff",
            "background-color": "#8b5cf6",
            width: 46,
            height: 46,
            "font-size": 8,
            "font-weight": "bold",
            "text-wrap": "wrap",
            "text-max-width": 125,
            "text-valign": "bottom",
            "text-halign": "center",
            "text-margin-y": 8,
            "border-width": 2,
            "border-color": "#a78bfa",
          },
        },
        {
          selector: 'node[type = "main_paper"]',
          style: {
            "background-color": "#2563eb",
            "border-color": "#60a5fa",
            width: 100,
            height: 100,
            "font-size": 10,
            "font-weight": "bold",
            "text-valign": "center",
            "text-halign": "center",
            "text-margin-y": 0,
            "text-max-width": 115,
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
          selector: 'node[type = "viewport_helper"]',
          style: {
            width: 1,
            height: 1,
            opacity: 0,
            label: "",
            "background-opacity": 0,
            "border-opacity": 0,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1.8,
            "line-color": "#64748b",
            "target-arrow-color": "#64748b",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            opacity: 0.75,
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
      ],

      layout: {
        name: "preset",
        fit: false,
      },

      minZoom: 0.2,
      maxZoom: 2.5,
    });

    cy.on("tap", "node", (event) => {
      const node = event.target;

      if (node.data("type") === "viewport_helper") return;

      cy.nodes().unselect();
      node.select();

      onNodeClick(node.data());
    });

    const timeoutId = setTimeout(() => {
      if (!cy || cy.destroyed()) return;

      cy.resize();

      const visibleArea = cy.elements();
      cy.fit(visibleArea, 90);
      cy.center(visibleArea);
    }, 150);

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
        <h4>Legend</h4>

        <div className="legend-items">
          <span>
            <i className="dot blue"></i> Selected Paper
          </span>

          <span>
            <i className="dot green"></i> References
          </span>

          <span>
            <i className="dot orange"></i> Citing Papers
          </span>
        </div>
      </div>

      <div className="graph-tools-outside">
        Arrastra para mover · Scroll para zoom · Clic en un nodo para ver detalles
      </div>

      <div className="graph-container" ref={graphRef}></div>
    </div>
  );
}