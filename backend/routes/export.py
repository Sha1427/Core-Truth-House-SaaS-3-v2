"""Brand kit export routes - ZIP + PDF generation."""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, Response, HTMLResponse
from typing import Optional
from datetime import datetime, timezone
from pathlib import Path
import uuid
import json
import zipfile
import io
import os
import re
import asyncio

from utils.playwright_helper import ensure_chromium_installed, get_browser_executable, LAUNCH_ARGS

from backend.database import get_db, UPLOAD_DIR, logger

router = APIRouter(prefix="/api/export", tags=["export"])

EXPORT_DIR = Path(__file__).parent.parent / "exports"
EXPORT_DIR.mkdir(exist_ok=True)

# Path to the styled HTML template
TEMPLATE_PATH = Path(__file__).parent.parent / "templates" / "brand_guidelines_template.html"

# ── In-memory job store for async PDF generation ──
PDF_JOBS = {}

async def get_brand_data_for_pdf(user_id: str, workspace_id: str = None):
    """Fetch brand data for PDF generation"""
    # Get workspace
    if workspace_id:
        workspace = await db.workspaces.find_one({"id": workspace_id}, {"_id": 0})
    else:
        workspace = await db.workspaces.find_one({"owner_id": user_id}, {"_id": 0})
    
    if not workspace:
        workspace = {"name": "Your Brand", "brand_name": "Your Brand"}
    
    # Get brand foundation
    foundation = await db.brand_foundation.find_one({"user_id": user_id}, {"_id": 0}) or {}
    
    # Get identity (colors, fonts)
    identity = await db.identity.find_one({"user_id": user_id}, {"_id": 0}) or {}
    
    # Get brand memory
    brand_memory = await db.brand_memory.find_one({"user_id": user_id}, {"_id": 0}) or {}
    
    return {
        "workspace": workspace,
        "foundation": foundation,
        "identity": identity,
        "brand_memory": brand_memory,
    }
    db = get_db()

def render_styled_brand_guidelines(brand_data: dict) -> str:
    """Render the styled HTML template with brand data"""
    # Read template
    if not TEMPLATE_PATH.exists():
        raise FileNotFoundError("Brand guidelines template not found")
    
    with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
        template = f.read()
    
    workspace = brand_data.get("workspace", {})
    foundation = brand_data.get("foundation", {})
    identity = brand_data.get("identity", {})
    
    # Get workspace/brand name
    workspace_name = workspace.get("brand_name") or workspace.get("name") or "Your Brand"
    
    # Get date strings
    now = datetime.now()
    generated_date = now.strftime("%B %d, %Y")
    generated_month = now.strftime("%B %Y")
    
    # Get domain
    domain = workspace.get("custom_domain") or "coretruthhouse.com"
    
    # Replace placeholders
    html = template
    html = html.replace("{{WORKSPACE_NAME}}", workspace_name)
    html = html.replace("{{DOMAIN}}", domain)
    html = html.replace("{{GENERATED_DATE}}", generated_date)
    html = html.replace("{{GENERATED_MONTH}}", generated_month)
    
    # Replace brand foundation content if available
    if foundation.get("mission"):
        html = html.replace(
            "Build the strategy, systems, and content behind a brand that actually grows.",
            foundation["mission"]
        )
    
    if foundation.get("vision"):
        old_vision = "A world where every serious founder stops guessing and starts building on a foundation of truth"
        if old_vision in html:
            html = html.replace(
                "A world where every serious founder stops guessing and starts building on a foundation of truth — where strategy comes before aesthetics, systems come before scale, and the brands that last are not the ones with the biggest budgets. They are the ones built the deepest.",
                foundation["vision"]
            )
    
    if foundation.get("tagline"):
        html = html.replace("Where serious brands are built.", foundation["tagline"])
    
    if foundation.get("positioning"):
        old_positioning = "For serious founders who are tired of building backwards"
        if old_positioning in html:
            html = html.replace(
                "For serious founders who are tired of building backwards — {{WORKSPACE_NAME}} is the brand operating system that puts strategy, systems, and clarity first, so every piece of content they create compounds instead of competes.",
                foundation["positioning"]
            )
    
    # Replace colors if identity has custom colors
    colors = identity.get("colors", [])
    if colors and len(colors) >= 2:
        if colors[0].get("hex"):
            html = html.replace("#33033C", colors[0]["hex"])
        if colors[1].get("hex"):
            html = html.replace("#E04E35", colors[1]["hex"])
    
    return html

