"""Search-related Pydantic schemas."""
import uuid
from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.search import SearchType


class SearchRequest(BaseModel):
    term: str = Field(min_length=2, max_length=512)
    type: SearchType = SearchType.EMAIL
    wildcard: bool = False


class LeakRecord(BaseModel):
    """A single leaked record returned from a source database."""

    id: str
    database: str
    database_label: str
    breach_date: Optional[str] = None
    provider: str
    severity: str
    has_password: bool = False
    email: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    hash: Optional[str] = None
    name: Optional[str] = None
    ip: Optional[str] = None
    fields: dict[str, Any] = Field(default_factory=dict)


class EnrichmentItem(BaseModel):
    """Supplementary context (subdomains, reputation, WHOIS, ...)."""

    source: str
    kind: str
    title: str
    summary: str
    data: dict[str, Any] = Field(default_factory=dict)


class SearchResponse(BaseModel):
    terms: List[str]
    type: SearchType
    wildcard: bool
    total: int
    database_count: int
    took_ms: float
    records: List[LeakRecord]
    enrichment: List[EnrichmentItem] = Field(default_factory=list)
    snusbase_configured: bool = True
    query_id: Optional[str] = None


class SearchHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    term: str
    term_type: str
    result_count: int
    created_at: datetime
