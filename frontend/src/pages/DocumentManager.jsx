import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DashboardLayout } from '../components/Layout';
import { useWorkspace } from '../context/WorkspaceContext';
import apiClient from '../lib/apiClient';

const C = {
 bg: 'var(--cth-admin-bg)',
 card: 'var(--cth-app-panel)',
 panel: 'var(--cth-app-panel)',
 border: 'var(--cth-app-border)',
 borderA: 'rgba(224,78,53,0.26)',
 accent: 'var(--cth-app-accent)',
 crimson: 'var(--cth-app-ruby)',
 tuscany: 'var(--cth-app-muted)',
 green: 'var(--cth-success)',
 amber: 'var(--cth-status-warning)',
 red: 'var(--cth-danger)',
 blue: 'var(--cth-status-info)',
 white: 'var(--cth-app-ink)',
 t80: 'var(--cth-app-ink)',
 t60: 'var(--cth-admin-ink-soft)',
 t40: 'var(--cth-app-muted)',
 t25: 'var(--cth-app-muted)',
 t10: 'rgba(43,16,64,0.10)',
 t06: 'var(--cth-app-panel-alt)',
 t03: 'var(--cth-app-panel-alt)',
 font: "'DM Sans', sans-serif",
 serif: "'DM Sans', sans-serif",
};

const CATEGORIES = ['all', 'general', 'branding', 'contracts', 'invoices', 'training', 'other'];

const CATEGORY_ICONS = {
 all: '📁',
 general: '📄',
 branding: '🎨',
 contracts: '✍️',
 invoices: '💰',
 training: '🎓',
 other: '📎',
};

const EXT_ICONS = {
 pdf: '📕',
 doc: '📘',
 docx: '📘',
 xls: '📗',
 xlsx: '📗',
 ppt: '📙',
 pptx: '📙',
 txt: '📃',
 csv: '📊',
 png: '🖼',
 jpg: '🖼',
 jpeg: '🖼',
 gif: '🖼',
 webp: '🖼',
 zip: '🗜',
};

function getExtIcon(filename) {
 const ext = String(filename || '').split('.').pop().toLowerCase();
 return EXT_ICONS[ext] || '📄';
}

function isPreviewable(filename) {
 const ext = String(filename || '').split('.').pop().toLowerCase();
 return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf'].includes(ext);
}

function formatBytes(bytes) {
 const n = Number(bytes || 0);
 if (!n) return '';
 if (n < 1024) return `${n} B`;
 if (n < 1048576) return `${(n / 1024).toFixed(0)} KB`;
 return `${(n / 1048576).toFixed(1)} MB`;
}

function formatDate(iso) {
 if (!iso) return '';
 try {
 return new Date(iso).toLocaleDateString(undefined, {
 month: 'short',
 day: 'numeric',
 year: 'numeric',
 });
 } catch {
 return '';
 }
}

