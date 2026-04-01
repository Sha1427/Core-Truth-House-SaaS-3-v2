"""SEO Intelligence routes - keyword generation, site audits, competitor analysis, market monitoring."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import logging
import json
import httpx
from bs4 import BeautifulSoup

from backend.database import get_db
from backend.services.ai import generate_with_ai

logger = logging.getLogger("cth.seo")
router = APIRouter(prefix="/api/seo")

CRAWL_TIMEOUT = 15

# ==================
# MODELS
# ==================

class KeywordRequest(BaseModel):
    topic: str
    niche: Optional[str] = ""
    intent: Optional[str] = "mixed"
    count: Optional[int] = 20

class SiteAuditRequest(BaseModel):
    url: str
    user_id: Optional[str] = "default"

class CompetitorRequest(BaseModel):
    user_id: str
    brand_name: Optional[str] = ""
    niche: Optional[str] = ""
    target_audience: Optional[str] = ""

class RankingGapRequest(BaseModel):
    user_id: str
    domain: Optional[str] = ""
    niche: Optional[str] = ""
    competitors: Optional[List[str]] = []

class BacklinkRequest(BaseModel):
    user_id: str
    domain: Optional[str] = ""
    niche: Optional[str] = ""
    content_types: Optional[List[str]] = []

class MarketShiftRequest(BaseModel):
    user_id: str
    niche: Optional[str] = ""
    industry: Optional[str] = ""

# ==================
# KEYWORD GENERATOR (All Plans)
# ==================

@router.post("/keywords/generate")
async def generate_keywords(req: KeywordRequest):
    """AI-powered keyword generation based on topic and niche."""
    prompt = f"""You are an expert SEO strategist. Generate exactly {req.count} keyword ideas for the following:

Topic/Seed: "{req.topic}"
{f'Niche/Industry: "{req.niche}"' if req.niche else ''}
Intent Filter: {req.intent} (informational, transactional, commercial, navigational, or mixed)

For each keyword, provide this data in a structured format:
1. keyword - the exact keyword phrase
2. search_intent - one of: informational, transactional, commercial, navigational
3. difficulty - one of: low, medium, high (estimate based on competitiveness)
4. volume_estimate - one of: low, medium, high, very_high
5. content_angle - a brief 1-sentence suggestion for how to create content around this keyword
6. long_tail_variations - 2-3 long-tail keyword variations

Return the data as a JSON array. Example:
[
  {{
    "keyword": "brand strategy framework",
    "search_intent": "informational",
    "difficulty": "medium",
    "volume_estimate": "medium",
    "content_angle": "Create a step-by-step guide with downloadable template",
    "long_tail_variations": ["brand strategy framework for startups", "how to build a brand strategy framework", "brand strategy framework template"]
  }}
]

