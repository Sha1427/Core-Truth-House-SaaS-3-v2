"""
campaign_context_router.py
CTH OS — Campaign Builder Strategic OS Context Aggregator

Provides a single endpoint that aggregates Strategic OS step data
and Brand Memory into a pre-populated context for the Campaign Builder.

ROUTE:
  GET /api/campaign-builder/strategic-context
"""

from fastapi import APIRouter, Query
from typing import Optional
from backend.database import get_db

router = APIRouter(prefix="/api/campaign-builder", tags=["campaign-builder"])

# ─── Field Mapping ───────────────────────────────────────────
# Maps output field → (step_number, step_inputs_key, label)
# Keys here match the actual step_inputs field names from os_workflow.py

STEP_INPUT_MAP = {
    # Step 2 — Audience Psychology
    'target_audience':  (2, 'ideal_client_sentence', 'Audience Psychology'),
    'pain_points':      (2, 'keeps_them_up',         'Audience Psychology'),
    'desired_outcome':  (2, 'dream_outcome',          'Audience Psychology'),

    # Step 3 — Differentiation
    'unique_mechanism': (3, 'why_you_not_them',       'Differentiation'),
    'positioning':      (3, 'want_to_be_known_for',   'Differentiation'),

    # Step 5 — Content Pillars
    'content_pillar_focus': (5, 'lead_pillar',        'Content Pillars'),
    'content_cta':          (5, 'primary_cta',        'Content Pillars'),

    # Step 6 — Platform Strategy
    'primary_platform': (6, 'priority_platform',      'Platform Strategy'),
    'posting_cadence':  (6, 'posting_capacity',       'Platform Strategy'),

    # Step 7 — Content Calendar
    'campaign_content_goal': (7, 'content_month_goal', 'Content Calendar'),

    # Step 9 — Conversion
    'primary_offer':    (9, 'offer_to_push',          'Conversion'),
    'revenue_goal':     (9, 'revenue_goal_quarter',   'Conversion'),
}

# Brand Memory field fallbacks — used when Strategic OS doesn't have the data
BRAND_MEMORY_MAP = {
    'target_audience':  ['target_audience', 'who_you_serve'],
    'pain_points':      ['audience_problem', 'biggest_challenge'],
    'desired_outcome':  ['audience_desire', 'transformation'],
    'unique_mechanism': ['unique_mechanism'],
    'positioning':      ['positioning', 'brand_promise'],
    'primary_offer':    ['primary_offer', 'core_offer'],
    'primary_platform': ['platforms'],
    'brand_voice':      ['voice', 'brand_voice'],
    'brand_name':       ['brand_name'],
    'tagline':          ['tagline'],
    'brand_strengths':  ['brand_strengths'],
    'transformation':   ['transformation'],
}

@router.get('/strategic-context')
async def get_strategic_context(
    user_id: str = Query("default"),
    workspace_id: Optional[str] = Query(None),
):
    """
    Aggregates Strategic OS step inputs + Brand Memory into a Campaign Builder
    pre-population context. Called once when the New Campaign form loads.
    """
    query = {"user_id": user_id}

    # ── Load the latest Strategic OS workflow and its steps ────────
    wf_query = {"user_id": user_id}
    if workspace_id:
        wf_query["workspace_id"] = workspace_id

    workflow = await db.os_workflows.find_one(
        wf_query, {"_id": 0, "id": 1},
        sort=[("created_at", -1)]
    )

    step_map = {}
    if workflow:
        steps_cursor = db.os_workflow_steps.find(
            {"workflow_id": workflow["id"]}, {"_id": 0}
        )
        steps_list = await steps_cursor.to_list(length=20)
        step_map = {s.get('step_number'): s for s in steps_list}

    # ── Load Brand Memory + Brand Foundation ──────────────────────
    brand_memory = await db.brand_memory.find_one(query, {"_id": 0}) or {}
    brand_foundation = await db.brand_foundation.find_one(query, {"_id": 0}) or {}
    # Merge foundation into memory as fallback (memory takes priority)
    merged_memory = {**brand_foundation, **brand_memory}

    # ── Build context data ────────────────────────────────────────
    data = {}
    prefilled = []
    field_sources = {}

    # 1. Extract from Strategic OS step_inputs (highest priority)
    for field_name, (step_num, input_key, label) in STEP_INPUT_MAP.items():
        step_data = step_map.get(step_num, {})
        step_inputs = step_data.get('step_inputs', {})

        value = step_inputs.get(input_key, '')
        if isinstance(value, list):
            value = ', '.join(value) if value else ''
        elif isinstance(value, str):
            value = value.strip()

        if value:
            data[field_name] = value
            prefilled.append(field_name)
            field_sources[field_name] = label

    # 2. Fill gaps from Brand Memory (lower priority — only if not already set)
    for field_name, memory_keys in BRAND_MEMORY_MAP.items():
        if field_name in data:
            continue  # Already populated from Strategic OS
        for mem_key in memory_keys:
            value = merged_memory.get(mem_key, '')
            if isinstance(value, list) and value:
                value = ', '.join(str(v) for v in value)
            elif isinstance(value, str):
                value = value.strip()
            if value:
                data[field_name] = value
                prefilled.append(field_name)
                field_sources[field_name] = 'Brand Memory'
                break

    # 3. Content Pillars (Step 5 — parsed from output if no step_inputs)
    step5 = step_map.get(5, {})
    step5_inputs = step5.get('step_inputs', {})
    if step5_inputs.get('lead_pillar') and 'content_pillar_focus' not in data:
        data['content_pillar_focus'] = step5_inputs['lead_pillar']
        prefilled.append('content_pillar_focus')
        field_sources['content_pillar_focus'] = 'Content Pillars'

    # ── Completion summary ────────────────────────────────────────
    completed_steps = [
        step_num for step_num in range(1, 10)
        if step_map.get(step_num, {}).get('is_locked', False)
    ]
    missing_steps = [s for s in range(1, 10) if s not in completed_steps]

    # Readiness: need at least Audience Psychology (step 2) with content,
    # or enough Brand Memory fields
    step2 = step_map.get(2, {})
    step2_inputs = step2.get('step_inputs', {})
    step2_has_content = bool(
        step2_inputs.get('ideal_client_sentence') or
        step2_inputs.get('keeps_them_up') or
        step2_inputs.get('dream_outcome')
    )
    has_brand_memory = bool(
        merged_memory.get('target_audience') or
        merged_memory.get('primary_offer')
    )
    is_ready = step2_has_content or has_brand_memory or 2 in completed_steps

    message = None
    if not is_ready:
        message = 'Complete Strategic OS Step 2 (Audience Psychology) or fill out Brand Memory to unlock full campaign pre-population.'

    return {
        'data': data,
        'prefilled_fields': prefilled,
        'field_sources': field_sources,
        'completion_summary': {
            'steps_complete': len(completed_steps),
            'completed_steps': completed_steps,
            'missing_steps': missing_steps,
            'is_ready': is_ready,
        },
        'message': message,
    }
