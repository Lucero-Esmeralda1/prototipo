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


// import { useEffect, useRef } from "react";
// import cytoscape from "cytoscape";

// export default function CitationGraph({ graphData, onNodeClick }) {
//   const graphRef = useRef(null);

//   useEffect(() => {
//     if (!graphData || !graphData.nodes || !graphData.edges) return;

//     const mainNodes = graphData.nodes.filter(
//       (node) => node.type === "main_paper"
//     );

//     const referenceNodes = graphData.nodes.filter(
//       (node) => node.type === "reference"
//     );

//     const citingNodes = graphData.nodes.filter(
//       (node) => node.type === "citing_paper"
//     );

//     const positions = {};

//     const mainNode = mainNodes[0];

//     if (mainNode) {
//       positions[mainNode.id] = { x: 0, y: 0 };
//     }

//     const placeVerticalSide = (nodes, side) => {
//       const gapY = 115;
//       const startY = -((nodes.length - 1) * gapY) / 2;

//       nodes.forEach((node, index) => {
//         positions[node.id] = {
//           x: side * 520,
//           y: startY + index * gapY,
//         };
//       });
//     };

//     placeVerticalSide(referenceNodes, -1);
//     placeVerticalSide(citingNodes, 1);

//     const realElements = [
//       ...graphData.nodes.map((node) => ({
//         data: {
//           id: node.id,
//           label: node.label,
//           type: node.type,
//           year: node.year,
//           citation_count: node.citation_count,
//         },
//         position: positions[node.id] || { x: 0, y: 0 },
//       })),

//       ...graphData.edges.map((edge, index) => ({
//         data: {
//           id: `edge-${index}`,
//           source: edge.source,
//           target: edge.target,
//           relationship: edge.relationship,
//         },
//       })),
//     ];

//     /*
//       Estos nodos son invisibles.
//       Solo sirven para ampliar el campo de visión del grafo.
//       Así Cytoscape no centra todo desde la mitad hacia la derecha.
//     */
//     const viewportHelpers = [
//       {
//         data: { id: "__left_bound", type: "viewport_helper" },
//         position: { x: -650, y: 0 },
//       },
//       {
//         data: { id: "__right_bound", type: "viewport_helper" },
//         position: { x: 650, y: 0 },
//       },
//       {
//         data: { id: "__top_bound", type: "viewport_helper" },
//         position: { x: 0, y: -500 },
//       },
//       {
//         data: { id: "__bottom_bound", type: "viewport_helper" },
//         position: { x: 0, y: 500 },
//       },
//     ];

//     const cy = cytoscape({
//       container: graphRef.current,
//       elements: [...realElements, ...viewportHelpers],

//       style: [
//         {
//           selector: "node",
//           style: {
//             label: "data(label)",
//             color: "#ffffff",
//             "background-color": "#8b5cf6",
//             width: 46,
//             height: 46,
//             "font-size": 8,
//             "font-weight": "700",
//             "text-wrap": "wrap",
//             "text-max-width": 125,
//             "text-valign": "bottom",
//             "text-halign": "center",
//             "text-margin-y": 8,
//             "border-width": 2,
//             "border-color": "#a78bfa",
//           },
//         },
//         {
//           selector: 'node[type = "main_paper"]',
//           style: {
//             "background-color": "#2563eb",
//             "border-color": "#60a5fa",
//             width: 95,
//             height: 95,
//             "font-size": 10,
//             "text-valign": "center",
//             "text-halign": "center",
//             "text-margin-y": 0,
//             "text-max-width": 115,
//           },
//         },
//         {
//           selector: 'node[type = "reference"]',
//           style: {
//             "background-color": "#10b981",
//             "border-color": "#34d399",
//           },
//         },
//         {
//           selector: 'node[type = "citing_paper"]',
//           style: {
//             "background-color": "#f59e0b",
//             "border-color": "#fbbf24",
//           },
//         },
//         {
//           selector: 'node[type = "viewport_helper"]',
//           style: {
//             width: 1,
//             height: 1,
//             opacity: 0,
//             label: "",
//             "background-opacity": 0,
//             "border-opacity": 0,
//           },
//         },
//         {
//           selector: "edge",
//           style: {
//             width: 1.8,
//             "line-color": "#64748b",
//             "target-arrow-color": "#64748b",
//             "target-arrow-shape": "triangle",
//             "curve-style": "bezier",
//             opacity: 0.75,
//           },
//         },
//         {
//           selector: "node:selected",
//           style: {
//             "border-width": 4,
//             "border-color": "#ffffff",
//             "z-index": 999,
//           },
//         },
//       ],

