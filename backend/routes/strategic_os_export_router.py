"""
strategic_os_export_router.py
Core Truth House OS — Strategic OS Export FastAPI Routes
Adapted for existing codebase (no tenant dependencies)

ROUTES:
  GET /api/export/strategic-os-styled        — async Playwright PDF
  GET /api/export/strategic-os/status        — poll async job
  GET /api/export/strategic-os/download/{id} — download when ready
  GET /api/export/strategic-os               — sync ReportLab basic PDF
  GET /api/export/strategic-os/print-preview — HTML for browser print
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import Response, HTMLResponse
import logging

logger = logging.getLogger("cth.export")
from datetime import datetime, timezone
import uuid
import os

from utils.playwright_helper import ensure_chromium_installed, get_browser_executable, LAUNCH_ARGS

from backend.database import get_db

router = APIRouter(prefix='/api/export', tags=['export-strategic-os'])

# ── In-memory job store ────────────────────────────────────────

JOBS = {}

def make_job(workspace_id: str) -> dict:
    job_id = str(uuid.uuid4()).replace('-', '')
    JOBS[job_id] = {
        'job_id': job_id,
        'workspace_id': workspace_id,
        'status': 'pending',
        'progress': 0,
        'download_url': None,
        'error': None,
    }
    return JOBS[job_id]

# ── HTML builder ──────────────────────────────────────────────

def _md_to_html(text: str) -> str:
    """Convert basic markdown to HTML for PDF rendering."""
    import re
    if not text:
        return ''
    html = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    # Headers
    html = re.sub(r'^### (.+)$', r'<h4 style="font-size:14px;font-weight:700;margin:16px 0 6px;color:#1a0020;">\1</h4>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.+)$', r'<h3 style="font-size:16px;font-weight:700;margin:20px 0 8px;color:#1a0020;">\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^# (.+)$', r'<h2 style="font-size:18px;font-weight:700;margin:24px 0 8px;color:#1a0020;">\1</h2>', html, flags=re.MULTILINE)
    # Bold and italic
    html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'\*(.+?)\*', r'<em>\1</em>', html)
    # Bullet lists
    html = re.sub(r'^[-•] (.+)$', r'<li style="margin-bottom:4px;">\1</li>', html, flags=re.MULTILINE)
    html = re.sub(r'(<li[^>]*>.*?</li>\n?)+', lambda m: f'<ul style="padding-left:20px;margin:8px 0;">{m.group(0)}</ul>', html)
    # Numbered lists
    html = re.sub(r'^\d+\. (.+)$', r'<li style="margin-bottom:4px;">\1</li>', html, flags=re.MULTILINE)
    # Paragraphs (double newline)
    html = re.sub(r'\n\n+', '</p><p style="margin:8px 0;line-height:1.7;">', html)
    # Single newlines to <br>
    html = html.replace('\n', '<br>')
    return f'<p style="margin:8px 0;line-height:1.7;">{html}</p>'

def build_strategic_os_html(workspace_data: dict, steps_data: dict, selected_steps: list, brand_data: dict) -> str:
    """Builds a fully styled HTML document for the Strategic OS."""
    colors = brand_data.get('colors', [])
    primary = colors[0] if colors else '#33033C'
    accent = colors[1] if len(colors) > 1 else '#E04E35'
    brand = brand_data.get('brand_name', workspace_data.get('name', 'Brand'))

    STEP_LABELS = {
        1: ('Brand Analysis', '01'),
        2: ('Audience Psychology', '02'),
        3: ('Differentiation', '03'),
        4: ('Competitor Analysis', '04'),
        5: ('Content Pillars', '05'),
        6: ('Platform Strategy', '06'),
        7: ('Monetization Path', '07'),
        8: ('30-Day Content Plan', '08'),
        9: ('Brand Lock', '09'),
    }

    # Fields to skip when rendering step data
    SKIP_FIELDS = {'_id', 'workspace_id', 'step_number', 'is_complete', 'updated_at',
                   'created_at', 'is_locked', 'user_id', 'step_name', 'workflow_id',
                   'id', 'status'}

    step_sections = ''
    for step_num in sorted(selected_steps):
        if step_num not in STEP_LABELS:
            continue
        label, num_str = STEP_LABELS[step_num]
        step_data = steps_data.get(step_num, {})
        content_html = ''

        # Priority 1: Render the 'output' field (AI-generated content)
        output = step_data.get('output', '')
        if isinstance(output, str) and output.strip():
            content_html += f'''
            <div class="field output-field">
              {_md_to_html(output)}
            </div>'''

        # Priority 2: Render step_inputs (user-provided form answers)
        step_inputs = step_data.get('step_inputs', {})
        if isinstance(step_inputs, dict) and step_inputs:
            for field_key, field_val in step_inputs.items():
                if not field_val or not str(field_val).strip():
                    continue
                field_label = field_key.replace('_', ' ').title()
                val_html = str(field_val).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('\n', '<br>')
                content_html += f'''
            <div class="field input-field">
              <p class="field-label">Your Input: {field_label}</p>
              <p class="field-value">{val_html}</p>
            </div>'''

        # Priority 3: Any other top-level fields that aren't metadata
        if not content_html:
            for key, value in step_data.items():
                if key in SKIP_FIELDS or key == 'output' or key == 'step_inputs':
                    continue
                if not value or not str(value).strip():
                    continue
                field_label = key.replace('_', ' ').title()
                val_html = str(value).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('\n', '<br>')
                content_html += f'''
            <div class="field">
              <p class="field-label">{field_label}</p>
              <p class="field-value">{val_html}</p>
            </div>'''

        if not content_html:
            content_html = '<p class="field-value empty">No data recorded for this step yet.</p>'

        step_sections += f'''
        <div class="step-section">
          <div class="step-header">
            <div class="step-number">{num_str}</div>
            <div>
              <p class="step-label">{label}</p>
            </div>
          </div>
          {content_html}
        </div>'''

    now = datetime.now(timezone.utc).strftime('%B %d, %Y')

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{brand} — Strategic OS</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: 'DM Sans', sans-serif; background: #fff; color: #1a0020; line-height: 1.6; }}

  .cover {{
    background: {primary};
    min-height: 100vh; display: flex; flex-direction: column;
    justify-content: flex-end; padding: 80px;
    page-break-after: always;
  }}
  .cover-label {{ font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(255,255,255,0.5); margin-bottom: 16px; }}
  .cover-title {{ font-size: 52px; font-weight: 800; color: #fff; line-height: 1.1; margin-bottom: 12px; }}
  .cover-sub   {{ font-size: 18px; color: rgba(255,255,255,0.55); margin-bottom: 40px; }}
  .cover-meta  {{ font-size: 11px; color: rgba(255,255,255,0.3); }}
  .cover-accent {{ color: {accent}; }}

  .content {{ padding: 60px 80px; }}

  .step-section {{ margin-bottom: 48px; page-break-inside: avoid; }}
  .step-header  {{ display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid {accent}; }}
  .step-number  {{ font-size: 11px; font-weight: 800; color: #fff; background: {accent}; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }}
  .step-label   {{ font-size: 20px; font-weight: 700; color: {primary}; }}

  .field        {{ margin-bottom: 20px; padding: 16px 20px; background: #faf7fd; border-radius: 8px; border-left: 3px solid {accent}; }}
  .field-label  {{ font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(26,0,32,0.4); margin-bottom: 6px; }}
  .field-value  {{ font-size: 14px; color: #2d1840; line-height: 1.7; }}
  .field-value.empty {{ color: rgba(26,0,32,0.25); font-style: italic; }}
  .output-field  {{ background: #fff; border-left: 4px solid {accent}; padding: 20px 24px; }}
  .output-field p {{ font-size: 14px; color: #2d1840; line-height: 1.7; }}
  .output-field h2, .output-field h3, .output-field h4 {{ color: {primary}; }}
  .output-field ul {{ padding-left: 20px; }}
  .output-field li {{ margin-bottom: 4px; }}
  .output-field strong {{ color: {primary}; }}
  .input-field {{ background: rgba(51,3,60,0.04); border-left: 3px solid rgba(51,3,60,0.2); }}

  @media print {{
    .cover {{ min-height: 100vh; }}
    .step-section {{ break-inside: avoid; }}
  }}
</style>
</head>
<body>

<div class="cover">
  <div>
    <p class="cover-label">Strategic Operating System</p>
    <h1 class="cover-title">{brand}</h1>
    <p class="cover-sub">9-Step Brand Strategy</p>
    <p class="cover-meta">Generated {now} · Core Truth House OS</p>
  </div>
</div>

<div class="content">
  {step_sections}
</div>

</body>
</html>"""