Return ONLY the JSON array, no additional text."""

    try:
        result = await generate_with_ai(prompt)
        # Parse JSON from AI response
        cleaned = result.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            cleaned = cleaned.rsplit("```", 1)[0]
        keywords = json.loads(cleaned)
        return {"keywords": keywords, "topic": req.topic, "count": len(keywords)}
    except json.JSONDecodeError:
        # Return raw text if JSON parsing fails
        return {"keywords": [], "raw_suggestions": result, "topic": req.topic, "count": 0}
    except Exception as e:
        logger.error(f"Keyword generation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate keywords")

# ==================
# SITE AUDIT
# ==================

async def _crawl_site(url: str) -> dict:
    """Crawl a URL and extract SEO-relevant data."""
    audit = {
        "url": url,
        "crawled": False,
        "title": None,
        "meta_description": None,
        "h1_tags": [],
        "h2_tags": [],
        "h3_tags": [],
        "images_without_alt": 0,
        "total_images": 0,
        "internal_links": 0,
        "external_links": 0,
        "has_canonical": False,
        "has_robots_meta": False,
        "has_viewport": False,
        "has_og_tags": False,
        "has_twitter_cards": False,
        "has_structured_data": False,
        "has_sitemap_link": False,
        "word_count": 0,
        "issues": [],
        "score": 0,
    }

    try:
        if not url.startswith("http"):
            url = f"https://{url}"

        async with httpx.AsyncClient(timeout=CRAWL_TIMEOUT, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "CoreTruthHouse-SEO-Audit/1.0"})
            audit["status_code"] = resp.status_code
            audit["crawled"] = True

        soup = BeautifulSoup(resp.text, "html.parser")

        # Title
        title_tag = soup.find("title")
        audit["title"] = title_tag.get_text(strip=True) if title_tag else None
        if not audit["title"]:
            audit["issues"].append({"type": "critical", "message": "Missing page title tag"})
        elif len(audit["title"]) > 60:
            audit["issues"].append({"type": "warning", "message": f"Title too long ({len(audit['title'])} chars, recommended < 60)"})

        # Meta description
        meta_desc = soup.find("meta", attrs={"name": "description"})
        audit["meta_description"] = meta_desc["content"] if meta_desc and meta_desc.get("content") else None
        if not audit["meta_description"]:
            audit["issues"].append({"type": "critical", "message": "Missing meta description"})
        elif len(audit["meta_description"]) > 160:
            audit["issues"].append({"type": "warning", "message": f"Meta description too long ({len(audit['meta_description'])} chars)"})

        # Headings
        audit["h1_tags"] = [h.get_text(strip=True) for h in soup.find_all("h1")]
        audit["h2_tags"] = [h.get_text(strip=True) for h in soup.find_all("h2")][:10]
        audit["h3_tags"] = [h.get_text(strip=True) for h in soup.find_all("h3")][:10]
        if len(audit["h1_tags"]) == 0:
            audit["issues"].append({"type": "critical", "message": "No H1 tag found"})
        elif len(audit["h1_tags"]) > 1:
            audit["issues"].append({"type": "warning", "message": f"Multiple H1 tags found ({len(audit['h1_tags'])})"})

        # Images
        images = soup.find_all("img")
        audit["total_images"] = len(images)
        audit["images_without_alt"] = sum(1 for img in images if not img.get("alt"))
        if audit["images_without_alt"] > 0:
            audit["issues"].append({"type": "warning", "message": f"{audit['images_without_alt']} images missing alt text"})

        # Links
        links = soup.find_all("a", href=True)
        for link in links:
            href = link["href"]
            if href.startswith("http") and url.split("//")[1].split("/")[0] not in href:
                audit["external_links"] += 1
            else:
                audit["internal_links"] += 1

        # Technical SEO checks
        audit["has_canonical"] = bool(soup.find("link", attrs={"rel": "canonical"}))
        if not audit["has_canonical"]:
            audit["issues"].append({"type": "warning", "message": "No canonical URL specified"})

        audit["has_robots_meta"] = bool(soup.find("meta", attrs={"name": "robots"}))
        audit["has_viewport"] = bool(soup.find("meta", attrs={"name": "viewport"}))
        if not audit["has_viewport"]:
            audit["issues"].append({"type": "critical", "message": "Missing viewport meta tag (mobile unfriendly)"})

        audit["has_og_tags"] = bool(soup.find("meta", attrs={"property": lambda x: x and x.startswith("og:")}))
        audit["has_twitter_cards"] = bool(soup.find("meta", attrs={"name": lambda x: x and x.startswith("twitter:")}))
        audit["has_structured_data"] = bool(soup.find("script", attrs={"type": "application/ld+json"}))

        if not audit["has_og_tags"]:
            audit["issues"].append({"type": "info", "message": "No Open Graph tags found (affects social sharing)"})
        if not audit["has_structured_data"]:
            audit["issues"].append({"type": "info", "message": "No structured data (JSON-LD) found"})

        # Word count
        body = soup.find("body")
        if body:
            audit["word_count"] = len(body.get_text(strip=True).split())
            if audit["word_count"] < 300:
                audit["issues"].append({"type": "warning", "message": f"Thin content ({audit['word_count']} words, aim for 300+)"})

        # Score calculation
        score = 100
        for issue in audit["issues"]:
            if issue["type"] == "critical":
                score -= 15
            elif issue["type"] == "warning":
                score -= 8
            elif issue["type"] == "info":
                score -= 3
        audit["score"] = max(0, score)

    except httpx.TimeoutException:
        audit["issues"].append({"type": "critical", "message": "Site took too long to respond (>15s)"})
    except Exception as e:
        audit["issues"].append({"type": "critical", "message": f"Could not crawl: {str(e)}"})

    return audit

@router.post("/site-audit")
async def run_site_audit(req: SiteAuditRequest):
    """Crawl a website and provide SEO audit + AI recommendations."""
    # Step 1: Crawl
    crawl_data = await _crawl_site(req.url)

    # Step 2: AI analysis
    ai_prompt = f"""You are an expert SEO auditor. Based on this crawl data from "{req.url}", provide actionable recommendations.