function buildFileUrl(fileUrl) {
 if (!fileUrl) return '';
 if (/^https?:\/\//i.test(fileUrl)) return fileUrl;

 if (typeof apiClient.buildApiUrl === 'function') {
 return apiClient.buildApiUrl(fileUrl);
 }

 return fileUrl;
}

async function uploadDocumentBinary(documentId, file) {
 const fd = new FormData();
 fd.append('file', file);

 const url =
 typeof apiClient.buildApiUrl === 'function'
 ? apiClient.buildApiUrl(`/api/documents/${documentId}/upload`)
 : `/api/documents/${documentId}/upload`;

 const headers =
 typeof apiClient.getAuthHeaders === 'function'
 ? await apiClient.getAuthHeaders({ isFormData: true })
 : {};

 const response = await fetch(url, {
 method: 'POST',
 headers,
 body: fd,
 credentials: 'include',
 });

 const contentType = response.headers.get('content-type') || '';
 let payload = null;

 if (contentType.includes('application/json')) {
 payload = await response.json().catch(() => null);
 }

 if (!response.ok) {
 throw new Error(payload?.detail || `Upload failed (${response.status})`);
 }

 return payload;
}

function normalizeDoc(doc) {
 return {
 id: doc.document_id || doc.id,
 title: doc.title || doc.original_filename || doc.stored_filename || 'Untitled Document',
 filename: doc.original_filename || doc.stored_filename || doc.title || 'document',
 description: doc.description || '',
 category: doc.category || 'general',
 tags: Array.isArray(doc.tags) ? doc.tags : [],
 file_url: doc.file_url || '',
 content_type: doc.content_type || '',
 file_size: doc.size_bytes || 0,
 created_at: doc.created_at || '',
 updated_at: doc.updated_at || '',
 is_public: !!doc.is_public,
 is_archived: !!doc.is_archived,
 };
}

function UploadZone({ onUpload, uploading }) {
 const [dragging, setDragging] = useState(false);
 const [category, setCategory] = useState('general');
 const [desc, setDesc] = useState('');
 const [title, setTitle] = useState('');
 const [open, setOpen] = useState(false);
 const inputRef = useRef(null);
 const dropRef = useRef(null);

 function handleFiles(files) {
 if (!files || files.length === 0) return;
 onUpload(Array.from(files), { category, description: desc, title });
 setDesc('');
 setTitle('');
 setOpen(false);
 }

 function handleDrop(e) {
 e.preventDefault();
 setDragging(false);
 handleFiles(e.dataTransfer.files);
 }

 return (
 <div>
 <button
 onClick={() => setOpen((p) => !p)}
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: 8,
 padding: '10px 20px',
 borderRadius: 10,
 border: 'none',
 background: 'linear-gradient(135deg, var(--cth-app-accent), var(--cth-app-ruby))',
 color: C.white,
 fontSize: 13,
 fontWeight: 700,
 cursor: 'pointer',
 fontFamily: C.font,
 boxShadow: '0 4px 16px rgba(224,78,53,0.25)',
 }}
 >
 <span style={{ fontSize: 16 }}>+</span>
 Upload Document
 </button>

 {open && (
 <div
 style={{
 marginTop: 12,
 padding: '20px 24px',
 background: C.card,
 border: `1px solid ${C.borderA}`,
 borderRadius: 14,
 fontFamily: C.font,
 }}
 >
 <div
 ref={dropRef}
 onClick={() => inputRef.current?.click()}
 onDragOver={(e) => {
 e.preventDefault();
 setDragging(true);
 }}
 onDragLeave={(e) => {
 if (!dropRef.current?.contains(e.relatedTarget)) setDragging(false);
 }}
 onDrop={handleDrop}
 style={{
 border: `2px dashed ${dragging ? C.accent : 'var(--cth-app-border)'}`,
 borderRadius: 10,
 padding: '32px 20px',
 textAlign: 'center',
 cursor: 'pointer',
 marginBottom: 16,
 background: dragging ? 'rgba(224,78,53,0.05)' : 'none',
 transition: 'all 0.15s',
 }}
 >
 <input
 ref={inputRef}
 type="file"
 multiple
 accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp,.zip"
 onChange={(e) => {
 handleFiles(e.target.files);
 e.target.value = '';
 }}
 style={{ display: 'none' }}
 />
 <div style={{ fontSize: 32, marginBottom: 8 }}>📤</div>
 <p
 style={{
 fontSize: 13,
 fontWeight: 600,
 color: dragging ? C.accent : C.t60,
 margin: '0 0 4px',
 }}
 >
 {dragging ? 'Drop here' : 'Drag & drop or click to browse'}
 </p>
 <p style={{ fontSize: 11, color: C.t25, margin: 0 }}>
 PDF, Word, Excel, PowerPoint, Images, ZIP
 </p>
 </div>

 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
 <div>
 <label style={labelStyle}>Title</label>
 <input
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder="Optional document title"
 style={inputStyle}
 />
 </div>
 <div>
 <label style={labelStyle}>Category</label>
 <select
 value={category}
 onChange={(e) => setCategory(e.target.value)}
 style={{ ...inputStyle, colorScheme: 'light' }}
 >
 {CATEGORIES.filter((c) => c !== 'all').map((c) => (
 <option key={c} value={c} style={{ background: 'var(--cth-app-panel)' }}>
 {CATEGORY_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}
 </option>
 ))}
 </select>
 </div>
 <div>
 <label style={labelStyle}>Description</label>
 <input
 value={desc}
 onChange={(e) => setDesc(e.target.value)}
 placeholder="What is this document?"
 style={inputStyle}
 />
 </div>
 </div>

 <div style={{ display: 'flex', gap: 8 }}>
 <button
 onClick={() => inputRef.current?.click()}
 disabled={uploading}
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: 6,
 padding: '9px 20px',
 borderRadius: 9,
 border: 'none',
 background: uploading ? 'rgba(224,78,53,0.4)' : 'linear-gradient(135deg, var(--cth-app-accent), var(--cth-app-ruby))',
 color: C.white,
 fontSize: 13,
 fontWeight: 600,
 cursor: uploading ? 'not-allowed' : 'pointer',
 fontFamily: C.font,
 }}
 >
 {uploading ? '⏳ Uploading...' : '📤 Choose Files'}
 </button>
 <button
 onClick={() => setOpen(false)}
 style={{
 padding: '9px 16px',
 borderRadius: 9,
 border: `1px solid ${C.border}`,
 background: 'none',
 color: C.t40,
 fontSize: 13,
 cursor: 'pointer',
 fontFamily: C.font,
 }}
 >
 Cancel
 </button>
 </div>
 </div>
 )}
 </div>
 );
}