@router.get("/brand-guidelines-styled")
async def export_styled_brand_guidelines(
    user_id: str,
    workspace_id: str = None,
    format: str = "pdf"
):
    """
    Generate and download styled Brand Guidelines PDF (6-page designed document)
    
    Args:
        user_id: User ID
        workspace_id: Optional workspace ID
        format: "pdf" or "html"
    """
    try:
        # Get brand data
        brand_data = await get_brand_data_for_pdf(user_id, workspace_id)
        
        # Render HTML
        html = render_styled_brand_guidelines(brand_data)
        
        # If HTML format requested, return HTML directly
        if format == "html":
            return Response(
                content=html,
                media_type="text/html",
                headers={
                    "Content-Disposition": 'inline; filename="brand-guidelines.html"'
                }
            )
        
        # Generate PDF using Playwright
        try:
            from playwright.async_api import async_playwright
            
            # Ensure chromium is installed
            ensure_chromium_installed()

            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True, args=LAUNCH_ARGS)
                page = await browser.new_page()
                
                # Set content and wait for fonts to load
                await page.set_content(html, wait_until="networkidle")
                
                # Generate PDF with critical settings
                pdf_bytes = await page.pdf(
                    format="A4",
                    print_background=True,  # CRITICAL - required for color blocks
                    margin={
                        "top": "0",
                        "right": "0", 
                        "bottom": "0",
                        "left": "0"
                    }
                )
                
                await browser.close()
        except ImportError:
            raise HTTPException(status_code=500, detail="Playwright not installed. Run: playwright install chromium")
        
        # Get workspace name for filename
        workspace_name = brand_data.get("workspace", {}).get("brand_name") or brand_data.get("workspace", {}).get("name") or "brand"
        safe_filename = re.sub(r'[^a-zA-Z0-9\-_]', '-', workspace_name.lower())
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_filename}-brand-guidelines.pdf"'
            }
        )
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Styled PDF generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

@router.post("/brand-kit")
async def export_brand_kit(user_id: str = "default", workspace_id: Optional[str] = None):
    """Export complete brand kit as ZIP (brand data JSON + assets + PDF guidelines)."""
    query = {"user_id": user_id}
    if workspace_id:
        query["workspace_id"] = workspace_id

    # Gather brand data
    foundation = await db.brand_foundation.find_one(query, {"_id": 0}) or {}
    identity = await db.identity.find_one({"user_id": user_id}, {"_id": 0}) or {}
    assets = await db.brand_assets.find({"user_id": user_id}, {"_id": 0}).to_list(50)
    generated_media = await db.generated_media.find(query, {"_id": 0}).sort("created_at", -1).to_list(20)
    offers = await db.offers.find(query, {"_id": 0}).to_list(50)
    content = await db.content.find(query, {"_id": 0}).sort("created_at", -1).to_list(20)

    workspace_name = "brand"
    if workspace_id:
        ws = await db.workspaces.find_one({"id": workspace_id}, {"_id": 0})
        if ws:
            workspace_name = ws.get("brand_name") or ws.get("name", "brand")

    # Build ZIP
    export_id = uuid.uuid4().hex[:8]
    zip_filename = f"brand_kit_{workspace_name.lower().replace(' ', '_')}_{export_id}.zip"
    zip_path = EXPORT_DIR / zip_filename

    with zipfile.ZipFile(str(zip_path), 'w', zipfile.ZIP_DEFLATED) as zf:
        # 1. Brand data JSON
        brand_data = {
            "brand_name": workspace_name,
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "foundation": _clean_for_json(foundation),
            "identity": {
                "colors": identity.get("colors", []),
                "fonts": identity.get("fonts", {}),
            },
            "offers": [_clean_for_json(o) for o in offers],
        }
        zf.writestr("brand_data.json", json.dumps(brand_data, indent=2, default=str))

        # 2. Brand assets (logos, icons)
        for asset in assets:
            asset_path = Path(asset.get("file_path", ""))
            if asset_path.exists():
                zf.write(str(asset_path), f"assets/{asset.get('original_filename', asset_path.name)}")

        # 3. Generated media
        for i, media in enumerate(generated_media[:10]):
            media_path = UPLOAD_DIR / media.get("filename", "")
            if media_path.exists():
                ext = media_path.suffix
                zf.write(str(media_path), f"media/{media.get('media_type', 'file')}_{i+1}{ext}")

        # 4. Brand guidelines PDF
        pdf_bytes = _generate_guidelines_pdf(workspace_name, foundation, identity, content, offers)
        if pdf_bytes:
            zf.writestr("brand_guidelines.pdf", pdf_bytes)

    file_size = os.path.getsize(zip_path)
    logger.info(f"Brand kit exported: {zip_filename} ({file_size} bytes)")

    return {
        "success": True,
        "download_url": f"/api/export/download/{zip_filename}",
        "filename": zip_filename,
        "file_size": file_size,
    }

