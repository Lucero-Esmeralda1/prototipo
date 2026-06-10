# =========================================================
# EXTRACCIÓN DE METADATOS ACADÉMICOS — OPENALEX
# Adaptado para ser usado como módulo por FastAPI
# =========================================================




# =========================================================
# EXTRACCIÓN DE METADATOS ACADÉMICOS — OPENALEX
# Búsqueda paginada + filtros para FastAPI
# =========================================================
import math
import requests

OPENALEX_WORKS_URL = "https://api.openalex.org/works"


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


def get_citing_papers(openalex_id, max_citing_papers=20):
    try:
        short_id = get_short_openalex_id(openalex_id)

        if not short_id:
            return []

        params = {
            "filter": f"cites:{short_id}",
            "per-page": max_citing_papers,
            "sort": "cited_by_count:desc",
        }

        response = requests.get(
            OPENALEX_WORKS_URL,
            params=params,
            timeout=20,
        )

        if response.status_code != 200:
            return []

        data = response.json()

        return [
            normalize_paper(result)
            for result in data.get("results", [])
            if result
        ]

    except Exception:
        return []


# import requests
# from pyalex import Works


# def reconstruct_abstract(inverted_index):
#     if not inverted_index:
#         return ""

#     word_positions = []

#     for word, positions in inverted_index.items():
#         for pos in positions:
#             word_positions.append((pos, word))

#     word_positions.sort()

#     return " ".join([word for pos, word in word_positions])


# def extract_authors(paper):
#     authors = []

#     for auth in paper.get("authorships", []):
#         author_name = auth.get("author", {}).get("display_name", "")

#         if author_name:
#             authors.append(author_name)

#     return list(set(authors))


# def extract_institutions(paper):
#     institutions = []

#     for auth in paper.get("authorships", []):
#         for inst in auth.get("institutions", []):
#             inst_name = inst.get("display_name", "")

#             if inst_name:
#                 institutions.append(inst_name)

#     return list(set(institutions))


# def extract_topics(paper):
#     topics = []

#     for topic in paper.get("topics", []):
#         topic_name = topic.get("display_name", "")

#         if topic_name:
#             topics.append(topic_name)

#     return topics


# def format_paper(paper):
#     primary_location = paper.get("primary_location") or {}
#     source = primary_location.get("source") or {}
#     open_access = paper.get("open_access") or {}

#     return {
#         "paper_id": paper.get("id", ""),
#         "title": paper.get("title", ""),
#         "doi": paper.get("doi", ""),
#         "year": paper.get("publication_year", ""),
#         "publication_date": paper.get("publication_date", ""),
#         "language": paper.get("language", ""),
#         "type": paper.get("type", ""),
#         "abstract": reconstruct_abstract(
#             paper.get("abstract_inverted_index")
#         ),
#         "citation_count": paper.get("cited_by_count", 0),
#         "references_count": len(paper.get("referenced_works", [])),
#         "references": paper.get("referenced_works", []),
#         "authors": extract_authors(paper),
#         "institutions": extract_institutions(paper),
#         "journal": source.get("display_name", ""),
#         "publisher": source.get("host_organization_name", ""),
#         "issn": source.get("issn_l", ""),
#         "topics": extract_topics(paper),
#         "open_access": open_access.get("is_oa", False),
#         "pdf_url": open_access.get("oa_url", "")
#     }


# def search_papers(query, max_results=10):
#     results = Works().search(query).get(per_page=max_results)

#     papers = []

#     for paper in results:
#         papers.append(format_paper(paper))

#     return papers


# def get_paper_by_id(openalex_id):
#     paper = Works()[openalex_id]
#     return format_paper(paper)

# def get_citing_papers(openalex_id, max_citing_papers=None):
#     try:
#         short_id = openalex_id.split("/")[-1]

#         citing_papers = []
#         cursor = "*"
#         per_page = 200

#         while True:
#             params = {
#                 "filter": f"cites:{short_id}",
#                 "per-page": per_page,
#                 "cursor": cursor
#             }

#             response = requests.get(
#                 "https://api.openalex.org/works",
#                 params=params,
#                 timeout=30
#             )

#             if response.status_code != 200:
#                 break

#             data = response.json()
#             results = data.get("results", [])

#             if not results:
#                 break

#             for result in results:
#                 citing_papers.append({
#                     "id": result.get("id", ""),
#                     "title": result.get("title", ""),
#                     "doi": result.get("doi", ""),
#                     "year": result.get("publication_year", ""),
#                     "citation_count": result.get("cited_by_count", 0)
#                 })

#                 if max_citing_papers is not None and len(citing_papers) >= max_citing_papers:
#                     return citing_papers

#             next_cursor = data.get("meta", {}).get("next_cursor")

#             if not next_cursor or next_cursor == cursor:
#                 break

#             cursor = next_cursor

#         return citing_papers

#     except Exception as e:
#         print("Error obteniendo papers citantes:", e)
#         return []
    
    