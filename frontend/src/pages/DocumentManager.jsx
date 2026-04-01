/**
 * DocumentManager.js — Redesign
 * CTH OS — Document Manager
 *
 * FIXES:
 *   - Documents are now accessible (download link opens the file)
 *   - Clean full-width card layout with icon, name, size, date
 *   - Preview panel opens inline for images and PDFs
 *   - Working delete with confirmation
 *   - Category filter tabs
 *   - Search
 *   - Drag-and-drop upload zone
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { DashboardLayout } from '../components/Layout'
import { useUser } from '../hooks/useAuth'
import axios from 'axios'

const API = import.meta.env.VITE_BACKEND_URL

// ─── Color tokens ─────────────────────────────────────────────
const C = {
  bg:      '#0D0010',
  card:    'rgba(255,255,255,0.03)',
  panel:   '#1A0020',
  border:  'rgba(255,255,255,0.07)',
  borderA: 'rgba(224,78,53,0.3)',
  accent:  '#E04E35',
  crimson: '#AF0024',
  tuscany: '#C7A09D',
  green:   '#10B981',
  amber:   '#F59E0B',
  red:     '#EF4444',
  blue:    '#3B82F6',
  white:   '#fff',
  t80:     'rgba(255,255,255,0.8)',
  t60:     'rgba(255,255,255,0.6)',
  t40:     'rgba(255,255,255,0.4)',
  t25:     'rgba(255,255,255,0.25)',
  t10:     'rgba(255,255,255,0.1)',
  t06:     'rgba(255,255,255,0.06)',
  t03:     'rgba(255,255,255,0.03)',
  font:    "'DM Sans', sans-serif",
  serif:   'Georgia, serif',
}

const CATEGORIES = ['all', 'general', 'branding', 'contracts', 'invoices', 'training', 'other']

const CATEGORY_ICONS = {
  all: '📁',
  general: '📄',
  branding: '🎨',
  contracts: '✍️',
  invoices: '💰',
  training: '🎓',
  other: '📎',
}

const EXT_ICONS = {
  pdf: '📕',
  doc: '📘', docx: '📘',
  xls: '📗', xlsx: '📗',
  ppt: '📙', pptx: '📙',
  txt: '📃',
  csv: '📊',
  png: '🖼', jpg: '🖼', jpeg: '🖼', gif: '🖼', webp: '🖼',
  zip: '🗜',
}

function getExtIcon(filename) {
  const ext = (filename || '').split('.').pop().toLowerCase()
  return EXT_ICONS[ext] || '📄'
}

function isPreviewable(filename) {
  const ext = (filename || '').split('.').pop().toLowerCase()
  return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf'].includes(ext)
}

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '' }
}

// ─── Upload Zone ──────────────────────────────────────────────
function UploadZone({ onUpload, uploading }) {
  const [dragging, setDragging] = useState(false)
  const [category, setCategory] = useState('general')
  const [desc, setDesc] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  const dropRef = useRef(null)

  function handleFiles(files) {
    if (!files || files.length === 0) return
    onUpload(Array.from(files), category, desc)
    setDesc('')
    setOpen(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div>
      {/* Upload trigger button */}
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 10, border: 'none',
          background: 'linear-gradient(135deg, #E04E35, #AF0024)',
          color: C.white, fontSize: 13, fontWeight: 700,
          cursor: 'pointer', fontFamily: C.font,
          boxShadow: '0 4px 16px rgba(224,78,53,0.25)',
        }}
      >
        <span style={{ fontSize: 16 }}>+</span>
        Upload Document
      </button>

      {/* Expandable upload panel */}
      {open && (
        <div style={{
          marginTop: 12, padding: '20px 24px',
          background: C.card, border: '1px solid ' + C.borderA,
          borderRadius: 14, fontFamily: C.font,
        }}>
          {/* Drop zone */}
          <div
            ref={dropRef}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={e => { if (!dropRef.current?.contains(e.relatedTarget)) setDragging(false) }}
            onDrop={handleDrop}
            style={{
              border: '2px dashed ' + (dragging ? C.accent : 'rgba(255,255,255,0.15)'),
              borderRadius: 10, padding: '32px 20px', textAlign: 'center',
              cursor: 'pointer', marginBottom: 16,
              background: dragging ? 'rgba(224,78,53,0.05)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            <input
              ref={inputRef} type="file" multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp,.zip"
              onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
              style={{ display: 'none' }}
            />
            <div style={{ fontSize: 32, marginBottom: 8 }}>📤</div>
            <p style={{ fontSize: 13, fontWeight: 600, color: dragging ? C.accent : C.t60, margin: '0 0 4px' }}>
              {dragging ? 'Drop here' : 'Drag & drop or click to browse'}
            </p>
            <p style={{ fontSize: 11, color: C.t25, margin: 0 }}>
              PDF, Word, Excel, PowerPoint, Images, ZIP · Max 50MB
            </p>
          </div>

          {/* Options row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.t25, marginBottom: 5 }}>
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{ width: '100%', background: C.t06, border: '1px solid ' + C.border, borderRadius: 8, padding: '8px 11px', fontSize: 12.5, color: C.white, fontFamily: C.font, outline: 'none', colorScheme: 'dark' }}
              >
                {CATEGORIES.filter(c => c !== 'all').map(c => (
                  <option key={c} value={c} style={{ background: '#1A0020' }}>
                    {CATEGORY_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.t25, marginBottom: 5 }}>
                Description
              </label>
              <input
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="What is this document?"
                style={{ width: '100%', background: C.t06, border: '1px solid ' + C.border, borderRadius: 8, padding: '8px 11px', fontSize: 12.5, color: C.white, fontFamily: C.font, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 20px', borderRadius: 9, border: 'none',
                background: uploading ? 'rgba(224,78,53,0.4)' : 'linear-gradient(135deg, #E04E35, #AF0024)',
                color: C.white, fontSize: 13, fontWeight: 600,
                cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: C.font,
              }}
            >
              {uploading ? '⏳ Uploading...' : '📤 Choose Files'}
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{ padding: '9px 16px', borderRadius: 9, border: '1px solid ' + C.border, background: 'none', color: C.t40, fontSize: 13, cursor: 'pointer', fontFamily: C.font }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Document Row ─────────────────────────────────────────────
function DocRow({ doc, onDelete, onPreview }) {
  const [hovered, setHovered] = useState(false)
  const downloadUrl = `${API}${doc.file_url}`
  const canPreview = isPreviewable(doc.filename)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 18px',
        background: hovered ? 'rgba(255,255,255,0.04)' : C.card,
        border: '1px solid ' + (hovered ? 'rgba(255,255,255,0.1)' : C.border),
        borderRadius: 11,
        transition: 'all 0.12s',
        cursor: 'default',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 9,
        background: 'rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>
        {getExtIcon(doc.filename)}
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.t80, margin: '0 0 3px', fontFamily: C.font, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {doc.filename}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {doc.description && (
            <span style={{ fontSize: 11, color: C.t40, fontFamily: C.font }}>
              {doc.description.substring(0, 50)}
            </span>
          )}
          <span style={{ fontSize: 11, color: C.t25, fontFamily: C.font }}>{formatBytes(doc.file_size)}</span>
          <span style={{ fontSize: 11, color: C.t25, fontFamily: C.font }}>{formatDate(doc.created_at)}</span>
          {doc.category && doc.category !== 'general' && (
            <span style={{
              fontSize: 9.5, fontWeight: 600, letterSpacing: '0.08em',
              padding: '1px 8px', borderRadius: 20,
              background: 'rgba(199,160,157,0.1)', color: C.tuscany,
              fontFamily: C.font, textTransform: 'capitalize',
            }}>
              {CATEGORY_ICONS[doc.category]} {doc.category}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, opacity: hovered ? 1 : 0, transition: 'opacity 0.12s' }}>
        {canPreview && (
          <button
            onClick={() => onPreview(doc)}
            title="Preview"
            style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid ' + C.border, background: C.t06, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}
          >
            👁
          </button>
        )}
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={doc.filename}
          title="Download"
          style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid ' + C.border, background: C.t06, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, textDecoration: 'none' }}
        >
          ⬇
        </a>
        <button
          onClick={() => onDelete(doc.id)}
          title="Delete"
          style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}
        >
          🗑
        </button>
      </div>
    </div>
  )
}

// ─── Preview Modal ────────────────────────────────────────────
function PreviewModal({ doc, onClose }) {
  if (!doc) return null
  const url = `${API}${doc.file_url}`
  const ext = (doc.filename || '').split('.').pop().toLowerCase()
  const isImg = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#1A0020', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '20px 24px', maxWidth: 860, width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', fontFamily: C.font }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{getExtIcon(doc.filename)}</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.white, margin: 0 }}>{doc.filename}</p>
              <p style={{ fontSize: 11, color: C.t40, margin: 0 }}>{formatBytes(doc.file_size)} · {formatDate(doc.created_at)}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              download={doc.filename}
              style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #E04E35, #AF0024)', color: C.white, fontSize: 12, fontWeight: 600, textDecoration: 'none', cursor: 'pointer', fontFamily: C.font }}
            >
              ⬇ Download
            </a>
            <button
              onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid ' + C.border, background: 'none', cursor: 'pointer', color: C.t40, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Preview content */}
        <div style={{ flex: 1, overflow: 'auto', borderRadius: 10, border: '1px solid ' + C.border, background: 'rgba(0,0,0,0.2)', minHeight: 300 }}>
          {isImg ? (
            <img
              src={url}
              alt={doc.filename}
              style={{ maxWidth: '100%', maxHeight: 600, display: 'block', margin: '0 auto', objectFit: 'contain', padding: 20 }}
            />
          ) : ext === 'pdf' ? (
            <iframe
              src={url}
              title={doc.filename}
              style={{ width: '100%', height: 560, border: 'none' }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 16 }}>
              <span style={{ fontSize: 48 }}>{getExtIcon(doc.filename)}</span>
              <p style={{ fontSize: 14, color: C.t50, fontFamily: C.font, margin: 0 }}>Preview not available for this file type</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                download={doc.filename}
                style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg, #E04E35, #AF0024)', color: C.white, fontSize: 13, fontWeight: 600, textDecoration: 'none', cursor: 'pointer', fontFamily: C.font }}
              >
                ⬇ Download to view
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function DocumentManager() {
  const { user } = useUser()
  const userId = user?.id || 'default'
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState(null)
  const [toast, setToast] = useState(null)

  function showToast(msg, err = false) {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ user_id: userId })
      if (category !== 'all') params.set('category', category)
      const res = await axios.get(`${API}/api/documents?${params}`)
      setDocs(res.data.documents || [])
    } catch {
      setDocs([])
    }
    setLoading(false)
  }, [userId, category])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  async function handleUpload(files, cat, desc) {
    setUploading(true)
    let succeeded = 0
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('user_id', userId)
      fd.append('category', cat || 'general')
      fd.append('description', desc || '')
      try {
        await axios.post(`${API}/api/documents/upload`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        succeeded++
      } catch (err) {
        showToast('Upload failed: ' + (err.response?.data?.detail || err.message), true)
      }
    }
    setUploading(false)
    if (succeeded > 0) {
      showToast(`${succeeded} file${succeeded > 1 ? 's' : ''} uploaded`)
      fetchDocs()
    }
  }

  async function handleDelete(docId) {
    if (!window.confirm('Delete this document permanently?')) return
    try {
      await axios.delete(`${API}/api/documents/${docId}?user_id=${userId}`)
      setDocs(prev => prev.filter(d => d.id !== docId))
      showToast('Document deleted')
    } catch {
      showToast('Delete failed', true)
    }
  }

  const filtered = docs.filter(d =>
    !search ||
    (d.filename || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const categoryCounts = CATEGORIES.reduce((acc, c) => {
    acc[c] = c === 'all' ? docs.length : docs.filter(d => d.category === c).length
    return acc
  }, {})

  return (
    <DashboardLayout>
      <div style={{ padding: '28px 32px', maxWidth: 900, fontFamily: C.font }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: C.serif, fontSize: 26, fontWeight: 700, color: C.white, margin: '0 0 4px' }}>
              Document Manager
            </h1>
            <p style={{ fontSize: 13, color: C.t40, margin: 0 }}>
              Upload, organize, and access your brand documents.
            </p>
          </div>
          <UploadZone onUpload={handleUpload} uploading={uploading} />
        </div>

        {/* Category filter + search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {/* Category tabs */}
          <div style={{ display: 'flex', gap: 5, flex: 1, flexWrap: 'wrap' }}>
            {CATEGORIES.filter(c => categoryCounts[c] > 0 || c === 'all').map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                style={{
                  padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontFamily: C.font,
                  fontSize: 12, fontWeight: category === c ? 600 : 400,
                  border: '1px solid ' + (category === c ? 'rgba(224,78,53,0.4)' : C.border),
                  background: category === c ? 'rgba(224,78,53,0.08)' : C.t03,
                  color: category === c ? C.white : C.t50,
                  transition: 'all 0.12s',
                  textTransform: 'capitalize',
                }}
              >
                {CATEGORY_ICONS[c]} {c === 'all' ? 'All' : c}
                {' '}
                <span style={{ fontSize: 10, opacity: 0.7 }}>({categoryCounts[c] || 0})</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: C.t30 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search documents..."
              style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 9, border: '1px solid ' + C.border, background: C.t06, color: C.white, fontSize: 12.5, fontFamily: C.font, outline: 'none', width: 220 }}
            />
          </div>
        </div>

        {/* Document list */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(224,78,53,0.3)', borderTopColor: C.accent, animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 13, color: C.t40, fontFamily: C.font }}>Loading documents...</span>
            <style dangerouslySetInnerHTML={{ __html: '@keyframes spin{to{transform:rotate(360deg)}}' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <span style={{ fontSize: 40 }}>📂</span>
            <p style={{ fontSize: 15, fontWeight: 600, color: C.t50, margin: '16px 0 6px', fontFamily: C.font }}>
              {search ? 'No documents match your search' : docs.length === 0 ? 'No documents yet' : 'No documents in this category'}
            </p>
            <p style={{ fontSize: 12, color: C.t25, margin: 0, fontFamily: C.font }}>
              {!search && docs.length === 0 && 'Upload your first document using the button above.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(doc => (
              <DocRow
                key={doc.id}
                doc={doc}
                onDelete={handleDelete}
                onPreview={setPreview}
              />
            ))}
          </div>
        )}

        {/* Stats bar */}
        {docs.length > 0 && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid ' + C.border, display: 'flex', gap: 20 }}>
            <span style={{ fontSize: 11, color: C.t25, fontFamily: C.font }}>
              {docs.length} document{docs.length !== 1 ? 's' : ''}
            </span>
            {search && filtered.length !== docs.length && (
              <span style={{ fontSize: 11, color: C.t25, fontFamily: C.font }}>
                {filtered.length} matching
              </span>
            )}
          </div>
        )}
      </div>

      {/* Preview modal */}
      <PreviewModal doc={preview} onClose={() => setPreview(null)} />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 300,
          padding: '10px 18px', borderRadius: 9, fontFamily: C.font, fontSize: 12.5,
          background: toast.err ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
          border: '1px solid ' + (toast.err ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'),
          color: toast.err ? '#f87171' : C.green,
        }}>
          {toast.msg}
        </div>
      )}
    </DashboardLayout>
  )
}