//       layout: {
//         name: "preset",
//         fit: false,
//       },

//       wheelSensitivity: 0.18,
//       minZoom: 0.2,
//       maxZoom: 2.5,
//     });

//     cy.on("tap", "node", (event) => {
//       const node = event.target;

//       if (node.data("type") === "viewport_helper") return;

//       cy.nodes().unselect();
//       node.select();

//       onNodeClick(node.data());
//     });

//     setTimeout(() => {
//       cy.resize();

//       // Fit considerando también los nodos invisibles de límite
//       cy.fit(cy.elements(), 80);
//       cy.center(cy.elements());
//     }, 150);

//     return () => cy.destroy();
//   }, [graphData, onNodeClick]);

//   return (
//     <div className="graph-section-wrapper">
//       <div className="graph-legend-outside">
//         <h4>Legend</h4>

//         <div className="legend-items">
//           <span>
//             <i className="dot blue"></i> Selected Paper
//           </span>

//           <span>
//             <i className="dot green"></i> References
//           </span>

//           <span>
//             <i className="dot orange"></i> Citing Papers
//           </span>
//         </div>
//       </div>

//       <div className="graph-tools-outside">
//         Arrastra para mover · Scroll para zoom · Clic en un nodo para ver detalles
//       </div>

//       <div className="graph-container" ref={graphRef}></div>
//     </div>
//   );
// }





// import { useEffect, useRef } from "react";
// import cytoscape from "cytoscape";

// export default function CitationGraph({ graphData, onNodeClick }) {
//   const graphRef = useRef(null);

//   useEffect(() => {
//     if (!graphData || !graphData.nodes || !graphData.edges) return;

//     const mainNodes = graphData.nodes.filter(
//       (node) => node.type === "main_paper"
//     );

//     const referenceNodes = graphData.nodes.filter(
//       (node) => node.type === "reference"
//     );

//     const citingNodes = graphData.nodes.filter(
//       (node) => node.type === "citing_paper"
//     );

//     const positions = {};

//     mainNodes.forEach((node) => {
//       positions[node.id] = { x: 0, y: 0 };
//     });

//     const placeSide = (nodes, side) => {
//       nodes.forEach((node, index) => {
//         const gapY = 110;
//         const startY = -((nodes.length - 1) * gapY) / 2;

//         positions[node.id] = {
//           x: side * 380,
//           y: startY + index * gapY,
//         };
//       });
//     };

//     placeSide(referenceNodes, -1);
//     placeSide(citingNodes, 1);

//     const elements = [
//       ...graphData.nodes.map((node) => ({
//         data: {
//           id: node.id,
//           label: node.label,
//           type: node.type,
//           year: node.year,
//           citation_count: node.citation_count,
//         },
//         position: positions[node.id],
//       })),

//       ...graphData.edges.map((edge, index) => ({
//         data: {
//           id: `edge-${index}`,
//           source: edge.source,
//           target: edge.target,
//           relationship: edge.relationship,
//         },
//       })),
//     ];

//     const cy = cytoscape({
//       container: graphRef.current,
//       elements,

