# =========================================================
# KNOWLEDGE GRAPH EXPLORER — API FASTAPI
# Todo en tiempo real + caché en memoria por sesión
# =========================================================
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from scripts.extract_papers import search_papers, get_paper_by_id
from scripts.build_graph import build_citation_graph


app = FastAPI(
    title="Academic Citation Explorer API",
    description="API para buscar papers y construir grafos de citación usando OpenAlex",
    version="1.0.0"
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
    max_results: int = 10
):
    papers = search_papers(query, max_results)

    return {
        "query": query,
        "total_results": len(papers),
        "papers": papers
    }


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
    max_references: int = 15,
    max_citing: int = 15
):
    graph = build_citation_graph(
        paper_id,
        max_references=max_references,
        max_citing=max_citing
    )

    return graph