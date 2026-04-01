"""Prompt Hub routes - prompts, packs, and generators.

Clean rebuild notes:
- removes all emergentintegrations Stripe usage
- uses services/stripe_client.py only
- keeps existing route surface intact
- preserves prompt library, prompt pack checkout, and generator endpoints
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from backend.database import get_db
from backend.routes.permissions import verify_workspace_access
from backend.services.ai import generate_with_ai
from backend.services.stripe_client import build_stripe_billing_client

logger = logging.getLogger("cth.prompts")
router = APIRouter(prefix="/api")

# ===================
# PYDANTIC MODELS
# ===================

class PromptCreate(BaseModel):
    title: str
    content: str
    category: str = "custom"
    tags: List[str] = Field(default_factory=list)

class PromptPackPurchase(BaseModel):
    pack_id: str
    payment_intent_id: Optional[str] = None

class PromptPackCheckoutRequest(BaseModel):
    pack_id: str
    user_id: str
    user_email: Optional[str] = None
    origin_url: str

class GeneratorInput(BaseModel):
    generator_type: str
    inputs: Dict[str, Any]
    workspace_id: Optional[str] = None

# ===================
# PROMPT PACKS DATA
# ===================

PROMPT_PACKS = [
    {
        "id": "pack-god-prompt",
        "title": "The Complete AI Brand Creation System",
        "slug": "complete-ai-brand-creation",
        "description": "The God Prompt Framework with the 10 master components, Brand Identity Core template, Character and Visual consistency system, universe-building architecture, and 8 industry-specific God Prompts.",
        "price": 67,
        "stripe_price_id": "price_god_prompt_67",
        "category": "premium",
        "prompts_count": 25,
        "includes": [
            "10 master framework components",
            "Brand Identity Core template",
            "Character and visual consistency system",
            "8 industry-specific God Prompts",
            "Universe-building architecture",
        ],
        "icon": "◈",
    },
    {
        "id": "pack-visual-identity",
        "title": "8-Layer Visual Identity Builder",
        "slug": "visual-identity-builder",
        "description": "The Master Prompt Blueprint with all 8 layers plus 100 pre-built prompts organized by brand archetype.",
        "price": 47,
        "stripe_price_id": "price_visual_identity_47",
        "category": "premium",
        "prompts_count": 100,
        "includes": [
            "8-layer prompt blueprint",
            "100 archetype-based prompts",
            "Visual identity worksheet",
            "4 style guides",
        ],
        "icon": "◎",
    },
    {
        "id": "pack-brand-consistency",
        "title": "Brand Visual Consistency System",
        "slug": "brand-consistency",
        "description": "The Prompt DNA System with Core DNA, Scene Generator, Variation Engine, scene variations, and platform-specific formatting guides.",
        "price": 47,
        "stripe_price_id": "price_brand_consistency_47",
        "category": "premium",
        "prompts_count": 50,
        "includes": [
            "Core DNA template builder",
            "Scene variation library",
            "Platform-specific guides",
            "Brand color integration system",
        ],
        "icon": "⬡",
    },
    {
        "id": "pack-content-machine",
        "title": "30-Day Content Production Machine",
        "slug": "content-production-machine",
        "description": "The AI Content Factory System with 5 production stages, a 30-day content calendar, daily prompt templates, batching workflow, and repurposing engine.",
        "price": 57,
        "stripe_price_id": "price_content_machine_57",
        "category": "premium",
        "prompts_count": 60,
        "includes": [
            "5-stage production system",
            "30-day content calendar",
            "Daily prompt templates",
            "Repurposing engine cheat sheet",
        ],
        "icon": "◉",
    },
    {
        "id": "pack-launch-scale",
        "title": "Brand Launch & Scale Framework",
        "slug": "launch-scale-framework",
        "description": "A complete launch and optimization system with pre-launch, launch week, and post-launch templates, activation checklist, KPI tracker, and optimization framework.",
        "price": 67,
        "stripe_price_id": "price_launch_scale_67",
        "category": "premium",
        "prompts_count": 35,
        "includes": [
            "Full launch framework",
            "Pre, during, and post launch templates",
            "Offer activation checklist",
            "Launch KPI tracker",
        ],
        "icon": "◆",
    },
    {
        "id": "pack-content-ops",
        "title": "Scalable Content Operations Blueprint",
        "slug": "content-operations",
        "description": "A content production system with Strategy, Production, Distribution, Repurposing, and Analytics layers, including SOP templates and delegation guides.",
        "price": 47,
        "stripe_price_id": "price_content_ops_47",
        "category": "premium",
        "prompts_count": 20,
        "includes": [
            "5-layer production framework",
            "Workflow SOP template",
            "Team delegation guide",
            "AI tool stack guide",
        ],
        "icon": "⬢",
    },
]

# ===================
# HELPERS
# ===================

def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def _require_db():
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return db

def _get_pack_or_404(pack_id: str) -> Dict[str, Any]:
    pack = next((p for p in PROMPT_PACKS if p["id"] == pack_id), None)
    if not pack:
        raise HTTPException(status_code=404, detail="Pack not found")
    return pack

def _validate_origin_url(origin_url: str) -> str:
    parsed = urlparse(origin_url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise HTTPException(status_code=400, detail="Invalid origin_url")
    return f"{parsed.scheme}://{parsed.netloc}"

def _extract_session_field(session: Any, field: str) -> Any:
    if isinstance(session, dict):
        return session.get(field)
    return getattr(session, field, None)

async def _create_prompt_purchase_if_missing(user_id: str, pack_id: str) -> None:
    database = _require_db()
    await database.prompt_pack_purchases.update_one(
        {"user_id": user_id, "pack_id": pack_id},
        {
            "$setOnInsert": {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "pack_id": pack_id,
                "purchased_at": _utc_now_iso(),
            }
        },
        upsert=True,
    )

def generate_pack_sample_prompts(pack_id: str) -> List[Dict[str, str]]:
    prompts: List[Dict[str, str]] = []

    if pack_id == "pack-god-prompt":
        prompts = [
            {
                "title": "Brand Identity Core",
                "content": "Create a [BRAND ARCHETYPE] brand identity for [INDUSTRY]. Include core values, visual language, emotional tone, and audience positioning.",
                "category": "identity",
            },
            {
                "title": "Character Consistency Master",
                "content": "Design a consistent brand character: [DESCRIPTION]. Maintain facial features, body language, wardrobe palette, and signature accessories across every scene.",
                "category": "character",
            },
            {
                "title": "Universe Building Foundation",
                "content": "Build a brand universe for [BRAND NAME] with a primary location, recurring elements, palette integration, lighting signature, and mood anchors.",
                "category": "universe",
            },
        ]
    elif pack_id == "pack-visual-identity":
        prompts = [
            {
                "title": "8-Layer Master Prompt",
                "content": "Layer 1 Identity: [BRAND TYPE]\nLayer 2 Character: [DETAILS]\nLayer 3 Emotion: [MOOD]\nLayer 4 Environment: [SETTING]\nLayer 5 Lighting: [STYLE]\nLayer 6 Camera: [ANGLE]\nLayer 7 Style: [AESTHETIC]\nLayer 8 Overlay: [BRAND ELEMENTS]",
                "category": "visual",
            },
            {
                "title": "Luxury Brand Template",
                "content": "Cinematic portrait of [SUBJECT] in [LUXURY SETTING], soft golden hour lighting, shallow depth of field, editorial fashion style, [BRAND COLORS] accents.",
                "category": "luxury",
            },
        ]
    elif pack_id == "pack-brand-consistency":
        prompts = [
            {
                "title": "Core DNA Template",
                "content": "BRAND DNA:\n- Character: [DESCRIPTION]\n- Lighting: [STYLE]\n- Color Palette: [COLORS]\n- Mood: [EMOTION]\n- Style: [AESTHETIC]\nGenerate scene: [SCENARIO]",
                "category": "dna",
            },
            {
                "title": "Scene Variation Engine",
                "content": "Using the established DNA, create a variation for [PLATFORM OR USE CASE]. Maintain character consistency, color integration, and mood alignment while adjusting composition, crop, and text space.",
                "category": "variation",
            },
        ]
    elif pack_id == "pack-content-machine":
        prompts = [
            {
                "title": "30-Day Calendar Builder",
                "content": "Create a 30-day content plan for [BRAND] using pillars [PILLARS], platforms [PLATFORMS], and offer [OFFER]. Include one hook and one CTA for each day.",
                "category": "calendar",
            },
            {
                "title": "Repurposing Engine",
                "content": "Turn one flagship piece of content on [TOPIC] into 10 assets for [PLATFORMS]. Include short-form, carousel, email, and CTA variations.",
                "category": "repurposing",
            },
        ]
    elif pack_id == "pack-launch-scale":
        prompts = [
            {
                "title": "Launch Week Structure",
                "content": "Design a 7-day launch plan for [OFFER] including pre-launch warmup, social proof moments, urgency, FAQ handling, and close-day CTA.",
                "category": "launch",
            },
            {
                "title": "Offer Activation Checklist",
                "content": "Create a full offer activation checklist for [OFFER], including messaging, assets, audience warmup, deadlines, email flow, and metrics to track.",
                "category": "operations",
            },
        ]
    elif pack_id == "pack-content-ops":
        prompts = [
            {
                "title": "Content Ops Blueprint",
                "content": "Design a content ops system for [TEAM SIZE] supporting [CHANNELS]. Break it into Strategy, Production, Distribution, Repurposing, and Analytics.",
                "category": "operations",
            },
            {
                "title": "Delegation SOP Prompt",
                "content": "Create a delegation SOP for [TASK TYPE] including inputs, outputs, owner, QA checklist, deadlines, and escalation rules.",
                "category": "sop",
            },
        ]

    return prompts

async def _save_generated_prompt(
    *,
    user_id: str,
    workspace_id: Optional[str],
    title: str,
    content: str,
    category: str,
    tags: List[str],
) -> str:
    database = _require_db()
    prompt_id = str(uuid.uuid4())

    await database.prompts.insert_one(
        {
            "id": prompt_id,
            "user_id": user_id,
            "workspace_id": workspace_id,
            "title": title,
            "content": content,
            "category": category,
            "tags": tags,
            "created_at": _utc_now_iso(),
            "is_favorite": False,
        }
    )

    return prompt_id

# ===================
# PROMPTS ENDPOINTS
# ===================

@router.get("/prompts")
async def get_prompts(user_id: str = "default", workspace_id: Optional[str] = None):
    """Get all saved prompts for a user or workspace."""
    database = _require_db()

    if workspace_id:
        await verify_workspace_access(workspace_id, user_id)

    query: Dict[str, Any] = {"user_id": user_id}
    if workspace_id:
        query["workspace_id"] = workspace_id

    prompts = await database.prompts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"prompts": prompts}

@router.post("/prompts")
async def create_prompt(data: PromptCreate, user_id: str = "default", workspace_id: Optional[str] = None):
    """Save a new prompt to the library."""
    database = _require_db()

    if workspace_id:
        await verify_workspace_access(workspace_id, user_id)

    prompt_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "workspace_id": workspace_id,
        "title": data.title,
        "content": data.content,
        "category": data.category,
        "tags": data.tags,
        "created_at": _utc_now_iso(),
        "is_favorite": False,
    }

    await database.prompts.insert_one(prompt_doc)
    return {"success": True, "prompt": prompt_doc}

@router.delete("/prompts/{prompt_id}")
async def delete_prompt(prompt_id: str, user_id: str = "default"):
    """Delete a prompt from the library."""
    database = _require_db()
    result = await database.prompts.delete_one({"id": prompt_id, "user_id": user_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Prompt not found")

    return {"success": True}

@router.put("/prompts/{prompt_id}/favorite")
async def toggle_favorite(prompt_id: str, user_id: str = "default"):
    """Toggle favorite status on a prompt."""
    database = _require_db()
    prompt = await database.prompts.find_one({"id": prompt_id, "user_id": user_id})

    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    new_status = not prompt.get("is_favorite", False)
    await database.prompts.update_one(
        {"id": prompt_id, "user_id": user_id},
        {"$set": {"is_favorite": new_status}},
    )

    return {"success": True, "is_favorite": new_status}

# ===================
# PROMPT PACKS ENDPOINTS
# ===================

@router.get("/prompt-packs")
async def get_prompt_packs(user_id: str = "default"):
    """Get all available prompt packs with purchase status."""
    database = _require_db()

    purchases = await database.prompt_pack_purchases.find(
        {"user_id": user_id},
        {"_id": 0, "pack_id": 1},
    ).to_list(100)
    purchased_ids = {p["pack_id"] for p in purchases}

    packs_with_status = []
    for pack in PROMPT_PACKS:
        pack_copy = pack.copy()
        pack_copy["is_purchased"] = pack["id"] in purchased_ids
        packs_with_status.append(pack_copy)

    return {"packs": packs_with_status}

@router.post("/prompt-packs/purchase")
async def purchase_pack(data: PromptPackPurchase, user_id: str = "default"):
    """
    Record a pack purchase after payment.
    Legacy-compatible endpoint kept for UI compatibility.
    """
    database = _require_db()
    _get_pack_or_404(data.pack_id)

    existing = await database.prompt_pack_purchases.find_one(
        {"user_id": user_id, "pack_id": data.pack_id}
    )
    if existing:
        return {
            "success": True,
            "pack_id": data.pack_id,
            "message": "Already purchased",
        }

    purchase_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "pack_id": data.pack_id,
        "payment_intent_id": data.payment_intent_id,
        "purchased_at": _utc_now_iso(),
    }

    await database.prompt_pack_purchases.insert_one(purchase_doc)
    return {"success": True, "pack_id": data.pack_id}

@router.post("/prompt-packs/checkout")
async def prompt_pack_checkout(data: PromptPackCheckoutRequest, request: Request):
    """Create a Stripe checkout session for a prompt pack purchase."""
    database = _require_db()
    pack = _get_pack_or_404(data.pack_id)

    existing = await database.prompt_pack_purchases.find_one(
        {"user_id": data.user_id, "pack_id": data.pack_id}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Pack already purchased")

    safe_origin = _validate_origin_url(data.origin_url)
    success_url = (
        f"{safe_origin}/prompt-hub"
        f"?session_id={{CHECKOUT_SESSION_ID}}"
        f"&pack_success=true"
        f"&pack_id={data.pack_id}"
    )
    cancel_url = f"{safe_origin}/prompt-hub?pack_cancelled=true"

    metadata = {
        "type": "prompt_pack",
        "pack_id": data.pack_id,
        "user_id": data.user_id,
        "user_email": data.user_email or "",
        "request_host": str(request.base_url).rstrip("/"),
    }

    try:
        stripe_client = build_stripe_billing_client()
        session = await stripe_client.create_checkout_session(
            amount_cents=int(pack["price"] * 100),
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata,
            currency="usd",
        )

        session_id = _extract_session_field(session, "id")
        checkout_url = _extract_session_field(session, "url")

        if not session_id or not checkout_url:
            raise HTTPException(status_code=500, detail="Stripe checkout session did not return required fields")

        await database.prompt_pack_transactions.insert_one(
            {
                "id": str(uuid.uuid4()),
                "session_id": session_id,
                "user_id": data.user_id,
                "user_email": data.user_email,
                "pack_id": data.pack_id,
                "amount": pack["price"],
                "amount_cents": int(pack["price"] * 100),
                "status": "pending",
                "payment_status": "unpaid",
                "provider": "stripe",
                "created_at": _utc_now_iso(),
                "updated_at": _utc_now_iso(),
            }
        )

        return {
            "success": True,
            "checkout_url": checkout_url,
            "session_id": session_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Prompt pack checkout error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/prompt-packs/checkout/status/{session_id}")
async def prompt_pack_checkout_status(session_id: str, request: Request):
    """Check the status of a prompt pack checkout session."""
    database = _require_db()

    transaction = await database.prompt_pack_transactions.find_one(
        {"session_id": session_id},
        {"_id": 0},
    )

    if transaction and transaction.get("status") == "complete":
        return {
            "status": "complete",
            "payment_status": "paid",
            "pack_id": transaction.get("pack_id"),
        }

    try:
        stripe_client = build_stripe_billing_client()
        session = await stripe_client.get_checkout_session(session_id)

        status = _extract_session_field(session, "status") or "unknown"
        payment_status = _extract_session_field(session, "payment_status") or "unknown"

        if payment_status == "paid" and transaction:
            pack_id = transaction.get("pack_id")
            user_id = transaction.get("user_id")

            await database.prompt_pack_transactions.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "status": "complete",
                        "payment_status": "paid",
                        "updated_at": _utc_now_iso(),
                    }
                },
            )

            await _create_prompt_purchase_if_missing(user_id=user_id, pack_id=pack_id)

            return {
                "status": "complete",
                "payment_status": "paid",
                "pack_id": pack_id,
            }

        if transaction:
            await database.prompt_pack_transactions.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "status": status,
                        "payment_status": payment_status,
                        "updated_at": _utc_now_iso(),
                    }
                },
            )

        return {
            "status": status,
            "payment_status": payment_status,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Prompt pack checkout status error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/prompt-packs/{pack_id}/prompts")
async def get_pack_prompts(pack_id: str, user_id: str = "default"):
    """Get prompts from a purchased pack."""
    database = _require_db()

    purchase = await database.prompt_pack_purchases.find_one(
        {"user_id": user_id, "pack_id": pack_id}
    )
    if not purchase:
        raise HTTPException(status_code=403, detail="Pack not purchased")

    pack = _get_pack_or_404(pack_id)
    sample_prompts = generate_pack_sample_prompts(pack_id)

    return {
        "prompts": sample_prompts,
        "pack": pack,
    }

# ===================
# GENERATORS ENDPOINTS
# ===================

@router.post("/generators/scene")
async def scene_generator(data: GeneratorInput, user_id: str = "default"):
    """Scene Generator - builds cinematic or brand-scene prompt systems."""
    inputs = data.inputs

    prompt = f"""Create a high-value brand scene generation system.