Crawl Results:
- Title: {crawl_data.get('title', 'Missing')}
- Meta Description: {crawl_data.get('meta_description', 'Missing')}
- H1 Tags: {crawl_data.get('h1_tags', [])}
- Word Count: {crawl_data.get('word_count', 0)}
- Images: {crawl_data.get('total_images', 0)} total, {crawl_data.get('images_without_alt', 0)} missing alt
- Internal Links: {crawl_data.get('internal_links', 0)}, External: {crawl_data.get('external_links', 0)}
- Has Canonical: {crawl_data.get('has_canonical')}, Has Viewport: {crawl_data.get('has_viewport')}
- Has OG Tags: {crawl_data.get('has_og_tags')}, Has Structured Data: {crawl_data.get('has_structured_data')}
- Issues Found: {json.dumps([i['message'] for i in crawl_data.get('issues', [])])}
- Audit Score: {crawl_data.get('score', 0)}/100

Provide your analysis as a JSON object:
{{
  "overall_grade": "A/B/C/D/F",
  "summary": "2-3 sentence overview",
  "quick_wins": ["list of 3-5 easy fixes with highest impact"],
  "technical_fixes": ["list of technical SEO improvements"],
  "content_recommendations": ["list of content improvement suggestions"],
  "competitive_edge": ["list of opportunities to outperform competitors"]
}}

Return ONLY the JSON, no additional text."""

    try:
        ai_result = await generate_with_ai(ai_prompt)
        cleaned = ai_result.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            cleaned = cleaned.rsplit("```", 1)[0]
        ai_analysis = json.loads(cleaned)
    except:
        ai_analysis = {"summary": "AI analysis unavailable", "quick_wins": [], "technical_fixes": [], "content_recommendations": [], "competitive_edge": []}

    # Save audit
    audit_record = {
        "id": str(uuid.uuid4()),
        "user_id": req.user_id,
        "url": req.url,
        "crawl_data": crawl_data,
        "ai_analysis": ai_analysis,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.seo_audits.insert_one(audit_record)

    return {"audit": crawl_data, "analysis": ai_analysis, "id": audit_record["id"]}

@router.get("/site-audits")
async def list_site_audits(user_id: str = "default", limit: int = 10):
    """List past site audits."""
    audits = await db.seo_audits.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return {"audits": audits}
    db = get_db()

# ==================
# RANKING GAP ANALYSIS
# ==================

@router.post("/ranking-gaps")
async def analyze_ranking_gaps(req: RankingGapRequest):
    """AI-powered ranking gap analysis."""
    # Get brand foundation for context
    brand = await db.brand_foundation.find_one({"user_id": req.user_id}, {"_id": 0})
    brand_context = ""
    if brand:
        brand_context = f"Brand: {brand.get('brand_name', '')}, Niche: {brand.get('niche', '')}, Target: {brand.get('target_audience', '')}"
    db = get_db()

    prompt = f"""You are an expert SEO strategist. Perform a ranking gap analysis.

