# =========================================================
# EXTRACCIÓN DE METADATOS ACADÉMICOS — OPENALEX
# Adaptado para ser usado como módulo por FastAPI
# =========================================================

import requests
from pyalex import Works


def reconstruct_abstract(inverted_index):
    if not inverted_index:
        return ""

    word_positions = []

    for word, positions in inverted_index.items():
        for pos in positions:
            word_positions.append((pos, word))

    word_positions.sort()

    return " ".join([word for pos, word in word_positions])


def extract_authors(paper):
    authors = []

    for auth in paper.get("authorships", []):
        author_name = auth.get("author", {}).get("display_name", "")

        if author_name:
            authors.append(author_name)

    return list(set(authors))


def extract_institutions(paper):
    institutions = []

    for auth in paper.get("authorships", []):
        for inst in auth.get("institutions", []):
            inst_name = inst.get("display_name", "")

            if inst_name:
                institutions.append(inst_name)

    return list(set(institutions))


def extract_topics(paper):
    topics = []

    for topic in paper.get("topics", []):
        topic_name = topic.get("display_name", "")

        if topic_name:
            topics.append(topic_name)

    return topics


def format_paper(paper):
    primary_location = paper.get("primary_location") or {}
    source = primary_location.get("source") or {}
    open_access = paper.get("open_access") or {}

    return {
        "paper_id": paper.get("id", ""),
        "title": paper.get("title", ""),
        "doi": paper.get("doi", ""),
        "year": paper.get("publication_year", ""),
        "publication_date": paper.get("publication_date", ""),
        "language": paper.get("language", ""),
        "type": paper.get("type", ""),
        "abstract": reconstruct_abstract(
            paper.get("abstract_inverted_index")
        ),
        "citation_count": paper.get("cited_by_count", 0),
        "references_count": len(paper.get("referenced_works", [])),
        "references": paper.get("referenced_works", []),
        "authors": extract_authors(paper),
        "institutions": extract_institutions(paper),
        "journal": source.get("display_name", ""),
        "publisher": source.get("host_organization_name", ""),
        "issn": source.get("issn_l", ""),
        "topics": extract_topics(paper),
        "open_access": open_access.get("is_oa", False),
        "pdf_url": open_access.get("oa_url", "")
    }


def search_papers(query, max_results=10):
    results = Works().search(query).get(per_page=max_results)

    papers = []

    for paper in results:
        papers.append(format_paper(paper))

    return papers


def get_paper_by_id(openalex_id):
    paper = Works()[openalex_id]
    return format_paper(paper)


def get_citing_papers(openalex_id, max_citing_papers=20):
    try:
        short_id = openalex_id.split("/")[-1]

        url = (
            f"https://api.openalex.org/works"
            f"?filter=cites:{short_id}"
            f"&per-page={max_citing_papers}"
        )

        response = requests.get(url)

        if response.status_code != 200:
            return []

        data = response.json()

        citing_papers = []

        for result in data.get("results", []):
            citing_papers.append({
                "id": result.get("id", ""),
                "title": result.get("title", ""),
                "doi": result.get("doi", ""),
                "year": result.get("publication_year", ""),
                "citation_count": result.get("cited_by_count", 0)
            })

        return citing_papers

    except Exception as e:
        print("Error obteniendo papers citantes:", e)
        return []