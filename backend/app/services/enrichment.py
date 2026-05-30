"""Free, keyless supplements that enrich thin Snusbase results.

- LeakCheck public API: breach source names for an email (no key, rate limited).
- EmailRep.io: email reputation / breach signal (key optional).
- Cert Spotter: certificate-transparency subdomains for a domain (no key).

Each function is best-effort and returns plain dicts the aggregator turns into
records or enrichment items. All synchronous (called from a thread pool).
"""
import logging
from typing import Any

import httpx

from app.core.config import settings
from app.services.validators import registered_domain

logger = logging.getLogger(__name__)


def _client(timeout: float | None = None) -> httpx.Client:
    return httpx.Client(
        timeout=timeout or settings.HTTP_TIMEOUT,
        headers={"User-Agent": settings.HTTP_USER_AGENT},
        follow_redirects=True,
    )


def leakcheck_public(email: str) -> list[dict[str, Any]]:
    """Return breach-source records for an email via LeakCheck's public API."""
    if not settings.ENABLE_LEAKCHECK_PUBLIC:
        return []
    try:
        with _client() as client:
            resp = client.get("https://leakcheck.io/api/public", params={"check": email})
        if resp.status_code == 429:
            return []
        resp.raise_for_status()
        data = resp.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.info("LeakCheck public lookup failed: %s", exc)
        return []

    if not data.get("success") or not data.get("found"):
        return []

    records: list[dict[str, Any]] = []
    for src in data.get("sources", []):
        if isinstance(src, dict):
            name = src.get("name", "unknown")
            date = src.get("date")
        else:
            name, date = str(src), None
        records.append(
            {
                "database": name,
                "breach_date": date,
                "fields": {"email": email, "source": "LeakCheck"},
                "provider": "LeakCheck",
            }
        )
    return records


def emailrep(email: str) -> dict[str, Any] | None:
    """Return an EmailRep reputation summary for an email, if notable."""
    if not settings.ENABLE_EMAILREP:
        return None
    headers = {"Accept": "application/json", "User-Agent": settings.HTTP_USER_AGENT}
    if settings.EMAILREP_API_KEY:
        headers["Key"] = settings.EMAILREP_API_KEY
    try:
        with _client() as client:
            resp = client.get(f"https://emailrep.io/{email}", headers=headers)
        if resp.status_code in (401, 429):
            return None
        resp.raise_for_status()
        data = resp.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.info("EmailRep lookup failed: %s", exc)
        return None

    details = data.get("details", {}) or {}
    return {
        "reputation": data.get("reputation"),
        "suspicious": data.get("suspicious"),
        "references": data.get("references"),
        "credentials_leaked": details.get("credentials_leaked"),
        "data_breach": details.get("data_breach"),
        "profiles": details.get("profiles", []),
        "last_seen": details.get("last_seen"),
    }


def certspotter_subdomains(domain: str) -> list[str]:
    """Return subdomains discovered via certificate transparency (Cert Spotter)."""
    if not settings.ENABLE_CERTSPOTTER:
        return []
    reg = registered_domain(domain)
    try:
        with _client(timeout=30) as client:
            resp = client.get(
                "https://api.certspotter.com/v1/issuances",
                params={
                    "domain": reg,
                    "include_subdomains": "true",
                    "expand": "dns_names",
                },
            )
        if resp.status_code == 429:
            return []
        resp.raise_for_status()
        issuances = resp.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.info("Cert Spotter lookup failed: %s", exc)
        return []

    subs: set[str] = set()
    for issuance in issuances:
        for name in issuance.get("dns_names", []) or []:
            name = name.strip().lstrip("*.").lower()
            if name.endswith(reg):
                subs.add(name)
    return sorted(subs)