Brand Type: {inputs.get('brand_type', 'Personal brand')}
Subject: {inputs.get('subject', 'Founder portrait')}
Visual Goal: {inputs.get('visual_goal', 'Luxury, cinematic authority')}
Audience: {inputs.get('audience', 'Entrepreneurs and professionals')}
Color Direction: {inputs.get('color_direction', 'Black, gold, cream')}
Environment: {inputs.get('environment', 'Editorial studio or elevated work setting')}

Generate:
1. A master scene prompt
2. 5 scene variations
3. 5 camera angle variations
4. 5 environment variations
5. 5 emotional tone shifts
6. 3 platform-specific edits for IG, website hero, and sales page

Format as polished, ready-to-use prompts.
"""

    try:
        result = await generate_with_ai(
            prompt=prompt,
            system_context="You are a visual brand strategist and cinematic prompt engineer.",
        )

        saved_prompt_id = await _save_generated_prompt(
            user_id=user_id,
            workspace_id=data.workspace_id,
            title=f"Scene Generator: {inputs.get('brand_type', 'Custom')}",
            content=result,
            category="generator-scene",
            tags=["generated", "scene", "visual-system"],
        )

        return {"success": True, "result": result, "saved_prompt_id": saved_prompt_id}
    except Exception as e:
        logger.error("Scene generator error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generators/dna")
async def prompt_dna_builder(data: GeneratorInput, user_id: str = "default"):
    """Prompt DNA Builder - defines the repeatable visual DNA of a brand."""
    inputs = data.inputs

    prompt = f"""Build a Brand Prompt DNA system.

