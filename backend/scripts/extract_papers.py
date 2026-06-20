# =========================================================
# EXTRACCIÓN DE METADATOS ACADÉMICOS — OPENALEX
# Búsqueda paginada + filtros + lista completa de referencias/citantes
# =========================================================
import math
import requests

OPENALEX_WORKS_URL = "https://api.openalex.org/works"
OPENALEX_AUTOCOMPLETE_URL = "https://api.openalex.org/autocomplete/works"


def reconstruct_abstract(inverted_index):
    if not inverted_index:
        return ""

    word_positions = []

    for word, positions in inverted_index.items():
        for pos in positions:
            word_positions.append((pos, word))

    word_positions.sort()

    return " ".join([word for pos, word in word_positions])


def get_short_openalex_id(openalex_id):
    if not openalex_id:
        return ""

    return str(openalex_id).rstrip("/").split("/")[-1]


def normalize_paper(paper):
    if not paper:
        return None

    authors = []
    institutions = []

    for auth in paper.get("authorships", []):
        author_name = auth.get("author", {}).get("display_name", "")

        if author_name:
            authors.append(author_name)

        for inst in auth.get("institutions", []):
            inst_name = inst.get("display_name", "")

            if inst_name:
                institutions.append(inst_name)

    authors = list(dict.fromkeys(authors))
    institutions = list(dict.fromkeys(institutions))

    topics = []

    for topic in paper.get("topics", []):
        topic_name = topic.get("display_name", "")

        if topic_name:
            topics.append(topic_name)

    primary_location = paper.get("primary_location") or {}
    source = primary_location.get("source") or {}
    open_access_data = paper.get("open_access") or {}

    return {
        "paper_id": paper.get("id", ""),
        "id": paper.get("id", ""),
        "title": paper.get("title", ""),
        "label": paper.get("title", ""),
        "doi": paper.get("doi", ""),
        "year": paper.get("publication_year", ""),
        "publication_date": paper.get("publication_date", ""),
        "language": paper.get("language", ""),
        "type": paper.get("type", ""),
        "abstract": reconstruct_abstract(paper.get("abstract_inverted_index")),
        "citation_count": paper.get("cited_by_count", 0),
        "references_count": len(paper.get("referenced_works", [])),
        "references": paper.get("referenced_works", []),
        "authors": authors,
        "institutions": institutions,
        "journal": source.get("display_name", ""),
        "publisher": source.get("host_organization_name", ""),
        "issn": source.get("issn_l", ""),
        "topics": topics,
        "open_access": open_access_data.get("is_oa", False),
        "pdf_url": open_access_data.get("oa_url", ""),
    }


def search_papers(
    query,
    page=1,
    per_page=10,
    year_from="",
    year_to="",
    author="",
    area="",
    min_citations=0,
):
    try:
        search_text = query.strip()

        if author and author.strip():
            search_text += f" {author.strip()}"

        if area and area.strip() and area != "all":
            search_text += f" {area.strip()}"

        filters = []

        if year_from:
            filters.append(f"from_publication_date:{year_from}-01-01")

        if year_to:
            filters.append(f"to_publication_date:{year_to}-12-31")

        if min_citations and int(min_citations) > 0:
            filters.append(f"cited_by_count:>{int(min_citations)}")

        params = {
            "search": search_text,
            "page": int(page),
            "per-page": int(per_page),
            # "sort": "cited_by_count:desc",
        }

        if filters:
            params["filter"] = ",".join(filters)

        response = requests.get(
            OPENALEX_WORKS_URL,
            params=params,
            timeout=20,
        )

        if response.status_code != 200:
            return {
                "query": query,
                "page": int(page),
                "per_page": int(per_page),
                "total_results": 0,
                "total_pages": 0,
                "papers": [],
                "error": f"OpenAlex respondió con estado {response.status_code}",
            }

        data = response.json()
        meta = data.get("meta", {})
        total_results = meta.get("count", 0)
        total_pages = math.ceil(total_results / int(per_page)) if per_page else 0

        papers = [
            normalize_paper(paper)
            for paper in data.get("results", [])
        ]

        papers = [paper for paper in papers if paper]

        return {
            "query": query,
            "page": int(page),
            "per_page": int(per_page),
            "total_results": total_results,
            "total_pages": total_pages,
            "papers": papers,
        }

    except Exception as e:
        return {
            "query": query,
            "page": int(page),
            "per_page": int(per_page),
            "total_results": 0,
            "total_pages": 0,
            "papers": [],
            "error": str(e),
        }


def get_paper_by_id(paper_id):
    try:
        short_id = get_short_openalex_id(paper_id)

        if not short_id:
            return None

        response = requests.get(
            f"{OPENALEX_WORKS_URL}/{short_id}",
            timeout=20,
        )

        if response.status_code != 200:
            return None

        return normalize_paper(response.json())

    except Exception:
        return None


