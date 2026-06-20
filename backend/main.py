# =========================================================
# KNOWLEDGE GRAPH EXPLORER — API FASTAPI
# Búsqueda paginada + filtros + grafo + lista completa de referencias/citantes
# =========================================================
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from scripts.extract_papers import search_papers, get_paper_by_id, get_network_papers, get_search_suggestions
from scripts.build_graph import build_citation_graph


app = FastAPI(
    title="Academic Citation Explorer API",
    description="API para buscar papers, construir grafos y listar referencias/citantes usando OpenAlex",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Academic Citation Explorer API funcionando correctamente"
    }


@app.get("/api/search")
def api_search(
    query: str = Query(..., description="Tema de búsqueda"),
    page: int = Query(1, ge=1, description="Número de página"),
    per_page: int = Query(10, ge=1, le=100, description="Resultados por página"),
    year_from: str = Query("", description="Año inicial opcional"),
    year_to: str = Query("", description="Año final opcional"),
    author: str = Query("", description="Autor opcional"),
    area: str = Query("", description="Área o topic opcional"),
    min_citations: int = Query(0, ge=0, description="Cantidad mínima de citas"),
):
    return search_papers(
        query=query,
        page=page,
        per_page=per_page,
        year_from=year_from,
        year_to=year_to,
        author=author,
        area=area,
        min_citations=min_citations,
    )


@app.get("/api/suggestions")
def api_suggestions(
    query: str = Query(..., description="Texto parcial para sugerencias"),
    limit: int = Query(8, ge=1, le=20, description="Máximo de sugerencias"),
):
    return get_search_suggestions(query=query, limit=limit)


@app.get("/api/paper")
def api_paper(
    paper_id: str = Query(..., description="ID de OpenAlex del paper")
):
    paper = get_paper_by_id(paper_id)

    return {
        "paper": paper
    }


@app.get("/api/graph")
def api_graph(
    paper_id: str = Query(..., description="ID de OpenAlex del paper"),
    max_references: int = Query(20, ge=0, le=40),
    max_citing: int = Query(20, ge=0, le=40),
):
    graph = build_citation_graph(
        paper_id,
        max_references=max_references,
        max_citing=max_citing,
    )

    return graph


@app.get("/api/network-papers")
def api_network_papers(
    paper_id: str = Query(..., description="ID de OpenAlex del paper"),
    references_page: int = Query(1, ge=1, description="Página de referencias"),
    references_per_page: int = Query(20, ge=1, le=50, description="Referencias por página"),
    citing_page: int = Query(1, ge=1, description="Página de papers citantes"),
    citing_per_page: int = Query(20, ge=1, le=50, description="Papers citantes por página"),
):
    return get_network_papers(
        paper_id=paper_id,
        references_page=references_page,
        references_per_page=references_per_page,
        citing_page=citing_page,
        citing_per_page=citing_per_page,
    )