Brand Name: {inputs.get('brand_name', 'My Brand')}
Industry: {inputs.get('industry', 'Brand strategy')}
Brand Personality: {inputs.get('personality', 'Bold, premium, grounded')}
Core Offer: {inputs.get('offer', 'Brand infrastructure and strategy')}
Visual Aesthetic: {inputs.get('visual_aesthetic', 'Editorial, cinematic, premium')}
Target Audience: {inputs.get('audience', 'Service providers and founders')}

Generate:
1. Core Brand DNA
2. Signature visual elements
3. Character consistency rules
4. Color, lighting, and mood directives
5. Composition rules
6. 10 reusable DNA-based prompts
7. Variation rules for keeping consistency without repetition

Format as a complete brand visual operating system.
"""

    try:
        result = await generate_with_ai(
            prompt=prompt,
            system_context="You are a visual identity strategist specializing in AI prompt systems.",
        )

        saved_prompt_id = await _save_generated_prompt(
            user_id=user_id,
            workspace_id=data.workspace_id,
            title=f"Prompt DNA: {inputs.get('brand_name', 'Custom')}",
            content=result,
            category="generator-dna",
            tags=["generated", "dna", "brand-consistency"],
        )

        return {"success": True, "result": result, "saved_prompt_id": saved_prompt_id}
    except Exception as e:
        logger.error("Prompt DNA builder error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generators/god-prompt")
async def god_prompt_generator(data: GeneratorInput, user_id: str = "default"):
    """God Prompt Generator - creates a full-stack master prompt."""
    inputs = data.inputs

    prompt = f"""Create a complete God Prompt for a brand.

