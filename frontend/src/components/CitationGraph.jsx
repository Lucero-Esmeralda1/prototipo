import { useRef, useMemo, useCallback, useEffect, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";

// Paleta por tipo de nodo: color vivo cuando un nodo es vecino
// directo del último nodo explorado (sus citas/citantes recién
// reveladas). "border" es el aro del nodo.
const COLORS = {
  reference: { base: "#22c55e", border: "#86efac" },
  citing_paper: { base: "#f59e0b", border: "#fcd34d" },
};

// Azul suave: cualquier nodo (que no sea el principal) que el
// usuario ya exploró alguna vez. Se acumula, no se pierde.
const EXPLORED_COLOR = "#1e3a8a";
const EXPLORED_BORDER = "#60a5fa";

// Celeste: color especial y fijo del paper principal A, distinto
// del azul de los demás nodos ya explorados.
const MAIN_COLOR = "#0ea5e9";
const MAIN_BORDER = "#7dd3fc";

// Gris neutro: nodos que nunca se han explorado y tampoco son
// vecinos directos del último nodo explorado en este momento.
const UNFOCUSED_COLOR = "#475569";
const UNFOCUSED_BORDER = "#64748b";

function getNodeRadius(isMain) {
  return isMain ? 16 : 8;
}

// Determina el aspecto visual de un nodo según 4 capas, en orden
// de prioridad:
// 1. ¿Es el paper principal A? -> celeste, siempre
// 2. ¿Ya fue explorado alguna vez (está en el historial)? -> azul
// 3. ¿Es vecino directo del último nodo explorado ahora? -> color
//    vivo de su tipo (verde si es referencia, naranja si es citante)
// 4. Si no es ninguna de las anteriores -> gris, sin explorar
function getNodeVisual(node, exploredIds, neighborsOfLast, mainPaperId) {
  if (node.id === mainPaperId) {
    return { fill: MAIN_COLOR, border: MAIN_BORDER, state: "main" };
  }

  const wasExplored = exploredIds.has(node.id);

  if (wasExplored) {
    return {
      fill: EXPLORED_COLOR,
      border: EXPLORED_BORDER,
      state: "explored",
    };
  }

  const isLiveNeighbor = neighborsOfLast.has(node.id);

  if (isLiveNeighbor) {
    const palette = COLORS[node.type] || COLORS.reference;
    return { fill: palette.base, border: palette.border, state: "live" };
  }

  return { fill: UNFOCUSED_COLOR, border: UNFOCUSED_BORDER, state: "unfocused" };
}

export default function CitationGraph({ graphData, onNodeClick, t }) {
  const fgRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState(null);

  // Mantiene el tamaño del lienzo sincronizado con el contenedor real.
  // IMPORTANTE: redondeamos a enteros con Math.round(). El navegador
  // puede reportar anchos/altos con decimales (ej. 741.54px), y al
  // multiplicar por un devicePixelRatio no entero (común en pantallas
  // con escalado de Windows como 112.5% => devicePixelRatio 1.125),
  // esa imprecisión de subpíxel se traduce en errores de varios
  // píxeles en la conversión de coordenadas de clic -- justo el tipo
  // de desajuste que afecta más a nodos pequeños que a nodos grandes
  // como el principal, coincidiendo con el patrón de fallo observado.
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const mainPaperId =
    graphData?.main_paper?.paper_id || graphData?.main_paper?.id || null;

  const exploredIds = useMemo(
    () => new Set(graphData?.exploredIds || []),
    [graphData?.exploredIds]
  );

  const lastExploredId = graphData?.lastExploredId || mainPaperId;

  // CRÍTICO: react-force-graph muta los objetos de nodo que recibe,
  // agregándoles x/y/vx/vy calculados por la física. Si en cada
  // exploración creamos OBJETOS NUEVOS para nodos que ya existían
  // (con spread {...n}), la librería pierde la posición física ya
  // calculada para ellos -- ve un objeto "nuevo" con el mismo id,
  // pero sin sus propiedades de posición, y debe re-posicionarlo
  // desde cero. Con cada exploración sucesiva esto reinicia más y
  // más nodos, lo cual puede dejar el grafo en un estado inconsistente
  // donde el dibujo visual y el área de detección de clic (que
  // depende de la posición que la física calculó) se desincronizan.
  //
  // La solución: mantener un registro estable de referencias de
  // objeto por id, reutilizando el MISMO objeto para nodos que ya
  // existían (preservando su x/y/vx/vy), y creando objetos nuevos
  // solo para ids que aparecen por primera vez.
  const nodeRefsCache = useRef(new Map());

  // Si cambia el paper principal (carga de un grafo nuevo, no una
  // exploración), limpiamos por completo el caché de referencias:
  // las posiciones físicas del grafo anterior no tienen sentido para
  // un grafo distinto.
  const prevMainPaperIdRef = useRef(mainPaperId);
  if (prevMainPaperIdRef.current !== mainPaperId) {
    nodeRefsCache.current.clear();
    prevMainPaperIdRef.current = mainPaperId;
  }

  const data = useMemo(() => {
    if (!graphData?.nodes) return { nodes: [], links: [] };

    const cache = nodeRefsCache.current;
    const seenIds = new Set();

    const nodes = graphData.nodes.map((n) => {
      seenIds.add(n.id);
      const existing = cache.get(n.id);

      if (existing) {
        // Reutilizamos el mismo objeto (con su x/y/vx/vy ya calculados
        // por la física), actualizando solo los campos de datos que
        // pudieran haber cambiado (label, type, etc.), sin tocar
        // las propiedades de posición que la física le agregó.
        Object.assign(existing, n);
        return existing;
      }

      // Nodo nuevo: se crea su objeto una sola vez y se guarda en
      // caché para reutilizarlo en futuras exploraciones.
      const fresh = { ...n };
      cache.set(n.id, fresh);
      return fresh;
    });

    // Limpiamos del caché los nodos que ya no están en el grafo
    // actual (por ejemplo, si se cargó un grafo completamente nuevo).
    for (const id of Array.from(cache.keys())) {
      if (!seenIds.has(id)) cache.delete(id);
    }

    return {
      nodes,
      links: (graphData.edges || []).map((e) => ({
        source: e.source,
        target: e.target,
        relationship: e.relationship,
      })),
    };
  }, [graphData]);

  // Vecinos directos del último nodo explorado: estos son los que
  // se pintan con color vivo (verde/naranja) en este momento.
  const neighborsOfLast = useMemo(() => {
    const neighbors = new Set();
    if (!lastExploredId) return neighbors;

    for (const edge of graphData?.edges || []) {
      if (edge.source === lastExploredId) neighbors.add(edge.target);
      if (edge.target === lastExploredId) neighbors.add(edge.source);
    }

    return neighbors;
  }, [graphData?.edges, lastExploredId]);

  const nodeCount = data.nodes.length;

  // Recentra/reencuadra el grafo cada vez que cambia el paper
  // principal (carga nueva) O cuando el grafo crece por exploración
  // (aparecen nodos nuevos). Sin esto, la cámara se queda fija en el
  // encuadre de la carga inicial y los nodos nuevos pueden aparecer
  // fuera de cuadro o con un zoom relativo extraño.
  useEffect(() => {
    if (!fgRef.current || !mainPaperId) return;

    const chargeForce = fgRef.current.d3Force("charge");
    if (chargeForce) {
      chargeForce.strength(-220).distanceMax(900);
    }

    const linkForce = fgRef.current.d3Force("link");
    if (linkForce) {
      linkForce.distance(70);
    }

    const timeoutId = setTimeout(() => {
      fgRef.current?.zoomToFit(400, 70);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [mainPaperId, nodeCount]);

  const handleNodeClick = useCallback(
    (node, event) => {
      if (!onNodeClick) return;
      const openInNewTab = Boolean(event?.ctrlKey || event?.metaKey);
      onNodeClick(node, { openInNewTab });
    },
    [onNodeClick]
  );

  // Tooltip nativo del navegador con el título completo (sin
  // truncar) más año y número de citas -- aparece al pasar el mouse,
  // sin saturar visualmente el grafo con texto largo permanente.
  const getNodeTooltip = useCallback((node) => {
    const title = node.label || node.title || t.noTitle || "Sin título";
    const year = node.year || "";
    const citations = Number(node.citation_count || 0).toLocaleString();
    const citationsLabel = t.citations || "citas";

    const parts = [title];
    const meta = [year, `${citations} ${citationsLabel}`].filter(Boolean);
    if (meta.length) parts.push(meta.join(" · "));

    return parts.join("\n");
  }, [t]);

  // DETECCIÓN MANUAL DE CLICS, independiente del sistema interno de
  // la librería (un canvas de sombra con colores únicos por objeto).
  // Ese mecanismo interno presentó fallos inconsistentes en ciertos
  // entornos/escalas de pantalla que no logramos resolver ajustando
  // su configuración. En su lugar, calculamos nosotros mismos qué
  // nodo está bajo el clic: convertimos la posición de cada nodo a
  // coordenadas de pantalla con graph2ScreenCoords (un método nativo
  // y confiable de la librería, ya verificado), y medimos la
  // distancia real al punto del clic.
  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl) return;

    const handleClick = (event) => {
      const fg = fgRef.current;
      if (!fg) return;

      const canvas = containerEl.querySelector("canvas");
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      let closestNode = null;
      let closestDist = Infinity;

      for (const node of data.nodes) {
        if (node.x === undefined || node.y === undefined) continue;

        const screenPos = fg.graph2ScreenCoords(node.x, node.y);
        const dx = screenPos.x - clickX;
        const dy = screenPos.y - clickY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const isMain = node.id === mainPaperId;
        const hitRadius = getNodeRadius(isMain) + 6; // pequeño margen

        if (dist <= hitRadius && dist < closestDist) {
          closestDist = dist;
          closestNode = node;
        }
      }

      if (closestNode) {
        handleNodeClick(closestNode, event);
      }
    };

    containerEl.addEventListener("click", handleClick);
    return () => containerEl.removeEventListener("click", handleClick);
  }, [data.nodes, mainPaperId, handleNodeClick]);

  // Mismo enfoque de detección manual para el hover (necesario para
  // el tooltip nativo y el efecto visual de "nodo bajo el cursor").
  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl) return;

    const handleMouseMove = (event) => {
      const fg = fgRef.current;
      if (!fg) return;

      const canvas = containerEl.querySelector("canvas");
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      let closestNode = null;
      let closestDist = Infinity;

      for (const node of data.nodes) {
        if (node.x === undefined || node.y === undefined) continue;

        const screenPos = fg.graph2ScreenCoords(node.x, node.y);
        const dx = screenPos.x - mouseX;
        const dy = screenPos.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const isMain = node.id === mainPaperId;
        const hitRadius = getNodeRadius(isMain) + 6;

        if (dist <= hitRadius && dist < closestDist) {
          closestDist = dist;
          closestNode = node;
        }
      }

      setHoveredNode((prev) => {
        if (prev?.id === closestNode?.id) return prev;
        return closestNode;
      });

      canvas.title = closestNode ? getNodeTooltip(closestNode) : "";
    };

    containerEl.addEventListener("mousemove", handleMouseMove);
    return () => containerEl.removeEventListener("mousemove", handleMouseMove);
  }, [data.nodes, mainPaperId, getNodeTooltip]);

  const paintNode = useCallback(
    (node, ctx, globalScale) => {
      // save/restore asegura que NINGÚN estado del canvas (alpha,
      // sombra, dash, etc.) se filtre de un nodo al siguiente. Sin
      // esto, un estado mal restaurado en un nodo podía interferir
      // con cómo se pinta el siguiente, incluyendo en el canvas
      // oculto de detección de color que usa la librería para saber
      // qué nodo está bajo el mouse.
      ctx.save();

      const isMain = node.id === mainPaperId;
      const radius = getNodeRadius(isMain);
      const visual = getNodeVisual(node, exploredIds, neighborsOfLast, mainPaperId);
      const isHovered = hoveredNode?.id === node.id;
      const isDimmed = visual.state === "unfocused";

      // Sombra suave para dar profundidad a nodos que no están apagados.
      if (!isDimmed) {
        ctx.shadowColor = visual.fill;
        ctx.shadowBlur = isHovered ? 14 : 7;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = visual.fill;
      ctx.globalAlpha = isDimmed ? 0.55 : 1;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Borde: punteado y fino si nunca se exploró (invita al clic);
      // sólido si ya se exploró o está en foco vivo ahora.
      ctx.lineWidth = (isHovered ? 2.5 : isDimmed ? 1.2 : 1.8) / globalScale;
      ctx.strokeStyle = visual.border;
      ctx.globalAlpha = isDimmed ? 0.7 : 1;

      if (isDimmed) {
        ctx.setLineDash([2.5 / globalScale, 2 / globalScale]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // Anillo extra blanco al hacer hover, para feedback claro.
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 2.5 / globalScale, 0, 2 * Math.PI, false);
        ctx.lineWidth = 1.2 / globalScale;
        ctx.strokeStyle = "#ffffff";
        ctx.globalAlpha = 0.85;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Etiqueta: siempre visible para el principal, lo ya explorado
      // (azul) y lo vivo (verde/naranja). Para lo gris, solo aparece
      // con bastante zoom o al pasar el mouse, para no saturar.
      const showLabel =
        isMain || !isDimmed || isHovered || globalScale > 2.2;

      if (showLabel) {
        const fontSize = (isMain ? 13 : 10) / globalScale;
        ctx.font = `${isMain ? "700" : "500"} ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        const label = node.label || node.title || "";
        const maxChars = isMain ? 42 : 30;
        const truncated =
          label.length > maxChars ? label.slice(0, maxChars) + "…" : label;

        // Halo oscuro detrás del texto para que siempre sea legible
        // sobre el fondo punteado, sin necesitar una caja sólida.
        ctx.lineWidth = 3 / globalScale;
        ctx.strokeStyle = "rgba(2, 6, 23, 0.85)";
        ctx.lineJoin = "round";
        ctx.strokeText(truncated, node.x, node.y + radius + 4 / globalScale);

        ctx.fillStyle = isDimmed ? "#94a3b8" : "#f1f5f9";
        ctx.fillText(truncated, node.x, node.y + radius + 4 / globalScale);
      }

      ctx.restore();
    },
    [exploredIds, neighborsOfLast, hoveredNode, mainPaperId]
  );

  // Tamaño del área de detección de clic/hover de cada nodo. En vez
  // de pintar manualmente un área custom (nodePointerAreaPaint, que
  // puede desincronizarse del dibujo visual en ciertas condiciones
  // de zoom/escala), usamos nodeVal: el mecanismo nativo y soportado
  // de la librería para esto, dimensionando el círculo de detección
  // según si el nodo es el principal o no.
  const getNodeVal = useCallback(
    (node) => (node.id === mainPaperId ? 10 : 4),
    [mainPaperId]
  );

  // El grafo es dirigido: una flecha de X hacia Y significa "X cita
  // a Y" (relationship CITES) o "X es citado por Y" (CITED_BY), según
  // cómo el backend armó el edge. Las líneas conectadas al foco actual
  // se ven más claras; el resto, atenuadas.
  const linkColor = useCallback(
    (link) => {
      const sourceId = typeof link.source === "object" ? link.source.id : link.source;
      const targetId = typeof link.target === "object" ? link.target.id : link.target;

      const sourceVisible =
        exploredIds.has(sourceId) || neighborsOfLast.has(sourceId) || sourceId === mainPaperId;
      const targetVisible =
        exploredIds.has(targetId) || neighborsOfLast.has(targetId) || targetId === mainPaperId;

      return sourceVisible && targetVisible ? "#94a3b8" : "#334155";
    },
    [exploredIds, neighborsOfLast, mainPaperId]
  );

  return (
    <div className="graph-section-wrapper">
      <div className="graph-legend-outside">
        <h4>{t.graphLegend || "Legend"}</h4>
        <div className="legend-items">
          <span>
            <i className="dot cyan"></i> {t.selectedPaper}
          </span>
          <span>
            <i className="dot blue"></i> {t.exploredPapers || "Ya explorados"}
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
          "Arrastra para mover · Scroll para zoom · Clic en un nodo gris para explorar sus conexiones · Ctrl/Cmd+clic para abrir en pestaña nueva"}
      </div>

      <div className="graph-container" ref={containerRef}>
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={data}
          nodeId="id"
          backgroundColor="transparent"
          linkColor={linkColor}
          linkWidth={1.2}
          linkDirectionalArrowLength={5}
          linkDirectionalArrowRelPos={1}
          linkCurvature={0.18}
          nodeVal={getNodeVal}
          nodeCanvasObject={paintNode}
          enableNodeDrag={false}
          cooldownTicks={150}
          d3AlphaDecay={0.025}
          d3VelocityDecay={0.4}
          warmupTicks={50}
          minZoom={0.3}
          maxZoom={8}
        />
      </div>
    </div>
  );
}