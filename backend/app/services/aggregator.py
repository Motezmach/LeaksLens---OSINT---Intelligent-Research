"""Orchestrate a search across Snusbase + free supplements and shape results.

Synchronous on purpose (all providers use httpx sync clients); the API layer
runs it in a worker thread. Providers run concurrently via a small thread pool.
"""
import hashlib
import logging
import re
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from app.models.search import SearchType
from app.services import enrichment, snusbase

logger = logging.getLogger(__name__)

# Fields we surface as "critical" in the UI, in priority order.
CRITICAL_FIELDS = ("password", "hash", "email", "username", "name", "lastip", "ip")

# Trailing date token in Snusbase table names, e.g. ..._012026 (MMYYYY).
_DATE_TOKEN = re.compile(r"^(0[1-9]|1[0-2])(\d{4})$")
_SIZE_TOKEN = re.compile(r"^\d+(\.\d+)?[KMB]$", re.IGNORECASE)


def _record_id(database: str, fields: dict[str, Any]) -> str:
    raw = database + "|" + "|".join(f"{k}={v}" for k, v in sorted(fields.items()))
    return hashlib.sha1(raw.encode("utf-8", "ignore")).hexdigest()[:16]


def _parse_database(name: str) -> dict[str, Any]:
    """Turn a Snusbase table name into a readable label + breach date."""
    tokens = name.split("_")
    breach_date: str | None = None
    label_parts: list[str] = []
    for tok in tokens:
        m = _DATE_TOKEN.match(tok)
        if m:
            breach_date = f"{m.group(2)}-{m.group(1)}"
            continue
        if tok.isdigit() and len(tok) <= 4:  # leading index like "0001"
            continue
        if _SIZE_TOKEN.match(tok):
            continue
        label_parts.append(tok.capitalize())
    label = " ".join(label_parts) or name
    return {"database_label": label, "breach_date": breach_date}


def _severity(fields: dict[str, Any]) -> str:
    if fields.get("password") or fields.get("hash"):
        return "critical"
    pii = any(fields.get(k) for k in ("name", "lastip", "ip", "phone", "address", "dob"))
    if fields.get("email") and pii:
        return "high"
    if fields.get("email") or fields.get("username"):
        return "medium"
    return "low"


def _build_record(database: str, fields: dict[str, Any], provider: str = "Snusbase") -> dict[str, Any]:
    clean = {k: v for k, v in fields.items() if v not in (None, "", [])}
    meta = _parse_database(database)
    ip = clean.get("lastip") or clean.get("ip")
    return {
        "id": _record_id(database, clean),
        "database": database,
        "database_label": meta["database_label"],
        "breach_date": meta["breach_date"],
        "provider": provider,
        "severity": _severity(clean),
        "has_password": bool(clean.get("password") or clean.get("hash")),
        "email": clean.get("email"),
        "username": clean.get("username"),
        "password": clean.get("password"),
        "hash": clean.get("hash"),
        "name": clean.get("name"),
        "ip": ip,
        "fields": clean,
    }


def _records_from_snusbase(payload: dict[str, Any] | None) -> list[dict[str, Any]]:
    if not payload:
        return []
    records: list[dict[str, Any]] = []
    results = payload.get("results", {}) or {}
    for database, rows in results.items():
        if not isinstance(rows, list):
            continue
        for row in rows:
            if isinstance(row, dict):
                records.append(_build_record(database, row))
    return records