Brand Name: {inputs.get('brand_name', 'My Brand')}
Industry: {inputs.get('industry', 'Creative services')}
Audience: {inputs.get('audience', 'Entrepreneurs')}
Offer: {inputs.get('offer', 'Premium service')}
Transformation: {inputs.get('transformation', 'From unclear to irresistible brand authority')}
Voice: {inputs.get('voice', 'Premium, direct, emotionally intelligent')}
Visual Direction: {inputs.get('visual_direction', 'Editorial luxury with cinematic realism')}

Generate:
1. The complete master God Prompt
2. Fill-in-the-blank placeholders that can be reused
3. A short-use version
4. A long-use version
5. 5 execution examples across different scenarios
6. Instructions for maintaining consistency

Format as a premium reusable system prompt.
"""

    try:
        result = await generate_with_ai(
            prompt=prompt,
            system_context="You are a master prompt architect for brand systems and AI content creation.",
        )

        saved_prompt_id = await _save_generated_prompt(
            user_id=user_id,
            workspace_id=data.workspace_id,
            title=f"God Prompt: {inputs.get('brand_name', 'Custom')}",
            content=result,
            category="generator-god-prompt",
            tags=["generated", "god-prompt", "master-system"],
        )

        return {"success": True, "result": result, "saved_prompt_id": saved_prompt_id}
    except Exception as e:
        logger.error("God prompt generator error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generators/launch")
async def launch_content_machine(data: GeneratorInput, user_id: str = "default"):
    """Launch content machine - builds a launch messaging sequence."""
    inputs = data.inputs

    prompt = f"""Create a launch content machine for this offer.