# ── DATA FETCH HELPER ─────────────────────────────────────────

async def _fetch_steps_data(workspace_id: str = '', user_id: str = '') -> dict:
    """
    Fetch Strategic OS step data from all sources, with proper fallbacks.
    
    os_workflow_steps: keyed by workflow_id (NOT workspace_id)
    strategic_os_steps: keyed by workspace_id or user_id
    """
    db = get_db()
    steps_data = {}
    
    # 1. Try strategic_os_steps first (persist router) — these have workspace_id
    persist_query = {}
    if workspace_id:
        persist_query = {'workspace_id': workspace_id}
    elif user_id:
        persist_query = {'user_id': user_id}
    
    persist_steps = await db.strategic_os_steps.find(persist_query, {'_id': 0}).to_list(20)
    for s in persist_steps:
        step_num = s.get('step_number')
        if step_num:
            steps_data[step_num] = s
    
    # 2. Try os_workflow_steps — keyed by workflow_id, need to find the workflow first
    wf_query = {}
    if workspace_id:
        wf_query = {'workspace_id': workspace_id}
    elif user_id:
        wf_query = {'user_id': user_id}
    
    # Find the most recent workflow for this workspace/user
    workflow = await db.os_workflows.find_one(wf_query, {'_id': 0, 'id': 1}, sort=[('created_at', -1)])
    if workflow and workflow.get('id'):
        wf_steps = await db.os_workflow_steps.find(
            {'workflow_id': workflow['id']}, {'_id': 0}
        ).to_list(20)
        for s in wf_steps:
            step_num = s.get('step_number')
            if step_num and step_num not in steps_data:
                steps_data[step_num] = s
    
    # 3. Final fallback — try os_workflow_steps with no filter (for single-user setups)
    if not steps_data:
        all_wf_steps = await db.os_workflow_steps.find({}, {'_id': 0}).to_list(20)
        for s in all_wf_steps:
            step_num = s.get('step_number')
            if step_num and step_num not in steps_data:
                steps_data[step_num] = s
    
    # 4. If still empty, try strategic_os_steps with no filter
    if not steps_data:
        all_persist = await db.strategic_os_steps.find({}, {'_id': 0}).to_list(20)
        for s in all_persist:
            step_num = s.get('step_number')
            if step_num and step_num not in steps_data:
                steps_data[step_num] = s
    
    return steps_data

