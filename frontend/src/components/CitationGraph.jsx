import { useEffect, useRef } from "react";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";

cytoscape.use(fcose);

const GRAPH_STYLE = [
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
      "border-opacity": 1,
      "transition-property":
        "border-width, border-color, background-color, border-opacity",
      "transition-duration": 300,
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
    selector: 'node[type = "extended"]',
    style: {
      "background-color": "#0ea5e9",
      "border-color": "#38bdf8",
      width: 32,
      height: 32,
      "font-size": 8,
    },
  },
  // Nodos ya explorados: mismo matiz de categoría pero más suave
  // y apagado, como una señal tranquila de "esto ya está revisado".
  {
    selector: 'node.explored[type = "reference"]',
    style: {
      "background-color": "#0d3b2e",
      "border-color": "#1d6e54",
    },
  },
  {
    selector: 'node.explored[type = "citing_paper"]',
    style: {
      "background-color": "#4a3107",
      "border-color": "#92660f",
    },
  },
  {
    selector: 'node.explored[type = "main_paper"]',
    style: {
      "background-color": "#1e3a6e",
      "border-color": "#3b67ad",
    },
  },
  // Nodos que aún no se han explorado: anillo punteado/llamativo
  // invitando al clic. Se quita en cuanto se exploran.
  {
    selector: "node.unexplored",
    style: {
      "border-width": 3,
      "border-style": "dashed",
      "border-opacity": 0.9,
    },
  },
  {
    selector: "node.unexplored.pulse-dim",
    style: {
      "border-opacity": 0.35,
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
      "transition-duration": 200,
    },
  },
  {
    selector: "node:selected",
    style: {
      "border-width": 4,
      "border-color": "#ffffff",
      "border-style": "solid",
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
];

// Layout inicial: breadthfirst circular. Organiza el grafo en niveles
// concéntricos a partir del paper principal (nivel 0 = centro,
// nivel 1 = sus referencias/citantes, nivel 2 = extendidos), dando
// una estructura de árbol limpia y ordenada en vez de una nube de
// física libre que se amontona con muchos nodos.
//
// IMPORTANTE: pasamos boundingBox explícito calculado desde las
// dimensiones reales del contenedor. Sin esto, breadthfirst usa
// cy.extent() (el área visible de cámara en ESE instante), que justo
// al inicializar Cytoscape puede no reflejar aún el tamaño final del
// contenedor — dejando el círculo completo calculado y centrado en
// una ventana equivocada, descentrado respecto al contenedor real.
const breadthfirstLayoutOptions = (rootId, boundingBox) => ({
  name: "breadthfirst",
  roots: rootId ? [rootId] : undefined,
  circle: true,
  spacingFactor: 1.1,
  avoidOverlap: true,
  animate: false,
  fit: false,
  directed: false,
  boundingBox,
});

// Layout para expansión incremental: fcose con física, pero dejando
// fijo todo lo que ya existía. Aquí sí conviene física (no árbol
// rígido) porque solo se está integrando un pequeño grupo nuevo
// alrededor de un nodo concreto, no reorganizando todo el grafo.
const expandLayoutOptions = (fixedNodes) => ({
  name: "fcose",
  quality: "default",
  randomize: false,
  animate: false,
  fit: false,
  nodeRepulsion: 7000,
  idealEdgeLength: 110,
  edgeElasticity: 0.45,
  nestingFactor: 0.1,
  gravity: 0.3,
  numIter: 1200,
  fixedNodeConstraint: fixedNodes,
});

export default function CitationGraph({ graphData, onNodeClick, t }) {
  const graphRef = useRef(null);
  const cyRef = useRef(null);
  // Guarda qué IDs ya estaban pintados en el grafo, para distinguir
  // entre "primera carga" (recrear todo) y "expansión" (solo agregar
  // los elementos nuevos sin reordenar lo que ya existía).
  const knownNodeIdsRef = useRef(new Set());
  const pulseIntervalRef = useRef(null);
  const resizeObserverRef = useRef(null);

  const applyExploredState = (cy) => {
    const exploredIds = new Set(graphData?.exploredIds || []);

    cy.nodes().forEach((node) => {
      const isExplored = exploredIds.has(node.id());
      const isHelper = node.data("type") === "viewport_helper";

      if (isExplored || isHelper) {
        node.removeClass("unexplored pulse-dim");
        if (isExplored) node.addClass("explored");
      } else {
        node.removeClass("explored");
        node.addClass("unexplored");
      }
    });
  };

  // Pulso sutil: alterna la opacidad del borde de los nodos sin
  // explorar cada cierto tiempo, como una respiración suave que
  // invita al clic sin ser una distracción constante.
  const startPulse = (cy) => {
    if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current);

    pulseIntervalRef.current = setInterval(() => {
      if (!cy || cy.destroyed()) return;
      cy.nodes(".unexplored").toggleClass("pulse-dim");
    }, 900);
  };

  const stopPulse = () => {
    if (pulseIntervalRef.current) {
      clearInterval(pulseIntervalRef.current);
      pulseIntervalRef.current = null;
    }
  };

  // Construye el grafo desde cero (primera carga o búsqueda nueva).
  useEffect(() => {
    if (!graphData || !graphData.nodes || !graphData.edges) return;
    if (!graphRef.current) return;

    const incomingIds = new Set(graphData.nodes.map((n) => n.id));
    const isFreshLoad =
      !cyRef.current ||
      cyRef.current.destroyed() ||
      // Si ningún nodo nuevo coincide con los que ya conocíamos,
      // es un grafo distinto (otra búsqueda), no una expansión.
      ![...knownNodeIdsRef.current].some((id) => incomingIds.has(id));

    if (!isFreshLoad) return; // la expansión la maneja el otro efecto

    stopPulse();

    if (cyRef.current && !cyRef.current.destroyed()) {
      cyRef.current.destroy();
    }

    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    // Cytoscape espera que su contenedor esté vacío al inicializarse;
    // cualquier resto de un render anterior puede desincronizar las
    // coordenadas internas respecto a lo que se ve en pantalla.
    graphRef.current.innerHTML = "";

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
      style: GRAPH_STYLE,
      layout: { name: "preset", fit: false },
      minZoom: 0.15,
      maxZoom: 3,
      // Suaviza la sensación de movimiento al hacer pan/zoom/drag.
      motionBlur: true,
      motionBlurOpacity: 0.18,
      // Fuerza un ratio de píxeles 1:1 entre coordenadas CSS y el
      // canvas interno. Sin esto, en pantallas/sistemas con escalado
      // distinto de 100% (ej. 112.5% en Windows), el canvas dibuja en
      // una resolución distinta a la que el navegador usa para
      // calcular la posición del mouse, causando que el grafo se vea
      // desplazado respecto a donde realmente se detectan los clics.
      pixelRatio: 1,
    });

    cyRef.current = cy;
    knownNodeIdsRef.current = incomingIds;

    // Mantiene las coordenadas internas de Cytoscape sincronizadas
    // con el tamaño REAL del contenedor en todo momento, y además
    // dispara el primer fit/center recién cuando el tamaño del
    // contenedor se ESTABILIZA (deja de cambiar), en vez de confiar
    // en un tiempo fijo arbitrario. En tu app real, React puede
    // seguir ajustando el layout de otros paneles/sidebar después
    // del montaje inicial; un timeout fijo corto puede ejecutarse
    // mientras el contenedor todavía está cambiando de tamaño,
    // dejando el grafo centrado respecto a un tamaño que no es
    // el final.
    let resizeDebounce = null;
    let didInitialFit = false;

    const performFit = () => {
      if (!cy || cy.destroyed()) return;
      cy.resize();
      cy.fit(cy.elements(), 60);
      cy.center(cy.elements());
    };

    resizeObserverRef.current = new ResizeObserver(() => {
      if (resizeDebounce) clearTimeout(resizeDebounce);
      resizeDebounce = setTimeout(() => {
        if (!cy || cy.destroyed()) return;
        cy.resize();

        // El primer fit "real" ocurre cuando el tamaño ya se
        // estabilizó (este callback se ejecuta tras 150ms sin
        // nuevos cambios de tamaño), no en un tiempo fijo arbitrario.
        if (!didInitialFit) {
          didInitialFit = true;
          performFit();
        }
      }, 150);
    });
    resizeObserverRef.current.observe(graphRef.current);

    // Salvaguarda extra: Cytoscape.js tiene un bug conocido donde,
    // si su contenedor queda dentro de un ancestro con scroll, los
    // clics quedan desincronizados respecto a la posición visual real
    // (ver github.com/cytoscape/cytoscape.js-cxtmenu/issues/75). Ya
    // eliminamos el scroll del contenedor padre directo (.graph-page),
    // pero por si algún scroll de la página completa llegara a ocurrir
    // de todos modos, forzamos un resize() para resincronizar.
    const handleWindowScroll = () => {
      if (!cy || cy.destroyed()) return;
      cy.resize();
    };
    window.addEventListener("scroll", handleWindowScroll, true);

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

    const mainPaperNode = graphData.nodes.find(
      (node) => node.type === "main_paper"
    );

    // Forzamos un resize ANTES de correr el layout, para que Cytoscape
    // tenga las dimensiones reales y actuales del contenedor. Sin esto,
    // el layout podría calcular su centro basándose en un tamaño viejo
    // o por defecto, dejando el grafo descentrado respecto al cuadro
    // visual real.
    cy.resize();

    const containerWidth = graphRef.current.clientWidth || 800;
    const containerHeight = graphRef.current.clientHeight || 600;

    cy.layout(
      breadthfirstLayoutOptions(mainPaperNode?.id, {
        x1: 0,
        y1: 0,
        w: containerWidth,
        h: containerHeight,
      })
    ).run();
    applyExploredState(cy);
    startPulse(cy);

    const timeoutId = setTimeout(() => {
      if (!didInitialFit) {
        didInitialFit = true;
        performFit();
      }
    }, 600);

    return () => {
      clearTimeout(timeoutId);
      stopPulse();

      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }

      window.removeEventListener("scroll", handleWindowScroll, true);

      // CRÍTICO: destruir la instancia de Cytoscape de ESTE montaje
      // al desmontar. Sin esto, con StrictMode (que monta/desmonta/
      // remonta cada componente una vez en desarrollo), la primera
      // instancia de Cytoscape queda viva en memoria con sus propios
      // listeners de eventos activos, mientras una segunda instancia
      // se crea sobre el DOM ya limpiado. Visualmente solo se ve la
      // segunda, pero la primera sigue "sintiendo" clics y movimientos
      // de mouse con coordenadas basadas en un estado nunca actualizado
      // — exactamente el síntoma de "el área sensible no coincide con
      // lo que se ve".
      if (cy && !cy.destroyed()) {
        cy.destroy();
      }

      if (cyRef.current === cy) {
        cyRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphData?.main_paper?.paper_id]);

  // Expansión incremental: agrega SOLO los nodos/edges nuevos al
  // grafo ya existente, sin destruirlo ni reordenar lo que ya estaba.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed() || !graphData) return;

    const incomingIds = new Set(graphData.nodes.map((n) => n.id));
    const isFreshLoad = ![...knownNodeIdsRef.current].some((id) =>
      incomingIds.has(id)
    );
    if (isFreshLoad) return; // ese caso lo maneja el efecto anterior

    const newNodes = graphData.nodes.filter(
      (n) => !knownNodeIdsRef.current.has(n.id)
    );

    if (newNodes.length === 0) {
      applyExploredState(cy);
      return;
    }

    const newNodeIds = new Set(newNodes.map((n) => n.id));

    cy.batch(() => {
      newNodes.forEach((node) => {
        // Buscamos un edge real que conecte este nodo nuevo con algún
        // nodo que YA existía, para nacer cerca de él (no en el origen).
        const connectingEdge = graphData.edges.find(
          (e) =>
            (e.source === node.id && knownNodeIdsRef.current.has(e.target)) ||
            (e.target === node.id && knownNodeIdsRef.current.has(e.source))
        );

        const neighborId = connectingEdge
          ? connectingEdge.source === node.id
            ? connectingEdge.target
            : connectingEdge.source
          : null;

        const neighbor = neighborId ? cy.getElementById(neighborId) : null;
        const hasNeighborPosition = neighbor && neighbor.length > 0;

        cy.add({
          data: {
            id: node.id,
            label: node.label,
            type: node.type,
            year: node.year,
            citation_count: node.citation_count,
          },
          position: hasNeighborPosition
            ? {
                x: neighbor.position("x") + (Math.random() - 0.5) * 60,
                y: neighbor.position("y") + (Math.random() - 0.5) * 60,
              }
            : { x: 0, y: 0 },
        });
      });

      graphData.edges.forEach((edge, index) => {
        const edgeId = `edge-${index}`;
        if (cy.getElementById(edgeId).length) return;
        if (!newNodeIds.has(edge.source) && !newNodeIds.has(edge.target)) return;

        cy.add({
          data: {
            id: edgeId,
            source: edge.source,
            target: edge.target,
            relationship: edge.relationship,
          },
        });
      });
    });

    knownNodeIdsRef.current = incomingIds;

    // Re-organiza solo localmente: deja fijo todo lo que ya estaba
    // colocado y permite que los nodos nuevos encuentren su lugar.
    const existingNodeIds = [...knownNodeIdsRef.current].filter(
      (id) => !newNodeIds.has(id)
    );

    const fixedNodes = existingNodeIds.map((id) => {
      const node = cy.getElementById(id);
      return {
        nodeId: id,
        position: { x: node.position("x"), y: node.position("y") },
      };
    });

    cy.layout(expandLayoutOptions(fixedNodes)).run();

    applyExploredState(cy);

    setTimeout(() => {
      if (!cy || cy.destroyed()) return;
      cy.fit(cy.elements(), 60);
    }, 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphData]);

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
          "Arrastra para mover · Scroll para zoom · Clic en un nodo con borde punteado para explorar sus conexiones · Ctrl/Cmd+clic para abrir en pestaña nueva"}
      </div>

      <div className="graph-container" ref={graphRef}></div>
    </div>
  );
}