def get_papers_by_ids(openalex_ids):
    """
    Trae varios papers en una sola petición a OpenAlex usando el
    operador OR (|) sobre el filtro 'openalex'. Antes esto se hacía
    con una petición HTTP por cada ID (muy lento con 20+ referencias).
    OpenAlex permite hasta 100 IDs por llamada, así que dividimos
    en lotes de 50 por seguridad.
    """
    openalex_ids = [oid for oid in (openalex_ids or []) if oid]

    if not openalex_ids:
        return []

    BATCH_SIZE = 50
    papers_by_short_id = {}

    for i in range(0, len(openalex_ids), BATCH_SIZE):
        batch = openalex_ids[i : i + BATCH_SIZE]
        short_ids = [get_short_openalex_id(oid) for oid in batch]
        short_ids = [sid for sid in short_ids if sid]

        if not short_ids:
            continue

        try:
            params = {
                "filter": f"openalex:{'|'.join(short_ids)}",
                "per-page": len(short_ids),
            }

            response = requests.get(
                OPENALEX_WORKS_URL,
                params=params,
                timeout=20,
            )

            if response.status_code != 200:
                continue

            data = response.json()

            for raw_paper in data.get("results", []):
                normalized = normalize_paper(raw_paper)

                if normalized and normalized.get("paper_id"):
                    short_id = get_short_openalex_id(normalized["paper_id"])
                    papers_by_short_id[short_id] = normalized

        except Exception as e:
            print("Error obteniendo lote de papers:", e)

    # Devolvemos en el mismo orden en que llegaron los IDs originales,
    # para no perder el orden de relevancia/citas ya calculado afuera.
    ordered_papers = []

    for original_id in openalex_ids:
        short_original = get_short_openalex_id(original_id)
        paper = papers_by_short_id.get(short_original)

        if paper:
            ordered_papers.append(paper)

    return ordered_papers


def get_referenced_papers_paginated(openalex_id, page=1, per_page=20):
    main_paper = get_paper_by_id(openalex_id)

    if not main_paper:
        return {
            "papers": [],
            "total": 0,
            "page": int(page),
            "per_page": int(per_page),
            "total_pages": 0,
        }

    reference_ids = main_paper.get("references", []) or []
    total = len(reference_ids)
    page = int(page)
    per_page = int(per_page)
    total_pages = math.ceil(total / per_page) if per_page else 0

    start = (page - 1) * per_page
    end = start + per_page
    page_reference_ids = reference_ids[start:end]

    papers = get_papers_by_ids(page_reference_ids)

    return {
        "papers": papers,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
    }


def get_citing_papers_paginated(openalex_id, page=1, per_page=20):
    try:
        short_id = get_short_openalex_id(openalex_id)

        if not short_id:
            return {
                "papers": [],
                "total": 0,
                "page": int(page),
                "per_page": int(per_page),
                "total_pages": 0,
            }

        page = int(page)
        per_page = int(per_page)

        params = {
            "filter": f"cites:{short_id}",
            "page": page,
            "per-page": per_page,
            "sort": "cited_by_count:desc",
        }

        response = requests.get(
            OPENALEX_WORKS_URL,
            params=params,
            timeout=20,
        )

        if response.status_code != 200:
            return {
                "papers": [],
                "total": 0,
                "page": page,
                "per_page": per_page,
                "total_pages": 0,
                "error": f"OpenAlex respondió con estado {response.status_code}",
            }

        data = response.json()
        meta = data.get("meta", {})
        total = meta.get("count", 0)
        total_pages = math.ceil(total / per_page) if per_page else 0

        papers = [
            normalize_paper(result)
            for result in data.get("results", [])
            if result
        ]

        papers = [paper for paper in papers if paper]

        return {
            "papers": papers,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
        }

    except Exception as e:
        return {
            "papers": [],
            "total": 0,
            "page": int(page),
            "per_page": int(per_page),
            "total_pages": 0,
            "error": str(e),
        }


def get_network_papers(
    paper_id,
    references_page=1,
    references_per_page=20,
    citing_page=1,
    citing_per_page=20,
):
    main_paper = get_paper_by_id(paper_id)

    references = get_referenced_papers_paginated(
        paper_id,
        page=references_page,
        per_page=references_per_page,
    )

    citing_papers = get_citing_papers_paginated(
        paper_id,
        page=citing_page,
        per_page=citing_per_page,
    )

    return {
        "main_paper": main_paper,
        "references": references,
        "citing_papers": citing_papers,
    }


# =========================================================
# SUGERENCIAS DE BÚSQUEDA — USA EL MISMO MOTOR QUE search_papers
# En vez del endpoint /autocomplete (que mezcla datasets, scripts,
# multimedia, etc.), usamos /works?search=, el mismo motor de
# búsqueda real, pidiendo pocos resultados y ordenados por citas.
# Así las sugerencias SON papers reales y consistentes con los
# resultados que vas a ver al hacer la búsqueda completa.
# =========================================================
def get_search_suggestions(query, limit=6):
    try:
        query = (query or "").strip()

        if len(query) < 2:
            return {
                "query": query,
                "suggestions": [],
            }

        params = {
            "search": query,
            "page": 1,
            "per-page": int(limit),
            "sort": "relevance_score:desc",
        }

        response = requests.get(
            OPENALEX_WORKS_URL,
            params=params,
            timeout=10,
        )

        if response.status_code != 200:
            return {
                "query": query,
                "suggestions": [],
                "error": f"OpenAlex respondió con estado {response.status_code}",
            }

        data = response.json()
        results = data.get("results", [])

        suggestions = []

        for result in results:
            normalized = normalize_paper(result)

            if not normalized or not normalized.get("title"):
                continue

            authors = normalized.get("authors") or []
            hint = ", ".join(authors[:2]) if authors else ""

            suggestions.append({
                "paper_id": normalized.get("paper_id", ""),
                "title": normalized.get("title", ""),
                "year": normalized.get("year", ""),
                "citation_count": normalized.get("citation_count", 0),
                "hint": hint,
            })

        return {
            "query": query,
            "suggestions": suggestions,
        }

    except Exception as e:
        return {
            "query": query,
            "suggestions": [],
            "error": str(e),
        }


# Mantengo esta función para que build_graph.py siga funcionando sin cambios.
def get_citing_papers(openalex_id, max_citing_papers=20):
    result = get_citing_papers_paginated(
        openalex_id,
        page=1,
        per_page=max_citing_papers,
    )

    return result.get("papers", [])