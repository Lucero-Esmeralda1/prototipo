# =========================================================
# CONSTRUCCIÓN DEL GRAFO DE CITACIONES
# Adaptado para ser usado como módulo por FastAPI
# =========================================================
from concurrent.futures import ThreadPoolExecutor

from scripts.extract_papers import get_paper_by_id, get_papers_by_ids, get_citing_papers


def build_citation_graph(openalex_id, max_references=None, max_citing=None):
    main_paper = get_paper_by_id(openalex_id)

    nodes = []
    edges = []
    added_nodes = set()

    def add_node(node):
        node_id = node.get("id")

        if node_id and node_id not in added_nodes:
            nodes.append(node)
            added_nodes.add(node_id)

    add_node({
        "id": main_paper["paper_id"],
        "label": main_paper["title"],
        "type": "main_paper",
        "year": main_paper["year"],
        "citation_count": main_paper["citation_count"]
    })

    reference_ids = main_paper.get("references", [])

    # Las referencias (batch fetch por IDs) y los citantes (búsqueda
    # por filtro) son peticiones independientes a OpenAlex una vez que
    # tenemos el paper principal -- se piden en paralelo en vez de
    # una tras otra, reduciendo el tiempo total de carga casi a la mitad.
    with ThreadPoolExecutor(max_workers=2) as executor:
        references_future = executor.submit(get_papers_by_ids, reference_ids)
        citing_future = executor.submit(
            get_citing_papers, openalex_id, max_citing
        )

        reference_papers = references_future.result()
        citing_papers = citing_future.result()

    # Traemos los datos completos de TODAS las referencias para poder
    # ordenarlas por relevancia (número de citas) antes de truncar.
    # Así, si hay muchas más de las que se van a mostrar, las que
    # se descartan son las menos citadas, no las primeras de la lista.
    reference_papers.sort(
        key=lambda paper: paper.get("citation_count", 0) or 0,
        reverse=True,
    )

    if max_references is not None and max_references > 0:
        reference_papers = reference_papers[:max_references]

    for ref_paper in reference_papers:
        ref_id = ref_paper.get("paper_id") or ref_paper.get("id")

        if not ref_id:
            continue

        add_node({
            "id": ref_id,
            "label": ref_paper.get("title", "Sin título"),
            "type": "reference",
            "year": ref_paper.get("year", ""),
            "citation_count": ref_paper.get("citation_count", 0)
        })

        edges.append({
            "source": main_paper["paper_id"],
            "target": ref_id,
            "relationship": "CITES"
        })

    for citing in citing_papers:
        add_node({
            "id": citing["id"],
            "label": citing["title"],
            "type": "citing_paper",
            "year": citing["year"],
            "citation_count": citing["citation_count"]
        })

        edges.append({
            "source": citing["id"],
            "target": main_paper["paper_id"],
            "relationship": "CITED_BY"
        })

    return {
        "main_paper": main_paper,
        "nodes": nodes,
        "edges": edges,
        "summary": {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "total_references": len(reference_papers),
            "total_citing_papers": len(citing_papers),
            "main_paper_citations": main_paper["citation_count"]
        }
    }