//       style: [
//         {
//           selector: "node",
//           style: {
//             label: "data(label)",
//             color: "#ffffff",
//             "background-color": "#8b5cf6",
//             width: 42,
//             height: 42,
//             "font-size": 8,
//             "font-weight": "600",
//             "text-wrap": "wrap",
//             "text-max-width": 130,
//             "text-valign": "bottom",
//             "text-halign": "center",
//             "border-width": 2,
//             "border-color": "#a78bfa",
//           },
//         },
//         {
//           selector: 'node[type = "main_paper"]',
//           style: {
//             "background-color": "#2563eb",
//             "border-color": "#60a5fa",
//             width: 90,
//             height: 90,
//             "font-size": 10,
//             "text-valign": "center",
//             "text-halign": "center",
//           },
//         },
//         {
//           selector: 'node[type = "reference"]',
//           style: {
//             "background-color": "#10b981",
//             "border-color": "#34d399",
//           },
//         },
//         {
//           selector: 'node[type = "citing_paper"]',
//           style: {
//             "background-color": "#f59e0b",
//             "border-color": "#fbbf24",
//           },
//         },
//         {
//           selector: "edge",
//           style: {
//             width: 1.8,
//             "line-color": "#64748b",
//             "target-arrow-color": "#64748b",
//             "target-arrow-shape": "triangle",
//             "curve-style": "bezier",
//             opacity: 0.75,
//           },
//         },
//         {
//           selector: "node:selected",
//           style: {
//             "border-width": 4,
//             "border-color": "#ffffff",
//           },
//         },
//       ],

//       layout: {
//         name: "preset",
//         fit: true,
//         padding: 60,
//       },

//       wheelSensitivity: 0.18,
//       minZoom: 0.3,
//       maxZoom: 2.2,
//     });

//     cy.on("tap", "node", (event) => {
//       const node = event.target;
//       cy.nodes().unselect();
//       node.select();
//       onNodeClick(node.data());
//     });

//     return () => cy.destroy();
//   }, [graphData, onNodeClick]);

//   return (
//     <div className="graph-section-wrapper">
//       <div className="graph-legend-outside">
//         <h4>Legend</h4>
//         <div className="legend-items">
//           <span><i className="dot blue"></i> Selected Paper</span>
//           <span><i className="dot green"></i> References</span>
//           <span><i className="dot orange"></i> Citing Papers</span>
//         </div>
//       </div>

//       <div className="graph-tools-outside">
//         Arrastra para mover · Scroll para zoom · Clic en un nodo para ver detalles
//       </div>

//       <div className="graph-container" ref={graphRef}></div>
//     </div>
//   );
// }






// import { useEffect, useRef } from "react";
// import cytoscape from "cytoscape";

// export default function CitationGraph({ graphData, onNodeClick }) {
//   const graphRef = useRef(null);

//   useEffect(() => {
//     if (!graphData || !graphData.nodes || !graphData.edges) return;

//     const mainNodes = graphData.nodes.filter(
//       (node) => node.type === "main_paper"
//     );

//     const referenceNodes = graphData.nodes.filter(
//       (node) => node.type === "reference"
//     );

//     const citingNodes = graphData.nodes.filter(
//       (node) => node.type === "citing_paper"
//     );

//     const otherNodes = graphData.nodes.filter(
//       (node) =>
//         node.type !== "main_paper" &&
//         node.type !== "reference" &&
//         node.type !== "citing_paper"
//     );

//     const positions = {};

//     mainNodes.forEach((node) => {
//       positions[node.id] = { x: 0, y: 0 };
//     });

//     const placeSide = (nodes, side) => {
//       const maxPerRing = 36;

//       nodes.forEach((node, index) => {
//         const ring = Math.floor(index / maxPerRing);
//         const indexInRing = index % maxPerRing;
//         const itemsInRing = Math.min(maxPerRing, nodes.length - ring * maxPerRing);

//         const angle =
//           itemsInRing === 1
//             ? 0
//             : -Math.PI / 2 + (indexInRing / (itemsInRing - 1)) * Math.PI;

//         const radius = 360 + ring * 230;