Offer Name: {inputs.get('offer_name', 'My Offer')}
Audience: {inputs.get('audience', 'Warm audience')}
Transformation: {inputs.get('transformation', 'Clear before and after result')}
Launch Style: {inputs.get('launch_style', 'Authority-based with emotional depth')}
Launch Length: {inputs.get('launch_length', '7 days')}
Primary CTA: {inputs.get('cta', 'Book or buy now')}

Generate:
1. Launch messaging strategy
2. Pre-launch content (3 pieces)
3. 7-day launch calendar
4. Launch day post
5. FAQ and objection handling
6. Post-launch nurture ideas

Format as an execution-ready launch content plan.
"""

    try:
        result = await generate_with_ai(
            prompt=prompt,
            system_context="You are a launch strategist and conversion copywriter.",
        )

        saved_prompt_id = await _save_generated_prompt(
            user_id=user_id,
            workspace_id=data.workspace_id,
            title=f"Launch Calendar: {inputs.get('offer_name', 'Custom Launch')}",
            content=result,
            category="generator-launch",
            tags=["generated", "launch", "content-calendar"],
        )

        return {"success": True, "result": result, "saved_prompt_id": saved_prompt_id}
    except Exception as e:
        logger.error("Launch content machine error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generators/ica-builder")
async def ica_deep_dive_builder(data: GeneratorInput, user_id: str = "default"):
    """ICA Deep-Dive Builder - maps the ideal client avatar in psychological depth."""
    inputs = data.inputs

    prompt = f"""Create a comprehensive Ideal Client Avatar Deep-Dive.