function DocRow({ doc, onDelete, onPreview }) {
 const [hovered, setHovered] = useState(false);
 const downloadUrl = buildFileUrl(doc.file_url);
 const canPreview = isPreviewable(doc.filename);

 return (
 <div
 onMouseEnter={() => setHovered(true)}
 onMouseLeave={() => setHovered(false)}
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: 14,
 padding: '12px 18px',
 background: hovered ? 'var(--cth-app-panel-alt)' : C.card,
 border: `1px solid ${hovered ? 'var(--cth-app-border)' : C.border}`,
 borderRadius: 11,
 transition: 'all 0.12s',
 }}
 >
 <div
 style={{
 width: 40,
 height: 40,
 borderRadius: 9,
 background: 'var(--cth-app-panel-alt)',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 fontSize: 20,
 flexShrink: 0,
 }}
 >
 {getExtIcon(doc.filename)}
 </div>

 <div style={{ flex: 1, minWidth: 0 }}>
 <p
 style={{
 fontSize: 13,
 fontWeight: 600,
 color: C.t80,
 margin: '0 0 3px',
 fontFamily: C.font,
 overflow: 'hidden',
 textOverflow: 'ellipsis',
 whiteSpace: 'nowrap',
 }}
 >
 {doc.title}
 </p>
 <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
 <span style={{ fontSize: 11, color: C.t40, fontFamily: C.font }}>
 {doc.filename}
 </span>
 {doc.description && (
 <span style={{ fontSize: 11, color: C.t40, fontFamily: C.font }}>
 {doc.description.substring(0, 50)}
 </span>
 )}
 <span style={{ fontSize: 11, color: C.t25, fontFamily: C.font }}>
 {formatBytes(doc.file_size)}
 </span>
 <span style={{ fontSize: 11, color: C.t25, fontFamily: C.font }}>
 {formatDate(doc.updated_at || doc.created_at)}
 </span>
 {doc.category && doc.category !== 'general' && (
 <span
 style={{
 fontSize: 9.5,
 fontWeight: 600,
 letterSpacing: '0.08em',
 padding: '1px 8px',
 borderRadius: 20,
 background: 'rgba(199,160,157,0.1)',
 color: C.tuscany,
 fontFamily: C.font,
 textTransform: 'capitalize',
 }}
 >
 {CATEGORY_ICONS[doc.category]} {doc.category}
 </span>
 )}
 </div>
 </div>

 <div
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: 6,
 flexShrink: 0,
 opacity: hovered ? 1 : 0,
 transition: 'opacity 0.12s',
 }}
 >
 {canPreview && doc.file_url && (
 <button
 onClick={() => onPreview(doc)}
 title="Preview"
 style={iconBtn}
 >
 👁
 </button>
 )}
 {doc.file_url && (
 <a
 href={downloadUrl}
 target="_blank"
 rel="noopener noreferrer"
 title="Download"
 style={{ ...iconBtn, textDecoration: 'none' }}
 >
 ⬇
 </a>
 )}
 <button
 onClick={() => onDelete(doc.id)}
 title="Delete"
 style={{
 ...iconBtn,
 border: '1px solid rgba(239,68,68,0.2)',
 background: 'rgba(239,68,68,0.06)',
 }}
 >
 🗑
 </button>
 </div>
 </div>
 );
}