# ── ROUTES ────────────────────────────────────────────────────

@router.get('/strategic-os-styled')
async def export_styled(
    steps: str = '1,2,3,4,5,6,7,8,9',
    workspace_id: str = '',
    user_id: str = '',
    background_tasks: BackgroundTasks = None,
):
    """Async Playwright-rendered PDF — returns job_id for polling."""
    selected_steps = [int(s.strip()) for s in steps.split(',') if s.strip().isdigit()]
    selected_steps = [s for s in selected_steps if 1 <= s <= 9]

    if not selected_steps:
        raise HTTPException(status_code=400, detail='Specify at least one step number')

    steps_data = await _fetch_steps_data(workspace_id, user_id)

    bm_query = {'workspace_id': workspace_id} if workspace_id else {}
    brand_memory = await db.brand_memory.find_one(bm_query, {'_id': 0}) or {}
    workspace = await db.workspaces.find_one({'id': workspace_id} if workspace_id else {}, {'_id': 0}) or {}

    html = build_strategic_os_html(workspace, steps_data, selected_steps, brand_memory)

    job = make_job(workspace_id)
    background_tasks.add_task(_generate_pdf_job, job['job_id'], html)

    return {'job_id': job['job_id'], 'status': 'pending'}

async def _generate_pdf_job(job_id: str, html: str):
    job = JOBS.get(job_id)
    if not job:
        return
    try:
        from playwright.async_api import async_playwright
        
        JOBS[job_id]['status'] = 'generating'
        JOBS[job_id]['progress'] = 10

        # Ensure chromium is installed
        if not ensure_chromium_installed():
            JOBS[job_id]['status'] = 'error'
            JOBS[job_id]['error'] = 'Failed to install Playwright chromium browser'
            return

        # Get explicit executable path
        executable = get_browser_executable()

        JOBS[job_id]['progress'] = 20
        async with async_playwright() as p:
            JOBS[job_id]['progress'] = 40
            launch_options = {
                'headless': True,
                'args': LAUNCH_ARGS
            }
            if executable:
                launch_options['executable_path'] = executable
            
            browser = await p.chromium.launch(**launch_options)
            page = await browser.new_page()
            JOBS[job_id]['progress'] = 60
            await page.set_content(html, wait_until='networkidle')
            JOBS[job_id]['progress'] = 80
            pdf_bytes = await page.pdf(
                format='A4',
                print_background=True,
                margin={'top': '10mm', 'bottom': '10mm', 'left': '0', 'right': '0'},
            )
            await browser.close()

        JOBS[job_id]['pdf_bytes'] = pdf_bytes
        JOBS[job_id]['download_url'] = f'/api/export/strategic-os/download/{job_id}'
        JOBS[job_id]['status'] = 'ready'
        JOBS[job_id]['progress'] = 100

    except Exception as e:
        err = str(e)
        if 'Executable' in err or 'playwright' in err.lower():
            err = 'Playwright browser not installed. Run: playwright install chromium'
        JOBS[job_id]['status'] = 'error'
        JOBS[job_id]['error'] = err

