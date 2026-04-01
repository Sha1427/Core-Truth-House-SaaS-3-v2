"""
brand_audit_export_router.py
CTH OS — Brand Audit Export Routes

ROUTES:
  GET /api/export/brand-audit-styled      — async Playwright PDF
  GET /api/export/brand-audit/status      — poll async job
  GET /api/export/brand-audit/download/{id} — download PDF
  GET /api/export/brand-audit/print-preview — HTML for browser print
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import Response, HTMLResponse
from datetime import datetime, timezone
from typing import Optional
import uuid

from backend.database import get_db
from utils.playwright_helper import ensure_chromium_installed, get_browser_executable, LAUNCH_ARGS

router = APIRouter(prefix='/api/export', tags=['export-audit'])
JOBS = {}

def build_audit_html(audit: dict, brand_memory: dict) -> str:
    """Build styled HTML for the Brand Audit report."""
    brand = brand_memory.get('brand_name', 'Brand')
    score = audit.get('overall_score', audit.get('score', 0))
    rating = audit.get('rating', audit.get('brand_health_rating', 'Building'))
    analysis = audit.get('analysis', audit.get('ai_analysis', ''))
    scores = audit.get('scores', audit.get('module_scores', {}))
    date_str = datetime.now().strftime('%B %d, %Y')

    colors = brand_memory.get('colors', [])
    primary = colors[0] if colors else '#33033C'
    accent = colors[1] if len(colors) > 1 else '#E04E35'

    def md_to_html(text):
        if not text:
            return ''
        lines = text.split('\n')
        html = ''
        in_list = False
        for line in lines:
            t = line.strip()
            if not t:
                if in_list:
                    html += '</ul>'
                    in_list = False
                html += '<br>'
                continue
            if t.startswith('## ') or t.startswith('# '):
                if in_list:
                    html += '</ul>'
                    in_list = False
                html += f'<h3>{t.lstrip("#").strip()}</h3>'
            elif t.startswith('### '):
                if in_list:
                    html += '</ul>'
                    in_list = False
                html += f'<h4>{t[4:].strip()}</h4>'
            elif t.startswith('- ') or t.startswith('* '):
                if not in_list:
                    html += '<ul>'
                    in_list = True
                item = t[2:]
                # Handle bold
                while '**' in item:
                    item = item.replace('**', '<strong>', 1).replace('**', '</strong>', 1)
                html += f'<li>{item}</li>'
            else:
                if in_list:
                    html += '</ul>'
                    in_list = False
                p = t
                while '**' in p:
                    p = p.replace('**', '<strong>', 1).replace('**', '</strong>', 1)
                html += f'<p>{p}</p>'
        if in_list:
            html += '</ul>'
        return html

    # Module scores grid
    modules_html = ''
    for k, v in scores.items():
        label = k.replace('_', ' ').title()
        color = '#10B981' if v >= 80 else '#F59E0B' if v >= 50 else '#EF4444'
        modules_html += f'<div class="mod"><p class="mod-name">{label}</p><p class="mod-score" style="color:{color}">{v}%</p></div>'

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{brand} — Brand Audit</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  *{{box-sizing:border-box;margin:0;padding:0;}}
  body{{font-family:'DM Sans',sans-serif;background:#fff;color:#1a0020;}}
  .cover{{background:{primary};min-height:100vh;display:flex;flex-direction:column;justify-content:space-between;padding:80px;page-break-after:always;}}
  .cover-brand{{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.2em;color:rgba(255,255,255,.45);margin-bottom:60px;}}
  .cover-score{{font-size:96px;font-weight:800;color:{accent};line-height:1;}}
  .cover-label{{font-size:18px;color:rgba(255,255,255,.55);margin:8px 0 4px;}}
  .cover-rating{{font-size:32px;font-weight:700;color:#fff;}}
  .cover-meta{{font-size:11px;color:rgba(255,255,255,.3);}}
  .section{{padding:50px 80px;page-break-inside:avoid;}}
  .section-title{{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.18em;color:{accent};margin-bottom:20px;}}
  .mod-grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px;}}
  .mod{{padding:16px 20px;background:#faf7fd;border-radius:8px;border-left:3px solid {accent};}}
  .mod-name{{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:rgba(26,0,32,.4);margin-bottom:6px;}}
  .mod-score{{font-size:28px;font-weight:800;}}
  .analysis h3{{font-size:15px;font-weight:700;color:{primary};margin:20px 0 8px;}}
  .analysis h4{{font-size:13px;font-weight:700;color:{primary};margin:14px 0 6px;}}
  .analysis p{{font-size:13px;color:#2d1840;line-height:1.75;margin-bottom:8px;}}
  .analysis ul{{margin:4px 0 12px 20px;}}
  .analysis li{{font-size:13px;color:#2d1840;line-height:1.7;margin-bottom:4px;}}
  .analysis strong{{font-weight:700;color:{primary};}}
  @media print{{.cover{{min-height:100vh;}}}}
</style>
</head>
<body>
<div class="cover">
  <p class="cover-brand">{brand} — Brand Audit Report</p>
  <div>
    <p class="cover-score">{score}</p>
    <p class="cover-label">Overall Brand Score</p>
    <p class="cover-rating">{rating}</p>
  </div>
  <p class="cover-meta">Generated {date_str} · Core Truth House OS</p>
</div>
<div class="section">
  <p class="section-title">Module Scores</p>
  <div class="mod-grid">{modules_html}</div>
</div>
<div class="section">
  <p class="section-title">AI Analysis</p>
  <div class="analysis">{md_to_html(analysis)}</div>
</div>
</body>
</html>"""