//         positions[node.id] = {
//           x: side * radius * Math.cos(angle),
//           y: radius * Math.sin(angle),
//         };
//       });
//     };

//     placeSide(referenceNodes, -1);
//     placeSide(citingNodes, 1);

//     otherNodes.forEach((node, index) => {
//       const angle = (index / Math.max(otherNodes.length, 1)) * 2 * Math.PI;
//       const radius = 700;

//       positions[node.id] = {
//         x: radius * Math.cos(angle),
//         y: radius * Math.sin(angle),
//       };
//     });

//     const elements = [
//       ...graphData.nodes.map((node) => ({
//         data: {
//           id: node.id,
//           label: node.label,
//           type: node.type,
//           year: node.year,
//           citation_count: node.citation_count,
//         },
//         position: positions[node.id],
//       })),

//       ...graphData.edges.map((edge, index) => ({
//         data: {
//           id: `edge-${index}`,
//           source: edge.source,
//           target: edge.target,
//           relationship: edge.relationship,
//         },
//       })),
//     ];

//     const cy = cytoscape({
//       container: graphRef.current,
//       elements,

//       style: [
//         {
//           selector: "node",
//           style: {
//             label: "",
//             color: "#ffffff",
//             "background-color": "#8b5cf6",
//             width: 26,
//             height: 26,
//             "font-size": 8,
//             "font-weight": "600",
//             "text-wrap": "wrap",
//             "text-max-width": 150,
//             "text-valign": "bottom",
//             "text-halign": "center",
//             "border-width": 2,
//             "border-color": "#a78bfa",
//           },
//         },
//         {
//           selector: 'node[type = "main_paper"]',
//           style: {
//             label: "data(label)",
//             "background-color": "#2563eb",
//             "border-color": "#60a5fa",
//             width: 90,
//             height: 90,
//             "font-size": 10,
//             "text-valign": "center",
//             "text-halign": "center",
//           },
//         },
//         {
//           selector: 'node[type = "reference"]',
//           style: {
//             "background-color": "#10b981",
//             "border-color": "#34d399",
//           },
//         },
//         {
//           selector: 'node[type = "citing_paper"]',
//           style: {
//             "background-color": "#f59e0b",
//             "border-color": "#fbbf24",
//           },
//         },
//         {
//           selector: "edge",
//           style: {
//             width: 1.3,
//             "line-color": "#475569",
//             "target-arrow-color": "#64748b",
//             "target-arrow-shape": "triangle",
//             "curve-style": "bezier",
//             opacity: 0.55,
//           },
//         },
//         {
//           selector: "node.hovered",
//           style: {
//             label: "data(label)",
//             width: 48,
//             height: 48,
//             "font-size": 9,
//             "z-index": 999,
//             "border-width": 4,
//             "border-color": "#ffffff",
//           },
//         },
//         {
//           selector: "node:selected",
//           style: {
//             label: "data(label)",
//             width: 58,
//             height: 58,
//             "font-size": 9,
//             "z-index": 999,
//             "border-width": 4,
//             "border-color": "#ffffff",
//           },
//         },
//       ],

//       layout: {
//         name: "preset",
//         fit: true,
//         padding: 90,
//       },

//       wheelSensitivity: 0.18,
//       minZoom: 0.08,
//       maxZoom: 3,
//     });

//     cy.on("mouseover", "node", (event) => {
//       event.target.addClass("hovered");
//     });

//     cy.on("mouseout", "node", (event) => {
//       event.target.removeClass("hovered");
//     });

//     cy.on("tap", "node", (event) => {
//       const node = event.target;

//       cy.nodes().unselect();
//       node.select();

//       onNodeClick(node.data());
//     });

//     cy.fit(undefined, 90);

//     return () => cy.destroy();
//   }, [graphData, onNodeClick]);

