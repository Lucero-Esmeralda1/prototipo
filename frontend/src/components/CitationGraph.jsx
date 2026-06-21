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
  const [isDraggingNode, setIsDraggingNode] = useState(false);

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
    const newNodeIds = [];

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
      newNodeIds.push(n.id);
      return fresh;
    });

    // Posicionamos los nodos nuevos cerca de su "padre" (el nodo que
    // se exploró y los reveló), en vez de dejar que aparezcan en el
    // origen (0,0) y la física los empuje de cualquier forma. Esto
    // mantiene cada rama agrupada visualmente cerca de donde se
    // originó, en lugar de mezclarse con ramas de otras zonas del
    // grafo.
    if (newNodeIds.length > 0) {
      const nodesById = new Map(nodes.map((n) => [n.id, n]));
      const newIdSet = new Set(newNodeIds);

      // Buscamos, para cada nodo nuevo, con quién se conecta que YA
      // tenía posición (su "padre" real en esta expansión).
      const parentOf = new Map();
      for (const edge of graphData.edges || []) {
        if (newIdSet.has(edge.target) && !newIdSet.has(edge.source)) {
          parentOf.set(edge.target, edge.source);
        } else if (newIdSet.has(edge.source) && !newIdSet.has(edge.target)) {
          parentOf.set(edge.source, edge.target);
        }
      }

      // Agrupamos los nodos nuevos por padre, para saber cuántos
      // hermanos hay en total ANTES de calcular cualquier ángulo --
      // así podemos repartir los 360° completos de forma uniforme
      // entre ellos (un "girasol" parejo), en vez de avanzar en
      // pasos fijos que pueden dar varias vueltas completas y
      // amontonarse cuando hay muchos hermanos.
      const childrenByParent = new Map();
      for (const id of newNodeIds) {
        const parentId = parentOf.get(id) || "__no_parent__";
        if (!childrenByParent.has(parentId)) {
          childrenByParent.set(parentId, []);
        }
        childrenByParent.get(parentId).push(id);
      }

      for (const [parentId, childIds] of childrenByParent) {
        const parent = nodesById.get(parentId);
        const total = childIds.length;

        childIds.forEach((id, index) => {
          const node = nodesById.get(id);
          if (!node || node.x !== undefined) return; // ya tiene posición

          if (parent && parent.x !== undefined) {
            // Reparte los hermanos uniformemente en los 360°
            // completos alrededor del padre, como pétalos de un
            // girasol. Un pequeño desfase angular aleatorio evita que
            // ramas distintas que comparten la misma cantidad de
            // hijos se vean idénticas/alineadas entre sí.
            const baseAngle = (2 * Math.PI * index) / total;
            const angleJitter = (Math.random() - 0.5) * 0.15;
            const angle = baseAngle + angleJitter;

            // Distancia ligeramente variable para que el conjunto se
            // vea más orgánico, sin perder el agrupamiento por rama.
            const distance = 55 + Math.random() * 15;

            node.x = parent.x + Math.cos(angle) * distance;
            node.y = parent.y + Math.sin(angle) * distance;
          } else {
            // Sin padre identificable (caso límite): posición
            // aleatoria pequeña cerca del centro, para que la física
            // la acomode.
            node.x = (Math.random() - 0.5) * 40;
            node.y = (Math.random() - 0.5) * 40;
          }
        });
      }
    }

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
  // se pintan con color vivo (verde/naranja) y los que se mueven
  // junto a él al arrastrarlo.
  //
  // IMPORTANTE: no calculamos esto recorriendo TODAS las edges
  // acumuladas del grafo, porque eso incluiría también al nodo
  // "padre" (el que se exploró antes para llegar al actual) si
  // existe una edge entre ambos -- y ese padre no debería moverse
  // ni iluminarse como si fuera un hijo recién revelado.
  //
  // En su lugar, usamos nodeCache[lastExploredId]: la respuesta
  // exacta y sin ambigüedad que la API devolvió al explorar ESE
  // nodo específico, que contiene solo sus hijos reales (referencias
  // y citantes propios), sin importar qué edges acumuladas existan
  // en el resto del grafo.
  const neighborsOfLast = useMemo(() => {
    const neighbors = new Set();
    if (!lastExploredId) return neighbors;

    const cachedData = graphData?.nodeCache?.[lastExploredId];

    if (cachedData?.nodes) {
      for (const node of cachedData.nodes) {
        const nodeId = node.paper_id || node.id;
        if (nodeId && nodeId !== lastExploredId) {
          neighbors.add(nodeId);
        }
      }
      return neighbors;
    }

    // Respaldo (no debería ocurrir en uso normal, el caché siempre
    // debería existir para el nodo en foco): si por algún motivo no
    // hay datos en caché, recurrimos al cálculo anterior por edges.
    for (const edge of graphData?.edges || []) {
      if (edge.source === lastExploredId) neighbors.add(edge.target);
      if (edge.target === lastExploredId) neighbors.add(edge.source);
    }

    return neighbors;
  }, [graphData?.nodeCache, graphData?.edges, lastExploredId]);

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

  // Encuentra el nodo más cercano a una posición de pantalla dada
  // (coordenadas relativas al canvas), dentro de su radio de
  // detección. Función reutilizada por clic, hover, arrastre y
  // clic derecho -- todos necesitan la misma lógica de "qué nodo
  // está bajo este punto".
  const findNodeAtPosition = useCallback(
    (screenX, screenY) => {
      const fg = fgRef.current;
      if (!fg) return null;

      let closestNode = null;
      let closestDist = Infinity;

      for (const node of data.nodes) {
        if (node.x === undefined || node.y === undefined) continue;

        const screenPos = fg.graph2ScreenCoords(node.x, node.y);
        const dx = screenPos.x - screenX;
        const dy = screenPos.y - screenY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const isMain = node.id === mainPaperId;
        const hitRadius = getNodeRadius(isMain) + 6;

        if (dist <= hitRadius && dist < closestDist) {
          closestDist = dist;
          closestNode = node;
        }
      }

      return closestNode;
    },
    [data.nodes, mainPaperId]
  );

  // SISTEMA UNIFICADO DE INTERACCIÓN: clic para explorar, mantener
  // presionado y mover para arrastrar. Se diferencian por un umbral
  // de movimiento (DRAG_THRESHOLD_PX): si el mouse se mueve menos de
  // eso desde el mousedown, al soltar se considera un CLIC (explora
  // el nodo); si se mueve más, se considera ARRASTRE (mueve el nodo
  // o, si es el nodo en foco actual, mueve todo el grafo junto).
  const DRAG_THRESHOLD_PX = 3;
  const dragStateRef = useRef(null); // { node, startX, startY, isDragging, isPanningAll, lastX, lastY }

  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl) return;

    const getCanvasPos = (event) => {
      const canvas = containerEl.querySelector("canvas");
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top, canvas };
    };

    const handleMouseDown = (event) => {
      if (event.button !== 0) return; // solo botón izquierdo
      const pos = getCanvasPos(event);
      if (!pos) return;

      const node = findNodeAtPosition(pos.x, pos.y);
      if (!node) return; // clic en el fondo: lo maneja la librería (pan normal)

      // Por ahora solo guardamos el estado inicial; todavía no
      // decidimos si esto termina siendo un clic o un arrastre.
      const isFocusNode = node.id === lastExploredId;

      dragStateRef.current = {
        node,
        startX: pos.x,
        startY: pos.y,
        lastX: pos.x,
        lastY: pos.y,
        isDragging: false,
        // Si arrastras el nodo actualmente en foco, se mueve junto
        // con sus vecinos directos (sus "crías": referencias/
        // citantes recién revelados), no el grafo completo. El resto
        // de nodos más lejanos se quedan fijos en su lugar.
        isPanningGroup: isFocusNode,
        groupNodeIds: isFocusNode
          ? new Set([node.id, ...neighborsOfLast])
          : null,
      };

      // Detenemos el evento para que la librería no inicie su propio
      // pan mientras decidimos qué hacer (ver nota sobre
      // stopImmediatePropagation más abajo).
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    const handleMouseMove = (event) => {
      const pos = getCanvasPos(event);
      if (!pos) return;

      const drag = dragStateRef.current;

      if (drag) {
        const movedDist = Math.hypot(
          pos.x - drag.startX,
          pos.y - drag.startY
        );

        if (!drag.isDragging && movedDist > DRAG_THRESHOLD_PX) {
          // Cruzamos el umbral: a partir de ahora es un arrastre, no
          // un clic.
          drag.isDragging = true;
          setIsDraggingNode(true);
          pos.canvas.style.cursor = "grabbing";

          if (drag.isPanningGroup) {
            // Fijamos el nodo en foco y sus vecinos directos en su
            // posición actual antes de empezar a moverlos a mano.
            // Sin esto, la física (que sigue corriendo por
            // d3ReheatSimulation) puede tirar de alguno hacia otra
            // posición al mismo tiempo que nosotros lo desplazamos.
            for (const n of data.nodes) {
              if (n.x === undefined || !drag.groupNodeIds.has(n.id)) continue;
              n.fx = n.x;
              n.fy = n.y;
            }
          } else {
            drag.node.fx = drag.node.x;
            drag.node.fy = drag.node.y;
          }

          fgRef.current?.d3ReheatSimulation();
        }

        if (drag.isDragging) {
          const fg = fgRef.current;
          if (!fg) return;

          if (drag.isPanningGroup) {
            // El nodo en foco y sus vecinos directos se mueven juntos,
            // en la misma proporción de pantalla que se movió el
            // mouse -- como un pequeño grupo que se desplaza, sin
            // afectar al resto del grafo más lejano.
            const dxScreen = pos.x - drag.lastX;
            const dyScreen = pos.y - drag.lastY;

            // Convertimos un desplazamiento de pantalla a un
            // desplazamiento en coordenadas del grafo, comparando dos
            // puntos cercanos (el origen y el desplazado).
            const origin = fg.screen2GraphCoords(0, 0);
            const shifted = fg.screen2GraphCoords(dxScreen, dyScreen);
            const dxGraph = shifted.x - origin.x;
            const dyGraph = shifted.y - origin.y;

            for (const n of data.nodes) {
              if (n.x === undefined || !drag.groupNodeIds.has(n.id)) continue;
              n.x += dxGraph;
              n.y += dyGraph;
              n.fx = n.x;
              n.fy = n.y;
            }
          } else {
            const graphPos = fg.screen2GraphCoords(pos.x, pos.y);
            drag.node.fx = graphPos.x;
            drag.node.fy = graphPos.y;
          }

          drag.lastX = pos.x;
          drag.lastY = pos.y;
        }

        return;
      }

      // Sin arrastre activo: cursor normal, solo actualizamos hover
      // y tooltip. No mostramos ninguna mano de forma permanente --
      // solo aparece mientras de verdad se está arrastrando algo.
      const closestNode = findNodeAtPosition(pos.x, pos.y);

      setHoveredNode((prev) => {
        if (prev?.id === closestNode?.id) return prev;
        return closestNode;
      });

      pos.canvas.title = closestNode ? getNodeTooltip(closestNode) : "";
      pos.canvas.style.cursor = "default";
    };

    const handleMouseUp = (event) => {
      const drag = dragStateRef.current;
      if (!drag) return;

      // Verificación de respaldo: si el movimiento fue muy rápido,
      // es posible que el navegador no haya generado suficientes
      // eventos "mousemove" intermedios para que detectáramos el
      // cruce del umbral a tiempo. Por seguridad, medimos también
      // aquí la distancia real entre el punto inicial y el final.
      const pos = getCanvasPos(event);
      const finalDist = pos
        ? Math.hypot(pos.x - drag.startX, pos.y - drag.startY)
        : 0;
      const wasActuallyDragged = drag.isDragging || finalDist > DRAG_THRESHOLD_PX;

      if (wasActuallyDragged) {
        // Fue un arrastre real: el nodo (o todo el grafo) se queda
        // exactamente donde se soltó, sin rebote -- no liberamos
        // fx/fy, así la física no lo vuelve a atraer a su posición
        // "natural" según sus conexiones.
        //
        // Si el umbral se detectó solo aquí (no durante mousemove),
        // todavía no se aplicó ningún movimiento real -- en ese caso
        // no hay nada que mover, simplemente evitamos que se dispare
        // la exploración por error.
        setIsDraggingNode(false);
      } else {
        // Nunca cruzó el umbral de movimiento: fue un clic real,
        // dispara la exploración normal del nodo.
        handleNodeClick(drag.node, event);
      }

      dragStateRef.current = null;
    };

    // IMPORTANTE: "mousedown" se registra en fase de CAPTURA (tercer
    // argumento true), no de burbujeo. La librería usa d3-drag/d3-zoom
    // internamente sobre el propio canvas para su sistema de pan, y
    // esas utilidades llaman a event.stopImmediatePropagation() para
    // bloquear cualquier otro listener -- incluyendo los que están en
    // elementos padres, en fase de burbujeo normal. Capturando el
    // evento ANTES de que llegue al canvas (de afuera hacia adentro,
    // que es como funciona la fase de captura) nuestro código se
    // ejecuta primero, y puede decidir si el evento es para nuestro
    // sistema (clic/arrastre de nodo) o dejarlo pasar para el pan
    // normal del fondo vacío.
    containerEl.addEventListener("mousedown", handleMouseDown, true);
    containerEl.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      containerEl.removeEventListener("mousedown", handleMouseDown, true);
      containerEl.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    findNodeAtPosition,
    lastExploredId,
    neighborsOfLast,
    getNodeTooltip,
    handleNodeClick,
    data.nodes,
  ]);

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
          "Arrastra para mover el nodo o el grafo · Scroll para zoom · Clic para explorar un nodo gris · Clic derecho para eliminar · Ctrl/Cmd+clic para abrir en pestaña nueva"}
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
          enablePanInteraction={!isDraggingNode}
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