@router.get('/brand-audit-styled')
async def export_styled(
    audit_id: Optional[str] = None,
    user_id: str = "default",
    workspace_id: Optional[str] = None,
    background_tasks: BackgroundTasks = None,
):
    """Generate styled PDF using Playwright."""
    # Load audit data
    query = {"user_id": user_id}
    if workspace_id:
        query["workspace_id"] = workspace_id
    
    if audit_id:
        query["_id"] = audit_id
    
    audit = await db.brand_audits.find_one(query, {"_id": 0}, sort=[("created_at", -1)]) or {}
    brand_mem = await db.brand_memory.find_one({"user_id": user_id}, {"_id": 0}) or {}
    
    html = build_audit_html(audit, brand_mem)

    # Check Playwright availability
    if not ensure_chromium_installed():
        raise HTTPException(status_code=503, detail='Playwright chromium not installed. Run: playwright install chromium')

    job_id = str(uuid.uuid4()).replace('-', '')
    JOBS[job_id] = {'status': 'pending', 'progress': 0, 'pdf_bytes': None, 'error': None}
    background_tasks.add_task(_render_pdf, job_id, html)
    return {'job_id': job_id, 'status': 'pending'}

async def _render_pdf(job_id: str, html: str):
    """Background task to render PDF with Playwright."""
    try:
        from playwright.async_api import async_playwright
        JOBS[job_id]['status'] = 'generating'
        
        executable = get_browser_executable()
        
        async with async_playwright() as p:
            launch_options = {'headless': True, 'args': LAUNCH_ARGS}
            if executable:
                launch_options['executable_path'] = executable
            
            browser = await p.chromium.launch(**launch_options)
            page = await browser.new_page()
            JOBS[job_id]['progress'] = 50
            await page.set_content(html, wait_until='networkidle')
            pdf = await page.pdf(
                format='A4',
                print_background=True,
                margin={'top': '10mm', 'bottom': '10mm', 'left': '0', 'right': '0'}
            )
            await browser.close()
        
        JOBS[job_id]['pdf_bytes'] = pdf
        JOBS[job_id]['download_url'] = f'/api/export/brand-audit/download/{job_id}'
        JOBS[job_id]['status'] = 'ready'
        JOBS[job_id]['progress'] = 100
    except Exception as e:
        JOBS[job_id]['status'] = 'error'
        JOBS[job_id]['error'] = str(e)

@router.get('/brand-audit/status')
async def get_status(job_id: str):
    """Poll job status."""
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(404, 'Job not found')
    return {
        'status': job['status'],
        'progress': job['progress'],
        'download_url': job.get('download_url'),
        'error': job.get('error'),
    }

@router.get('/brand-audit/download/{job_id}')
async def download(job_id: str):
    """Download completed PDF."""
    job = JOBS.get(job_id)
    if not job or job['status'] != 'ready' or not job.get('pdf_bytes'):
        raise HTTPException(404, 'PDF not ready')
    return Response(
        content=job['pdf_bytes'],
        media_type='application/pdf',
        headers={'Content-Disposition': 'attachment; filename="CTH_Brand_Audit.pdf"'}
    )

@router.get('/brand-audit/print-preview', response_class=HTMLResponse)
async def print_preview(
    audit_id: Optional[str] = None,
    user_id: str = "default",
    workspace_id: Optional[str] = None,
):
    """HTML for browser print - no Playwright required."""
    query = {"user_id": user_id}
    if workspace_id:
        query["workspace_id"] = workspace_id
    if audit_id:
        query["_id"] = audit_id
    
    audit = await db.brand_audits.find_one(query, {"_id": 0}, sort=[("created_at", -1)]) or {}
    brand_mem = await db.brand_memory.find_one({"user_id": user_id}, {"_id": 0}) or {}
    
    html = build_audit_html(audit, brand_mem)
    # Add auto-print script
    html = html.replace('</body>', '<script>window.onload=function(){setTimeout(window.print,500)}</script></body>')
    return HTMLResponse(content=html)