@router.get("/download/{filename}")
async def download_export(filename: str):
    """Download an exported brand kit."""
    file_path = EXPORT_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Export file not found")

    return FileResponse(
        str(file_path),
        media_type="application/zip",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.post("/brand-kit-pdf")
async def export_brand_kit_pdf(user_id: str = "default", workspace_id: Optional[str] = None):
    """Export brand guidelines as PDF only (no ZIP)."""
    from fastapi.responses import Response

    query = {"user_id": user_id}
    if workspace_id:
        query["workspace_id"] = workspace_id

    foundation = await db.brand_foundation.find_one(query, {"_id": 0}) or {}
    identity = await db.identity.find_one({"user_id": user_id}, {"_id": 0}) or {}
    content = await db.content.find(query, {"_id": 0}).sort("created_at", -1).to_list(10)
    offers = await db.offers.find(query, {"_id": 0}).to_list(20)

    workspace_name = "brand"
    if workspace_id:
        ws = await db.workspaces.find_one({"id": workspace_id}, {"_id": 0})
        if ws:
            workspace_name = ws.get("brand_name") or ws.get("name", "brand")

    pdf_bytes = _generate_guidelines_pdf(workspace_name, foundation, identity, content, offers)
    if not pdf_bytes:
        raise HTTPException(status_code=500, detail="PDF generation failed")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{workspace_name.lower()}_brand_guidelines.pdf"'}
    )

def _clean_for_json(doc: dict) -> dict:
    """Remove MongoDB internal fields and convert datetimes."""
    cleaned = {}
    for k, v in doc.items():
        if k.startswith("_"):
            continue
        if isinstance(v, datetime):
            cleaned[k] = v.isoformat()
        else:
            cleaned[k] = v
    return cleaned

