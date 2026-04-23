import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../hooks/useAuth';
import axios from 'axios';
import { DashboardLayout } from '../components/Layout';
import {
  Plus, Search, PenLine, Loader2, X, Trash2, Eye, Archive,
  FileText, Wand2, Tags, ChevronRight, Image, Images,
  Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Link as LinkIcon,
  Undo2, Redo2
} from 'lucide-react';
import UploadZone from '../components/shared/UploadZone';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import TiptapLink from '@tiptap/extension-link';
import TiptapPlaceholder from '@tiptap/extension-placeholder';
import TiptapUnderline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';

const API = import.meta.env.VITE_BACKEND_URL;

// Convert markdown to HTML for the rich text editor
function markdownToHtml(markdown) {
  if (!markdown) return '';
  
  let html = markdown
    // Escape HTML first to prevent XSS
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers (must be at start of line)
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/___(.+?)___/g, '<strong><em>$1</em></strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // Unordered lists
    .replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // Blockquotes
    .replace(/^>\s*(.+)$/gm, '<blockquote>$1</blockquote>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr>')
    .replace(/^\*\*\*$/gm, '<hr>')
    // Links [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Line breaks - double newline becomes paragraph
    .replace(/\n\n+/g, '</p><p>')
    // Single newlines become <br>
    .replace(/\n/g, '<br>');
  
  // Wrap in paragraph tags
  html = '<p>' + html + '</p>';
  
  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');
  
  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => '<ul>' + match + '</ul>');
  
  // Fix blockquotes that got split
  html = html.replace(/<\/blockquote>\s*<blockquote>/g, '<br>');
  
  return html;
}

// Check if content looks like markdown
function looksLikeMarkdown(content) {
  if (!content) return false;
  const markdownPatterns = [
    /^#{1,3}\s+/m,           // Headers
    /\*\*[^*]+\*\*/,         // Bold
    /^\s*[-*+]\s+/m,         // Unordered list
    /^\s*\d+\.\s+/m,         // Ordered list
    /\[.+\]\(.+\)/,          // Links
  ];
  return markdownPatterns.some(pattern => pattern.test(content));
}

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'var(--cth-admin-muted)', bg: 'rgba(74,53,80,0.15)' },
  scheduled: { label: 'Scheduled', color: 'var(--cth-admin-muted)', bg: 'rgba(199,160,157,0.1)' },
  published: { label: 'Published', color: 'var(--cth-status-success-bright)', bg: 'rgba(74,222,128,0.1)' },
  archived: { label: 'Archived', color: 'var(--cth-brand-primary-deep)', bg: 'rgba(93,0,18,0.2)' },
};

const ALL_CATEGORIES = ['Brand Strategy', 'Content Strategy', 'Business Systems', 'Entrepreneurship', 'Brand Identity'];

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span data-testid={`status-badge-${status}`} className="text-xs px-2.5 py-1 rounded-full font-medium"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
      {cfg.label}
    </span>
  );
}

