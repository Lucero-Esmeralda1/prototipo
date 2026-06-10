# =========================================================
# KNOWLEDGE GRAPH EXPLORER — API FASTAPI
# Todo en tiempo real + caché en memoria por sesión
# =========================================================

# =========================================================
# KNOWLEDGE GRAPH EXPLORER — API FASTAPI
# Todo en tiempo real
# Construcción dinámica de grafo con OpenAlex
# =========================================================

# =========================================================
# KNOWLEDGE GRAPH EXPLORER — API FASTAPI
# Búsqueda paginada + filtros + grafo en tiempo real
# =========================================================
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from scripts.extract_papers import search_papers, get_paper_by_id
from scripts.build_graph import build_citation_graph


app = FastAPI(
    title="Academic Citation Explorer API",
    description="API para buscar papers y construir grafos de citación usando OpenAlex",
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
    max_references: int = Query(10, ge=0, le=50),
    max_citing: int = Query(10, ge=0, le=50),
):
    graph = build_citation_graph(
        paper_id,
        max_references=max_references,
        max_citing=max_citing,
    )

    return graph



# from typing import Optional

# from fastapi import FastAPI, Query
# from fastapi.middleware.cors import CORSMiddleware

# from scripts.extract_papers import search_papers, get_paper_by_id
# from scripts.build_graph import build_citation_graph


# app = FastAPI(
#     title="Academic Citation Explorer API",
#     description="API para buscar papers y construir grafos de citación usando OpenAlex",
#     version="1.0.0"
# )


# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# @app.get("/")
# def home():
#     return {
#         "message": "Academic Citation Explorer API funcionando correctamente"
#     }


# @app.get("/api/search")
# def api_search(
#     query: str = Query(..., description="Tema de búsqueda"),
#     max_results: int = Query(
#         10,
#         description="Cantidad máxima de resultados de búsqueda"
#     )
# ):
#     papers = search_papers(query, max_results)

#     return {
#         "query": query,
#         "total_results": len(papers),
#         "papers": papers
#     }


# @app.get("/api/paper")
# def api_paper(
#     paper_id: str = Query(..., description="ID de OpenAlex del paper")
# ):
#     paper = get_paper_by_id(paper_id)

#     return {
#         "paper": paper
#     }


# @app.get("/api/graph")
# def api_graph(
#     paper_id: str = Query(
#         ...,
#         description="ID de OpenAlex del paper principal"
#     ),
#     max_references: Optional[int] = Query(
#         None,
#         description="Cantidad máxima de referencias. Si se deja vacío, trae todas."
#     ),
#     max_citing: Optional[int] = Query(
#         None,
#         description="Cantidad máxima de papers citantes. Si se deja vacío, trae todos."
#     )
# ):
#     graph = build_citation_graph(
#         paper_id,
#         max_references=max_references,
#         max_citing=max_citing
#     )

#     return graph


