/**
 * upload-integrations.js
 * Core Truth House OS — Upload Integration Guide
 *
 * Shows exactly where UploadZone drops into each generator.
 * Copy the relevant snippet into the target component.
 *
 * IMPORT in each generator:
 *   import UploadZone from '../../components/shared/UploadZone'
 */

// ─────────────────────────────────────────────────────────────
// 1. CONTENT STUDIO
// Add above the prompt textarea in the generate panel.
// User uploads a doc/PDF/image → its content is sent to Claude
// alongside the generation prompt as context.
// ─────────────────────────────────────────────────────────────

export var ContentStudioIntegration = `
// In ContentStudioPage.jsx — inside the center generation panel, above the prompt:

var [sourceAssets, setSourceAssets] = useState([])

function handleSourceUpload(asset) {
  setSourceAssets(function(prev) { return prev.concat([asset]) })
}

function handleSourceRemove(id) {
  setSourceAssets(function(prev) { return prev.filter(function(a) { return a.id !== id }) })
}

// In your generate API call, attach source assets as context:
// body: JSON.stringify({
//   prompt: userPrompt,
//   contentType: selectedFormat,
//   sourceUrls: sourceAssets.map(function(a) { return a.url }),  // passed to Claude as document context
//   ...brandMemory,
// })

// JSX — add above the prompt textarea:
<div style={{ marginBottom: 14 }}>
  <label style={lbl}>Upload source material <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>(optional)</span></label>
  <UploadZone
    accept="document"
    multiple={true}
    maxFiles={3}
    compact={true}
    label="Upload a doc, PDF, or image to generate content from"
    sublabel="PDF, DOCX, TXT, MD, PNG, JPG · Max 20MB each"
    onUpload={handleSourceUpload}
    onRemove={handleSourceRemove}
  />
</div>
`

// ─────────────────────────────────────────────────────────────
// 2. MEDIA STUDIO — Reference Image (img2img)
// Add to the left control panel, below the prompt textarea.
// Reference image URL is passed to Replicate as init_image.
// ─────────────────────────────────────────────────────────────

export var MediaStudioIntegration = `
// In MediaStudioPage.jsx — inside the left controls panel:

var [referenceImage, setReferenceImage] = useState(null)
var [referenceStrength, setReferenceStrength] = useState(0.7)

// In your Replicate API call:
// body: JSON.stringify({
//   input: {
//     prompt: builtPrompt,
//     image: referenceImage ? referenceImage.url : undefined,    // init_image
//     image_strength: referenceImage ? referenceStrength : undefined,
//     ...otherParams,
//   }
// })

// JSX — add below the prompt textarea in the left panel:
<div style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 4 }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
    <label style={lbl}>Reference image</label>
    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>For style transfer or img2img</span>
  </div>
  <UploadZone
    accept="image"
    multiple={false}
    compact={true}
    label="Upload reference image"
    sublabel="JPG, PNG, WebP · Max 20MB"
    onUpload={function(asset) { setReferenceImage(asset) }}
    onRemove={function() { setReferenceImage(null) }}
    existingAssets={referenceImage ? [referenceImage] : []}
  />
  {referenceImage && (
    <div style={{ marginTop: 8 }}>
      <label style={lbl}>Reference strength</label>
      <input
        type="range" min="0" max="1" step="0.05"
        value={referenceStrength}
        onChange={function(e) { setReferenceStrength(parseFloat(e.target.value)) }}
        style={{ width: '100%', accentColor: '#E04E35' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'rgba(255,255,255,0.3)' }}>
        <span>More creative</span>
        <span style={{ color: '#E04E35', fontWeight: 600 }}>{referenceStrength}</span>
        <span>More faithful</span>
      </div>
    </div>
  )}
</div>
`

// ─────────────────────────────────────────────────────────────
// 3. MEDIA WORKFLOW — AI Twin Reference Photos
// Add to the asset brief card when assetTypeId === 'ai_twin'
// or to the PromptBuilderPanel when mode === 'aitwin'.
// User uploads 3–5 face photos → used to lock Model ID.
// ─────────────────────────────────────────────────────────────