//   return (
//     <div className="graph-wrapper">
//       <div className="legend-box">
//         <h4>Legend</h4>
//         <p>
//           <span className="dot blue"></span> Selected Paper
//         </p>
//         <p>
//           <span className="dot green"></span> References
//         </p>
//         <p>
//           <span className="dot orange"></span> Citing Papers
//         </p>
//       </div>

//       <div className="graph-tools">
//         Arrastra para mover · Scroll para zoom · Clic en un nodo para ver detalles
//       </div>

//       <div ref={graphRef} className="graph-container"></div>
//     </div>
//   );
// }







// import { useEffect, useRef } from "react";
// import cytoscape from "cytoscape";

// export default function CitationGraph({ graphData, onNodeClick }) {
//   const graphRef = useRef(null);

//   useEffect(() => {
//     if (!graphData || !graphData.nodes || !graphData.edges) return;

//     const elements = [
//       ...graphData.nodes.map((node) => ({
//         data: {
//           id: node.id,
//           label: node.label,
//           type: node.type,
//           year: node.year,
//           citation_count: node.citation_count,
//         },
//       })),

//       ...graphData.edges.map((edge, index) => ({
//         data: {
//           id: `edge-${index}`,
//           source: edge.source,
//           target: edge.target,
//           relationship: edge.relationship,
//         },
//       })),
//     ];

//     const cy = cytoscape({
//       container: graphRef.current,
//       elements,

//       style: [
//         {
//           selector: "node",
//           style: {
//             label: "data(label)",
//             color: "#ffffff",
//             "background-color": "#8b5cf6",
//             "font-size": 8,
//             "font-weight": "600",
//             "text-wrap": "wrap",
//             "text-max-width": 130,
//             "text-valign": "center",
//             "text-halign": "center",
//             width: 95,
//             height: 48,
//             shape: "round-rectangle",
//             "border-width": 2,
//             "border-color": "#a78bfa",
//           },
//         },
//         {
//           selector: 'node[type = "main_paper"]',
//           style: {
//             "background-color": "#2563eb",
//             "border-color": "#60a5fa",
//             width: 125,
//             height: 58,
//           },
//         },
//         {
//           selector: 'node[type = "reference"]',
//           style: {
//             "background-color": "#10b981",
//             "border-color": "#34d399",
//           },
//         },
//         {
//           selector: 'node[type = "citing_paper"]',
//           style: {
//             "background-color": "#f59e0b",
//             "border-color": "#fbbf24",
//           },
//         },
//         {
//           selector: "edge",
//           style: {
//             width: 2,
//             "line-color": "#475569",
//             "target-arrow-color": "#64748b",
//             "target-arrow-shape": "triangle",
//             "curve-style": "bezier",
//             label: "data(relationship)",
//             color: "#93c5fd",
//             "font-size": 7,
//           },
//         },
//         {
//           selector: "node:selected",
//           style: {
//             "border-width": 4,
//             "border-color": "#ffffff",
//           },
//         },
//       ],

//       layout: {
//         name: "cose",
//         animate: true,
//         padding: 60,
//         nodeRepulsion: 9000,
//         idealEdgeLength: 160,
//       },

//       wheelSensitivity: 0.2,
//     });

//     cy.on("tap", "node", (event) => {
//       onNodeClick(event.target.data());
//     });

//     return () => cy.destroy();
//   }, [graphData, onNodeClick]);

//   return (
//     <div className="graph-wrapper">
//       <div className="legend-box">
//         <h4>Legend</h4>
//         <p><span className="dot blue"></span> Selected Paper</p>
//         <p><span className="dot green"></span> References</p>
//         <p><span className="dot purple"></span> Citations</p>
//         <p><span className="dot orange"></span> Highly Influential</p>
//       </div>

//       <div ref={graphRef} className="graph-container"></div>
//     </div>
//   );
// }






// import { useEffect, useRef } from "react";
// import cytoscape from "cytoscape";

// function CitationGraph({ graphData, onNodeClick }) {
//   const graphRef = useRef(null);