Industry: {inputs.get('industry', 'Brand Consulting')}
Offer Type: {inputs.get('offer_type', '1:1 coaching')}
Client Stage: {inputs.get('client_stage', 'Growth-stage entrepreneur')}
Core Transformation: {inputs.get('transformation', 'From invisible to recognized authority')}
Price Point: {inputs.get('price_point', '$5,000-$15,000')}

Generate:
1. Demographics and psychographics
2. Core fears
3. Deep desires
4. Objections and resistance points
5. Language patterns
6. Content that resonates
7. Buying triggers
8. Day-in-the-life before and after
9. Where they spend time online
10. Their internal dialogue about investing

Format as detailed, actionable prose organized by section.
"""

    try:
        result = await generate_with_ai(
            prompt=prompt,
            system_context="You are a consumer psychology expert and brand strategist.",
        )

        saved_prompt_id = await _save_generated_prompt(
            user_id=user_id,
            workspace_id=data.workspace_id,
            title=f"ICA Deep-Dive: {inputs.get('industry', 'Custom')}",
            content=result,
            category="generator-ica-builder",
            tags=["generated", "ica", "client-avatar"],
        )

        return {"success": True, "result": result, "saved_prompt_id": saved_prompt_id}
    except Exception as e:
        logger.error("ICA builder error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generators/content-pillars")
async def content_pillar_architect(data: GeneratorInput, user_id: str = "default"):
    """Content Pillar Architect - defines brand content pillars with messaging frameworks."""
    inputs = data.inputs

    prompt = f"""Design a Content Pillar Architecture for this brand.