@router.get('/strategic-os/status')
async def get_export_status(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')
    return {
        'job_id': job['job_id'],
        'status': job['status'],
        'progress': job['progress'],
        'download_url': job.get('download_url'),
        'error': job.get('error'),
    }

@router.get('/strategic-os/download/{job_id}')
async def download_export(job_id: str):
    job = JOBS.get(job_id)
    if not job or job['status'] != 'ready':
        raise HTTPException(status_code=404, detail='PDF not ready')
    pdf_bytes = job.get('pdf_bytes')
    if not pdf_bytes:
        raise HTTPException(status_code=404, detail='PDF data not found')
    return Response(
        content=pdf_bytes,
        media_type='application/pdf',
        headers={'Content-Disposition': 'attachment; filename="CTH_Strategic_OS.pdf"'},
    )

@router.get('/strategic-os')
async def export_basic(steps: str = '1,2,3,4,5,6,7,8,9', workspace_id: str = '', user_id: str = ''):
    """Basic PDF via ReportLab — no Playwright needed."""
    selected_steps = [int(s.strip()) for s in steps.split(',') if s.strip().isdigit()]

    # Use the unified data fetching helper
    steps_data = await _fetch_steps_data(workspace_id, user_id)

    bm_query = {'workspace_id': workspace_id} if workspace_id else {}
    brand_memory = await db.brand_memory.find_one(bm_query, {'_id': 0}) or {}
    brand_name = brand_memory.get('brand_name', 'Brand')

    try:
        from io import BytesIO
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
        from reportlab.lib.units import mm

        buf = BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=20*mm, rightMargin=20*mm, topMargin=20*mm, bottomMargin=20*mm)
        styles = getSampleStyleSheet()

        STEP_LABELS = {
            1: 'Brand Analysis', 2: 'Audience Psychology', 3: 'Differentiation',
            4: 'Competitor Analysis', 5: 'Content Pillars', 6: 'Platform Strategy',
            7: 'Monetization Path', 8: '30-Day Content Plan', 9: 'Brand Lock'
        }

        now = datetime.now(timezone.utc).strftime("%B %d, %Y")
        story = []
        story.append(Paragraph(f'{brand_name} — Strategic OS', styles['Title']))
        story.append(Paragraph(f'Generated {now} · Core Truth House OS', styles['Normal']))
        story.append(Spacer(1, 12))

        SKIP_KEYS = {'_id', 'workspace_id', 'step_number', 'is_complete', 'updated_at',
                     'created_at', 'is_locked', 'user_id', 'step_name', 'workflow_id', 'id', 'status'}

        for step_num in sorted(selected_steps):
            if step_num not in STEP_LABELS:
                continue
            s_data = steps_data.get(step_num, {})
            story.append(HRFlowable(width='100%', thickness=1))
            story.append(Spacer(1, 6))
            story.append(Paragraph(f'Step {step_num}: {STEP_LABELS[step_num]}', styles['Heading1']))
            story.append(Spacer(1, 4))

            # Priority: render 'output' first (AI-generated content)
            output = s_data.get('output', '')
            if isinstance(output, str) and output.strip():
                story.append(Paragraph(str(output).replace('\n', '<br/>'), styles['Normal']))
                story.append(Spacer(1, 8))

            # Then render step_inputs if present
            step_inputs = s_data.get('step_inputs', {})
            if isinstance(step_inputs, dict):
                for inp_key, inp_val in step_inputs.items():
                    if not inp_val or not str(inp_val).strip():
                        continue
                    label = inp_key.replace('_', ' ').title()
                    story.append(Paragraph(f'<b>Input: {label}</b>', styles['Normal']))
                    story.append(Paragraph(str(inp_val).replace('\n', '<br/>'), styles['Normal']))
                    story.append(Spacer(1, 6))

            # Fallback: render any other non-metadata fields
            if not output and not step_inputs:
                for key, value in s_data.items():
                    if key in SKIP_KEYS or key == 'output' or key == 'step_inputs':
                        continue
                    if not value or not str(value).strip():
                        continue
                    label = key.replace('_', ' ').title()
                    story.append(Paragraph(f'<b>{label}</b>', styles['Normal']))
                    story.append(Paragraph(str(value).replace('\n', '<br/>'), styles['Normal']))
                    story.append(Spacer(1, 8))

            story.append(Spacer(1, 12))

        doc.build(story)
        buf.seek(0)
        return Response(
            content=buf.read(),
            media_type='application/pdf',
            headers={'Content-Disposition': 'attachment; filename="CTH_Strategic_OS_Basic.pdf"'},
        )
    except ImportError:
        raise HTTPException(status_code=500, detail='ReportLab not installed. Run: pip install reportlab')

@router.get('/strategic-os/print-preview', response_class=HTMLResponse)
async def print_preview(steps: str = '1,2,3,4,5,6,7,8,9', workspace_id: str = '', user_id: str = ''):
    """Returns a print-ready HTML page."""
    selected_steps = [int(s.strip()) for s in steps.split(',') if s.strip().isdigit()]
    
    # Use the unified data fetching helper
    steps_data = await _fetch_steps_data(workspace_id, user_id)
    
    bm_query = {'workspace_id': workspace_id} if workspace_id else {}
    brand_memory = await db.brand_memory.find_one(bm_query, {'_id': 0}) or {}
    workspace = await db.workspaces.find_one({'id': workspace_id} if workspace_id else {}, {'_id': 0}) or {}
    db = get_db()

    html = build_strategic_os_html(workspace, steps_data, selected_steps, brand_memory)
    html = html.replace('</body>', '<script>window.onload=function(){setTimeout(window.print,500)}</script></body>')
    return HTMLResponse(content=html)