def _generate_guidelines_pdf(brand_name: str, foundation: dict, identity: dict, content: list = None, offers: list = None) -> bytes:
    """Generate brand guidelines PDF using reportlab."""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.colors import HexColor, Color
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib.enums import TA_CENTER

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=60, bottomMargin=40)
        styles = getSampleStyleSheet()
        elements = []

        # Custom styles
        title_style = ParagraphStyle(
            'BrandTitle', parent=styles['Title'],
            fontSize=32, textColor=HexColor('#AF0024'), spaceAfter=12, alignment=TA_CENTER
        )
        heading_style = ParagraphStyle(
            'BrandHeading', parent=styles['Heading2'],
            fontSize=18, textColor=HexColor('#e04e35'), spaceBefore=28, spaceAfter=10
        )
        subheading_style = ParagraphStyle(
            'BrandSubheading', parent=styles['Heading3'],
            fontSize=13, textColor=HexColor('#763b5b'), spaceBefore=16, spaceAfter=6
        )
        body_style = ParagraphStyle(
            'BrandBody', parent=styles['Normal'],
            fontSize=11, leading=16, textColor=HexColor('#333333'), spaceAfter=8
        )
        label_style = ParagraphStyle(
            'BrandLabel', parent=styles['Normal'],
            fontSize=9, textColor=HexColor('#999999'), spaceAfter=4
        )
        center_style = ParagraphStyle(
            'CenterLabel', parent=label_style, alignment=TA_CENTER
        )

        # ===== TITLE PAGE =====
        elements.append(Spacer(1, 2.5 * inch))
        elements.append(Paragraph(f"{brand_name}", title_style))
        elements.append(Spacer(1, 0.2 * inch))
        elements.append(Paragraph("Brand Guidelines", ParagraphStyle(
            'Subtitle', parent=styles['Normal'],
            fontSize=16, textColor=HexColor('#C7A09D'), spaceAfter=24, alignment=TA_CENTER
        )))
        elements.append(Spacer(1, 0.5 * inch))
        elements.append(Paragraph(
            f"Generated by Core Truth House OS | {datetime.now(timezone.utc).strftime('%B %d, %Y')}",
            center_style
        ))
        elements.append(PageBreak())

        # ===== BRAND FOUNDATION =====
        elements.append(Paragraph("Brand Foundation", title_style))
        elements.append(Spacer(1, 0.3 * inch))

        sections = [
            ("mission", "Mission Statement"),
            ("vision", "Vision Statement"),
            ("tagline", "Tagline"),
            ("positioning", "Brand Positioning"),
            ("story", "Brand Story"),
            ("tone_of_voice", "Tone of Voice"),
            ("target_audience", "Target Audience"),
            ("unique_value_proposition", "Unique Value Proposition"),
        ]
        for key, label in sections:
            val = foundation.get(key, "")
            if val:
                elements.append(Paragraph(label, heading_style))
                # Handle long text with proper wrapping
                text = str(val).replace('\n', '<br/>')
                elements.append(Paragraph(text, body_style))

        # Values
        values = foundation.get("values", [])
        if values:
            elements.append(Paragraph("Core Values", heading_style))
            for v in values:
                elements.append(Paragraph(f"&bull; {v}", body_style))

        # ===== VISUAL IDENTITY =====
        elements.append(PageBreak())
        elements.append(Paragraph("Visual Identity", title_style))
        elements.append(Spacer(1, 0.3 * inch))

        # Colors
        id_colors = identity.get("colors", [])
        if id_colors:
            elements.append(Paragraph("Color Palette", heading_style))
            color_data = [["Color Name", "Hex Code", "Usage"]]
            for c in id_colors:
                color_data.append([
                    c.get("name", "—"),
                    c.get("hex", "#000"),
                    c.get("usage", "—"),
                ])
            if len(color_data) > 1:
                t = Table(color_data, colWidths=[2*inch, 1.5*inch, 3*inch])
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), HexColor('#2b1040')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                    ('TOPPADDING', (0, 0), (-1, -1), 8),
                    ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#dddddd')),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#ffffff'), HexColor('#f9f5f5')]),
                ]))
                elements.append(t)

        # Fonts
        fonts = identity.get("fonts", {})
        if fonts:
            elements.append(Paragraph("Typography", heading_style))
            if fonts.get("heading"):
                elements.append(Paragraph(f"<b>Heading Font:</b> {fonts['heading']}", body_style))
            if fonts.get("body"):
                elements.append(Paragraph(f"<b>Body Font:</b> {fonts['body']}", body_style))
            if fonts.get("accent"):
                elements.append(Paragraph(f"<b>Accent Font:</b> {fonts['accent']}", body_style))

        # ===== OFFERS =====
        if offers:
            elements.append(PageBreak())
            elements.append(Paragraph("Offers & Services", title_style))
            elements.append(Spacer(1, 0.3 * inch))

            for i, offer in enumerate(offers[:10]):
                elements.append(Paragraph(f"{i+1}. {offer.get('name', 'Untitled Offer')}", heading_style))
                if offer.get('description'):
                    elements.append(Paragraph(str(offer['description']), body_style))
                if offer.get('price'):
                    elements.append(Paragraph(f"<b>Price:</b> {offer['price']}", body_style))
                if offer.get('features'):
                    features = offer['features']
                    if isinstance(features, list):
                        for f in features:
                            elements.append(Paragraph(f"&bull; {f}", body_style))

        # ===== RECENT CONTENT =====
        if content:
            elements.append(PageBreak())
            elements.append(Paragraph("Content Library", title_style))
            elements.append(Spacer(1, 0.3 * inch))

            for item in content[:10]:
                title = item.get('title') or item.get('type', 'Untitled')
                elements.append(Paragraph(title, subheading_style))
                body = item.get('content', '')
                if body:
                    # Truncate very long content
                    text = str(body)[:1000]
                    if len(str(body)) > 1000:
                        text += '...'
                    text = text.replace('\n', '<br/>')
                    elements.append(Paragraph(text, body_style))

        # ===== FOOTER =====
        elements.append(Spacer(1, 0.5 * inch))
        elements.append(Paragraph("—", center_style))
        elements.append(Paragraph(
            f"This brand guideline document was generated by Core Truth House OS for {brand_name}.",
            center_style
        ))

        doc.build(elements)
        return buffer.getvalue()

    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        return b""