{f'Brand Context: {brand_context}' if brand_context else ''}
{f'Domain: {req.domain}' if req.domain else ''}
{f'Niche: {req.niche}' if req.niche else ''}
{f'Known Competitors: {", ".join(req.competitors)}' if req.competitors else ''}

Identify keyword ranking gaps - topics and keywords where competitors likely rank but this brand probably doesn't. Analyze:
1. High-value keywords the brand should be targeting
2. Content gaps compared to typical competitors in this space
3. Quick-win opportunities (low competition, high relevance)
4. Long-tail opportunities

Return as JSON:
{{
  "summary": "2-3 sentence overview of the gap analysis",
  "high_value_gaps": [
    {{"keyword": "...", "estimated_difficulty": "low/medium/high", "priority": "high/medium/low", "content_suggestion": "...", "competitor_advantage": "..."}}
  ],
  "content_gaps": [
    {{"topic": "...", "why_important": "...", "content_type": "blog/guide/video/tool", "estimated_impact": "high/medium/low"}}
  ],
  "quick_wins": [
    {{"keyword": "...", "reason": "...", "action": "..."}}
  ],
  "long_tail_opportunities": [
    {{"keyword": "...", "intent": "...", "content_angle": "..."}}
  ]
}}

Return ONLY the JSON."""

    try:
        result = await generate_with_ai(prompt)
        cleaned = result.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            cleaned = cleaned.rsplit("```", 1)[0]
        analysis = json.loads(cleaned)
        return {"analysis": analysis}
    except json.JSONDecodeError:
        return {"analysis": {"summary": result[:500]}, "raw": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================
# BACKLINK OPPORTUNITIES
# ==================

@router.post("/backlink-opportunities")
async def find_backlink_opportunities(req: BacklinkRequest):
    """AI-powered backlink opportunity discovery."""
    brand = await db.brand_foundation.find_one({"user_id": req.user_id}, {"_id": 0})
    brand_context = ""
    if brand:
        brand_context = f"Brand: {brand.get('brand_name', '')}, Niche: {brand.get('niche', '')}"
    db = get_db()

    prompt = f"""You are an expert link-building strategist. Identify the top backlink opportunities.

{f'Brand Context: {brand_context}' if brand_context else ''}
{f'Domain: {req.domain}' if req.domain else ''}
{f'Niche: {req.niche}' if req.niche else ''}

Provide actionable backlink strategies and specific types of opportunities. Return as JSON:
{{
  "summary": "2-3 sentence backlink opportunity overview",
  "strategies": [
    {{
      "strategy": "strategy name",
      "description": "what to do",
      "difficulty": "easy/medium/hard",
      "impact": "high/medium/low",
      "examples": ["specific examples of sites/resources to target"],
      "outreach_template": "brief email pitch concept"
    }}
  ],
  "content_ideas_for_links": [
    {{"type": "...", "title_idea": "...", "why_linkable": "...", "target_sites": ["..."]}}
  ],
  "quick_wins": [
    {{"opportunity": "...", "action": "...", "expected_links": "1-5/5-20/20+"}}
  ],
  "resource_pages": [
    {{"type": "...", "description": "...", "how_to_get_listed": "..."}}
  ]
}}

Return ONLY the JSON."""

    try:
        result = await generate_with_ai(prompt)
        cleaned = result.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            cleaned = cleaned.rsplit("```", 1)[0]
        analysis = json.loads(cleaned)
        return {"analysis": analysis}
    except json.JSONDecodeError:
        return {"analysis": {"summary": result[:500]}, "raw": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================
# COMPETITOR POSITIONING
# ==================

@router.post("/competitor-analysis")
async def analyze_competitors(req: CompetitorRequest):
    """AI-powered competitor analysis using brand foundation data."""
    brand = await db.brand_foundation.find_one({"user_id": req.user_id}, {"_id": 0})
    brand_context = ""
    if brand:
        brand_context = f"""Brand Name: {brand.get('brand_name', req.brand_name)}
    db = get_db()
