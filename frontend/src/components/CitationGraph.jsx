import { useEffect, useRef } from "react";
import cytoscape from "cytoscape";

function CitationGraph({ graphData, onNodeClick }) {
  const graphRef = useRef(null);

  useEffect(() => {
    if (!graphData || !graphData.nodes || !graphData.edges) return;

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
      elements: elements,

      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            width: 45,
            height: 45,
            "font-size": 8,
            "text-wrap": "wrap",
            "text-max-width": 120,
            "text-valign": "bottom",
            "text-halign": "center",
          },
        },
        {
          selector: 'node[type = "main_paper"]',
          style: {
            width: 90,
            height: 90,
            "font-size": 11,
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
            label: "data(relationship)",
            "font-size": 7,
          },
        },
      ],

      layout: {
        name: "cose",
        animate: true,
      },
    });

    cy.on("tap", "node", (event) => {
      const node = event.target.data();
      onNodeClick(node);
    });

    return () => {
      cy.destroy();
    };
  }, [graphData, onNodeClick]);

  return <div className="graph-container" ref={graphRef}></div>;
}

export default CitationGraph;
















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