/**
 * UploadZone.jsx
 * Core Truth House OS — Universal Upload Component
 *
 * Clean JSX. Zero TypeScript. Zero React Router.
 *
 * ONE COMPONENT. DROPS INTO EVERY GENERATOR.
 *
 * Used in:
 *   Content Studio    — upload docs, PDFs, images to generate content from
 *   Media Studio      — upload reference images for img2img / style transfer
 *   Media Workflow    — upload AI Twin reference photos (3–5 faces)
 *   Identity Studio   — upload logo, brand assets
 *   Prompt Builder    — upload style reference for prompt injection
 *
 * USAGE:
 *   <UploadZone
 *     accept="image"
 *     multiple={false}
 *     onUpload={(asset) => setReferenceImage(asset)}
 *   />
 *
 *   <UploadZone
 *     accept="document"
 *     multiple={true}
 *     label="Upload documents to generate content from"
 *     onUpload={(assets) => setSourceDocs(assets)}
 *   />
 *
 * PROPS:
 *   accept       'image' | 'video' | 'document' | 'any' | string (mime types)
 *   multiple     boolean — allow multiple files (default false)
 *   maxMb        number  — max file size in MB (default 20)
 *   maxFiles     number  — max files when multiple=true (default 10)
 *   label        string  — instruction text shown in the zone
 *   sublabel     string  — secondary instruction text
 *   compact      boolean — smaller inline version (default false)
 *   showPreview  boolean — show image thumbnails (default true)
 *   onUpload     function(asset | asset[]) — called after upload completes
 *   onRemove     function(assetId) — called when file is removed
 *   existingAssets array — pre-populated assets (for editing state)
 *
 * ASSET OBJECT returned via onUpload:
 *   { id, name, type, size, url, thumbnailUrl, uploadedAt }
 */

import { useState, useRef, useCallback } from 'react'

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────

var ACCEPT_CONFIGS = {
  image:    { mimes: ['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'], label: 'JPG, PNG, WebP, GIF, SVG', icon: '🖼' },
  video:    { mimes: ['video/mp4','video/webm','video/mov','video/quicktime'],             label: 'MP4, WebM, MOV',           icon: '🎬' },
  document: { mimes: ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain','text/markdown'],
              label: 'PDF, DOCX, TXT, MD', icon: '📄' },
  any:      { mimes: [],                                                                   label: 'Any file type',            icon: '📎' },
}

// Style constants
var C = {
  bg:     '#0D0010',
  border: 'rgba(255,255,255,0.09)',
  accent: '#E04E35',
  purple: '#33033C',
  white:  '#fff',
  t60:    'rgba(255,255,255,0.6)',
  t40:    'rgba(255,255,255,0.4)',
  t30:    'rgba(255,255,255,0.3)',
  t25:    'rgba(255,255,255,0.25)',
  t20:    'rgba(255,255,255,0.2)',
  font:   "'DM Sans', sans-serif",
}

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (bytes < 1024)       return bytes + ' B'
  if (bytes < 1048576)    return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function getFileIcon(type) {
  if (type.startsWith('image/')) return '🖼'
  if (type.startsWith('video/')) return '🎬'
  if (type.includes('pdf'))      return '📕'
  if (type.includes('word') || type.includes('document')) return '📄'
  if (type.includes('text'))     return '📝'
  return '📎'
}

function isImageType(type) {
  return type.startsWith('image/')
}

function validateFile(file, acceptConfig, maxMb) {
  if (maxMb && file.size > maxMb * 1024 * 1024) {
    return 'File too large. Maximum size is ' + maxMb + 'MB.'
  }
  if (acceptConfig.mimes.length > 0 && !acceptConfig.mimes.includes(file.type)) {
    return 'File type not supported. Accepted: ' + acceptConfig.label
  }
  return null
}

var API = (typeof process !== 'undefined' && process.env && import.meta.env.VITE_BACKEND_URL) ? import.meta.env.VITE_BACKEND_URL + '/api' : '/api'

async function uploadFile(file, onProgress) {
  // Upload to FastAPI backend using multipart form data
  var formData = new FormData()
  formData.append('file', file)

  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest()
    xhr.open('POST', API + '/upload/file')

    xhr.upload.addEventListener('progress', function(e) {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        var data = JSON.parse(xhr.responseText)
        resolve({
          id:           data.id,
          name:         data.name,
          type:         data.type,
          size:         data.size,
          url:          data.url,
          thumbnailUrl: data.thumbnailUrl || data.url,
          uploadedAt:   data.uploadedAt,
        })
      } else {
        reject(new Error('Upload failed: ' + xhr.status))
      }
    })

    xhr.addEventListener('error', function() {
      reject(new Error('Upload failed'))
    })

    xhr.send(formData)
  })
}

// ─────────────────────────────────────────────────────────────
// FILE PREVIEW CARD
// ─────────────────────────────────────────────────────────────