# ===== ASYNC JOB ENDPOINTS (for BrandGuidelinesExport.jsx) =====

def _build_brand_html(brand_data: dict) -> str:
    """Build styled HTML from brand data for Playwright PDF rendering."""
    primary = '#33033C'
    accent = '#E04E35'

    colors = brand_data.get('colors', [])
    if colors and isinstance(colors, list):
        if isinstance(colors[0], dict):
            if colors[0].get('hex'):
                primary = colors[0]['hex']
            if len(colors) > 1 and colors[1].get('hex'):
                accent = colors[1]['hex']
        elif isinstance(colors[0], str):
            primary = colors[0]
            if len(colors) > 1:
                accent = colors[1]

    brand_name = brand_data.get('brand_name', 'Brand')
    tagline = brand_data.get('tagline', 'Where serious brands are built.')
    mission = brand_data.get('mission', '')
    vision = brand_data.get('vision', '')
    values = brand_data.get('values', [])
    positioning = brand_data.get('positioning', '')
    tone_of_voice = brand_data.get('tone_of_voice', '')
    target_audience = brand_data.get('target_audience', '')
    story = brand_data.get('story', '')
    fonts = brand_data.get('fonts', {})

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{brand_name} — Brand Guidelines</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: 'DM Sans', sans-serif; background: #fff; color: #1a0020; }}
  .cover {{ background: {primary}; min-height: 100vh; display: flex; flex-direction: column; justify-content: flex-end; padding: 80px; }}
  .cover h1 {{ font-size: 56px; font-weight: 800; color: #fff; margin-bottom: 12px; line-height: 1.1; }}
  .cover p {{ font-size: 18px; color: rgba(255,255,255,0.6); }}
  .cover .accent {{ color: {accent}; }}
  .section {{ padding: 60px 80px; page-break-inside: avoid; }}
  .section:nth-child(even) {{ background: #faf7fd; }}
  .section-label {{ font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: {accent}; margin-bottom: 8px; }}
  .section-title {{ font-size: 32px; font-weight: 800; color: {primary}; margin-bottom: 24px; }}
  .field {{ margin-bottom: 20px; }}
  .field-label {{ font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(26,0,32,0.4); margin-bottom: 6px; }}
  .field-value {{ font-size: 15px; color: #2d1840; line-height: 1.65; }}
  .color-grid {{ display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px; }}
  .color-chip {{ width: 80px; }}
  .color-swatch {{ width: 80px; height: 60px; border-radius: 8px; margin-bottom: 6px; }}
  .color-hex {{ font-size: 11px; font-weight: 600; color: #4a3050; font-family: monospace; }}
  .values-list {{ list-style: none; padding: 0; }}
  .values-list li {{ padding: 8px 0; border-bottom: 1px solid rgba(26,0,32,0.06); font-size: 15px; color: #2d1840; }}
  .values-list li:last-child {{ border-bottom: none; }}
  .page-break {{ page-break-after: always; }}
  @media print {{
    .cover {{ min-height: 100vh; }}
    .section {{ break-inside: avoid; }}
  }}
</style>
</head>
<body>

<!-- COVER -->
<div class="cover page-break">
  <div>
    <p class="accent" style="font-size:13px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;margin-bottom:20px;">Brand Guidelines</p>
    <h1>{brand_name}</h1>
    <p>{tagline}</p>
    <p style="margin-top:40px;font-size:12px;color:rgba(255,255,255,0.35);">Generated {datetime.now(timezone.utc).strftime('%B %d, %Y')}</p>
  </div>
</div>
"""

    # Brand Foundation section
    has_foundation = any([mission, vision, values, positioning, story, tone_of_voice, target_audience])
    if has_foundation:
        html += '<div class="section">'
        html += '<p class="section-label">01 — Brand Foundation</p>'
        html += '<h2 class="section-title">Who We Are</h2>'
        for key, label in [('mission', 'Mission'), ('vision', 'Vision'), ('positioning', 'Positioning'),
                           ('story', 'Brand Story'), ('tone_of_voice', 'Tone of Voice'), ('target_audience', 'Target Audience')]:
            val = brand_data.get(key, '')
            if val:
                html += f'<div class="field"><p class="field-label">{label}</p><p class="field-value">{val}</p></div>'
        if values:
            html += '<div class="field"><p class="field-label">Core Values</p><ul class="values-list">'
            for v in values:
                html += f'<li>{v}</li>'
            html += '</ul></div>'
        html += '</div>'

    # Color Palette section
    color_list = brand_data.get('colors', [])
    if color_list:
        html += '<div class="section">'
        html += '<p class="section-label">02 — Visual Identity</p>'
        html += '<h2 class="section-title">Color Palette</h2>'
        html += '<div class="color-grid">'
        for c in color_list:
            if isinstance(c, dict):
                hex_val = c.get('hex', '#000')
                name = c.get('name', '')
                html += f'<div class="color-chip"><div class="color-swatch" style="background:{hex_val};"></div><p class="color-hex">{hex_val}</p><p style="font-size:10px;color:#999;">{name}</p></div>'
            elif isinstance(c, str):
                html += f'<div class="color-chip"><div class="color-swatch" style="background:{c};"></div><p class="color-hex">{c}</p></div>'
        html += '</div>'

        # Typography
        if fonts:
            html += '<div class="field" style="margin-top:40px;"><p class="field-label">Typography</p>'
            for fk, fl in [('heading', 'Heading Font'), ('body', 'Body Font'), ('accent', 'Accent Font')]:
                if fonts.get(fk):
                    html += f'<p class="field-value"><strong>{fl}:</strong> {fonts[fk]}</p>'
            html += '</div>'
        html += '</div>'

    html += '</body></html>'
    return html

async def _run_pdf_generation(job_id: str, html: str, workspace_name: str, user_id: str = "default", workspace_id: str = None):
    """Background coroutine: renders HTML to PDF via Playwright and saves to Documents."""
    job = PDF_JOBS.get(job_id)
    if not job:
        return

    try:
        PDF_JOBS[job_id]['status'] = 'generating'
        PDF_JOBS[job_id]['step'] = 1

        from playwright.async_api import async_playwright

        # Ensure chromium is installed
        if not ensure_chromium_installed():
            PDF_JOBS[job_id]['status'] = 'error'
            PDF_JOBS[job_id]['error'] = 'Failed to install Playwright chromium browser'
            return

        # Get explicit executable path
        executable = get_browser_executable()

        async with async_playwright() as p:
            PDF_JOBS[job_id]['step'] = 2
            launch_options = {
                'headless': True,
                'args': LAUNCH_ARGS
            }
            if executable:
                launch_options['executable_path'] = executable
            
            browser = await p.chromium.launch(**launch_options)
            page = await browser.new_page()

            await page.set_content(html, wait_until='networkidle')

            PDF_JOBS[job_id]['step'] = 3
            pdf_bytes = await page.pdf(
                format='A4',
                print_background=True,
                margin={'top': '0', 'bottom': '0', 'left': '0', 'right': '0'},
            )
            await browser.close()

        # Save PDF to disk
        safe_name = re.sub(r'[^a-zA-Z0-9\-_]', '-', workspace_name.lower())
        filename = f"{safe_name}-brand-guidelines-{job_id[:8]}.pdf"
        pdf_path = EXPORT_DIR / filename
        with open(pdf_path, 'wb') as f:
            f.write(pdf_bytes)

        PDF_JOBS[job_id]['download_url'] = f'/api/export/download/{filename}'
        PDF_JOBS[job_id]['preview_url'] = f'/api/export/guidelines/preview/{job_id}'
        PDF_JOBS[job_id]['pdf_path'] = str(pdf_path)
        PDF_JOBS[job_id]['status'] = 'done'
        PDF_JOBS[job_id]['step'] = 3
        
        # Auto-save to Documents folder
        try:
            doc_id = str(uuid.uuid4())
            doc = {
                "id": doc_id,
                "user_id": user_id,
                "workspace_id": workspace_id or "",
                "client_id": "",
                "filename": f"{workspace_name} - Brand Guidelines.pdf",
                "stored_filename": filename,
                "file_url": f"/api/export/download/{filename}",
                "file_size": len(pdf_bytes),
                "mime_type": "application/pdf",
                "category": "branding",
                "description": "Auto-generated brand guidelines PDF export",
                "extension": ".pdf",
                "auto_generated": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.documents.insert_one(doc)
            logger.info(f"Brand guidelines saved to Documents: {doc_id}")
        except Exception as doc_err:
            logger.error(f"Failed to save to Documents: {doc_err}")

    except Exception as e:
        err = str(e)
        if 'Executable' in err or 'playwright' in err.lower():
            err = 'Playwright browser not installed. Run: playwright install chromium'
        logger.error(f"Async PDF generation failed: {err}")
        PDF_JOBS[job_id]['status'] = 'error'
        PDF_JOBS[job_id]['error'] = err

@router.post("/guidelines/generate")
async def start_guidelines_export(
    background_tasks: BackgroundTasks,
    user_id: str = "default",
    workspace_id: Optional[str] = None,
):
    """Start an async PDF generation job. Returns job_id for polling."""
    # Fetch brand data
    brand_data = await get_brand_data_for_pdf(user_id, workspace_id)

    workspace = brand_data.get("workspace", {})
    foundation = brand_data.get("foundation", {})
    identity = brand_data.get("identity", {})
    brand_memory = brand_data.get("brand_memory", {})

    workspace_name = workspace.get("brand_name") or workspace.get("name") or "Your Brand"

    combined = {
        'brand_name': workspace_name,
        'tagline': foundation.get('tagline', brand_memory.get('tagline', '')),
        'mission': foundation.get('mission', ''),
        'vision': foundation.get('vision', ''),
        'values': foundation.get('values', []),
        'positioning': foundation.get('positioning', ''),
        'story': foundation.get('story', ''),
        'tone_of_voice': foundation.get('tone_of_voice', brand_memory.get('voice', '')),
        'target_audience': foundation.get('target_audience', brand_memory.get('target_audience', '')),
        'colors': identity.get('colors', []),
        'fonts': identity.get('fonts', {}),
    }

    html = _build_brand_html(combined)

    job_id = str(uuid.uuid4())
    PDF_JOBS[job_id] = {
        'job_id': job_id,
        'status': 'pending',
        'step': 0,
        'download_url': None,
        'preview_url': None,
        'error': None,
        'pdf_path': None,
        'html': html,
        'created_at': datetime.now(timezone.utc).isoformat(),
    }

    background_tasks.add_task(_run_pdf_generation, job_id, html, workspace_name, user_id, workspace_id)

    return {'job_id': job_id, 'status': 'pending'}

@router.get("/guidelines/status/{job_id}")
async def get_guidelines_status(job_id: str):
    """Poll for async export job status."""
    job = PDF_JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        'job_id': job['job_id'],
        'status': job['status'],
        'step': job.get('step', 0),
        'download_url': job.get('download_url'),
        'preview_url': job.get('preview_url'),
        'error': job.get('error'),
    }

@router.get("/guidelines/preview/{job_id}", response_class=HTMLResponse)
async def preview_guidelines(job_id: str):
    """Returns the HTML used for the PDF — useful for browser preview."""
    job = PDF_JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    html = job.get('html', '')
    if not html:
        raise HTTPException(status_code=404, detail="Preview not available")
    return HTMLResponse(content=html)

@router.get("/guidelines/print-preview", response_class=HTMLResponse)
async def print_preview_guidelines(
    user_id: str = "default",
    workspace_id: Optional[str] = None,
):
    """
    Print-ready HTML — opens in new tab, browser handles PDF save.
    This is a fallback when Playwright is not installed.
    """
    brand_data = await get_brand_data_for_pdf(user_id, workspace_id)

    workspace = brand_data.get("workspace", {})
    foundation = brand_data.get("foundation", {})
    identity = brand_data.get("identity", {})
    brand_memory = brand_data.get("brand_memory", {})

    workspace_name = workspace.get("brand_name") or workspace.get("name") or "Your Brand"

    combined = {
        'brand_name': workspace_name,
        'tagline': foundation.get('tagline', brand_memory.get('tagline', '')),
        'mission': foundation.get('mission', ''),
        'vision': foundation.get('vision', ''),
        'values': foundation.get('values', []),
        'positioning': foundation.get('positioning', ''),
        'story': foundation.get('story', ''),
        'tone_of_voice': foundation.get('tone_of_voice', brand_memory.get('voice', '')),
        'target_audience': foundation.get('target_audience', brand_memory.get('target_audience', '')),
        'colors': identity.get('colors', []),
        'fonts': identity.get('fonts', {}),
    }

    html = _build_brand_html(combined)
    # Add auto-print script
    html = html.replace('</body>', '<script>window.onload=function(){setTimeout(window.print,500)}</script></body>')
    return HTMLResponse(content=html)

