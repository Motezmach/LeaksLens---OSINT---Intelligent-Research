"""Snusbase API client - the primary leak-data engine.

Covers /data/search (email, username, ip, password, hash, name, domain) plus
the IP and domain WHOIS tools. The activation code is sent in the ``Auth``
header. Every call is best-effort: network/auth errors yield empty results
rather than failing the whole search.
"""
import logging
from typing import Any

import httpx

from app.core.config import settings
from app.models.search import SearchType

logger = logging.getLogger(__name__)

# Map our search types to Snusbase's field names.
TYPE_MAP: dict[SearchType, str] = {
    SearchType.EMAIL: "email",
    SearchType.USERNAME: "username",
    SearchType.IP: "lastip",
    SearchType.PASSWORD: "password",
    SearchType.HASH: "hash",
    SearchType.NAME: "name",
    SearchType.DOMAIN: "_domain",
}


def is_configured() -> bool:
    return bool(settings.SNUSBASE_API_KEY)


def _client() -> httpx.Client:
    return httpx.Client(
        base_url=settings.SNUSBASE_API_URL.rstrip("/"),
        timeout=settings.HTTP_TIMEOUT,
        headers={
            "Auth": settings.SNUSBASE_API_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )


def _post(path: str, body: dict[str, Any]) -> dict[str, Any] | None:
    if not is_configured():
        logger.warning("Snusbase API key not configured; skipping %s", path)
        return None
    try:
        with _client() as client:
            resp = client.post(path, json=body)
        if resp.status_code == 401:
            logger.error("Snusbase rejected the API key (401).")
            return None
        if resp.status_code == 429:
            logger.warning("Snusbase rate limit hit (429).")
            return None
        resp.raise_for_status()
        return resp.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.info("Snusbase %s failed: %s", path, exc)
        return None


def search(terms: list[str], term_type: SearchType, wildcard: bool = False) -> dict[str, Any] | None:
    """POST /data/search. Returns the raw Snusbase payload or None."""
    body: dict[str, Any] = {
        "terms": terms,
        "types": [TYPE_MAP[term_type]],
    }
    if wildcard:
        body["wildcard"] = True
    return _post("/data/search", body)


def domain_whois(domains: list[str]) -> dict[str, Any] | None:
    """POST /tools/domain-whois. Registration / RDAP info for domains."""
    return _post("/tools/domain-whois", {"terms": domains})


def ip_whois(ips: list[str]) -> dict[str, Any] | None:
    """POST /tools/ip-whois. Geolocation / ISP info for IP addresses."""
    return _post("/tools/ip-whois", {"terms": ips})