function PostCard({ post, onEdit, onPublish, onArchive, onDelete }) {
  return (
    <div data-testid={`post-card-${post.id}`} className="group p-5 rounded-2xl border border-[var(--cth-app-border)] cth-card hover:border-[rgba(224,78,53,0.22)] transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <StatusBadge status={post.status} />
            {post.tags && post.tags.length > 0 && (
              <span className="text-xs cth-muted flex items-center gap-1">
                <Tags size={10} /> {post.tags.slice(0, 2).join(', ')}
              </span>
            )}
          </div>
          <h3 className="font-semibold cth-heading text-sm leading-snug mb-1 group-hover:cth-text-accent transition-colors cursor-pointer"
            onClick={() => onEdit(post)}>
            {post.title}
          </h3>
          <p className="text-xs cth-muted line-clamp-2 mb-3">{post.excerpt}</p>
          <div className="flex items-center gap-4 text-xs cth-muted">
            {post.slug && <span>/{post.slug}</span>}
            {post.word_count > 0 && <span>{post.word_count} words</span>}
            {post.reading_time > 0 && <span>{post.reading_time} min read</span>}
            {post.published_at && <span>Published {new Date(post.published_at).toLocaleDateString()}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button data-testid={`edit-post-${post.id}`} onClick={() => onEdit(post)}
            className="text-xs px-3 py-1.5 rounded-lg border border-[var(--cth-app-border)] cth-muted hover:cth-heading hover:border-[rgba(224,78,53,0.3)] transition-all">
            Edit
          </button>
          {post.status === 'draft' && (
            <button data-testid={`publish-post-${post.id}`} onClick={() => onPublish(post.id)}
              className="text-xs px-3 py-1.5 rounded-lg cth-heading transition-all hover:opacity-90"
              style={{ background: "var(--cth-admin-accent)" }}>
              Publish
            </button>
          )}
          {post.status === 'published' && (
            <button onClick={() => onArchive(post.id)}
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--cth-app-border)] cth-muted hover:cth-muted transition-all">
              <Archive size={12} />
            </button>
          )}
          <button data-testid={`delete-post-${post.id}`} onClick={() => onDelete(post.id)}
            className="text-xs px-2 py-1.5 rounded-lg border border-[var(--cth-app-border)] cth-muted hover:text-red-400 hover:border-red-400/30 transition-all">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function RichTextToolbar({ editor }) {
  if (!editor) return null;
  const btn = (active, onClick, icon) => (
    <button type="button" onClick={onClick}
      className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-[rgba(224,78,53,0.12)] cth-text-accent' : 'cth-muted hover:cth-heading hover:bg-[var(--cth-app-panel-alt)]'}`}>
      {icon}
    </button>
  );
  return (
    <div className="flex items-center gap-0.5 flex-wrap px-3 py-2 border-b border-[var(--cth-app-border)] cth-card-muted/60" data-testid="rich-text-toolbar">
      {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), <Bold size={14} />)}
      {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), <Italic size={14} />)}
      {btn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), <UnderlineIcon size={14} />)}
      <div className="w-px h-5 bg-white/10 mx-1" />
      {btn(editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), <Heading1 size={14} />)}
      {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 size={14} />)}
      <div className="w-px h-5 bg-white/10 mx-1" />
      {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), <List size={14} />)}
      {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered size={14} />)}
      <div className="w-px h-5 bg-white/10 mx-1" />
      {btn(editor.isActive({ textAlign: 'left' }), () => editor.chain().focus().setTextAlign('left').run(), <AlignLeft size={14} />)}
      {btn(editor.isActive({ textAlign: 'center' }), () => editor.chain().focus().setTextAlign('center').run(), <AlignCenter size={14} />)}
      {btn(editor.isActive({ textAlign: 'right' }), () => editor.chain().focus().setTextAlign('right').run(), <AlignRight size={14} />)}
      <div className="w-px h-5 bg-white/10 mx-1" />
      {btn(false, () => {
        const url = window.prompt('Enter link URL');
        if (url) editor.chain().focus().setLink({ href: url }).run();
      }, <LinkIcon size={14} />)}
      {btn(false, () => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/*';
        input.onchange = async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const fd = new FormData(); fd.append('file', file); fd.append('user_id', 'default');
          try {
            const res = await axios.post(`${API}/api/blog/upload-image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res.data.url) editor.chain().focus().setImage({ src: `${API}${res.data.url}` }).run();
          } catch { alert('Image upload failed'); }
        };
        input.click();
      }, <Image size={14} />)}
      <div className="w-px h-5 bg-white/10 mx-1" />
      {btn(false, () => editor.chain().focus().undo().run(), <Undo2 size={14} />)}
      {btn(false, () => editor.chain().focus().redo().run(), <Redo2 size={14} />)}
    </div>
  );
}

function PostEditorDrawer({ post, onClose, onSave, generating, onGenerate }) {
  const [draft, setDraft] = useState({
    title: '', content: '', excerpt: '', status: 'draft', tags: [],
    seo_title: '', seo_description: '', featured_image: '', publish_date: '', author_name: '',
    gallery_images: [],
    ...post
  });
  const [activeTab, setActiveTab] = useState('content');
  const [tagInput, setTagInput] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);


  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapImage.configure({ inline: true }),
      TiptapLink.configure({ openOnClick: false }),
      TiptapPlaceholder.configure({ placeholder: 'Write your post here, or use AI Draft Generator above...' }),
      TiptapUnderline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: draft.content || '',
    onUpdate: ({ editor }) => {
      setDraft(d => ({ ...d, content: editor.getHTML() }));
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none px-4 py-3 min-h-[300px] focus:outline-none text-sm leading-relaxed',
        'data-testid': 'rich-text-editor',
      },
    },
  });

  const update = (field, value) => setDraft(d => ({ ...d, [field]: value }));

  const handleTitleChange = (title) => {
    setDraft(d => ({
      ...d, title,
      slug: d.slug || slugify(title),
      seo_title: d.seo_title || title,
    }));
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    update('tags', [...(draft.tags || []), tagInput.trim().toLowerCase()]);
    setTagInput('');
  };

  const removeTag = (tag) => update('tags', (draft.tags || []).filter(t => t !== tag));

  const handleAiDraft = async () => {
    if (!aiPrompt.trim()) return;
    const result = await onGenerate(aiPrompt);
    if (result) {
      // Convert markdown to HTML if the content looks like markdown
      let processedContent = result.content || draft.content;
      if (looksLikeMarkdown(processedContent)) {
        processedContent = markdownToHtml(processedContent);
      }
      
      const newDraft = {
        ...draft,
        title: result.title || draft.title,
        content: processedContent,
        excerpt: result.excerpt || draft.excerpt,
        seo_description: result.seo_description || draft.seo_description,
        tags: result.tags && result.tags.length > 0 ? result.tags : draft.tags,
      };
      setDraft(newDraft);
      if (editor && processedContent) editor.commands.setContent(processedContent);
      setShowAiPanel(false);
    }
  };

  const handleFeaturedImageUpload = async (file) => {
    setUploadingImage(true);
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('user_id', 'default');
      const res = await axios.post(`${API}/api/blog/upload-image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.url) update('featured_image', `${API}${res.data.url}`);
    } catch { alert('Image upload failed'); }
    setUploadingImage(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex" data-testid="post-editor-drawer">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-3xl h-full flex flex-col overflow-hidden"
        style={{ background: "var(--cth-app-panel)", borderLeft: "1px solid var(--cth-app-border)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--cth-app-border)]">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="cth-muted hover:cth-heading transition-colors"><X size={18} /></button>
            <span className="font-semibold cth-heading text-sm">{post?.id ? 'Edit Post' : 'New Post'}</span>
          </div>
          <div className="flex items-center gap-2">
            <select data-testid="post-status-select" value={draft.status}
              onChange={e => update('status', e.target.value)}
              className="text-xs rounded-lg px-3 py-1.5 border border-[var(--cth-app-border)] cth-card cth-muted focus:outline-none">
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <button data-testid="save-post-btn" onClick={() => onSave(draft)}
              className="text-xs px-4 py-1.5 rounded-lg cth-heading font-semibold hover:opacity-90"
              style={{ background: "var(--cth-admin-accent)" }}>
              Save
            </button>
          </div>
        </div>

        <div className="flex border-b border-[var(--cth-app-border)]">
          {['content', 'seo', 'settings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-6 py-3 text-xs font-medium capitalize transition-colors relative"
              style={{ color: activeTab === tab ? "var(--cth-admin-accent)" : "var(--cth-admin-ink-soft)" }}>
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-px bg-[var(--cth-admin-accent)]" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'content' && (
            <>
              <div className="rounded-2xl border border-[var(--cth-app-border)] cth-card overflow-hidden">
                <button onClick={() => setShowAiPanel(!showAiPanel)}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-left">
                  <div className="flex items-center gap-2">
                    <Wand2 size={14} className="cth-text-accent" />
                    <span className="text-xs font-semibold cth-heading">AI Draft Generator</span>
                    <span className="text-xs cth-muted">-- describe the post, get a full draft</span>
                  </div>
                  <ChevronRight size={14} className={`cth-muted transition-transform ${showAiPanel ? 'rotate-90' : ''}`} />
                </button>
                {showAiPanel && (
                  <div className="px-5 pb-5 border-t border-[var(--cth-admin-border)]">
                    <textarea data-testid="ai-prompt-input" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                      placeholder="e.g. Write a post about why entrepreneurs struggle with brand messaging..."
                      rows={3} className="w-full mt-4 text-sm rounded-xl px-4 py-3 border border-[var(--cth-app-border)] cth-card-muted cth-heading placeholder-[color:var(--cth-admin-muted)] resize-none focus:outline-none focus:border-[rgba(224,78,53,0.4)]" />
                    <button data-testid="generate-draft-btn" onClick={handleAiDraft} disabled={generating || !aiPrompt.trim()}
                      className="mt-3 text-xs px-4 py-2 rounded-lg cth-heading font-semibold disabled:opacity-40"
                      style={{ background: "var(--cth-admin-accent)" }}>
                      {generating ? <><Loader2 size={12} className="inline animate-spin mr-1" />Generating...</> : 'Generate Draft'}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs cth-text-accent font-medium uppercase tracking-widest mb-2 block">Title</label>
                <input data-testid="post-title-input" value={draft.title} onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Post title..."
                  className="w-full text-lg font-semibold rounded-xl px-4 py-3 border border-[var(--cth-app-border)] cth-card cth-heading placeholder-[color:var(--cth-admin-muted)] focus:outline-none focus:border-[rgba(224,78,53,0.4)]" />
              </div>

              <div>
                <label className="text-xs cth-text-accent font-medium uppercase tracking-widest mb-2 block">Excerpt</label>
                <textarea data-testid="post-excerpt-input" value={draft.excerpt || ''} onChange={e => update('excerpt', e.target.value)}
                  placeholder="Brief summary for post listings..." rows={2}
                  className="w-full text-sm rounded-xl px-4 py-3 border border-[var(--cth-app-border)] cth-card cth-heading placeholder-[color:var(--cth-admin-muted)] resize-none focus:outline-none focus:border-[rgba(224,78,53,0.4)]" />
              </div>

              <div>
                <label className="text-xs cth-text-accent font-medium uppercase tracking-widest mb-2 block">Content</label>
                <div className="rounded-xl border border-[var(--cth-app-border)] cth-card overflow-hidden">
                  <RichTextToolbar editor={editor} />
                  <EditorContent editor={editor} />
                </div>
                <p className="text-xs cth-muted mt-1">
                  {(draft.content || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length} words
                </p>
              </div>

              <div>
                <label className="text-xs cth-text-accent font-medium uppercase tracking-widest mb-2 block">Featured Image</label>
                {draft.featured_image && (
                  <div className="mb-3 relative rounded-xl overflow-hidden border border-[var(--cth-app-border)]">
                    <img src={draft.featured_image} alt="Featured" className="w-full h-40 object-cover" />
                    <button onClick={() => update('featured_image', '')}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-red-500/80 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                )}
                {!draft.featured_image && (
                  <UploadZone
                    accept="image"
                    multiple={false}
                    maxMb={10}
                    maxFiles={1}
                    label="Featured Image"
                    sublabel="PNG, JPG, WebP, GIF — up to 10MB"
                    onUpload={(asset) => {
                      if (asset && asset.url) update('featured_image', asset.url);
                    }}
                  />
                )}
                <input value={draft.featured_image || ''} onChange={e => update('featured_image', e.target.value)}
                  placeholder="Or paste image URL..."
                  className="w-full mt-2 text-sm rounded-xl px-4 py-2.5 border border-[var(--cth-app-border)] cth-card cth-heading placeholder-[color:var(--cth-admin-muted)] focus:outline-none focus:border-[rgba(224,78,53,0.4)]" />
              </div>

              <div>
                <label className="text-xs cth-text-accent font-medium uppercase tracking-widest mb-2 block">Tags</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {(draft.tags || []).map(tag => (
                    <span key={tag} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full cth-card border border-[var(--cth-app-border)] cth-muted">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="cth-muted hover:cth-heading">x</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input data-testid="tag-input" value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag, press Enter..."
                    className="flex-1 text-sm rounded-xl px-4 py-2.5 border border-[var(--cth-app-border)] cth-card cth-heading placeholder-[color:var(--cth-admin-muted)] focus:outline-none" />
                  <button onClick={addTag} className="text-xs px-3 py-2 rounded-xl border border-[var(--cth-app-border)] cth-muted hover:cth-heading">Add</button>
                </div>
              </div>

              {/* Media Gallery - Bulk Image Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs cth-text-accent font-medium uppercase tracking-widest flex items-center gap-1.5">
                    <Images size={12} /> Media Gallery
                  </label>
                  <span className="text-xs cth-muted">{(draft.gallery_images || []).length} / 20 images</span>
                </div>
                
                {/* Gallery Preview Grid */}
                {(draft.gallery_images || []).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3" data-testid="media-gallery-grid">
                    {(draft.gallery_images || []).map((img, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-[var(--cth-app-border)] hover:border-[rgba(224,78,53,0.3)] transition-colors">
                        <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              if (editor) editor.chain().focus().setImage({ src: img }).run();
                            }}
                            className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                            title="Insert into content"
                            data-testid={`gallery-insert-${idx}`}
                          >
                            <Image size={14} />
                          </button>
                          <button
                            onClick={() => {
                              const newGallery = (draft.gallery_images || []).filter((_, i) => i !== idx);
                              update('gallery_images', newGallery);
                            }}
                            className="p-1.5 rounded-lg bg-red-500/60 text-white hover:bg-red-500/80 transition-colors"
                            title="Remove from gallery"
                            data-testid={`gallery-remove-${idx}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] bg-black/60 cth-muted">
                          {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bulk Upload Zone */}
                <UploadZone
                  accept="image"
                  multiple={true}
                  maxMb={10}
                  maxFiles={20}
                  label="Drop images here or click to upload"
                  sublabel="PNG, JPG, WebP, GIF — up to 20 images, 10MB each"
                  onUpload={(asset) => {
                    const currentGallery = draft.gallery_images || [];
                    if (currentGallery.length < 20) {
                      update('gallery_images', [...currentGallery, asset.url]);
                    }
                  }}
                />
                
                {(draft.gallery_images || []).length > 0 && (
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs cth-muted">
                      Hover over images to insert into content or remove
                    </p>
                    <button 
                      onClick={() => update('gallery_images', [])}
                      className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
                      data-testid="gallery-clear-all"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'seo' && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs cth-text-accent font-medium uppercase tracking-widest">SEO Title</label>
                  <span className="text-xs" style={{ color: (draft.seo_title || "").length > 60 ? "var(--cth-admin-accent)" : "var(--cth-admin-ink-soft)" }}>
                    {(draft.seo_title || '').length}/60
                  </span>
                </div>
                <input value={draft.seo_title || ''} onChange={e => update('seo_title', e.target.value)}
                  placeholder="How this post appears in search results..."
                  className="w-full text-sm rounded-xl px-4 py-3 border border-[var(--cth-app-border)] cth-card cth-heading placeholder-[color:var(--cth-admin-muted)] focus:outline-none" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs cth-text-accent font-medium uppercase tracking-widest">SEO Description</label>
                  <span className="text-xs" style={{ color: (draft.seo_description || "").length > 160 ? "var(--cth-admin-accent)" : "var(--cth-admin-ink-soft)" }}>
                    {(draft.seo_description || '').length}/160
                  </span>
                </div>
                <textarea value={draft.seo_description || ''} onChange={e => update('seo_description', e.target.value)}
                  placeholder="The snippet shown below your title..." rows={3}
                  className="w-full text-sm rounded-xl px-4 py-3 border border-[var(--cth-app-border)] cth-card cth-heading placeholder-[color:var(--cth-admin-muted)] resize-none focus:outline-none" />
              </div>
              {(draft.seo_title || draft.title) && (
                <div>
                  <label className="text-xs cth-text-accent font-medium uppercase tracking-widest mb-3 block">Search Preview</label>
                  <div className="p-4 rounded-xl cth-card border border-[var(--cth-app-border)]">
                    <p className="text-xs cth-muted mb-1">yourbrand.com / blog / {draft.slug || 'your-post-slug'}</p>
                    <p className="text-sm font-semibold mb-1" style={{ color: 'color-mix(in srgb, var(--cth-status-info) 60%, white)' }}>{draft.seo_title || draft.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--cth-admin-muted)' }}>{draft.seo_description || draft.excerpt || 'Post excerpt will appear here...'}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'settings' && (
            <>
              <div>
                <label className="text-xs cth-text-accent font-medium uppercase tracking-widest mb-2 block">Publish Date</label>
                <input type="datetime-local" value={draft.publish_date ? draft.publish_date.slice(0, 16) : ''}
                  onChange={e => update('publish_date', e.target.value ? new Date(e.target.value).toISOString() : '')}
                  className="w-full text-sm rounded-xl px-4 py-3 border border-[var(--cth-app-border)] cth-card cth-heading focus:outline-none"
                  style={{ colorScheme: 'dark' }} />
              </div>
              <div>
                <label className="text-xs cth-text-accent font-medium uppercase tracking-widest mb-2 block">Author Name</label>
                <input value={draft.author_name || ''} onChange={e => update('author_name', e.target.value)}
                  placeholder="e.g. The Core Truth House Team"
                  className="w-full text-sm rounded-xl px-4 py-3 border border-[var(--cth-app-border)] cth-card cth-heading placeholder-[color:var(--cth-admin-muted)] focus:outline-none" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Blog CMS page content
function BlogCMSContent({ embedded = false }) {
  const LayoutWrapper = embedded ? React.Fragment : DashboardLayout;
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeStatus, setActiveStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [generating, setGenerating] = useState(false);

  const userId = user?.id || 'default';

  useEffect(() => { fetchData(); }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [articlesRes, analyticsRes] = await Promise.all([
        axios.get(`${API}/api/blog/articles?user_id=${userId}`),
        axios.get(`${API}/api/blog/analytics?user_id=${userId}`),
      ]);
      setArticles(articlesRes.data.articles || []);
      setAnalytics(analyticsRes.data);
    } catch (err) { console.error('Failed to fetch blog data:', err); }
    setLoading(false);
  };

  const handleSave = async (postData) => {
    try {
      if (postData.id) {
        await axios.put(`${API}/api/blog/articles/${postData.id}?user_id=${userId}`, postData);
      } else {
        await axios.post(`${API}/api/blog/articles?user_id=${userId}`, postData);
      }
      setEditingPost(null);
      fetchData();
    } catch (err) { console.error('Save failed:', err); }
  };

  const handlePublish = async (id) => {
    try {
      await axios.post(`${API}/api/blog/articles/${id}/publish?user_id=${userId}`);
      fetchData();
    } catch (err) { console.error('Publish failed:', err); }
  };

  const handleArchive = async (id) => {
    try {
      await axios.put(`${API}/api/blog/articles/${id}?user_id=${userId}`, { status: 'archived' });
      fetchData();
    } catch (err) { console.error('Archive failed:', err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this article?')) return;
    try {
      await axios.delete(`${API}/api/blog/articles/${id}?user_id=${userId}`);
      fetchData();
    } catch (err) { console.error('Delete failed:', err); }
  };

  const handleGenerate = async (prompt) => {
    setGenerating(true);
    try {
      const res = await axios.post(`${API}/api/blog/generate?user_id=${userId}`, {
        topic: prompt, keywords: [], tone: 'professional', word_count: 800, include_outline: true,
      });
      setGenerating(false);
      return res.data.generated;
    } catch (err) {
      console.error('AI generation failed:', err);
      setGenerating(false);
      return null;
    }
  };

  const counts = {
    all: articles.length,
    draft: articles.filter(a => a.status === 'draft').length,
    scheduled: articles.filter(a => a.status === 'scheduled').length,
    published: articles.filter(a => a.status === 'published').length,
    archived: articles.filter(a => a.status === 'archived').length,
  };

  const filtered = articles.filter(a => {
    if (activeStatus !== 'all' && a.status !== activeStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.title?.toLowerCase().includes(q) || a.excerpt?.toLowerCase().includes(q) || (a.tags || []).some(t => t.includes(q));
    }
    return true;
  });

  return (
    <>
      <LayoutWrapper>
      <div data-testid="blog-cms-page" className="cth-page flex-1 overflow-y-auto">
        <div
          className="border-b sticky top-0 z-30 backdrop-blur-xl"
          style={{
            borderColor: 'var(--cth-admin-border)',
            background: 'rgba(248, 244, 242, 0.94)',
          }}
        >
          <div className="max-w-6xl mx-auto px-4 py-4 md:px-6 md:py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1 pl-10 md:pl-0">
                <h1 className="font-bold cth-heading text-lg md:text-xl flex items-center gap-2">
                  <PenLine size={20} className="cth-text-accent flex-shrink-0" /> Blog CMS
                </h1>
                <p className="text-xs cth-muted mt-0.5">
                  {counts.published} published / {counts.draft} drafts / {counts.scheduled} scheduled
                </p>
              </div>
              <button data-testid="new-post-btn" onClick={() => setEditingPost({})}
                className="cth-button-primary flex items-center gap-2 px-5 py-2.5 text-sm font-semibold hover:opacity-90">
                <Plus size={16} /> New Post
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-5 md:px-6 md:py-8">
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-xl cth-card-muted" style={{ border: '1px solid var(--cth-admin-border)' }}>
              {['all', 'draft', 'scheduled', 'published', 'archived'].map(s => (
                <button key={s} onClick={() => setActiveStatus(s)} data-testid={`filter-${s}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: activeStatus === s ? 'rgba(224,78,53,0.15)' : 'transparent',
                    color: activeStatus === s ? 'var(--cth-admin-accent)' : 'var(--cth-admin-ink-soft)',
                  }}>
                  {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}
                  <span className="ml-1.5 opacity-60">{counts[s]}</span>
                </button>
              ))}
            </div>
            <div className="flex-1 min-w-48">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 cth-muted" />
                <input data-testid="blog-search-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search posts..."
                  className="cth-input w-full text-sm rounded-xl pl-9 pr-4 py-2.5" />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <Loader2 size={32} className="mx-auto animate-spin cth-text-accent" />
              <p className="cth-muted mt-3 text-sm">Loading articles...</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map(post => (
                <PostCard key={post.id} post={post} onEdit={setEditingPost}
                  onPublish={handlePublish} onArchive={handleArchive} onDelete={handleDelete} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20" data-testid="empty-blog-state">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(224,78,53,0.1)', border: '1px solid rgba(224,78,53,0.15)' }}>
                <PenLine size={22} className="cth-text-accent" />
              </div>
              <p className="cth-heading font-semibold mb-1">
                {searchQuery ? 'No posts match your search' : 'No posts yet'}
              </p>
              <p className="text-sm cth-muted mb-4">
                {searchQuery ? 'Try a different search term.' : 'Create your first post to get started.'}
              </p>
              {!searchQuery && (
                <button onClick={() => setEditingPost({})}
                  className="cth-button-primary text-sm px-5 py-2.5 font-semibold hover:opacity-90">
                  Write Your First Post
                </button>
              )}
            </div>
          )}
        </div>

        {editingPost !== null && (
          <PostEditorDrawer post={editingPost} onClose={() => setEditingPost(null)}
            onSave={handleSave} generating={generating} onGenerate={handleGenerate} />
        )}
      </div>
      </LayoutWrapper>
    </>
  );
}

// Export with plan gate wrapper
export default function BlogCMS({ embedded = false }) {
  return <BlogCMSContent embedded={embedded} />;
}
