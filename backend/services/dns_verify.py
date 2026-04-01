"""DNS verification service for custom domains."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

import dns.resolver

from backend.database import get_db

logger = logging.getLogger("cth.dns")

EXPECTED_CNAME_TARGET = "app.coretruthhouse.com"


async def verify_domain_dns(domain: str) -> dict:
    """Verify CNAME record for a custom domain."""
    try:
        result = await asyncio.to_thread(_dns_lookup, domain)
        return result
    except Exception as e:
        logger.error("DNS verification error for %s: %s", domain, e)
        return {"verified": False, "error": str(e), "records": []}


def _dns_lookup(domain: str) -> dict:
    """Synchronous DNS lookup for CNAME records."""
    try:
        answers = dns.resolver.resolve(domain, "CNAME")
        records = [str(r.target).rstrip(".") for r in answers]
        verified = any(EXPECTED_CNAME_TARGET in r for r in records)
        return {"verified": verified, "records": records, "error": None}
    except dns.resolver.NXDOMAIN:
        return {"verified": False, "records": [], "error": "Domain not found (NXDOMAIN)"}
    except dns.resolver.NoAnswer:
        try:
            answers = dns.resolver.resolve(domain, "A")
            records = [str(r) for r in answers]
            return {"verified": False, "records": records, "error": "No CNAME record found (A records exist)"}
        except Exception:
            return {"verified": False, "records": [], "error": "No DNS records found"}
    except dns.resolver.Timeout:
        return {"verified": False, "records": [], "error": "DNS lookup timed out"}
    except Exception as e:
        return {"verified": False, "records": [], "error": str(e)}


async def run_verification_for_all_pending():
    """Verify DNS for all pending domains (background task)."""
    db = get_db()

    pending = await db.custom_domains.find(
        {"status": {"$in": ["pending_verification", "failed"]}},
        {"_id": 0},
    ).to_list(100)

    for domain_doc in pending:
        domain = domain_doc.get("domain")
        if not domain:
            continue

        result = await verify_domain_dns(domain)
        new_status = "verified" if result["verified"] else "failed"

        await db.custom_domains.update_one(
            {"domain": domain},
            {"$set": {
                "status": new_status,
                "dns_records": result.get("records", []),
                "dns_error": result.get("error"),
                "last_checked": datetime.now(timezone.utc).isoformat(),
            }},
        )
        logger.info("DNS check for %s: %s", domain, new_status)
