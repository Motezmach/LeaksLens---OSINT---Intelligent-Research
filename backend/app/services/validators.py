"""Input validation and normalization for multi-type search terms."""
import ipaddress
import re

import tldextract

from app.models.search import SearchType

# Pragmatic email regex (RFC 5322 is overkill for our purposes).
EMAIL_RE = re.compile(
    r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?"
    r"(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$"
)

# Domain (no scheme, no path).
DOMAIN_RE = re.compile(
    r"^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+"
    r"[a-zA-Z]{2,63}$"
)

# Hex hash (md5/sha1/sha256/...) - 16 to 128 hex chars.
HASH_RE = re.compile(r"^[a-fA-F0-9]{16,128}$")

# tldextract offline (no remote suffix-list fetch) for reproducible runs.
_extract = tldextract.TLDExtract(suffix_list_urls=())


class InvalidSearchTerm(ValueError):
    """Raised when a search term does not match its declared type."""


def normalize_term(term: str, term_type: SearchType) -> str:
    term = term.strip()
    # Case-insensitive identifiers; passwords stay verbatim.
    if term_type in (SearchType.EMAIL, SearchType.DOMAIN, SearchType.USERNAME):
        return term.lower()
    return term


def validate_term(term: str, term_type: SearchType, wildcard: bool = False) -> str:
    """Validate a single term against its declared type. Returns the term.

    With wildcard enabled we relax strict format checks (the user is searching
    patterns like ``%@gmail.com``), only enforcing a minimum length.
    """
    term = term.strip()
    if not term:
        raise InvalidSearchTerm("Search term cannot be empty.")
    if len(term) > 320:
        raise InvalidSearchTerm("Search term is too long.")

    if wildcard:
        if len(term) < 3:
            raise InvalidSearchTerm("Wildcard searches need at least 3 characters.")
        return term

    if term_type == SearchType.EMAIL:
        if not EMAIL_RE.match(term.lower()):
            raise InvalidSearchTerm("Not a valid email address.")
    elif term_type == SearchType.DOMAIN:
        if not DOMAIN_RE.match(term.lower()):
            raise InvalidSearchTerm("Not a valid domain name.")
    elif term_type == SearchType.IP:
        try:
            ipaddress.ip_address(term)
        except ValueError:
            raise InvalidSearchTerm("Not a valid IP address.")
    elif term_type == SearchType.HASH:
        if not HASH_RE.match(term):
            raise InvalidSearchTerm("Not a valid hash (expected 16-128 hex chars).")
    elif term_type in (SearchType.USERNAME, SearchType.NAME, SearchType.PASSWORD):
        if len(term) < 2:
            raise InvalidSearchTerm("Search term is too short.")
    else:  # pragma: no cover - defensive
        raise InvalidSearchTerm("Unsupported search type.")
    return term


def parse_terms(raw: str, term_type: SearchType, wildcard: bool = False) -> list[str]:
    """Split a comma-separated input into validated, de-duplicated terms."""
    parts = [p for p in (s.strip() for s in raw.split(",")) if p]
    if not parts:
        raise InvalidSearchTerm("Enter at least one search term.")
    if len(parts) > 25:
        raise InvalidSearchTerm("Too many terms (max 25 per search).")
    seen: list[str] = []
    for p in parts:
        validated = normalize_term(validate_term(p, term_type, wildcard), term_type)
        if validated not in seen:
            seen.append(validated)
    return seen


def registered_domain(domain: str) -> str:
    """Return the registrable domain (e.g. 'example.com' from 'a.b.example.com')."""
    ext = _extract(domain)
    if ext.domain and ext.suffix:
        return f"{ext.domain}.{ext.suffix}".lower()
    return domain.lower()