def _email_supplements(terms: list[str]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    records: list[dict[str, Any]] = []
    items: list[dict[str, Any]] = []
    for term in terms[:5]:
        for rec in enrichment.leakcheck_public(term):
            records.append(
                _build_record(rec["database"], rec["fields"], provider="LeakCheck")
                | {"breach_date": _normalize_date(rec.get("breach_date"))}
            )
        rep = enrichment.emailrep(term)
        if rep and (rep.get("credentials_leaked") or rep.get("data_breach") or rep.get("suspicious")):
            items.append(
                {
                    "source": "EmailRep.io",
                    "kind": "reputation",
                    "title": f"Reputation for {term}",
                    "summary": (
                        f"reputation={rep.get('reputation')}, "
                        f"breach={rep.get('data_breach')}, "
                        f"leaked_credentials={rep.get('credentials_leaked')}"
                    ),
                    "data": rep,
                }
            )
    return records, items


def _normalize_date(value: str | None) -> str | None:
    if not value:
        return None
    value = value.strip()
    if len(value) == 4:
        return f"{value}-01"
    return value[:7] if len(value) >= 7 else value


def _domain_enrichment(terms: list[str]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for term in terms[:5]:
        subs = enrichment.certspotter_subdomains(term)
        if subs:
            items.append(
                {
                    "source": "Cert Spotter",
                    "kind": "subdomains",
                    "title": f"{len(subs)} subdomains for {term}",
                    "summary": ", ".join(subs[:12]) + ("..." if len(subs) > 12 else ""),
                    "data": {"subdomains": subs},
                }
            )
    whois = snusbase.domain_whois(terms)
    if whois and whois.get("results"):
        for key, info in whois["results"].items():
            if isinstance(info, dict):
                reg = info.get("registrar", {}) or {}
                items.append(
                    {
                        "source": "Domain WHOIS",
                        "kind": "whois",
                        "title": f"WHOIS: {key}",
                        "summary": (
                            f"registrar={reg.get('name', 'n/a')}, "
                            f"created={(info.get('dates') or {}).get('created', 'n/a')}"
                        ),
                        "data": info,
                    }
                )
    return items


def _ip_enrichment(terms: list[str]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    whois = snusbase.ip_whois(terms)
    if whois and whois.get("results"):
        for key, info in whois["results"].items():
            if isinstance(info, dict):
                items.append(
                    {
                        "source": "IP WHOIS",
                        "kind": "whois",
                        "title": f"WHOIS: {key}",
                        "summary": (
                            f"{info.get('city', '')} {info.get('country', '')} "
                            f"- {info.get('isp', 'unknown ISP')}"
                        ).strip(),
                        "data": info,
                    }
                )
    return items


def run_search(terms: list[str], term_type: SearchType, wildcard: bool = False) -> dict[str, Any]:
    """Run the full search and return a shaped result dict."""
    started = time.perf_counter()

    with ThreadPoolExecutor(max_workers=4) as pool:
        snus_future = pool.submit(snusbase.search, terms, term_type, wildcard)

        supplement_future = None
        enrich_future = None
        if term_type == SearchType.EMAIL and not wildcard:
            supplement_future = pool.submit(_email_supplements, terms)
        elif term_type == SearchType.DOMAIN and not wildcard:
            enrich_future = pool.submit(_domain_enrichment, terms)
        elif term_type == SearchType.IP and not wildcard:
            enrich_future = pool.submit(_ip_enrichment, terms)

        payload = snus_future.result()
        records = _records_from_snusbase(payload)
        enrichment_items: list[dict[str, Any]] = []

        if supplement_future is not None:
            extra_records, extra_items = supplement_future.result()
            records.extend(extra_records)
            enrichment_items.extend(extra_items)
        if enrich_future is not None:
            enrichment_items.extend(enrich_future.result())

    # De-duplicate records by id.
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []
    for rec in records:
        if rec["id"] in seen:
            continue
        seen.add(rec["id"])
        unique.append(rec)

    # Sort: critical first, then records with passwords, then by database.
    sev_rank = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
    unique.sort(key=lambda r: (sev_rank.get(r["severity"], 5), r["database_label"]))

    databases = {r["database"] for r in unique}
    took_ms = round((time.perf_counter() - started) * 1000, 1)

    return {
        "records": unique,
        "enrichment": enrichment_items,
        "total": len(unique),
        "database_count": len(databases),
        "took_ms": took_ms,
        "snusbase_configured": snusbase.is_configured(),
    }