function FileCard(props) {
  var file     = props.file     // { id, name, type, size, url, thumbnailUrl, progress, error }
  var onRemove = props.onRemove
  var compact  = props.compact

  var isImage  = isImageType(file.type)
  var isUploading = file.progress !== undefined && file.progress < 100
  var hasError = !!file.error

  return (
    <div style={{
      position: 'relative',
      borderRadius: compact ? 8 : 10,
      overflow: 'hidden',
      border: '1px solid ' + (hasError ? 'rgba(239,68,68,0.4)' : isUploading ? 'rgba(224,78,53,0.3)' : 'rgba(255,255,255,0.1)'),
      background: hasError ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.04)',
      transition: 'border-color 0.15s',
    }}>
      {/* Image preview */}
      {isImage && file.thumbnailUrl && !compact && (
        <div style={{ height: 100, overflow: 'hidden', background: '#1a0020' }}>
          <img
            src={file.thumbnailUrl}
            alt={file.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      {/* File info row */}
      <div style={{ padding: compact ? '7px 10px' : '10px 12px', display: 'flex', alignItems: 'center', gap: 9 }}>
        {/* Icon or small thumb */}
        {(compact || !isImage || !file.thumbnailUrl) && (
          <span style={{ fontSize: compact ? 14 : 18, flexShrink: 0 }}>{getFileIcon(file.type)}</span>
        )}
        {isImage && file.thumbnailUrl && compact && (
          <img src={file.thumbnailUrl} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: compact ? 11 : 12, fontWeight: 500,
            color: hasError ? '#f87171' : C.t60,
            margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {file.name}
          </p>
          {hasError
            ? <p style={{ fontSize: 9.5, color: '#ef4444', margin: '2px 0 0' }}>{file.error}</p>
            : <p style={{ fontSize: 9.5, color: C.t25, margin: '2px 0 0' }}>{formatBytes(file.size)}</p>
          }
        </div>

        {/* Remove button */}
        {!isUploading && (
          <button
            onClick={function() { onRemove(file.id) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t30, fontSize: 15, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
            title="Remove"
          >
            ×
          </button>
        )}
      </div>

      {/* Progress bar */}
      {isUploading && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.06)' }}>
          <div style={{
            height: '100%', background: C.accent,
            width: (file.progress || 0) + '%',
            transition: 'width 0.1s ease',
            borderRadius: '0 0 0 0',
          }} />
        </div>
      )}

      {/* Done check */}
      {!isUploading && !hasError && (
        <div style={{ position: 'absolute', top: 6, right: onRemove ? 28 : 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="8" height="8" fill="none" viewBox="0 0 12 12">
              <path d="M10 3L5 8.5 2 5.5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function UploadZone(props) {
  var accept        = props.accept        || 'any'
  var multiple      = props.multiple      !== false ? !!props.multiple : false
  var maxMb         = props.maxMb         || 20
  var maxFiles      = props.maxFiles      || 10
  var label         = props.label
  var sublabel      = props.sublabel
  var compact       = props.compact       || false
  var showPreview   = props.showPreview   !== false
  var onUpload      = props.onUpload
  var onRemove      = props.onRemove
  var existingAssets = props.existingAssets || []

  var inputRef      = useRef(null)

  var dragState     = useState(false); var isDragging = dragState[0]; var setIsDragging = dragState[1]
  var filesState    = useState(existingAssets.map(function(a) { return Object.assign({}, a) }))
  var files         = filesState[0]
  var setFiles      = filesState[1]

  var acceptConfig  = ACCEPT_CONFIGS[accept] || ACCEPT_CONFIGS.any
  var acceptMimes   = acceptConfig.mimes.join(',') || undefined

  // ── File processing ────────────────────────────────────────

  var processFiles = useCallback(function(rawFiles) {
    var incoming = Array.from(rawFiles)
    if (!multiple) incoming = incoming.slice(0, 1)

    var available = multiple ? maxFiles - files.length : 1
    incoming = incoming.slice(0, available)

    incoming.forEach(function(file) {
      var error = validateFile(file, acceptConfig, maxMb)
      var fileEntry = {
        id:       'pending-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        name:     file.name,
        type:     file.type,
        size:     file.size,
        progress: error ? undefined : 0,
        error:    error || undefined,
        url:      null,
        thumbnailUrl: null,
      }

      if (!error) {
        setFiles(function(prev) { return multiple ? prev.concat([fileEntry]) : [fileEntry] })

        uploadFile(file, function(progress) {
          setFiles(function(prev) { return prev.map(function(f) { return f.id === fileEntry.id ? Object.assign({}, f, { progress: progress }) : f }) })
        }).then(function(asset) {
          var completed = Object.assign({}, fileEntry, asset, { progress: 100 })
          setFiles(function(prev) { return prev.map(function(f) { return f.id === fileEntry.id ? completed : f }) })
          if (onUpload) {
            if (multiple) {
              onUpload(completed)
            } else {
              onUpload(completed)
            }
          }
        }).catch(function(err) {
          setFiles(function(prev) { return prev.map(function(f) { return f.id === fileEntry.id ? Object.assign({}, f, { error: 'Upload failed. Please try again.' }) : f }) })
        })
      } else {
        setFiles(function(prev) { return multiple ? prev.concat([fileEntry]) : [fileEntry] })
      }
    })
  }, [files, multiple, maxFiles, acceptConfig, maxMb, onUpload])

  // ── Drag handlers ──────────────────────────────────────────

  function handleDragOver(e) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    processFiles(e.dataTransfer.files)
  }

  function handleInput(e) {
    processFiles(e.target.files)
    e.target.value = ''
  }

  function handleRemove(id) {
    setFiles(function(prev) { return prev.filter(function(f) { return f.id !== id }) })
    if (onRemove) onRemove(id)
  }

  // ── Layout ─────────────────────────────────────────────────

  var hasFiles    = files.length > 0
  var canAddMore  = multiple ? files.length < maxFiles : files.length === 0
  var isUploading = files.some(function(f) { return f.progress !== undefined && f.progress < 100 })

  var defaultLabel   = 'Drop ' + (multiple ? 'files' : 'a file') + ' here or click to browse'
  var defaultSublabel = acceptConfig.label + (maxMb ? ' · Max ' + maxMb + 'MB' : '')

  // Compact inline style
  if (compact) {
    return (
      <div style={{ fontFamily: C.font }}>
        {/* Compact drop zone */}
        {canAddMore && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={function() { inputRef.current && inputRef.current.click() }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
              borderRadius: 8, border: '1px dashed ' + (isDragging ? C.accent : 'rgba(255,255,255,0.18)'),
              background: isDragging ? 'rgba(224,78,53,0.06)' : 'rgba(255,255,255,0.03)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 16 }}>{acceptConfig.icon}</span>
            <div>
              <p style={{ fontSize: 11.5, fontWeight: 500, color: C.t50, margin: 0 }}>{label || ('Upload ' + (multiple ? 'files' : 'file'))}</p>
              <p style={{ fontSize: 9.5, color: C.t25, margin: '1px 0 0' }}>{sublabel || defaultSublabel}</p>
            </div>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke={C.t30} strokeWidth="2" style={{ marginLeft: 'auto', flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            <input ref={inputRef} type="file" style={{ display: 'none' }} accept={acceptMimes} multiple={multiple} onChange={handleInput} />
          </div>
        )}

        {/* Compact file list */}
        {hasFiles && showPreview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 7 }}>
            {files.map(function(f) {
              return <FileCard key={f.id} file={f} onRemove={handleRemove} compact={true} />
            })}
          </div>
        )}
      </div>
    )
  }

  // Full drop zone
  return (
    <div style={{ fontFamily: C.font }}>
      {/* Main drop zone — only shown when files can be added */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={function() { inputRef.current && inputRef.current.click() }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '28px 20px',
            border: '2px dashed ' + (isDragging ? C.accent : 'rgba(255,255,255,0.14)'),
            borderRadius: 12,
            background: isDragging ? 'rgba(224,78,53,0.07)' : 'rgba(255,255,255,0.02)',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.15s',
            minHeight: compact ? 80 : 120,
          }}
        >
          {/* Upload icon */}
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: isDragging ? 'rgba(224,78,53,0.15)' : 'rgba(255,255,255,0.06)',
            border: '1px solid ' + (isDragging ? 'rgba(224,78,53,0.4)' : 'rgba(255,255,255,0.1)'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={isDragging ? C.accent : C.t40} strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
          </div>

          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: isDragging ? C.white : C.t50, margin: '0 0 3px' }}>
              {label || defaultLabel}
            </p>
            <p style={{ fontSize: 10.5, color: C.t25, margin: 0 }}>
              {sublabel || defaultSublabel}
            </p>
          </div>

          {/* Browse button */}
          <div style={{
            padding: '5px 14px', borderRadius: 8, fontSize: 11, fontWeight: 500,
            background: 'rgba(224,78,53,0.1)', border: '1px solid rgba(224,78,53,0.25)',
            color: C.accent,
          }}>
            Browse files
          </div>

          <input ref={inputRef} type="file" style={{ display: 'none' }} accept={acceptMimes} multiple={multiple} onChange={handleInput} />
        </div>
      )}

      {/* File count when at max */}
      {!canAddMore && multiple && (
        <p style={{ fontSize: 10.5, color: C.t25, marginTop: 6, textAlign: 'center' }}>
          Maximum {maxFiles} files reached.
          <button onClick={function() { setFiles([]) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.accent, fontSize: 10.5, fontFamily: C.font, marginLeft: 6 }}>
            Clear all
          </button>
        </p>
      )}

      {/* File previews */}
      {hasFiles && showPreview && (
        <div style={{
          marginTop: canAddMore ? 12 : 0,
          display: 'grid',
          gridTemplateColumns: multiple ? 'repeat(auto-fill, minmax(160px, 1fr))' : '1fr',
          gap: 8,
        }}>
          {files.map(function(f) {
            return <FileCard key={f.id} file={f} onRemove={handleRemove} compact={false} />
          })}
        </div>
      )}

      {/* Global uploading state */}
      {isUploading && (
        <p style={{ fontSize: 10, color: C.t25, margin: '8px 0 0', textAlign: 'center' }}>
          Uploading...
        </p>
      )}
    </div>
  )
}
