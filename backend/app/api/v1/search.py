"""Search endpoint: query Snusbase + free supplements in real time."""
import asyncio
import logging

from fastapi import APIRouter, HTTPException, Request, status

from app.api.deps import DBSession, SearchUser
from app.core.config import settings
from app.core.rate_limit import limiter
from app.models.search import SearchQuery
from app.schemas.search import SearchRequest, SearchResponse
from app.services.aggregator import run_search
from app.services.validators import InvalidSearchTerm, parse_terms

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("", response_model=SearchResponse)
@limiter.limit(f"{settings.SEARCH_RATE_LIMIT_PER_MINUTE}/minute")
async def search(
    request: Request,
    payload: SearchRequest,
    current_user: SearchUser,
    db: DBSession,
) -> SearchResponse:
    try:
        terms = parse_terms(payload.term, payload.type, payload.wildcard)
    except InvalidSearchTerm as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        )

    # The aggregator is synchronous (sync httpx + thread pool); offload it so we
    # don't block the event loop.
    result = await asyncio.to_thread(run_search, terms, payload.type, payload.wildcard)

    record = SearchQuery(
        owner_id=current_user.id,
        term=", ".join(terms),
        term_type=payload.type.value,
        result_count=result["total"],
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    return SearchResponse(
        terms=terms,
        type=payload.type,
        wildcard=payload.wildcard,
        total=result["total"],
        database_count=result["database_count"],
        took_ms=result["took_ms"],
        records=result["records"],
        enrichment=result["enrichment"],
        snusbase_configured=result["snusbase_configured"],
        query_id=str(record.id),
    )
