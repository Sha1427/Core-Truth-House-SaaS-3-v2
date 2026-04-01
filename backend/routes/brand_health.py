"""Brand Health Score routes."""
from fastapi import APIRouter
from typing import Optional
from backend.database import get_db

router = APIRouter(prefix="/api")

@router.get("/brand-health")
async def get_brand_health(user_id: str = "default", workspace_id: Optional[str] = None):
    """Calculate brand health score across all 6 modules."""
    query = {"user_id": user_id}
    if workspace_id:
        query["workspace_id"] = workspace_id

    scores = {}

    # 1. Brand Foundation (mission, voice, values, story, audience, positioning)
    foundation = await db.brand_foundation.find_one(query, {"_id": 0})
    if foundation:
        fields = ["mission", "voice", "values", "story", "audience", "positioning"]
        filled = sum(1 for f in fields if foundation.get(f))
        scores["brand_foundation"] = {
            "score": round((filled / len(fields)) * 100),
            "completed": filled,
            "total": len(fields),
            "label": "Brand Foundation",
        }
    else:
        scores["brand_foundation"] = {"score": 0, "completed": 0, "total": 6, "label": "Brand Foundation"}

    # 2. Content Studio (count generated content assets)
    content_count = await db.content_assets.count_documents(query)
    content_score = min(100, content_count * 10)  # 10 pieces = 100%
    scores["content_studio"] = {
        "score": content_score,
        "completed": min(content_count, 10),
        "total": 10,
        "label": "Content Studio",
    }

    # 3. Systems Builder (count systems/SOPs)
    systems_count = await db.systems.count_documents(query)
    systems_score = min(100, systems_count * 20)  # 5 systems = 100%
    scores["systems_builder"] = {
        "score": systems_score,
        "completed": min(systems_count, 5),
        "total": 5,
        "label": "Systems Builder",
    }

    # 4. Offer Builder (count offers)
    offers_count = await db.offers.count_documents(query)
    offers_score = min(100, offers_count * 25)  # 4 offers = 100%
    scores["offer_builder"] = {
        "score": offers_score,
        "completed": min(offers_count, 4),
        "total": 4,
        "label": "Offer Builder",
    }

    # 5. Identity Studio (check logos, colors, fonts)
    identity = await db.identity_studio.find_one(query, {"_id": 0})
    if identity:
        id_fields = ["logos", "color_palette", "typography", "mood_board"]
        id_filled = sum(1 for f in id_fields if identity.get(f))
        scores["identity_studio"] = {
            "score": round((id_filled / len(id_fields)) * 100),
            "completed": id_filled,
            "total": len(id_fields),
            "label": "Identity Studio",
        }
    else:
        scores["identity_studio"] = {"score": 0, "completed": 0, "total": 4, "label": "Identity Studio"}

    # 6. Launch Planner (count launch plans)
    launch_count = await db.launch_plans.count_documents(query)
    launch_score = min(100, launch_count * 50)  # 2 plans = 100%
    scores["launch_planner"] = {
        "score": launch_score,
        "completed": min(launch_count, 2),
        "total": 2,
        "label": "Launch Planner",
    }

    # Calculate overall score
    total = sum(s["score"] for s in scores.values())
    overall = round(total / len(scores)) if scores else 0

    return {
        "overall_score": overall,
        "modules": scores,
        "recommendations": _get_recommendations(scores),
    }

def _get_recommendations(scores: dict) -> list:
    """Generate actionable recommendations based on low scores."""
    recs = []
    sorted_modules = sorted(scores.items(), key=lambda x: x[1]["score"])
    for key, data in sorted_modules:
        if data["score"] < 50:
            recs.append({
                "module": key,
                "label": data["label"],
                "score": data["score"],
                "action": f"Complete your {data['label']} to strengthen your brand. You're {data['completed']}/{data['total']} done.",
            })
    return recs[:3]