function PreviewModal({ doc, onClose }) {
 if (!doc) return null;

 const url = buildFileUrl(doc.file_url);
 const ext = String(doc.filename || '').split('.').pop().toLowerCase();
 const isImg = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);

 return (
 <div
 onClick={onClose}
 style={{
 position: 'fixed',
 inset: 0,
 background: 'rgba(0,0,0,0.88)',
 zIndex: 200,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 padding: 24,
 }}
 >
 <div
 onClick={(e) => e.stopPropagation()}
 style={{
 background: 'var(--cth-app-panel)',
 border: '1px solid var(--cth-app-border)',
 borderRadius: 16,
 padding: '20px 24px',
 maxWidth: 860,
 width: '100%',
 maxHeight: '88vh',
 display: 'flex',
 flexDirection: 'column',
 fontFamily: C.font,
 }}
 >
 <div
 style={{
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 marginBottom: 16,
 flexShrink: 0,
 }}
 >
 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
 <span style={{ fontSize: 20 }}>{getExtIcon(doc.filename)}</span>
 <div>
 <p style={{ fontSize: 14, fontWeight: 600, color: C.white, margin: 0 }}>{doc.title}</p>
 <p style={{ fontSize: 11, color: C.t40, margin: 0 }}>
 {doc.filename} · {formatBytes(doc.file_size)}
 </p>
 </div>
 </div>
 <div style={{ display: 'flex', gap: 8 }}>
 {doc.file_url && (
 <a
 href={url}
 target="_blank"
 rel="noopener noreferrer"
 style={{
 padding: '7px 16px',
 borderRadius: 8,
 border: 'none',
 background: 'linear-gradient(135deg, var(--cth-app-accent), var(--cth-app-ruby))',
 color: C.white,
 fontSize: 12,
 fontWeight: 600,
 textDecoration: 'none',
 cursor: 'pointer',
 fontFamily: C.font,
 }}
 >
 ⬇ Download
 </a>
 )}
 <button
 onClick={onClose}
 style={{
 width: 32,
 height: 32,
 borderRadius: 8,
 border: `1px solid ${C.border}`,
 background: 'none',
 cursor: 'pointer',
 color: C.t40,
 fontSize: 18,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 }}
 >
 ×
 </button>
 </div>
 </div>

 <div
 style={{
 flex: 1,
 overflow: 'auto',
 borderRadius: 10,
 border: `1px solid ${C.border}`,
 background: 'rgba(0,0,0,0.2)',
 minHeight: 300,
 }}
 >
 {!doc.file_url ? (
 <div style={emptyPreviewStyle}>No file uploaded for this document yet.</div>
 ) : isImg ? (
 <img
 src={url}
 alt={doc.filename}
 style={{
 maxWidth: '100%',
 maxHeight: 600,
 display: 'block',
 margin: '0 auto',
 objectFit: 'contain',
 padding: 20,
 }}
 />
 ) : ext === 'pdf' ? (
 <iframe src={url} title={doc.filename} style={{ width: '100%', height: 560, border: 'none' }} />
 ) : (
 <div style={emptyPreviewStyle}>Preview not available for this file type.</div>
 )}
 </div>
 </div>
 </div>
 );
}