Brand Name: {inputs.get('brand_name', 'My Brand')}
Target Audience: {inputs.get('audience', 'Entrepreneurs and experts')}
Transformation: {inputs.get('transformation', 'From scattered to systematic brand growth')}
Content Platforms: {inputs.get('platforms', 'Instagram, LinkedIn, Podcast')}
Brand Voice: {inputs.get('brand_voice', 'Authoritative, warm, direct')}

Generate:
1. 4 to 6 content pillars
2. Why each pillar matters
3. Key messages for each pillar
4. Content ideas with hooks
5. Platform-specific angles
6. Content mix ratio
7. Weekly content template
8. Pillar rotation strategy
9. Cross-pillar combinations

Format as structured, actionable content strategy.
"""

    try:
        result = await generate_with_ai(
            prompt=prompt,
            system_context="You are a content strategist specializing in personal brand building.",
        )

        saved_prompt_id = await _save_generated_prompt(
            user_id=user_id,
            workspace_id=data.workspace_id,
            title=f"Content Pillars: {inputs.get('brand_name', 'Custom')}",
            content=result,
            category="generator-content-pillars",
            tags=["generated", "content-pillars", "strategy"],
        )

        return {"success": True, "result": result, "saved_prompt_id": saved_prompt_id}
    except Exception as e:
        logger.error("Content pillar architect error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generators/email-sequence")
async def email_nurture_sequence(data: GeneratorInput, user_id: str = "default"):
    """Email Nurture Sequence - generates a 5-part nurture sequence."""
    inputs = data.inputs

    prompt = f"""Create a 5-part email nurture sequence.

Offer Name: {inputs.get('offer_name', 'Brand Mastery Program')}
Audience Pain: {inputs.get('audience_pain', 'Inconsistent revenue and unclear messaging')}
Brand Voice: {inputs.get('brand_voice', 'Bold, direct, no-fluff')}
Sequence Goal: {inputs.get('sequence_goal', 'Book a discovery call')}

For each email, generate:
1. Subject line plus two variants
2. Preview text
3. Opening hook
4. Full body copy
5. CTA
6. P.S. line
7. Send timing

Also include:
- sequence strategy overview
- segmentation notes
- re-send strategy
- key metrics to track
"""

    try:
        result = await generate_with_ai(
            prompt=prompt,
            system_context="You are an email marketing expert and conversion copywriter.",
        )

        saved_prompt_id = await _save_generated_prompt(
            user_id=user_id,
            workspace_id=data.workspace_id,
            title=f"Email Sequence: {inputs.get('offer_name', 'Custom')}",
            content=result,
            category="generator-email-sequence",
            tags=["generated", "email", "nurture-sequence"],
        )

        return {"success": True, "result": result, "saved_prompt_id": saved_prompt_id}
    except Exception as e:
        logger.error("Email nurture sequence error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generators/brand-story")
async def brand_story_arc(data: GeneratorInput, user_id: str = "default"):
    """Brand Story Arc Generator - crafts the brand's hero journey narrative."""
    inputs = data.inputs

    prompt = f"""Craft a Brand Story Arc.

Founder's Journey: {inputs.get('founders_journey', 'Left the old path to build something aligned')}
Turning Point Moment: {inputs.get('turning_point', 'The moment you realized the old way was broken')}
Brand Mission: {inputs.get('mission', 'Help people build powerful brands')}
Audience Mirror: {inputs.get('audience_mirror', 'They are where I used to be')}

Generate:
1. Origin story
2. Turning point scene
3. Transformation bridge
4. Mission declaration
5. Client mirror section
6. Vision forward
7. Story snippets for bio, about page, podcast intro, and sales page

Format as polished, ready-to-use brand storytelling copy.
"""

    try:
        result = await generate_with_ai(
            prompt=prompt,
            system_context="You are a brand storytelling expert.",
        )

        saved_prompt_id = await _save_generated_prompt(
            user_id=user_id,
            workspace_id=data.workspace_id,
            title=f"Brand Story: {inputs.get('mission', 'Custom')[:50]}",
            content=result,
            category="generator-brand-story",
            tags=["generated", "brand-story", "narrative"],
        )

        return {"success": True, "result": result, "saved_prompt_id": saved_prompt_id}
    except Exception as e:
        logger.error("Brand story arc error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
