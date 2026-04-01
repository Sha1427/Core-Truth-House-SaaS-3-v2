"""Strategic OS Workflow routes."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid
import logging

from backend.database import get_db
from backend.services.os_prompts import (
    STEP_NAMES, STEP_DESCRIPTIONS, FULL_OS_STEPS, FAST_START_STEPS, get_step_prompt
)
from backend.services.ai import _call_llm

logger = logging.getLogger("cth.os_workflow")
router = APIRouter(prefix="/api/os-workflow")

# Step input question labels for prompt injection (mirrors frontend os-step-inputs.js)
_STEP_INPUT_LABELS = {
    1: {"biggest_challenge": "What is your biggest strategic challenge right now?", "winning_looks_like": "What does winning look like for your brand in 12 months?", "current_stage": "Where are you right now in your business?"},
    2: {"ideal_client_sentence": "Describe your ideal client in one sentence.", "keeps_them_up": "What keeps your ideal client up at night?", "already_tried": "What have they already tried that has not worked?", "dream_outcome": "What is the dream outcome your client is hiring you to achieve?"},
    3: {"known_for_now": "What are you currently known for?", "want_to_be_known_for": "What do you want to be known for?", "why_you_not_them": "Why would someone choose you over every other option?"},
    4: {"additional_competitors": "Additional competitors not in Brand Memory", "what_competitors_do_well": "What are your competitors doing well that you respect?", "formats_to_avoid": "Content formats or approaches to avoid"},
    5: {"lead_pillar": "Which type of content do you want to lead with?", "primary_cta": "What is your primary call to action right now?", "content_goal": "Most important thing your content needs to do right now"},
    6: {"priority_platform": "Which platform is your current priority?", "primary_format": "What content format do you post most?", "posting_capacity": "How many times per week can you realistically post?"},
    7: {"business_events": "What is happening in your business this month?", "content_month_goal": "Single most important outcome for your content this month", "avoid_this_month": "Anything to avoid in content this month?"},
    8: {"post_pillar": "Which content pillar should this post come from?", "hook_angle": "What hook angle do you want?", "post_platform": "Which platform is this post for?", "specific_direction": "Specific direction or topic for this post"},
    9: {"revenue_goal_quarter": "Primary revenue goal this quarter", "offer_to_push": "Which offer to prioritize this quarter?", "conversion_gap": "Where does your audience drop off before buying?", "willing_to_do": "What conversion actions are you willing to take?"},
}

def _format_step_inputs_for_prompt(step_num: int, inputs: dict) -> str:
    """Format step inputs as a readable prompt block for AI generation."""
    labels = _STEP_INPUT_LABELS.get(step_num, {})
    if not labels or not inputs:
        return ""
    lines = [f"--- USER CONTEXT FOR STEP {step_num}: {STEP_NAMES.get(step_num, '').upper()} ---"]
    for field_id, label in labels.items():
        val = inputs.get(field_id)
        if not val:
            continue
        display = ", ".join(val) if isinstance(val, list) else str(val)
        lines.append(f"{label}\n{display}")
    lines.append("--- END USER CONTEXT ---")
    return "\n\n".join(lines)

OS_REQUIRED_FIELDS = [
    ("brand_name", "Brand Name"), ("business_description", "Business Description"),
    ("niche", "Niche"), ("primary_offer", "Primary Offer"),
    ("target_audience", "Target Audience"), ("audience_problem", "Audience Problem"),
    ("audience_desire", "Audience Desire"), ("brand_strengths", "Brand Strengths"),
    ("brand_voice", "Brand Voice"), ("unique_mechanism", "Unique Mechanism"),
]

async def _build_os_variables(user_id: str, workspace_id: str = None) -> dict:
    """Build OS variables from brand foundation and brand memory data."""
    query = {"user_id": user_id}
    if workspace_id:
        query["workspace_id"] = workspace_id
    
    # Get brand foundation data
    bm = await db.brand_foundation.find_one(query, {"_id": 0})
    if not bm:
        bm = {}
    
    # Get OS variables from brand_memory (new location)
    brand_memory = await db.brand_memory.find_one(query, {"_id": 0})
    os_vars = brand_memory.get("os_variables", {}) if brand_memory else {}
    
    # Also check legacy os_brand_memory collection for backwards compatibility
    os_ext = await db.os_brand_memory.find_one(query, {"_id": 0}) or {}
    
    # Merge: prefer new os_variables, fallback to legacy os_brand_memory
    def get_val(key):
        return os_vars.get(key) or os_ext.get(key, "")
    
    return {
        "BRAND_NAME": bm.get("brand_name") or bm.get("mission", "")[:50] or "",
        "BUSINESS_DESCRIPTION": bm.get("business_description") or bm.get("story", "") or "",
        "NICHE": bm.get("niche") or bm.get("positioning", "") or "",
        "PRIMARY_OFFER": get_val("primary_offer"),
        "SECONDARY_OFFERS": get_val("secondary_offers"),
        "TARGET_AUDIENCE": bm.get("audience") or bm.get("target_audience", "") or "",
        "AUDIENCE_PROBLEM": get_val("audience_problem"),
        "AUDIENCE_DESIRE": get_val("audience_desire"),
        "BRAND_STRENGTHS": get_val("brand_strengths"),
        "FOUNDER_BACKGROUND": get_val("founder_background"),
        "UNIQUE_MECHANISM": get_val("unique_mechanism"),
        "COMPETITOR_1": get_val("competitor_1"),
        "COMPETITOR_2": get_val("competitor_2"),
        "COMPETITOR_3": get_val("competitor_3"),
        "PLATFORMS": ", ".join(os_vars.get("platforms", [])) if isinstance(os_vars.get("platforms"), list) else (", ".join(os_ext.get("platforms", [])) if isinstance(os_ext.get("platforms"), list) else get_val("platforms")),
        "CURRENT_CONTENT_APPROACH": get_val("current_content_approach"),
        "GROWTH_GOAL": get_val("growth_goal"),
        "REVENUE_GOAL": get_val("revenue_goal"),
        "BRAND_VOICE": bm.get("voice") or bm.get("brand_voice", "") or "",
        "CALL_TO_ACTION_PREFERENCE": get_val("cta_preference"),
        "GEOGRAPHY_OR_MARKET": get_val("geography_or_market"),
        "PRICE_POINT": get_val("price_point"),
        "SALES_MODEL": get_val("sales_model"),
        "CONSTRAINTS": get_val("constraints"),
    }
    db = get_db()

async def _build_prior_context(workflow_id: str, up_to_step: int) -> str:
    """Assemble locked prior step outputs as context."""
    steps = await db.os_workflow_steps.find(
        {"workflow_id": workflow_id, "step_number": {"$lt": up_to_step}, "is_locked": True},
        {"_id": 0}
    ).sort("step_number", 1).to_list(20)
    if not steps:
        return ""
    return "\n".join(f"=== STEP {s['step_number']}: {s['step_name']} ===\n{s['output']}\n" for s in steps)
    db = get_db()

# ─── DEPRECATED: OS Brand Memory ────────────────────────────────────────────
# These endpoints are DEPRECATED. Use /api/persist/brand-memory instead.
# Kept for backward compatibility until all clients migrate.

class OSBrandMemoryInput(BaseModel):
    user_id: str
    workspace_id: Optional[str] = None
    primary_offer: Optional[str] = None
    secondary_offers: Optional[str] = None
    audience_problem: Optional[str] = None
    audience_desire: Optional[str] = None
    brand_strengths: Optional[str] = None
    founder_background: Optional[str] = None
    unique_mechanism: Optional[str] = None
    competitor_1: Optional[str] = None
    competitor_2: Optional[str] = None
    competitor_3: Optional[str] = None
    platforms: Optional[List[str]] = None
    current_content_approach: Optional[str] = None
    growth_goal: Optional[str] = None
    revenue_goal: Optional[str] = None
    cta_preference: Optional[str] = None
    geography_or_market: Optional[str] = None
    price_point: Optional[str] = None
    sales_model: Optional[str] = None
    constraints: Optional[str] = None

@router.get("/brand-memory", deprecated=True)
async def get_os_brand_memory(user_id: str):
    """DEPRECATED: Use GET /api/persist/brand-memory instead."""
    doc = await db.os_brand_memory.find_one({"user_id": user_id}, {"_id": 0})
    return doc or {}
    db = get_db()

@router.post("/brand-memory", deprecated=True)
async def save_os_brand_memory(data: OSBrandMemoryInput):
    """DEPRECATED: Use POST /api/persist/brand-memory instead."""
    update = {k: v for k, v in data.dict().items() if v is not None and k != "user_id"}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.os_brand_memory.update_one(
        {"user_id": data.user_id},
        {"$set": update, "$setOnInsert": {"user_id": data.user_id, "created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"success": True}
    db = get_db()

# ─── Readiness ─────────────────────────────────────────────────────────────

@router.get("/readiness")
async def get_readiness(user_id: str, workspace_id: Optional[str] = None):
    variables = await _build_os_variables(user_id, workspace_id)
    required = [
        ("BRAND_NAME", "Brand Name"), ("BUSINESS_DESCRIPTION", "Business Description"),
        ("NICHE", "Niche"), ("PRIMARY_OFFER", "Primary Offer"),
        ("TARGET_AUDIENCE", "Target Audience"), ("AUDIENCE_PROBLEM", "Audience Problem"),
        ("AUDIENCE_DESIRE", "Audience Desire"), ("BRAND_STRENGTHS", "Brand Strengths"),
        ("BRAND_VOICE", "Brand Voice"), ("UNIQUE_MECHANISM", "Unique Mechanism"),
        ("COMPETITOR_1", "Competitor 1"), ("PLATFORMS", "Platforms"),
        ("GROWTH_GOAL", "Growth Goal"), ("REVENUE_GOAL", "Revenue Goal"),
        ("PRICE_POINT", "Price Point"), ("SALES_MODEL", "Sales Model"),
    ]
    missing = [label for key, label in required if not variables.get(key)]
    score = round(((len(required) - len(missing)) / len(required)) * 100)
    return {"score": score, "missing_fields": missing, "is_ready": score >= 80}

# ─── Workflow CRUD ─────────────────────────────────────────────────────────

class CreateWorkflowInput(BaseModel):
    user_id: str
    workspace_id: Optional[str] = None
    workflow_type: str = "FULL_OS"

@router.get("")
async def list_workflows(user_id: str):
    db = get_db()
    workflows = await db.os_workflows.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    for w in workflows:
        w["steps"] = await db.os_workflow_steps.find(
            {"workflow_id": w["id"]}, {"_id": 0, "output": 0}
        ).sort("step_number", 1).to_list(20)
    return {"workflows": workflows}

@router.post("")
async def create_workflow(data: CreateWorkflowInput):
    db = get_db()
    readiness = await get_readiness(data.user_id, data.workspace_id)
    step_numbers = FULL_OS_STEPS if data.workflow_type == "FULL_OS" else FAST_START_STEPS
    now = datetime.now(timezone.utc).isoformat()
    workflow = {
        "id": str(uuid.uuid4()),
        "user_id": data.user_id,
        "workspace_id": data.workspace_id,
        "workflow_type": data.workflow_type,
        "current_step": step_numbers[0],
        "status": "IN_PROGRESS",
        "step_numbers": step_numbers,
        "readiness_score": readiness["score"],
        "created_at": now,
        "updated_at": now,
    }
    await db.os_workflows.insert_one(workflow)
    workflow.pop("_id", None)
    return {"workflow": workflow, "readiness": readiness}

@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str):
    db = get_db()
    w = await db.os_workflows.find_one({"id": workflow_id}, {"_id": 0})
    if not w:
        raise HTTPException(status_code=404, detail="Workflow not found")
    w["steps"] = await db.os_workflow_steps.find(
        {"workflow_id": workflow_id}, {"_id": 0}
    ).sort("step_number", 1).to_list(20)
    return w

# ─── Step Generation ──────────────────────────────────────────────────────

class GenerateStepInput(BaseModel):
    user_id: str
    workspace_id: Optional[str] = None
    extra: Optional[Dict[str, Any]] = None
    step_inputs: Optional[Dict[str, Any]] = None

@router.post("/{workflow_id}/step/{step_num}/generate")
async def generate_step(workflow_id: str, step_num: int, data: GenerateStepInput):
    db = get_db()
    w = await db.os_workflows.find_one({"id": workflow_id}, {"_id": 0})
    if not w:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if step_num not in w.get("step_numbers", FULL_OS_STEPS):
        raise HTTPException(status_code=400, detail="Step not in this workflow")

    variables = await _build_os_variables(data.user_id, data.workspace_id)
    prior_context = await _build_prior_context(workflow_id, step_num)

    # Build base prompt then inject step inputs if provided
    prompt = get_step_prompt(step_num, variables, prior_context, data.extra)
    if data.step_inputs:
        step_input_block = _format_step_inputs_for_prompt(step_num, data.step_inputs)
        if step_input_block:
            prompt = prompt + "\n\n" + step_input_block

    logger.info(f"Generating OS step {step_num} for workflow {workflow_id}")
    output = await _call_llm(prompt)

    now = datetime.now(timezone.utc).isoformat()
    step_name = STEP_NAMES.get(step_num, f"Step {step_num}")
    step_data = {
        "workflow_id": workflow_id, "step_number": step_num,
        "step_name": step_name, "output": output,
        "is_locked": False, "updated_at": now,
    }
    if data.step_inputs:
        step_data["step_inputs"] = data.step_inputs

    await db.os_workflow_steps.update_one(
        {"workflow_id": workflow_id, "step_number": step_num},
        {"$set": step_data, "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": now}},
        upsert=True
    )
    return {"step_number": step_num, "step_name": step_name, "output": output}

# ─── Step Lock ─────────────────────────────────────────────────────────────

@router.post("/{workflow_id}/step/{step_num}/lock")
async def lock_step(workflow_id: str, step_num: int, user_id: str = "default"):
    db = get_db()
    step = await db.os_workflow_steps.find_one(
        {"workflow_id": workflow_id, "step_number": step_num}, {"_id": 0}
    )
    if not step or not step.get("output"):
        raise HTTPException(status_code=400, detail="Generate step before locking")

    now = datetime.now(timezone.utc).isoformat()
    await db.os_workflow_steps.update_one(
        {"workflow_id": workflow_id, "step_number": step_num},
        {"$set": {"is_locked": True, "locked_at": now}}
    )

    w = await db.os_workflows.find_one({"id": workflow_id}, {"_id": 0})
    step_numbers = w.get("step_numbers", FULL_OS_STEPS)
    current_idx = step_numbers.index(step_num) if step_num in step_numbers else -1
    if current_idx < len(step_numbers) - 1:
        next_step = step_numbers[current_idx + 1]
        await db.os_workflows.update_one(
            {"id": workflow_id}, {"$set": {"current_step": next_step, "updated_at": now}}
        )
    else:
        await db.os_workflows.update_one(
            {"id": workflow_id}, {"$set": {"status": "COMPLETE", "updated_at": now}}
        )

    # Check if enough steps locked for milestone
    locked_count = await db.os_workflow_steps.count_documents(
        {"workflow_id": workflow_id, "is_locked": True}
    )
    if locked_count >= 2:
        from backend.routes.onboarding_router import mark_milestone_internal
        await mark_milestone_internal(user_id, "strategic_os_started", w.get("workspace_id"))

    return {"success": True, "locked_step": step_num}

@router.post("/{workflow_id}/step/{step_num}/unlock")
async def unlock_step(workflow_id: str, step_num: int, user_id: str = "default"):

# ─── Step Unlock ───────────────────────────────────────────────────────────

    """Unlock a previously locked step to allow editing and regeneration."""
    step = await db.os_workflow_steps.find_one(
        {"workflow_id": workflow_id, "step_number": step_num}, {"_id": 0}
    )
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    if not step.get("is_locked"):
        raise HTTPException(status_code=400, detail="Step is not locked")

    now = datetime.now(timezone.utc).isoformat()
    await db.os_workflow_steps.update_one(
        {"workflow_id": workflow_id, "step_number": step_num},
        {"$set": {"is_locked": False, "unlocked_at": now}}
    )

    # Update workflow status back to IN_PROGRESS if it was COMPLETE
    w = await db.os_workflows.find_one({"id": workflow_id}, {"_id": 0})
    if w.get("status") == "COMPLETE":
        await db.os_workflows.update_one(
            {"id": workflow_id}, 
            {"$set": {"status": "IN_PROGRESS", "current_step": step_num, "updated_at": now}}
        )
    else:
        # Set current step to the unlocked step
        await db.os_workflows.update_one(
            {"id": workflow_id}, {"$set": {"current_step": step_num, "updated_at": now}}
        )

    return {"success": True, "unlocked_step": step_num}

# ─── Step Edit ─────────────────────────────────────────────────────────────

class EditStepInput(BaseModel):
    output: str

@router.put("/{workflow_id}/step/{step_num}/edit")
async def edit_step(workflow_id: str, step_num: int, data: EditStepInput):
    db = get_db()
    step = await db.os_workflow_steps.find_one(
        {"workflow_id": workflow_id, "step_number": step_num}, {"_id": 0}
    )
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    if step.get("is_locked"):
        raise HTTPException(status_code=400, detail="Cannot edit a locked step")
    await db.os_workflow_steps.update_one(
        {"workflow_id": workflow_id, "step_number": step_num},
        {"$set": {"output": data.output, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True}

# ─── Export ────────────────────────────────────────────────────────────────

@router.get("/{workflow_id}/export")
async def export_workflow(workflow_id: str):
    db = get_db()
    w = await db.os_workflows.find_one({"id": workflow_id}, {"_id": 0})
    if not w:
        raise HTTPException(status_code=404, detail="Workflow not found")
    steps = await db.os_workflow_steps.find(
        {"workflow_id": workflow_id}, {"_id": 0}
    ).sort("step_number", 1).to_list(20)

    markdown = "# Core Truth House — Strategic OS Export\n\n"
    markdown += f"Workflow: {w.get('workflow_type', 'FULL_OS')} | Created: {w.get('created_at', '')}\n\n---\n\n"
    for s in steps:
        markdown += f"## Step {s['step_number']}: {s.get('step_name', '')}\n\n"
        markdown += s.get("output", "(Not generated)") + "\n\n---\n\n"
    return {"markdown": markdown, "step_count": len(steps)}

@router.get("/{workflow_id}/export-pdf")
async def export_workflow_pdf(workflow_id: str, user_id: str = "default"):
    """Export Strategic OS workflow as a styled PDF and save to Documents."""
    from fastapi.responses import Response
    from pathlib import Path
    import re
    
    w = await db.os_workflows.find_one({"id": workflow_id}, {"_id": 0})
    if not w:
        raise HTTPException(status_code=404, detail="Workflow not found")
    steps = await db.os_workflow_steps.find(
        {"workflow_id": workflow_id}, {"_id": 0}
    ).sort("step_number", 1).to_list(20)
    db = get_db()

    # Build styled HTML for PDF
    html = _build_os_pdf_html(w, steps)
    
    # Generate PDF with Playwright
    try:
        from playwright.async_api import async_playwright
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
            page = await browser.new_page()
            await page.set_content(html, wait_until="networkidle")
            
            pdf_bytes = await page.pdf(
                format="A4",
                print_background=True,
                margin={"top": "20mm", "right": "20mm", "bottom": "20mm", "left": "20mm"}
            )
            
            await browser.close()
        
        workflow_type = w.get('workflow_type', 'full')
        safe_filename = f"strategic-os-{workflow_type.lower()}-{workflow_id[:8]}.pdf"
        
        # Save PDF to exports directory
        exports_dir = Path(__file__).parent.parent / "exports"
        exports_dir.mkdir(exist_ok=True)
        pdf_path = exports_dir / safe_filename
        with open(pdf_path, 'wb') as f:
            f.write(pdf_bytes)
        
        # Auto-save to Documents folder
        try:
            doc_id = str(uuid.uuid4())
            doc = {
                "id": doc_id,
                "user_id": user_id,
                "workspace_id": w.get("workspace_id", ""),
                "client_id": "",
                "filename": f"Strategic OS - {workflow_type.replace('_', ' ')}.pdf",
                "stored_filename": safe_filename,
                "file_url": f"/api/export/download/{safe_filename}",
                "file_size": len(pdf_bytes),
                "mime_type": "application/pdf",
                "category": "branding",
                "description": f"Auto-generated Strategic OS ({workflow_type}) PDF export",
                "extension": ".pdf",
                "auto_generated": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.documents.insert_one(doc)
            logger.info(f"Strategic OS PDF saved to Documents: {doc_id}")
        except Exception as doc_err:
            logger.error(f"Failed to save Strategic OS to Documents: {doc_err}")
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_filename}"'
            }
        )
        
    except ImportError:
        raise HTTPException(status_code=500, detail="Playwright not installed")
    except Exception as e:
        logger.error(f"Strategic OS PDF export failed: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

def _build_os_pdf_html(workflow: dict, steps: list) -> str:
    """Build styled HTML for Strategic OS PDF export."""
    import html as html_escape
    
    workflow_type = workflow.get('workflow_type', 'FULL_OS')
    created_at = workflow.get('created_at', '')[:10]
    
    steps_html = ""
    for s in steps:
        step_num = s.get('step_number', 0)
        step_name = s.get('step_name', f'Step {step_num}')
        output = s.get('output', '(Not generated)')
        is_locked = s.get('is_locked', False)
        
        # Convert markdown to basic HTML
        output_html = _markdown_to_html(output)
        
        status_badge = '<span style="background:#22c55e;color:white;padding:2px 8px;border-radius:4px;font-size:10px;">LOCKED</span>' if is_locked else '<span style="background:#f59e0b;color:white;padding:2px 8px;border-radius:4px;font-size:10px;">DRAFT</span>'
        
        steps_html += f'''
        <div style="page-break-inside:avoid;margin-bottom:30px;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                <div style="width:36px;height:36px;background:#e04e35;color:white;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;">{step_num}</div>
                <div style="flex:1;">
                    <h2 style="margin:0;font-size:16px;color:#1f2937;">{html_escape.escape(step_name)}</h2>
                </div>
                {status_badge}
            </div>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;">
                {output_html}
            </div>
        </div>
        '''
    
    return f'''<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * {{ margin:0;padding:0;box-sizing:border-box; }}
        body {{ font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.6;color:#374151; }}
        h1,h2,h3 {{ color:#111827; }}
        p {{ margin-bottom:8px; }}
        ul,ol {{ margin-left:20px;margin-bottom:8px; }}
        li {{ margin-bottom:4px; }}
        strong {{ color:#111827; }}
    </style>
</head>
<body>
    <!-- Cover -->
    <div style="background:linear-gradient(135deg,#0d0010,#33033c);color:white;padding:60px 40px;margin:-20mm;margin-bottom:30px;text-align:center;">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:2px;opacity:0.7;margin-bottom:20px;">Core Truth House</div>
        <h1 style="font-size:32px;color:white;margin-bottom:10px;">Strategic OS</h1>
        <p style="font-size:14px;opacity:0.8;">{workflow_type.replace('_', ' ')} Workflow</p>
        <p style="font-size:11px;opacity:0.6;margin-top:30px;">Generated: {created_at}</p>
    </div>
    
    <!-- Steps -->
    {steps_html}
    
    <!-- Footer -->
    <div style="text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;">
        <p style="font-size:10px;color:#9ca3af;">Generated by Core Truth House OS</p>
    </div>
</body>
</html>'''

def _markdown_to_html(text: str) -> str:
    """Convert markdown to basic HTML."""
    import html as html_escape
    import re
    
    if not text:
        return '<p>(No content)</p>'
    
    # Escape HTML first
    text = html_escape.escape(text)
    
    # Convert markdown headers
    text = re.sub(r'^### (.+)$', r'<h3 style="font-size:14px;margin:16px 0 8px;">\1</h3>', text, flags=re.MULTILINE)
    text = re.sub(r'^## (.+)$', r'<h2 style="font-size:16px;margin:20px 0 10px;">\1</h2>', text, flags=re.MULTILINE)
    text = re.sub(r'^# (.+)$', r'<h1 style="font-size:18px;margin:24px 0 12px;">\1</h1>', text, flags=re.MULTILINE)
    
    # Convert bold and italic
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)
    
    # Convert bullet lists
    text = re.sub(r'^[-*] (.+)$', r'<li>\1</li>', text, flags=re.MULTILINE)
    text = re.sub(r'(<li>.*</li>\n?)+', r'<ul style="margin:8px 0 8px 20px;">\g<0></ul>', text)
    
    # Convert numbered lists
    text = re.sub(r'^\d+\. (.+)$', r'<li>\1</li>', text, flags=re.MULTILINE)
    
    # Convert line breaks to paragraphs
    paragraphs = text.split('\n\n')
    text = ''.join(f'<p>{p}</p>' if not p.startswith('<') else p for p in paragraphs if p.strip())
    
    return text

# ─── Standalone Generation ─────────────────────────────────────────────────

class StandaloneGenInput(BaseModel):
    user_id: str
    workspace_id: Optional[str] = None
    step_number: int
    extra: Optional[Dict[str, Any]] = None

@router.post("/standalone")
async def standalone_generate(data: StandaloneGenInput):
    variables = await _build_os_variables(data.user_id, data.workspace_id)
    prompt = get_step_prompt(data.step_number, variables, "", data.extra)
    output = await _call_llm(prompt)
    return {"step_number": data.step_number, "step_name": STEP_NAMES.get(data.step_number, ""), "output": output}

# ─── Step Info ─────────────────────────────────────────────────────────────

@router.get("/steps/info")
async def get_steps_info():
    return {
        "steps": [
            {"number": n, "name": STEP_NAMES[n], "description": STEP_DESCRIPTIONS[n]}
            for n in FULL_OS_STEPS
        ],
        "full_os": FULL_OS_STEPS,
        "fast_start": FAST_START_STEPS,
    }