export default function DocumentManager() {
 const { currentWorkspace } = useWorkspace();

 const workspaceId =
 currentWorkspace?.id ||
 currentWorkspace?.workspace_id ||
 '';

 const [docs, setDocs] = useState([]);
 const [loading, setLoading] = useState(true);
 const [uploading, setUploading] = useState(false);
 const [category, setCategory] = useState('all');
 const [search, setSearch] = useState('');
 const [preview, setPreview] = useState(null);
 const [toast, setToast] = useState(null);

 function showToast(msg, err = false) {
 setToast({ msg, err });
 window.setTimeout(() => setToast(null), 3500);
 }

 const fetchDocs = useCallback(async () => {
 if (!workspaceId) {
 setDocs([]);
 setLoading(false);
 return;
 }

 setLoading(true);
 try {
 const params = {};
 if (category !== 'all') params.category = category;

 const res = await apiClient.get('/api/documents', { params });
 setDocs((res?.documents || []).map(normalizeDoc));
 } catch (err) {
 console.error('Failed to load documents:', err);
 setDocs([]);
 showToast(err?.message || 'Failed to load documents', true);
 } finally {
 setLoading(false);
 }
 }, [workspaceId, category]);

 useEffect(() => {
 fetchDocs();
 }, [fetchDocs]);

 async function handleUpload(files, meta) {
 setUploading(true);
 let succeeded = 0;

 for (const file of files) {
 try {
 const created = await apiClient.post('/api/documents', {
 title: meta.title?.trim() || file.name,
 description: meta.description?.trim() || '',
 category: meta.category || 'general',
 tags: [],
 is_public: false,
 });

 const documentId = created?.document_id || created?.id;
 if (!documentId) throw new Error('Document record was created without an id');

 await uploadDocumentBinary(documentId, file);
 succeeded += 1;
 } catch (err) {
 console.error('Upload failed:', err);
 showToast(err?.message || `Upload failed for ${file.name}`, true);
 }
 }

 setUploading(false);

 if (succeeded > 0) {
 showToast(`${succeeded} file${succeeded > 1 ? 's' : ''} uploaded`);
 fetchDocs();
 }
 }

 async function handleDelete(documentId) {
 if (!window.confirm('Delete this document permanently?')) return;

 try {
 await apiClient.delete(`/api/documents/${documentId}`);
 setDocs((prev) => prev.filter((d) => d.id !== documentId));
 showToast('Document deleted');
 } catch (err) {
 console.error('Delete failed:', err);
 showToast(err?.message || 'Delete failed', true);
 }
 }

 const filtered = useMemo(() => {
 return docs.filter((d) => {
 if (!search) return true;

 const q = search.toLowerCase();
 return (
 String(d.title || '').toLowerCase().includes(q) ||
 String(d.filename || '').toLowerCase().includes(q) ||
 String(d.description || '').toLowerCase().includes(q)
 );
 });
 }, [docs, search]);

 const categoryCounts = useMemo(() => {
 return CATEGORIES.reduce((acc, c) => {
 acc[c] = c === 'all' ? docs.length : docs.filter((d) => d.category === c).length;
 return acc;
 }, {});
 }, [docs]);

 return (
 <DashboardLayout>
 <div style={{ padding: '28px 32px', maxWidth: 900, fontFamily: C.font }}>
 <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
 <div>
 <h1
 style={{
 fontFamily: C.serif,
 fontSize: 26,
 fontWeight: 700,
 color: C.white,
 margin: '0 0 4px',
 }}
 >
 Document Manager
 </h1>
 <p style={{ fontSize: 13, color: C.t40, margin: 0 }}>
 Upload, organize, and access your brand documents.
 </p>
 </div>
 <UploadZone onUpload={handleUpload} uploading={uploading} />
 </div>

 <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
 <div style={{ display: 'flex', gap: 5, flex: 1, flexWrap: 'wrap' }}>
 {CATEGORIES.filter((c) => categoryCounts[c] > 0 || c === 'all').map((c) => (
 <button
 key={c}
 onClick={() => setCategory(c)}
 style={{
 padding: '6px 14px',
 borderRadius: 20,
 cursor: 'pointer',
 fontFamily: C.font,
 fontSize: 12,
 fontWeight: category === c ? 600 : 400,
 border: `1px solid ${category === c ? 'rgba(224,78,53,0.4)' : C.border}`,
 background: category === c ? 'rgba(224,78,53,0.08)' : C.t03,
 color: category === c ? C.white : C.t60,
 transition: 'all 0.12s',
 textTransform: 'capitalize',
 }}
 >
 {CATEGORY_ICONS[c]} {c === 'all' ? 'All' : c}{' '}
 <span style={{ fontSize: 10, opacity: 0.7 }}>({categoryCounts[c] || 0})</span>
 </button>
 ))}
 </div>

 <div style={{ position: 'relative', flexShrink: 0 }}>
 <span
 style={{
 position: 'absolute',
 left: 11,
 top: '50%',
 transform: 'translateY(-50%)',
 fontSize: 13,
 color: C.t25,
 }}
 >
 🔍
 </span>
 <input
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search documents..."
 style={{
 paddingLeft: 32,
 paddingRight: 12,
 paddingTop: 8,
 paddingBottom: 8,
 borderRadius: 9,
 border: `1px solid ${C.border}`,
 background: C.t06,
 color: C.white,
 fontSize: 12.5,
 fontFamily: C.font,
 outline: 'none',
 width: 220,
 }}
 />
 </div>
 </div>

 {loading ? (
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 10 }}>
 <div
 style={{
 width: 20,
 height: 20,
 borderRadius: '50%',
 border: '2px solid rgba(224,78,53,0.3)',
 borderTopColor: C.accent,
 animation: 'spin 0.8s linear infinite',
 }}
 />
 <span style={{ fontSize: 13, color: C.t40, fontFamily: C.font }}>Loading documents...</span>
 </div>
 ) : filtered.length === 0 ? (
 <div style={{ textAlign: 'center', padding: '64px 0' }}>
 <span style={{ fontSize: 40 }}>📂</span>
 <p style={{ fontSize: 15, fontWeight: 600, color: C.t60, margin: '16px 0 6px', fontFamily: C.font }}>
 {search ? 'No documents match your search' : docs.length === 0 ? 'No documents yet' : 'No documents in this category'}
 </p>
 <p style={{ fontSize: 12, color: C.t25, margin: 0, fontFamily: C.font }}>
 {!search && docs.length === 0 && 'Upload your first document using the button above.'}
 </p>
 </div>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
 {filtered.map((doc) => (
 <DocRow
 key={doc.id}
 doc={doc}
 onDelete={handleDelete}
 onPreview={setPreview}
 />
 ))}
 </div>
 )}

 {docs.length > 0 && (
 <div
 style={{
 marginTop: 20,
 paddingTop: 16,
 borderTop: `1px solid ${C.border}`,
 display: 'flex',
 gap: 20,
 }}
 >
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

 <PreviewModal doc={preview} onClose={() => setPreview(null)} />

 {toast && (
 <div
 style={{
 position: 'fixed',
 bottom: 20,
 right: 20,
 zIndex: 300,
 padding: '10px 18px',
 borderRadius: 9,
 fontFamily: C.font,
 fontSize: 12.5,
 background: toast.err ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
 border: `1px solid ${toast.err ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
 color: toast.err ? 'var(--cth-status-danger)' : C.green,
 }}
 >
 {toast.msg}
 </div>
 )}

 <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
 </DashboardLayout>
 );
}

const labelStyle = {
 display: 'block',
 fontSize: 10,
 fontWeight: 700,
 textTransform: 'uppercase',
 letterSpacing: '0.12em',
 color: C.t25,
 marginBottom: 5,
};

const inputStyle = {
 width: '100%',
 background: C.t06,
 border: `1px solid ${C.border}`,
 borderRadius: 8,
 padding: '8px 11px',
 fontSize: 12.5,
 color: C.white,
 fontFamily: C.font,
 outline: 'none',
 boxSizing: 'border-box',
};

const iconBtn = {
 width: 30,
 height: 30,
 borderRadius: 7,
 border: `1px solid ${C.border}`,
 background: C.t06,
 cursor: 'pointer',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 fontSize: 13,
};

const emptyPreviewStyle = {
 display: 'flex',
 flexDirection: 'column',
 alignItems: 'center',
 justifyContent: 'center',
 padding: 48,
 gap: 16,
 color: C.t40,
 fontFamily: C.font,
};