//   useEffect(() => {
//     if (!graphData || !graphData.nodes || !graphData.edges) return;

//     const elements = [
//       ...graphData.nodes.map((node) => ({
//         data: {
//           id: node.id,
//           label: node.label,
//           type: node.type,
//           year: node.year,
//           citation_count: node.citation_count,
//         },
//       })),

//       ...graphData.edges.map((edge, index) => ({
//         data: {
//           id: `edge-${index}`,
//           source: edge.source,
//           target: edge.target,
//           relationship: edge.relationship,
//         },
//       })),
//     ];

//     const cy = cytoscape({
//       container: graphRef.current,
//       elements: elements,

//       style: [
//         {
//           selector: "node",
//           style: {
//             label: "data(label)",
//             width: 45,
//             height: 45,
//             "font-size": 8,
//             "text-wrap": "wrap",
//             "text-max-width": 120,
//             "text-valign": "bottom",
//             "text-halign": "center",
//           },
//         },
//         {
//           selector: 'node[type = "main_paper"]',
//           style: {
//             width: 90,
//             height: 90,
//             "font-size": 11,
//           },
//         },
//         {
//           selector: "edge",
//           style: {
//             width: 2,
//             "curve-style": "bezier",
//             "target-arrow-shape": "triangle",
//             label: "data(relationship)",
//             "font-size": 7,
//           },
//         },
//       ],

//       layout: {
//         name: "cose",
//         animate: true,
//       },
//     });

//     cy.on("tap", "node", (event) => {
//       const node = event.target.data();
//       onNodeClick(node);
//     });

//     return () => {
//       cy.destroy();
//     };
//   }, [graphData, onNodeClick]);

//   return <div className="graph-container" ref={graphRef}></div>;
// }

// export default CitationGraph;
















// import { useEffect, useRef } from "react";
// import cytoscape from "cytoscape";

// function CitationGraph({ graphData, onNodeClick }) {
//   const graphRef = useRef(null);

//   useEffect(() => {
//     if (!graphData || !graphData.nodes || !graphData.edges) return;

//     const elements = [
//       ...graphData.nodes.map((node) => ({
//         data: {
//           id: node.id,
//           label: node.label,
//           type: node.type,
//           year: node.year,
//           citation_count: node.citation_count,
//         },
//       })),

//       ...graphData.edges.map((edge, index) => ({
//         data: {
//           id: `edge-${index}`,
//           source: edge.source,
//           target: edge.target,
//           relationship: edge.relationship,
//         },
//       })),
//     ];

//     const cy = cytoscape({
//       container: graphRef.current,
//       elements,

//       style: [
//         {
//           selector: "node",
//           style: {
//             label: "data(label)",
//             width: 45,
//             height: 45,
//             "font-size": 8,
//             "text-wrap": "wrap",
//             "text-max-width": 120,
//             "text-valign": "bottom",
//             "text-halign": "center",
//           },
//         },
//         {
//           selector: 'node[type = "main_paper"]',
//           style: {
//             width: 90,
//             height: 90,
//             "font-size": 11,
//           },
//         },
//         {
//           selector: 'node[type = "reference"]',
//           style: {
//             width: 50,
//             height: 50,
//           },
//         },
//         {
//           selector: 'node[type = "citing_paper"]',
//           style: {
//             width: 50,
//             height: 50,
//           },
//         },
//         {
//           selector: "edge",
//           style: {
//             width: 2,
//             "curve-style": "bezier",
//             "target-arrow-shape": "triangle",
//             label: "data(relationship)",
//             "font-size": 7,
//           },
//         },
//       ],

//       layout: {
//         name: "cose",
//         animate: true,
//       },
//     });

//     cy.on("tap", "node", (event) => {
//       const node = event.target.data();
//       onNodeClick(node);
//     });

//     return () => {
//       cy.destroy();
//     };
//   }, [graphData, onNodeClick]);

//   return <div className="graph-container" ref={graphRef}></div>;
// }

// export default CitationGraph;