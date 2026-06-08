# =========================================================
# CONSTRUCCIÓN DEL GRAFO DE CITACIONES — NETWORKX
# Adaptado para ser usado como módulo por FastAPI
# =========================================================


from pyalex import Works
from scripts.extract_papers import get_paper_by_id, get_citing_papers


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

    references = main_paper.get("references", [])

    if max_references is not None and max_references > 0:
        references = references[:max_references]

    for ref_id in references:
        try:
            ref_paper = Works()[ref_id]

            add_node({
                "id": ref_id,
                "label": ref_paper.get("title", "Sin título"),
                "type": "reference",
                "year": ref_paper.get("publication_year", ""),
                "citation_count": ref_paper.get("cited_by_count", 0)
            })

            edges.append({
                "source": main_paper["paper_id"],
                "target": ref_id,
                "relationship": "CITES"
            })

        except Exception as e:
            print("Error obteniendo referencia:", e)

    citing_papers = get_citing_papers(
        openalex_id,
        max_citing_papers=max_citing
    )

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
            "total_references": len(references),
            "total_citing_papers": len(citing_papers),
            "main_paper_citations": main_paper["citation_count"]
        }
    }
# from pyalex import Works
# from scripts.extract_papers import get_paper_by_id, get_citing_papers


# def build_citation_graph(openalex_id, max_references=15, max_citing=15):
#     main_paper = get_paper_by_id(openalex_id)

#     nodes = []
#     edges = []

#     nodes.append({
#         "id": main_paper["paper_id"],
#         "label": main_paper["title"],
#         "type": "main_paper",
#         "year": main_paper["year"],
#         "citation_count": main_paper["citation_count"]
#     })

#     references = main_paper.get("references", [])[:max_references]

#     for ref_id in references:
#         try:
#             ref_paper = Works()[ref_id]

#             nodes.append({
#                 "id": ref_id,
#                 "label": ref_paper.get("title", "Sin título"),
#                 "type": "reference",
#                 "year": ref_paper.get("publication_year", ""),
#                 "citation_count": ref_paper.get("cited_by_count", 0)
#             })

#             edges.append({
#                 "source": main_paper["paper_id"],
#                 "target": ref_id,
#                 "relationship": "CITES"
#             })

#         except Exception as e:
#             print("Error obteniendo referencia:", e)

#     citing_papers = get_citing_papers(openalex_id, max_citing)

#     for citing in citing_papers:
#         nodes.append({
#             "id": citing["id"],
#             "label": citing["title"],
#             "type": "citing_paper",
#             "year": citing["year"],
#             "citation_count": citing["citation_count"]
#         })

#         edges.append({
#             "source": citing["id"],
#             "target": main_paper["paper_id"],
#             "relationship": "CITED_BY"
#         })

#     return {
#         "main_paper": main_paper,
#         "nodes": nodes,
#         "edges": edges
#     }