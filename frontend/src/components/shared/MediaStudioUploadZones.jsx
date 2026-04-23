/**
 * MediaStudioUploadZones.jsx
 * Core Truth House OS — Media Studio Upload Integration
 * Stack: React / FastAPI / MongoDB
 *
 * Components for uploading:
 *   1. Reference image upload + strength slider
 *   2. AI Twin photo upload (3-5 face photos)
 *   3. Brand asset reference upload
 */

import { useState, useRef, useCallback } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_BACKEND_URL

function toApiUrl(url) {
  if (!url) return ''
  return url.startsWith('http') ? url : `${API}${url}`
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const C = {
  bg:      'var(--cth-admin-bg)',
  card:    'var(--cth-admin-panel)',
  cardHov: 'var(--cth-admin-panel-alt)',
  panel:   'var(--cth-admin-panel)',
  border:  'var(--cth-admin-border)',
  borderA: 'rgba(224,78,53,0.35)',
  accent:  'var(--cth-admin-accent)',
  purple:  'var(--cth-admin-ruby)',
  white:   'var(--cth-admin-ink)',
  t70:     'var(--cth-admin-ink)',
  t60:     'var(--cth-admin-ink-soft)',
  t50:     'var(--cth-admin-ink-soft)',
  t40:     'var(--cth-admin-muted)',
  t30:     'var(--cth-admin-muted)',
  t25:     'var(--cth-admin-muted)',
  t20:     'var(--cth-admin-muted)',
  t10:     'rgba(43,16,64,0.08)',
  t08:     'var(--cth-admin-panel-alt)',
  green:   'var(--cth-success)',
  red:     'var(--cth-danger)',
  font:    "'DM Sans', sans-serif",
}

// ─────────────────────────────────────────────────────────────
// FILE UPLOAD HOOK
// Uploads to backend which stores locally or in cloud storage
// ─────────────────────────────────────────────────────────────

export function useFileUpload(context, workspaceId = '', userId = 'default') {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const upload = useCallback(async (file) => {
    if (!file) return null

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, WebP, or GIF file.')
      return null
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB.')
      return null
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('context', context)
      formData.append('user_id', userId || 'default')
      formData.append('workspace_id', workspaceId || '')

      const res = await axios.post(`${API}/api/media-upload/upload-asset`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setUploading(false)
      return {
        asset_id:    res.data.asset_id,
        preview_url: res.data.preview_url,
        filename:    file.name,
        file_type:   file.type,
      }
    } catch (err) {
      setUploading(false)
      setError(err.response?.data?.detail || 'Upload failed. Please try again.')
      return null
    }
  }, [context])

  return { upload, uploading, error, setError }
}

// ─────────────────────────────────────────────────────────────
// SHARED DROP ZONE
// ─────────────────────────────────────────────────────────────

function DropZone({ onFile, accept = 'image/*', multiple = false, label = 'Upload image', sublabel = 'PNG, JPG, WebP up to 10MB', compact = false }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (!multiple && files.length > 0) onFile(files[0])
    else if (multiple) onFile(files)
  }

  function handleChange(e) {
    const files = Array.from(e.target.files)
    if (!multiple && files.length > 0) onFile(files[0])
    else if (multiple) onFile(files)
    e.target.value = ''
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      data-testid="drop-zone"
      style={{
        border:       `1px dashed ${dragging ? C.accent : C.border}`,
        borderRadius: 10,
        padding:      compact ? '12px 16px' : '20px',
        display:      'flex',
        flexDirection: compact ? 'row' : 'column',
        alignItems:   'center',
        justifyContent: compact ? 'flex-start' : 'center',
        gap:          compact ? 10 : 8,
        background:   dragging ? 'rgba(224,78,53,0.06)' : C.t08,
        cursor:       'pointer',
        transition:   'all 0.15s',
        textAlign:    'center',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      {/* Upload icon */}
      <div style={{ width: compact ? 28 : 36, height: compact ? 28 : 36, borderRadius: compact ? 7 : 9, background: dragging ? 'rgba(224,78,53,0.15)' : C.t10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width={compact ? 14 : 16} height={compact ? 14 : 16} fill="none" viewBox="0 0 24 24" stroke={dragging ? C.accent : C.t50} strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
        </svg>
      </div>

      <div>
        <p style={{ fontSize: compact ? 11.5 : 12, fontWeight: 500, color: dragging ? C.accent : C.t70, margin: 0, fontFamily: C.font }}>
          {label}
        </p>
        <p style={{ fontSize: 10, color: C.t30, margin: compact ? 0 : '2px 0 0', fontFamily: C.font }}>{sublabel}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// IMAGE PREVIEW THUMBNAIL
// ─────────────────────────────────────────────────────────────

function ImageThumb({ src, onRemove, size = 60 }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <img src={src} alt="Upload preview" style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover', border: `1px solid ${C.border}` }} />
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          style={{ position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: '50%', background: C.red, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="8" height="8" fill="none" viewBox="0 0 12 12" stroke="var(--cth-white)" strokeWidth="2">
            <path strokeLinecap="round" d="M2 2l8 8M10 2l-8 8"/>
          </svg>
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────────────

function SectionLabel({ label, tooltip, optional }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: C.t30, margin: 0, fontFamily: C.font }}>
        {label}
      </p>
      {tooltip && (
        <span title={tooltip} style={{ cursor: 'help', fontSize: 10, color: C.t30 }}>ⓘ</span>
      )}
      {optional && <span style={{ fontSize: 9.5, color: C.t20, fontFamily: C.font }}>Optional</span>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 1. REFERENCE IMAGE UPLOAD
// ─────────────────────────────────────────────────────────────

export function ReferenceImageUpload({ referenceImage = null, strength = 0.65, onImageChange, onStrengthChange, workspaceId = '', userId = 'default' }) {
  const uploader = useFileUpload('reference_image', workspaceId, userId)

  async function handleFile(file) {
    const result = await uploader.upload(file)
    if (result) onImageChange?.(result)
  }

  return (
    <div style={{ marginBottom: 16 }} data-testid="reference-image-upload">
      <SectionLabel
        label="Reference image"
        tooltip="Upload a photo you want the AI to match aesthetically. It copies the mood, lighting, and style — not the actual content."
        optional={true}
      />

      {referenceImage ? (
        <div style={{ background: C.t08, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <ImageThumb
              src={toApiUrl(referenceImage.preview_url)}
              size={52}
              onRemove={() => onImageChange?.(null)}
            />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: C.t70, margin: '0 0 2px', fontFamily: C.font, fontWeight: 500 }}>
                {referenceImage.filename || 'Reference image'}
              </p>
              <p style={{ fontSize: 10, color: C.t30, margin: 0, fontFamily: C.font }}>
                Style transfer active
              </p>
            </div>
            <button
              onClick={() => onImageChange?.(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t30, padding: 4, fontFamily: C.font, fontSize: 11 }}
            >
              Remove
            </button>
          </div>

          {/* Strength slider */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: C.t30, margin: 0, fontFamily: C.font, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Reference strength</p>
                <span title="0 = fully creative, ignores reference. 1 = closely matches reference. 0.6–0.75 is the sweet spot for style transfer." style={{ cursor: 'help', fontSize: 10, color: C.t30 }}>ⓘ</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.white, fontFamily: C.font }}>
                {strength.toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: C.t20, fontFamily: C.font }}>Creative</span>
              <span style={{ fontSize: 9, color: C.t20, fontFamily: C.font }}>Match reference</span>
            </div>

            <input
              type="range" min="0" max="1" step="0.05"
              value={strength}
              onChange={(e) => onStrengthChange?.(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: C.accent, cursor: 'pointer' }}
            />

            <p style={{ fontSize: 9.5, color: C.t20, margin: '4px 0 0', fontFamily: C.font }}>
              {strength < 0.3 ? 'Very creative — loosely inspired by reference' :
               strength < 0.5 ? 'Creative — takes mood from reference' :
               strength < 0.75 ? '✓ Sweet spot — strong style transfer' :
               'Strong match — very close to reference style'}
            </p>
          </div>
        </div>
      ) : (
        <div>
          {uploader.uploading ? (
            <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: C.t08, borderRadius: 10, border: `1px solid ${C.border}` }}>
              <div className="animate-spin" style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(224,78,53,0.3)', borderTopColor: C.accent }} />
              <span style={{ fontSize: 12, color: C.t40, fontFamily: C.font }}>Uploading...</span>
            </div>
          ) : (
            <DropZone
              onFile={handleFile}
              label="Upload reference image"
              sublabel="PNG, JPG, WebP up to 10MB · AI matches the style, not the content"
              compact={true}
            />
          )}
          {uploader.error && (
            <p style={{ fontSize: 11, color: C.red, margin: '6px 0 0', fontFamily: C.font }}>{uploader.error}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 2. AI TWIN PHOTO UPLOAD
// ─────────────────────────────────────────────────────────────

export function AITwinUpload({ photos = [], onChange, workspaceId = '', userId = 'default' }) {
  const uploader = useFileUpload('ai_twin', workspaceId, userId)
  const [expanded, setExpanded] = useState(false)

  const MIN_PHOTOS = 3
  const MAX_PHOTOS = 5
  const count = photos.length
  const isReady = count >= MIN_PHOTOS

  async function handleFiles(files) {
    const remaining = MAX_PHOTOS - photos.length
    const toUpload = Array.from(files).slice(0, remaining)
    if (toUpload.length === 0) return

    const results = []
    for (const file of toUpload) {
      const result = await uploader.upload(file)
      if (result) results.push(result)
    }
    onChange?.(photos.concat(results))
  }

  function removePhoto(idx) {
    onChange?.(photos.filter((_, i) => i !== idx))
  }

  return (
    <div style={{ marginBottom: 16 }} data-testid="ai-twin-upload">
      <button
        onClick={() => setExpanded(p => !p)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: expanded ? 10 : 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: C.t30, margin: 0, fontFamily: C.font }}>
            AI Twin Photos
          </p>
          <span title="Upload 3–5 clear photos of your face to generate consistent personal brand photos using your AI Twin." style={{ cursor: 'help', fontSize: 10, color: C.t30 }}>ⓘ</span>
          <span style={{ fontSize: 9.5, color: C.t20, fontFamily: C.font }}>Optional</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {count > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: isReady ? C.green : 'var(--cth-status-warning)' }} />
              <span style={{ fontSize: 10, color: isReady ? C.green : 'var(--cth-status-warning)', fontFamily: C.font }}>
                {count}/{MAX_PHOTOS} {isReady ? '— ready' : `— need ${MIN_PHOTOS - count} more`}
              </span>
            </div>
          )}
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke={C.t30} strokeWidth="2" style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </button>

      {expanded && (
        <div style={{ background: C.t08, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px' }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
            {[
              ['✓', 'Clear face photos', 'Straight on, good lighting'],
              ['✓', '3–5 photos minimum', 'More variety = better results'],
              ['✗', 'No sunglasses or hats', 'Face must be clearly visible'],
            ].map(item => (
              <div key={item[1]} style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                <span style={{ fontSize: 10, color: item[0] === '✓' ? C.green : C.red, fontWeight: 700, flexShrink: 0, lineHeight: 1.5 }}>{item[0]}</span>
                <div>
                  <p style={{ fontSize: 10.5, color: C.t60, margin: 0, fontFamily: C.font, fontWeight: 500 }}>{item[1]}</p>
                  <p style={{ fontSize: 9.5, color: C.t25, margin: 0, fontFamily: C.font }}>{item[2]}</p>
                </div>
              </div>
            ))}
          </div>

          {count > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {photos.map((photo, i) => (
                <ImageThumb
                  key={photo.asset_id}
                  src={toApiUrl(photo.preview_url)}
                  size={56}
                  onRemove={() => removePhoto(i)}
                />
              ))}
            </div>
          )}

          {count < MAX_PHOTOS && (
            <div>
              {uploader.uploading ? (
                <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: C.t08, borderRadius: 8, border: `1px solid ${C.border}` }}>
                  <div className="animate-spin" style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(224,78,53,0.3)', borderTopColor: C.accent }} />
                  <span style={{ fontSize: 11.5, color: C.t40, fontFamily: C.font }}>Uploading...</span>
                </div>
              ) : (
                <DropZone
                  onFile={handleFiles}
                  multiple={true}
                  label={`Add photos (${count}/${MAX_PHOTOS})`}
                  sublabel={`Select up to ${MAX_PHOTOS - count} more · JPG or PNG`}
                  compact={true}
                />
              )}
              {uploader.error && (
                <p style={{ fontSize: 11, color: C.red, margin: '6px 0 0', fontFamily: C.font }}>{uploader.error}</p>
              )}
            </div>
          )}

          {isReady && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 7 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, flexShrink: 0 }} />
              <p style={{ fontSize: 10.5, color: C.green, margin: 0, fontFamily: C.font }}>
                AI Twin ready — your face will be used in this generation
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 3. BRAND ASSET REFERENCE
// ─────────────────────────────────────────────────────────────

export function BrandAssetUpload({ asset = null, onChange, workspaceId = '', userId = 'default' }) {
  const uploader = useFileUpload('brand_asset_reference', workspaceId, userId)

  async function handleFile(file) {
    const result = await uploader.upload(file)
    if (result) onChange?.(result)
  }

  return (
    <div style={{ marginBottom: 16 }} data-testid="brand-asset-upload">
      <SectionLabel
        label="Brand asset"
        tooltip="Include a logo, watermark, or brand element in the generation. Best results with PNG files with transparent backgrounds."
        optional={true}
      />

      {asset ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: C.t08, border: `1px solid ${C.border}`, borderRadius: 9 }}>
          <ImageThumb src={toApiUrl(asset.preview_url)} size={40} onRemove={() => onChange?.(null)} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: C.t70, margin: 0, fontFamily: C.font }}>{asset.filename || 'Brand asset'}</p>
            <p style={{ fontSize: 10, color: C.t30, margin: '1px 0 0', fontFamily: C.font }}>Will be included in generation</p>
          </div>
          <button onClick={() => onChange?.(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t30, fontSize: 11, fontFamily: C.font }}>Remove</button>
        </div>
      ) : (
        <div>
          {uploader.uploading ? (
            <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: C.t08, borderRadius: 9, border: `1px solid ${C.border}` }}>
              <div className="animate-spin" style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(224,78,53,0.3)', borderTopColor: C.accent }} />
              <span style={{ fontSize: 11.5, color: C.t40, fontFamily: C.font }}>Uploading...</span>
            </div>
          ) : (
            <DropZone onFile={handleFile} label="Upload logo or brand element" sublabel="PNG with transparency works best" compact={true} />
          )}
          {uploader.error && <p style={{ fontSize: 11, color: C.red, margin: '6px 0 0', fontFamily: C.font }}>{uploader.error}</p>}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// COMPLETE UPLOAD PANEL
// ─────────────────────────────────────────────────────────────

export default function MediaStudioUploadPanel({ onChange, workspaceId = '', userId = 'default' }) {
  const [referenceImage, setReferenceImage] = useState(null)
  const [referenceStrength, setReferenceStrength] = useState(0.65)
  const [aiTwinPhotos, setAiTwinPhotos] = useState([])
  const [brandAsset, setBrandAsset] = useState(null)

  function update(key, value) {
    const next = {
      referenceImage:   key === 'referenceImage'   ? value : referenceImage,
      referenceStrength: key === 'referenceStrength' ? value : referenceStrength,
      aiTwinPhotos:     key === 'aiTwinPhotos'     ? value : aiTwinPhotos,
      brandAsset:       key === 'brandAsset'       ? value : brandAsset,
    }
    onChange?.(next)
  }

  function handleRefImg(img)    { setReferenceImage(img);     update('referenceImage', img) }
  function handleStrength(n)    { setReferenceStrength(n);    update('referenceStrength', n) }
  function handleTwin(photos)   { setAiTwinPhotos(photos);    update('aiTwinPhotos', photos) }
  function handleAsset(asset)   { setBrandAsset(asset);       update('brandAsset', asset) }

  return (
    <div data-testid="media-studio-upload-panel">
      <ReferenceImageUpload
        referenceImage={referenceImage}
        strength={referenceStrength}
        onImageChange={handleRefImg}
        onStrengthChange={handleStrength}
        workspaceId={workspaceId}
        userId={userId}
      />

      <AITwinUpload
        photos={aiTwinPhotos}
        onChange={handleTwin}
        workspaceId={workspaceId}
        userId={userId}
      />

      <BrandAssetUpload
        asset={brandAsset}
        onChange={handleAsset}
        workspaceId={workspaceId}
        userId={userId}
      />
    </div>
  )
}