export var MediaWorkflowAITwinIntegration = `
// In MediaWorkflowPage.jsx — inside AssetCard when assetTypeId === 'ai_twin',
// or in MediaPromptEngine.jsx PromptBuilderPanel when mode === 'aitwin':

var [referencePhotos, setReferencePhotos] = useState([])

function handlePhotoUpload(asset) {
  setReferencePhotos(function(prev) { return prev.concat([asset]) })
}

function handlePhotoRemove(id) {
  setReferencePhotos(function(prev) { return prev.filter(function(a) { return a.id !== id }) })
}

// JSX — add below the Model ID input field:
<div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
    <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 0 }}>
      Reference Photos <span style={{ color: '#E04E35' }}>*</span>
    </label>
    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>Upload 3–5 photos of yourself</span>
  </div>
  <UploadZone
    accept="image"
    multiple={true}
    maxFiles={5}
    label="Upload 3–5 clear photos of your face"
    sublabel="Front-facing, side angle, natural lighting — JPG or PNG"
    onUpload={handlePhotoUpload}
    onRemove={handlePhotoRemove}
  />
  {referencePhotos.length > 0 && referencePhotos.length < 3 && (
    <p style={{ fontSize: 10, color: '#f59e0b', marginTop: 6 }}>
      Upload at least 3 photos for best results. ({referencePhotos.length}/3 minimum)
    </p>
  )}
  {referencePhotos.length >= 3 && (
    <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(16,185,129,0.08)', borderRadius: 7, border: '1px solid rgba(16,185,129,0.2)' }}>
      <p style={{ fontSize: 10.5, color: '#10b981', margin: 0, fontWeight: 500 }}>
        ✓ {referencePhotos.length} photos uploaded — ready to lock Model ID
      </p>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '3px 0 0' }}>
        Use the reference URLs below in your AI tool (Runway, Pika, Midjourney) to create your Model ID.
      </p>
    </div>
  )}
  {referencePhotos.length > 0 && (
    <div style={{ marginTop: 8 }}>
      <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>Reference URLs (copy into your AI tool):</p>
      {referencePhotos.map(function(photo, i) {
        return (
          <p key={photo.id} style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {i + 1}. {photo.url}
          </p>
        )
      })}
    </div>
  )}
</div>
`

// ─────────────────────────────────────────────────────────────
// 4. IDENTITY STUDIO — Logo + Brand Asset Upload
// Add to the Brand Assets section (already exists as a section).
// Replaces the current placeholder upload area.
// ─────────────────────────────────────────────────────────────

export var IdentityStudioIntegration = `
// In IdentityStudioPage.jsx — in the Brand Assets section:
// Replace the existing upload drop zone placeholder with:

var [logoLight, setLogoLight] = useState(null)
var [logoDark,  setLogoDark]  = useState(null)
var [brandAssets, setBrandAssets] = useState([])

// JSX — replaces existing placeholder:

// Logo uploads (two separate zones for light + dark versions)
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
  <div>
    <label style={lbl}>Logo — Light version</label>
    <UploadZone
      accept="image"
      multiple={false}
      label="Upload light logo"
      sublabel="PNG or SVG with transparent background"
      onUpload={function(asset) { setLogoLight(asset) }}
      onRemove={function() { setLogoLight(null) }}
      existingAssets={logoLight ? [logoLight] : []}
    />
  </div>
  <div>
    <label style={lbl}>Logo — Dark version</label>
    <UploadZone
      accept="image"
      multiple={false}
      label="Upload dark logo"
      sublabel="PNG or SVG with transparent background"
      onUpload={function(asset) { setLogoDark(asset) }}
      onRemove={function() { setLogoDark(null) }}
      existingAssets={logoDark ? [logoDark] : []}
    />
  </div>
</div>

// Brand assets (icons, textures, brand elements)
<div>
  <label style={lbl}>Brand Assets</label>
  <UploadZone
    accept="image"
    multiple={true}
    maxFiles={20}
    label="Upload brand assets — icons, textures, brand elements"
    sublabel="PNG, SVG, JPG, WebP · Max 20MB each"
    onUpload={function(asset) { setBrandAssets(function(prev) { return prev.concat([asset]) }) }}
    onRemove={function(id) { setBrandAssets(function(prev) { return prev.filter(function(a) { return a.id !== id }) }) }}
    existingAssets={brandAssets}
  />
</div>
`

// ─────────────────────────────────────────────────────────────
// 5. CAMPAIGN BUILDER — Campaign Creative Upload
// Add to Step M (Mission) for attaching existing brand materials
// ─────────────────────────────────────────────────────────────

export var CampaignBuilderIntegration = `
// In CampaignBuilderPage.jsx — inside StepM, below the offer section:

var [campaignAssets, setCampaignAssets] = useState([])

// JSX — below the offer selector:
<div style={{ marginBottom: 18 }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
    <label style={lbl}>Campaign materials</label>
    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>optional</span>
  </div>
  <UploadZone
    accept="any"
    multiple={true}
    maxFiles={5}
    compact={true}
    label="Upload existing assets, briefs, or inspiration"
    sublabel="Images, PDFs, docs · Added to campaign context"
    onUpload={function(asset) { set('campaignAssets', (form.campaignAssets || []).concat([asset])) }}
    onRemove={function(id) { set('campaignAssets', (form.campaignAssets || []).filter(function(a) { return a.id !== id })) }}
    existingAssets={form.campaignAssets || []}
  />
</div>
`