Niche: {brand.get('niche', req.niche)}
Target Audience: {brand.get('target_audience', req.target_audience)}
Mission: {brand.get('mission', '')}
Positioning: {brand.get('positioning', '')}"""

    prompt = f"""You are a competitive intelligence expert. Based on this brand's foundation data, identify and analyze their likely competitors.

{brand_context if brand_context else f'Brand: {req.brand_name}, Niche: {req.niche}, Target: {req.target_audience}'}

Tasks:
1. Identify 5-7 likely competitors (both direct and indirect)
2. Analyze each competitor's positioning
3. Find the brand's unique advantages
4. Identify market opportunities

Return as JSON:
{{
  "summary": "2-3 sentence competitive landscape overview",
  "competitors": [
    {{
      "name": "competitor name",
      "type": "direct/indirect/adjacent",
      "positioning": "how they position themselves",
      "strengths": ["..."],
      "weaknesses": ["..."],
      "target_audience": "who they serve",
      "estimated_market_share": "small/medium/large",
      "threat_level": "low/medium/high"
    }}
  ],
  "your_advantages": [
    {{"advantage": "...", "how_to_leverage": "..."}}
  ],
  "market_gaps": [
    {{"gap": "...", "opportunity": "...", "action": "..."}}
  ],
  "positioning_recommendations": [
    {{"recommendation": "...", "rationale": "..."}}
  ]
}}

Return ONLY the JSON."""

    try:
        result = await generate_with_ai(prompt)
        cleaned = result.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            cleaned = cleaned.rsplit("```", 1)[0]
        analysis = json.loads(cleaned)
        return {"analysis": analysis}
    except json.JSONDecodeError:
        return {"analysis": {"summary": result[:500]}, "raw": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================
# MARKET SHIFT MONITOR
# ==================

@router.post("/market-shifts")
async def monitor_market_shifts(req: MarketShiftRequest):
    """AI-powered market shift and trend monitoring."""
    brand = await db.brand_foundation.find_one({"user_id": req.user_id}, {"_id": 0})
    brand_context = ""
    if brand:
        brand_context = f"Niche: {brand.get('niche', req.niche)}, Industry: {brand.get('industry', req.industry)}"
    db = get_db()

    prompt = f"""You are a market intelligence analyst. Analyze current market shifts and emerging trends.

{brand_context if brand_context else f'Niche: {req.niche}, Industry: {req.industry}'}

Provide analysis of:
1. Current market trends affecting this space
2. Emerging search patterns and consumer behavior shifts
3. Technology and platform changes impacting the industry
4. Content and marketing strategy shifts
5. Opportunities arising from these changes

Return as JSON:
{{
  "summary": "3-4 sentence market overview",
  "trends": [
    {{
      "trend": "trend name",
      "description": "what's happening",
      "impact": "high/medium/low",
      "timeline": "now/3-6 months/6-12 months",
      "action_items": ["what to do about it"]
    }}
  ],
  "search_behavior_shifts": [
    {{"shift": "...", "evidence": "...", "content_opportunity": "..."}}
  ],
  "platform_changes": [
    {{"platform": "...", "change": "...", "implication": "..."}}
  ],
  "emerging_keywords": [
    {{"keyword": "...", "why_growing": "...", "content_angle": "..."}}
  ],
  "strategic_recommendations": [
    {{"recommendation": "...", "priority": "high/medium/low", "effort": "low/medium/high"}}
  ]
}}

Return ONLY the JSON."""

    try:
        result = await generate_with_ai(prompt)
        cleaned = result.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            cleaned = cleaned.rsplit("```", 1)[0]
        analysis = json.loads(cleaned)
        return {"analysis": analysis}
    except json.JSONDecodeError:
        return {"analysis": {"summary": result[:500]}, "raw": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
