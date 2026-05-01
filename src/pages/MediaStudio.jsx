import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardLayout } from '../components/Layout';
import { useWorkspace } from '../context/WorkspaceContext';
import { usePlan } from '../context/PlanContext';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../lib/apiClient';
import MediaStudioUploadPanel from '../components/shared/MediaStudioUploadZones';
import CampaignContextBanner from '../components/shared/CampaignContextBanner';

const API_BASE = apiClient.baseUrl || '';

const IMAGE_STYLES = [
 { id: 'brand', label: 'On-Brand', description: 'Matches your color palette and visual identity' },
 { id: 'professional', label: 'Professional', description: 'Clean, corporate-ready photography style' },
 { id: 'artistic', label: 'Artistic', description: 'Creative, editorial quality with expressive tones' },
 { id: 'photographic', label: 'Photographic', description: 'Realistic photography with natural lighting' },
 { id: 'minimalist', label: 'Minimalist', description: 'Clean, simple compositions with breathing room' },
 { id: 'cinematic', label: 'Cinematic', description: 'Film-quality framing with dramatic lighting' },
];

const ASPECT_RATIOS_IMAGE = ['1:1', '4:5', '16:9', '9:16', '4:3', '3:4'];
const ASPECT_RATIOS_VIDEO = ['16:9', '9:16', '1:1', '4:3'];

const IMAGE_PROVIDERS = [
 { id: 'openai', label: 'GPT Image 1', tag: 'OpenAI', creditCost: 2, available: true, category: 'Image' },
 { id: 'nano-banana', label: 'Nano Banana', tag: 'Gemini', creditCost: 2, available: true, category: 'Image' },
 { id: 'flux-pro', label: 'Flux Pro', tag: 'Replicate', creditCost: 1, available: true, category: 'Image' },
 { id: 'sdxl', label: 'SDXL', tag: 'Replicate', creditCost: 1, available: true, category: 'Image' },
 { id: 'midjourney', label: 'Midjourney', tag: 'Midjourney', creditCost: 3, available: false, category: 'Image' },
 { id: 'grok-imagine', label: 'Grok Imagine', tag: 'xAI', creditCost: 2, available: false, category: 'Image' },
 { id: 'krea', label: 'Krea', tag: 'Krea', creditCost: 2, available: false, category: 'Image' },
];

const VIDEO_PROVIDERS = [
 { id: 'sora', label: 'Sora 2', tag: 'OpenAI', creditCost: 5, available: true, category: 'Video' },
 { id: 'kling', label: 'Kling AI v2.6', tag: 'Replicate', creditCost: 5, available: true, category: 'Video' },
 { id: 'luma', label: 'Luma Ray 3', tag: 'Replicate', creditCost: 5, available: true, category: 'Video' },
 { id: 'runway', label: 'Runway Gen 4.5', tag: 'Replicate', creditCost: 8, available: true, category: 'Video' },
 { id: 'veo', label: 'Google VEO 3.1', tag: 'Google', creditCost: 6, available: false, category: 'Video' },
 { id: 'wan', label: 'WAN 2.6', tag: 'WAN', creditCost: 4, available: false, category: 'Video' },
 { id: 'seedance', label: 'Seedance 1.5 Pro', tag: 'Seedance', creditCost: 5, available: false, category: 'Video' },
 { id: 'hailuo', label: 'Hailuo 2.3', tag: 'Minimax', creditCost: 5, available: false, category: 'Video' },
 { id: 'invideo', label: 'InVideo AI', tag: 'InVideo', creditCost: 6, available: false, category: 'Video' },
];

async function authedFetchJson(url, { method = 'GET', body, isFormData = false } = {}) {
 const headers =
 typeof apiClient.getAuthHeaders === 'function'
 ? await apiClient.getAuthHeaders({ isFormData })
 : {};

 const response = await fetch(
 typeof apiClient.buildApiUrl === 'function' ? apiClient.buildApiUrl(url) : url,
 {
 method,
 headers,
 body: isFormData ? body : body ? JSON.stringify(body) : undefined,
 credentials: 'include',
 }
 );

 const contentType = response.headers.get('content-type') || '';
 const payload = contentType.includes('application/json')
 ? await response.json().catch(() => null)
 : null;

 if (!response.ok) {
 throw new Error(payload?.detail || payload?.message || `Request failed (${response.status})`);
 }

 return payload;
}

function buildMediaUrl(url) {
 if (!url) return '';
 if (/^https?:\/\//i.test(url)) return url;
 if (typeof apiClient.buildApiUrl === 'function') return apiClient.buildApiUrl(url);
 return `${API_BASE}${url}`;
}

function normalizeGalleryItem(item) {
 return {
 id: item.id || item.media_id || item.job_id,
 type: item.type || item.media_type || 'image',
 url: item.url || item.image_url || item.video_url || '',
 thumbnail_url: item.thumbnail_url || item.image_url || item.video_url || '',
 prompt: item.prompt || '',
 provider: item.provider || item.model || 'Unknown',
 created_at: item.created_at || new Date().toISOString(),
 is_saved: !!item.is_saved,
 dimensions: item.dimensions || item.size || '',
 settings: item.settings || {},
 };
}

function ProviderDropdown({ providers, selectedId, onSelect }) {
 const [open, setOpen] = useState(false);
 const [search, setSearch] = useState('');
 const ref = useRef(null);

 useEffect(() => {
 const handler = (e) => {
 if (ref.current && !ref.current.contains(e.target)) setOpen(false);
 };
 document.addEventListener('mousedown', handler);
 return () => document.removeEventListener('mousedown', handler);
 }, []);

 const filtered = providers.filter(
 (p) =>
 p.label.toLowerCase().includes(search.toLowerCase()) ||
 p.tag.toLowerCase().includes(search.toLowerCase())
 );

 const available = filtered.filter((p) => p.available !== false);
 const unavailable = filtered.filter((p) => p.available === false);
 const selected = providers.find((p) => p.id === selectedId);

 return (
 <div ref={ref} className="relative">
 <button
 onClick={() => setOpen(!open)}
 data-testid="provider-dropdown-trigger"
 className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-[var(--cth-admin-border)] cth-card-muted text-left hover:border-[rgba(224,78,53,0.24)] transition-all"
 >
 <div className="flex items-center gap-2">
 {selected ? (
 <>
 <span className="text-sm cth-heading font-medium">{selected.label}</span>
 <span className="px-1.5 py-0.5 rounded text-[9px] cth-card-muted cth-muted">{selected.tag}</span>
 </>
 ) : (
 <span className="text-sm cth-muted">Select AI model...</span>
 )}
 </div>
 <div className="flex items-center gap-2">
 {selected && <span className="text-[11px] cth-muted">{selected.creditCost} credits</span>}
 <svg className={`w-4 h-4 cth-muted transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
 </svg>
 </div>
 </button>

 {open && (
 <div className="absolute z-50 top-full left-0 right-0 mt-1.5 cth-card border border-[var(--cth-admin-border)] rounded-xl shadow-2xl shadow-black/40 overflow-hidden" data-testid="provider-dropdown-menu">
 <div className="p-2 border-b border-[var(--cth-admin-border)]">
 <div className="flex items-center gap-2 px-3 py-2 cth-card-muted rounded-lg">
 <svg className="w-3.5 h-3.5 cth-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
 </svg>
 <input
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search models..."
 autoFocus
 data-testid="provider-search-input"
 className="bg-transparent text-xs cth-heading placeholder:cth-muted focus:outline-none w-full"
 />
 </div>
 </div>

 <div className="max-h-64 overflow-y-auto py-1">
 {available.length > 0 && (
 <>
 <p className="px-3 py-1.5 text-[9px] font-semibold tracking-widest uppercase cth-muted">Available</p>
 {available.map((p) => (
 <button
 key={p.id}
 onClick={() => {
 onSelect(p.id);
 setOpen(false);
 setSearch('');
 }}
 data-testid={`provider-${p.id}`}
 className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-all hover:cth-card-muted ${selectedId === p.id ? 'bg-[var(--cth-admin-accent)]/10' : ''}`}
 >
 <div className="flex items-center gap-2">
 <div className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedId === p.id ? 'bg-[var(--cth-admin-accent)]' : 'bg-emerald-400/60'}`} />
 <span className="text-xs cth-heading font-medium">{p.label}</span>
 <span className="px-1.5 py-0.5 rounded text-[8px] cth-card-muted cth-muted">{p.tag}</span>
 </div>
 <span className="text-[10px] cth-muted">{p.creditCost} cr</span>
 </button>
 ))}
 </>
 )}

 {unavailable.length > 0 && (
 <>
 <p className="px-3 py-1.5 text-[9px] font-semibold tracking-widest uppercase cth-muted mt-1 border-t border-[var(--cth-admin-border)] pt-2">Coming Soon , API Key Required</p>
 {unavailable.map((p) => (
 <div
 key={p.id}
 className="w-full flex items-center justify-between px-3.5 py-2.5 opacity-40 cursor-not-allowed"
 data-testid={`provider-${p.id}-unavailable`}
 >
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-white/15 flex-shrink-0" />
 <span className="text-xs cth-muted">{p.label}</span>
 <span className="px-1.5 py-0.5 rounded text-[8px] cth-card-muted cth-muted">{p.tag}</span>
 </div>
 <span className="text-[9px] cth-muted italic">key needed</span>
 </div>
 ))}
 </>
 )}

 {filtered.length === 0 && (
 <p className="text-xs cth-muted text-center py-6">No models match "{search}"</p>
 )}
 </div>
 </div>
 )}
 </div>
 );
}

function timeAgo(date) {
 const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
 if (seconds < 60) return 'just now';
 if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
 if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
 return `${Math.floor(seconds / 86400)}d ago`;
}

function PlaceholderMedia({ index, type }) {
 const colors = ['var(--cth-brand-primary-soft)', 'var(--cth-surface-night)', 'var(--cth-brand-primary-soft)', 'var(--cth-brand-primary-deep)', 'var(--cth-admin-ruby)'];
 const bg = colors[index % colors.length];
 return (
 <div
 className="w-full h-full flex flex-col items-center justify-center"
 style={{ background: `linear-gradient(135deg, ${bg} 0%, var(--cth-surface-deep) 100%)` }}
 >
 {type === 'video' ? (
 <svg className="w-10 h-10 cth-muted" fill="currentColor" viewBox="0 0 24 24">
 <path d="M8 5v14l11-7z" />
 </svg>
 ) : (
 <svg className="w-10 h-10 cth-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
 </svg>
 )}
 </div>
 );
}

function MediaStudioContent() {
 const { activeWorkspace } = useWorkspace();
 const { userId } = useAuth();
 const { plan } = usePlan();
 const location = useLocation();

 const workspaceId = activeWorkspace?.id || activeWorkspace?.workspace_id || '';

 const [activeCampaignId, setActiveCampaignId] = useState(() => location.state?.campaignId || null);
 const [activeCampaignName, setActiveCampaignName] = useState(() => location.state?.campaignName || null);

 useEffect(() => {
  if (location.state?.campaignId) {
   setActiveCampaignId(location.state.campaignId);
   if (location.state.campaignName) setActiveCampaignName(location.state.campaignName);
  }
 }, [location.state]);

 const [mode, setMode] = useState('image');
 const [prompt, setPrompt] = useState('');
 const [referenceImage, setReferenceImage] = useState(null);
 const referenceInputRef = useRef(null);

 const [imageSettings, setImageSettings] = useState({
 provider: 'openai',
 style: 'brand',
 aspectRatio: '1:1',
 quality: 'hd',
 brandColors: true,
 });

 const [videoSettings, setVideoSettings] = useState({
 provider: 'sora',
 duration: '5s',
 aspectRatio: '16:9',
 motionAmount: 'medium',
 });

 const [isGenerating, setIsGenerating] = useState(false);
 const [generationProgress, setGenerationProgress] = useState(0);
 const [generatedResults, setGeneratedResults] = useState([]);
 const [generationError, setGenerationError] = useState(null);

 const [library, setLibrary] = useState([]);
 const [libraryFilter, setLibraryFilter] = useState('all');
 const [selectedMedia, setSelectedMedia] = useState(null);
 const [libraryLoading, setLibraryLoading] = useState(true);

 const pollRef = useRef(null);

 const [watermarkSettings, setWatermarkSettings] = useState({
 text: 'Core Truth House',
 position: 'bottom-right',
 opacity: 0.5,
 fontSize: 24,
 color: 'var(--cth-white)',
 });
 const [watermarkImage, setWatermarkImage] = useState(null);
 const [watermarkResult, setWatermarkResult] = useState(null);
 const [isWatermarking, setIsWatermarking] = useState(false);
 const watermarkInputRef = useRef(null);

 const [credits, setCredits] = useState({ remaining: 75, total: 75 });

 const [uploadData, setUploadData] = useState({
 referenceImage: null,
 referenceStrength: 0.65,
 aiTwinPhotos: [],
 brandAsset: null,
 });

 const creditCost = useMemo(() => {
 if (mode === 'image') return IMAGE_PROVIDERS.find((p) => p.id === imageSettings.provider)?.creditCost ?? 2;
 if (mode === 'video') return VIDEO_PROVIDERS.find((p) => p.id === videoSettings.provider)?.creditCost ?? 5;
 return 0;
 }, [mode, imageSettings.provider, videoSettings.provider]);

 const canGenerate = prompt.trim().length > 0 && !isGenerating;

 const filteredLibrary = useMemo(() => {
 return library.filter((item) => {
 if (libraryFilter === 'all') return true;
 if (libraryFilter === 'images') return item.type === 'image';
 if (libraryFilter === 'videos') return item.type === 'video';
 if (libraryFilter === 'saved') return item.is_saved;
 return true;
 });
 }, [library, libraryFilter]);

 const loadLibrary = useCallback(async () => {
 if (!workspaceId) {
 setLibrary([]);
 setLibraryLoading(false);
 return;
 }

 setLibraryLoading(true);
 try {
 const res = await apiClient.get('/api/media/gallery', { params: { limit: 40 } });
 setLibrary((res?.items || []).map(normalizeGalleryItem));
 } catch (err) {
 console.error('Failed to load gallery:', err);
 setLibrary([]);
 } finally {
 setLibraryLoading(false);
 }
 }, [workspaceId]);

 useEffect(() => {
 loadLibrary();
 return () => {
 if (pollRef.current) clearInterval(pollRef.current);
 };
 }, [loadLibrary]);

 const handleGenerateImage = async () => {
 setIsGenerating(true);
 setGenerationProgress(0);
 setGeneratedResults([]);
 setGenerationError(null);

 const progressInterval = setInterval(() => {
 setGenerationProgress((p) => Math.min(p + 8, 92));
 }, 500);

 try {
 let res;
 const provider = imageSettings.provider;

 if (provider === 'nano-banana') {
 const formData = new FormData();
 formData.append('prompt', prompt);
 formData.append('style', imageSettings.style);
 if (referenceImage instanceof File) formData.append('reference_image', referenceImage);
 res = await authedFetchJson('/api/media/nano-banana/generate', {
 method: 'POST',
 body: formData,
 isFormData: true,
 });
 } else if (provider === 'flux-pro' || provider === 'sdxl') {
 const formData = new FormData();
 formData.append('prompt', prompt);
 formData.append(
 'model',
 provider === 'flux-pro'
 ? 'black-forest-labs/flux-1.1-pro'
 : 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b'
 );
 if (referenceImage instanceof File) formData.append('reference_image', referenceImage);
 res = await authedFetchJson('/api/media/replicate/generate-image', {
 method: 'POST',
 body: formData,
 isFormData: true,
 });
 } else {
 const formData = new FormData();
 formData.append('prompt', prompt);
 formData.append('style', imageSettings.style);
 formData.append('aspect_ratio', imageSettings.aspectRatio);
 if (referenceImage instanceof File) formData.append('reference_image', referenceImage);
 res = await authedFetchJson('/api/media/generate-image', {
 method: 'POST',
 body: formData,
 isFormData: true,
 });
 }

 const newMedia = normalizeGalleryItem({
 id: res?.media_id || res?.id || Date.now().toString(),
 type: 'image',
 image_url: res?.image_url || res?.url,
 prompt,
 provider: IMAGE_PROVIDERS.find((p) => p.id === imageSettings.provider)?.label || imageSettings.provider,
 created_at: new Date().toISOString(),
 is_saved: false,
 dimensions: res?.dimensions || '1024×1024',
 settings: { style: imageSettings.style, aspectRatio: imageSettings.aspectRatio },
 });

 setGeneratedResults([newMedia]);
 setLibrary((prev) => [newMedia, ...prev]);
 setGenerationProgress(100);
 } catch (err) {
 console.error('Image generation failed:', err);
 setGenerationError(err.message || 'Image generation failed. Please try again.');
 } finally {
 clearInterval(progressInterval);
 setIsGenerating(false);
 }
 };

 const handleGenerateVideo = async () => {
 setIsGenerating(true);
 setGenerationProgress(0);
 setGeneratedResults([]);
 setGenerationError(null);

 try {
 const provider = videoSettings.provider;
 let startRes;

 if (provider === 'kling') {
 const formData = new FormData();
 formData.append('prompt', prompt);
 formData.append('model', 'kwaivgi/kling-v3-omni-video');
 formData.append('duration', videoSettings.duration);
 formData.append('aspect_ratio', videoSettings.aspectRatio);
 if (referenceImage instanceof File) formData.append('reference_image', referenceImage);

 startRes = await authedFetchJson('/api/media/replicate/generate-video', {
 method: 'POST',
 body: formData,
 isFormData: true,
 });
 } else {
 startRes = await apiClient.post('/api/media/generate-video', {
 prompt,
 size:
 videoSettings.aspectRatio === '16:9'
 ? '1280x720'
 : videoSettings.aspectRatio === '9:16'
 ? '720x1280'
 : '1024x1024',
 duration: parseInt(videoSettings.duration, 10),
 provider,
 });
 }

 const jobId = startRes?.job_id;
 if (!jobId) throw new Error('Video job did not return a job id');

 pollRef.current = setInterval(async () => {
 try {
 const statusRes = await apiClient.get(`/api/media/video-status/${jobId}`);
 const status = statusRes?.status;

 if (status === 'processing') {
 setGenerationProgress((p) => Math.min(p + 3, 92));
 } else if (status === 'completed') {
 clearInterval(pollRef.current);

 const newMedia = normalizeGalleryItem({
 id: jobId,
 type: 'video',
 video_url: statusRes?.video_url,
 thumbnail_url: statusRes?.thumbnail_url || statusRes?.video_url,
 prompt,
 provider: VIDEO_PROVIDERS.find((p) => p.id === videoSettings.provider)?.label || videoSettings.provider,
 created_at: new Date().toISOString(),
 is_saved: false,
 dimensions: videoSettings.aspectRatio === '16:9' ? '1920×1080' : '1080×1920',
 settings: { duration: videoSettings.duration, aspectRatio: videoSettings.aspectRatio },
 });

 setGeneratedResults([newMedia]);
 setLibrary((prev) => [newMedia, ...prev]);
 setGenerationProgress(100);
 setIsGenerating(false);
 } else if (status === 'failed') {
 clearInterval(pollRef.current);
 setGenerationError(statusRes?.error || 'Video generation failed');
 setIsGenerating(false);
 }
 } catch (err) {
 console.error('Video status check failed:', err);
 }
 }, 3000);
 } catch (err) {
 console.error('Video generation failed:', err);
 setGenerationError(err.message || 'Video generation failed. Please try again.');
 setIsGenerating(false);
 }
 };

 const handleGenerate = () => {
 if (mode === 'image') handleGenerateImage();
 else if (mode === 'video') handleGenerateVideo();
 };

 const handleApplyWatermark = async () => {
 if (!watermarkImage) return;
 setIsWatermarking(true);
 setWatermarkResult(null);

 try {
 const formData = new FormData();
 formData.append('image', watermarkImage);
 formData.append('text', watermarkSettings.text);
 formData.append('position', watermarkSettings.position);
 formData.append('opacity', String(watermarkSettings.opacity));
 formData.append('font_size', String(watermarkSettings.fontSize));
 formData.append('color', watermarkSettings.color);

 const res = await authedFetchJson('/api/media/watermark', {
 method: 'POST',
 body: formData,
 isFormData: true,
 });

 setWatermarkResult(res);

 const newMedia = normalizeGalleryItem({
 id: res?.media_id || Date.now().toString(),
 type: 'image',
 image_url: res?.image_url,
 prompt: `Watermarked: ${watermarkSettings.text}`,
 provider: 'Watermark',
 created_at: new Date().toISOString(),
 is_saved: false,
 });

 setLibrary((prev) => [newMedia, ...prev]);
 } catch (err) {
 console.error('Watermark failed:', err);
 setGenerationError(err.message || 'Watermark failed');
 }

 setIsWatermarking(false);
 };

 const handleSave = async (media) => {
 try {
 const payload = { id: media.id };
 if (activeCampaignId) payload.campaign_id = activeCampaignId;
 await apiClient.post('/api/media/save', payload);
 setLibrary((prev) => prev.map((m) => (m.id === media.id ? { ...m, is_saved: true, campaign_id: activeCampaignId || m.campaign_id } : m)));
 setGeneratedResults((prev) => prev.map((m) => (m.id === media.id ? { ...m, is_saved: true, campaign_id: activeCampaignId || m.campaign_id } : m)));
 } catch (err) {
 console.error('Failed to save media:', err);
 }
 };

 const handleDelete = async (mediaId) => {
 try {
 await apiClient.delete(`/api/media/${mediaId}`);
 setLibrary((prev) => prev.filter((m) => m.id !== mediaId));
 setSelectedMedia(null);
 } catch (err) {
 console.error('Failed to delete media:', err);
 }
 };

 const handleDownload = async (media) => {
 try {
 const link = document.createElement('a');
 link.href = buildMediaUrl(media.url || media.thumbnail_url);
 link.download = `${media.type}-${media.id}.${media.type === 'video' ? 'mp4' : 'png'}`;
 link.target = '_blank';
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 } catch (err) {
 console.error('Download failed:', err);
 }
 };

 const handleReferenceUpload = (e) => {
 const file = e.target.files?.[0];
 if (!file) return;
 setReferenceImage(file);
 };

 return (
 <DashboardLayout>
 <div className="cth-page cth-app-page flex min-h-screen flex-col" data-testid="media-studio-page">
 <div
 className="cth-topbar cth-row-between sticky top-0 z-20 border-b pl-14 pr-4 py-3 backdrop-blur-sm md:px-8 md:py-4"
 style={{
 borderColor: 'var(--cth-admin-border)',
 background: 'rgba(248, 244, 242, 0.94)',
 }}
 >
 <div className="cth-topbar-title min-w-0 flex-1">
 <p className="cth-kicker mb-1">Create visual assets</p>
 <h1 className="text-lg font-semibold cth-heading truncate md:text-xl">
 Media Studio
 </h1>
 <p className="mt-0.5 text-[11px] cth-muted md:text-xs">
 Generate on-brand images, videos, and refinements from one workspace.
 </p>
 </div>

 <div className="cth-topbar-actions ml-2 flex flex-shrink-0 items-center gap-3 md:gap-6">
 <div className="cth-card-muted flex items-center gap-2 rounded-full px-3 py-2 md:gap-3">
 <div className="text-right hidden sm:block">
 <p className="text-xs font-medium cth-heading">{credits.remaining} / {credits.total} credits</p>
 <p className="text-[10px] cth-muted">remaining this month</p>
 </div>
 <div className="w-12 md:w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--cth-admin-border)' }}>
 <div
 className="h-full rounded-full"
 style={{
 background: 'var(--cth-admin-accent)',
 width: `${(credits.remaining / credits.total) * 100}%`,
 }}
 />
 </div>
 </div>
 </div>
 </div>

 <CampaignContextBanner
 campaignId={activeCampaignId}
 campaignName={activeCampaignName}
 label="Creating media for campaign:"
 onClear={() => { setActiveCampaignId(null); setActiveCampaignName(null); }}
 />

 <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
 <div
 className="cth-panel md:w-80 flex-shrink-0 overflow-y-auto border-b px-4 py-4 md:border-b-0 md:border-r md:px-5 md:py-5"
 style={{
 borderColor: 'var(--cth-admin-border)',
 background: 'var(--cth-admin-panel)',
 }}
 >
 <div className="cth-stack gap-5">
 <div>
 <p className="cth-kicker mb-2">Studio mode</p>
 <div className="flex gap-1 p-1 cth-card-muted rounded-xl overflow-x-auto">
 {[
 { id: 'image', label: 'Image', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
 { id: 'video', label: 'Video', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
 { id: 'watermark', label: 'Watermark', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
 { id: 'finetune', label: 'Fine-tune', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
 ].map((tab) => (
 <button
 key={tab.id}
 onClick={() => setMode(tab.id)}
 data-testid={`mode-tab-${tab.id}`}
 className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
 mode === tab.id
 ? 'bg-[var(--cth-admin-accent)] text-white shadow-sm'
 : 'cth-muted hover:cth-heading hover:bg-white/40'
 }`}
 >
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
 </svg>
 {tab.label}
 </button>
 ))}
 </div>
 </div>

 {mode !== 'watermark' && (
 <div className="cth-card p-4">
 <p className="cth-kicker mb-2">Creative direction</p>
 <label className="cth-label">
 Prompt
 </label>
 <textarea
 value={prompt}
 onChange={(e) => setPrompt(e.target.value)}
 placeholder={mode === 'video' ? 'Describe the video you want to create...' : 'Describe the image you want to create...'}
 data-testid="prompt-input"
 className="cth-textarea h-28 text-sm"
 />
 </div>
 )}

 {mode === 'video' && (
 <div className="mb-5">
 <label className="block text-[10px] font-semibold tracking-widest uppercase cth-muted mb-2">
 Reference Image (Optional)
 </label>
 <input
 type="file"
 ref={referenceInputRef}
 onChange={handleReferenceUpload}
 accept="image/*"
 className="hidden"
 />
 {referenceImage ? (
 <div className="relative w-full h-24 rounded-lg overflow-hidden">
 <img src={URL.createObjectURL(referenceImage)} alt="Reference" className="w-full h-full object-cover" />
 <button
 onClick={() => setReferenceImage(null)}
 className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:cth-heading"
 >
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 </div>
 ) : (
 <button
 onClick={() => referenceInputRef.current?.click()}
 className="w-full h-20 border border-dashed rounded-lg flex flex-col items-center justify-center gap-1 text-sm cth-muted hover:opacity-80 transition-colors"
 style={{ borderColor: 'var(--cth-admin-border)' }}
 type="button"
 >
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
 </svg>
 <span className="text-[11px]">Upload reference</span>
 </button>
 )}
 </div>
 )}

 {mode !== 'watermark' && (
 <div className="cth-card p-4 relative">
 <p className="cth-kicker mb-2">Model</p>
 <label className="block text-[10px] font-semibold tracking-widest uppercase cth-muted mb-2">
 AI Model
 </label>
 <ProviderDropdown
 providers={mode === 'image' ? IMAGE_PROVIDERS : VIDEO_PROVIDERS}
 selectedId={mode === 'image' ? imageSettings.provider : videoSettings.provider}
 onSelect={(id) =>
 mode === 'image'
 ? setImageSettings((s) => ({ ...s, provider: id }))
 : setVideoSettings((s) => ({ ...s, provider: id }))
 }
 />
 </div>
 )}

 {mode === 'image' && (
 <div className="cth-card p-4">
 <p className="cth-kicker mb-2">Visual style</p>
 <label className="block text-[10px] font-semibold tracking-widest uppercase cth-muted mb-2">
 Style
 </label>
 <div className="grid grid-cols-2 gap-2">
 {IMAGE_STYLES.map((style) => (
 <button
 key={style.id}
 onClick={() => setImageSettings((s) => ({ ...s, style: style.id }))}
 data-testid={`style-${style.id}`}
 className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
 imageSettings.style === style.id
 ? 'bg-[var(--cth-admin-accent)] text-white'
 : 'cth-card-muted cth-muted hover:cth-card-muted'
 }`}
 >
 {style.label}
 </button>
 ))}
 </div>
 </div>
 )}

 {mode === 'image' && (
 <div className="cth-card p-4">
 <p className="cth-kicker mb-3">Reference assets</p>
 <MediaStudioUploadPanel onChange={setUploadData} workspaceId={workspaceId} userId={userId} />
 </div>
 )}

 <div className="cth-card p-4">
 <p className="cth-kicker mb-2">Output settings</p>
 <label className="block text-[10px] font-semibold tracking-widest uppercase cth-muted mb-2">
 Aspect Ratio
 </label>
 <div className="flex flex-wrap gap-2">
 {(mode === 'image' ? ASPECT_RATIOS_IMAGE : ASPECT_RATIOS_VIDEO).map((ratio) => (
 <button
 key={ratio}
 onClick={() =>
 mode === 'image'
 ? setImageSettings((s) => ({ ...s, aspectRatio: ratio }))
 : setVideoSettings((s) => ({ ...s, aspectRatio: ratio }))
 }
 data-testid={`ratio-${ratio}`}
 className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
 (mode === 'image' ? imageSettings.aspectRatio : videoSettings.aspectRatio) === ratio
 ? 'bg-[var(--cth-admin-accent)] text-white'
 : 'cth-card-muted cth-muted hover:cth-card-muted'
 }`}
 >
 {ratio}
 </button>
 ))}
 </div>
 </div>

 {mode === 'video' && (
 <div className="mb-5">
 <label className="block text-[10px] font-semibold tracking-widest uppercase cth-muted mb-2">
 Duration
 </label>
 <div className="flex gap-2">
 {['5s', '10s'].map((dur) => (
 <button
 key={dur}
 onClick={() => setVideoSettings((s) => ({ ...s, duration: dur }))}
 data-testid={`duration-${dur}`}
 className={`flex-1 px-3 py-2 rounded-lg text-xs transition-all ${
 videoSettings.duration === dur
 ? 'bg-[var(--cth-admin-accent)] text-white'
 : 'cth-card-muted cth-muted hover:cth-card-muted'
 }`}
 >
 {dur}
 </button>
 ))}
 </div>
 </div>
 )}

 {mode === 'watermark' && (
 <div className="space-y-5 mb-5">
 <div>
 <label className="block text-[10px] font-semibold tracking-widest uppercase cth-muted mb-2">Upload Image</label>
 <input
 ref={watermarkInputRef}
 type="file"
 accept="image/*"
 onChange={(e) => setWatermarkImage(e.target.files?.[0] || null)}
 data-testid="watermark-image-input"
 className="hidden"
 />
 <button
 onClick={() => watermarkInputRef.current?.click()}
 className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-[rgba(224,78,53,0.24)] text-xs cth-muted hover:border-[var(--cth-admin-accent)]/40 hover:cth-muted transition-all"
 >
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
 </svg>
 {watermarkImage ? watermarkImage.name : 'Select image to watermark'}
 </button>
 </div>

 <div>
 <label className="block text-[10px] font-semibold tracking-widest uppercase cth-muted mb-2">Watermark Text</label>
 <input
 value={watermarkSettings.text}
 onChange={(e) => setWatermarkSettings((s) => ({ ...s, text: e.target.value }))}
 data-testid="watermark-text-input"
 placeholder="e.g. Core Truth House"
 className="w-full cth-card-muted border border-[var(--cth-admin-border)] rounded-lg px-3.5 py-2.5 text-sm cth-heading placeholder:cth-muted focus:outline-none focus:border-[var(--cth-admin-accent)]/40 transition-all"
 />
 </div>

 <div>
 <label className="block text-[10px] font-semibold tracking-widest uppercase cth-muted mb-2">Position</label>
 <div className="grid grid-cols-3 gap-1.5">
 {['top-left', 'top-center', 'top-right', 'center', 'bottom-left', 'bottom-center', 'bottom-right'].map((pos) => (
 <button
 key={pos}
 onClick={() => setWatermarkSettings((s) => ({ ...s, position: pos }))}
 data-testid={`watermark-pos-${pos}`}
 className={`px-2 py-1.5 rounded-lg text-[10px] font-medium capitalize transition-all ${watermarkSettings.position === pos ? 'bg-[var(--cth-admin-accent)] text-white' : 'cth-card-muted cth-muted hover:cth-card-muted'}`}
 >
 {pos.replace('-', ' ')}
 </button>
 ))}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="cth-label">Opacity</label>
 <input
 type="range"
 min="0.1"
 max="1"
 step="0.1"
 value={watermarkSettings.opacity}
 onChange={(e) => setWatermarkSettings((s) => ({ ...s, opacity: parseFloat(e.target.value) }))}
 data-testid="watermark-opacity"
 className="w-full accent-[var(--cth-admin-accent)]"
 />
 <p className="text-[10px] cth-muted text-center mt-1">{Math.round(watermarkSettings.opacity * 100)}%</p>
 </div>
 <div>
 <label className="block text-[10px] font-semibold tracking-widest uppercase cth-muted mb-2">Font Size</label>
 <input
 type="range"
 min="12"
 max="72"
 step="2"
 value={watermarkSettings.fontSize}
 onChange={(e) => setWatermarkSettings((s) => ({ ...s, fontSize: parseInt(e.target.value, 10) }))}
 data-testid="watermark-fontsize"
 className="w-full accent-[var(--cth-admin-accent)]"
 />
 <p className="text-[10px] cth-muted text-center mt-1">{watermarkSettings.fontSize}px</p>
 </div>
 </div>

 <div>
 <label className="block text-[10px] font-semibold tracking-widest uppercase cth-muted mb-2">Color</label>
 <div className="flex gap-2">
 {['var(--cth-white)', '#000000', 'var(--cth-admin-accent)', 'var(--cth-brand-primary)', 'var(--cth-brand-primary-deep)', 'var(--cth-admin-ruby)'].map((c) => (
 <button
 key={c}
 onClick={() => setWatermarkSettings((s) => ({ ...s, color: c }))}
 className={`w-8 h-8 rounded-lg border-2 transition-all ${watermarkSettings.color === c ? 'border-[var(--cth-admin-accent)] scale-110' : 'border-[var(--cth-admin-border)]'}`}
 style={{ backgroundColor: c }}
 data-testid={`watermark-color-${c.slice(1)}`}
 />
 ))}
 </div>
 </div>

 <button
 onClick={handleApplyWatermark}
 disabled={!watermarkImage || isWatermarking}
 data-testid="apply-watermark-btn"
 className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all ${
 watermarkImage && !isWatermarking
 ? 'bg-[var(--cth-admin-accent)] text-white hover:opacity-90 shadow-lg shadow-[rgba(224,78,53,0.20)]'
 : 'cth-card-muted cth-muted cursor-not-allowed'
 }`}
 >
 {isWatermarking ? (
 <>
 <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
 </svg>
 Applying watermark...
 </>
 ) : (
 <>
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
 </svg>
 Apply Watermark
 </>
 )}
 </button>

 {watermarkResult && (
 <div className="p-3 rounded-lg border" style={{ background: 'rgba(63,122,95,0.08)', borderColor: 'rgba(63,122,95,0.20)' }}>
 <p className="text-xs font-medium" style={{ color: 'var(--cth-success)' }}>Watermark applied successfully!</p>
 {watermarkResult.image_url && (
 <a
 href={buildMediaUrl(watermarkResult.image_url)}
 target="_blank"
 rel="noopener noreferrer"
 className="text-[10px] cth-text-accent hover:underline mt-1 block"
 >
 View watermarked image
 </a>
 )}
 </div>
 )}
 </div>
 )}

 {(mode === 'image' || mode === 'video') && (
 <button
 onClick={handleGenerate}
 disabled={!canGenerate}
 data-testid="generate-btn"
 className={`w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all ${
 canGenerate
 ? 'bg-[var(--cth-admin-accent)] text-white shadow-lg shadow-[rgba(224,78,53,0.20)] hover:-translate-y-[1px] hover:opacity-95'
 : 'cth-card-muted cth-muted cursor-not-allowed'
 }`}
 >
 {isGenerating ? (
 <>
 <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
 </svg>
 Generating...
 </>
 ) : (
 <>
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
 </svg>
 Generate ({creditCost} credits)
 </>
 )}
 </button>
 )}

 {isGenerating && (
 <div className="mt-4">
 <div className="flex justify-between text-[10px] cth-muted mb-1.5">
 <span>Generating {mode}...</span>
 <span>{generationProgress}%</span>
 </div>
 <div className="h-1.5 rounded-full cth-card-muted overflow-hidden">
 <div
 className="h-full rounded-full bg-[var(--cth-admin-accent)] transition-all duration-300"
 style={{ width: `${generationProgress}%` }}
 />
 </div>
 </div>
 )}

 {generationError && (
 <div className="mt-4 p-3 rounded-lg border" style={{ background: 'rgba(180,67,67,0.08)', borderColor: 'rgba(180,67,67,0.20)' }}>
 <p className="text-xs" style={{ color: 'var(--cth-danger)' }}>{generationError}</p>
 </div>
 )}
 </div>
 </div>

 <div className="cth-page-container cth-page-wide flex-1 overflow-y-auto p-5 md:p-8">
 <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
 {generatedResults.length > 0 ? (
 <div className="cth-stack">
 <div className="cth-row-between mb-1">
 <div>
 <p className="cth-kicker mb-1">Active output</p>
 <h2 className="text-base font-semibold cth-heading">Studio Preview</h2>
 </div>
 <button
 onClick={() => setGeneratedResults([])}
 className="rounded-full px-3 py-1.5 text-xs cth-card-muted cth-muted hover:cth-heading"
 >
 Clear
 </button>
 </div>

 {generatedResults.map((media, idx) => (
 <div key={media.id} className="cth-card overflow-hidden rounded-[28px]">
 <div className="border-b border-[var(--cth-admin-border)] px-5 py-4">
 <div className="cth-row-between">
 <div className="min-w-0">
 <p className="cth-kicker mb-1">Generated asset</p>
 <h3 className="truncate text-lg font-semibold cth-heading">
 {media.type === 'video' ? 'AI Video Output' : 'AI Image Output'}
 </h3>
 <p className="mt-1 text-xs cth-muted">
 {media.provider} • {media.dimensions}
 </p>
 </div>
 <div className="rounded-full px-3 py-1.5 text-xs cth-card-muted cth-muted">
 {media.is_saved ? 'Saved' : 'Ready to save'}
 </div>
 </div>
 </div>

 <div className="p-5">
 <div className="rounded-[26px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-4">
 <div className="overflow-hidden rounded-[22px] bg-black/90">
 <div className="aspect-[4/5] md:aspect-video">
 {media.url ? (
 media.type === 'video' ? (
 <video
 src={buildMediaUrl(media.url)}
 controls
 className="h-full w-full object-contain bg-black"
 />
 ) : (
 <img
 src={buildMediaUrl(media.url)}
 alt={media.prompt}
 className="h-full w-full object-contain bg-black"
 />
 )
 ) : (
 <PlaceholderMedia index={idx} type={media.type} />
 )}
 </div>
 </div>
 </div>

 {generatedResults.length > 1 && (
 <div className="mt-4">
 <p className="mb-2 text-xs font-medium cth-muted">Iterations</p>
 <div className="flex gap-3 overflow-x-auto pb-1">
 {generatedResults.map((thumb, thumbIdx) => (
 <div
 key={thumb.id}
 className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)]"
 >
 {thumb.url || thumb.thumbnail_url ? (
 thumb.type === 'video' ? (
 <div className="flex h-full w-full items-center justify-center bg-black/80">
 <svg className="h-7 w-7 cth-muted" fill="currentColor" viewBox="0 0 24 24">
 <path d="M8 5v14l11-7z" />
 </svg>
 </div>
 ) : (
 <img
 src={buildMediaUrl(thumb.thumbnail_url || thumb.url)}
 alt=""
 className="h-full w-full object-cover"
 />
 )
 ) : (
 <PlaceholderMedia index={thumbIdx} type={thumb.type} />
 )}
 </div>
 ))}
 </div>
 </div>
 )}

 <div className="mt-4 rounded-[22px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-4 py-4">
 <p className="mb-2 text-sm cth-heading">Prompt</p>
 <p className="text-sm cth-muted">{media.prompt}</p>
 </div>

 <div className="cth-row-between mt-4 rounded-[22px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-4 py-4">
 <div className="flex items-center gap-3 text-xs cth-muted">
 <span>{media.provider}</span>
 <span>•</span>
 <span>{media.dimensions}</span>
 <span>•</span>
 <span>{media.type}</span>
 </div>
 <div className="flex items-center gap-2">
 <button
 onClick={() => handleDownload(media)}
 className="rounded-xl bg-white/5 px-3 py-2 text-xs cth-muted transition-colors hover:cth-heading"
 >
 Download
 </button>
 {!media.is_saved && (
 <button
 onClick={() => handleSave(media)}
 className="rounded-xl bg-[var(--cth-admin-accent)] px-3 py-2 text-xs text-white transition-colors hover:opacity-90"
 >
 Save to Library
 </button>
 )}
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="cth-card flex h-full min-h-[420px] flex-col items-center justify-center text-center">
 <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--cth-admin-accent)]/10">
 <svg className="w-10 h-10 cth-text-accent/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
 </svg>
 </div>
 <p className="cth-kicker mb-1">Studio canvas</p>
 <h3 className="mb-2 text-lg font-semibold cth-heading">
 Create something amazing
 </h3>
 <p className="max-w-md text-sm cth-muted">
 Enter a prompt on the left to generate on-brand images or videos. Your creations will appear here.
 </p>
 </div>
 )}
 </div>
 </div>

 <div
 className="cth-panel hidden w-72 flex-shrink-0 overflow-y-auto border-l px-4 py-5 lg:block"
 style={{
 borderColor: 'var(--cth-admin-border)',
 background: 'var(--cth-admin-panel)',
 }}
 >
 <div className="cth-stack gap-4">
 <div className="cth-row-between mb-1">
 <div>
 <p className="cth-kicker mb-1">Saved assets</p>
 <h3 className="text-sm font-semibold cth-heading">Media Library</h3>
 </div>
 <span className="rounded-full px-2.5 py-1 text-[10px] cth-card-muted cth-muted">{library.length} items</span>
 </div>

 <div className="flex gap-1 mb-4 p-1 cth-card-muted rounded-lg">
 {['all', 'images', 'videos', 'saved'].map((filter) => (
 <button
 key={filter}
 onClick={() => setLibraryFilter(filter)}
 data-testid={`filter-${filter}`}
 className={`flex-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition-all ${
 libraryFilter === filter
 ? 'bg-[var(--cth-admin-accent)] text-white shadow-sm'
 : 'cth-muted hover:cth-heading hover:bg-white/40'
 }`}
 >
 {filter.charAt(0).toUpperCase() + filter.slice(1)}
 </button>
 ))}
 </div>

 {libraryLoading ? (
 <div className="flex items-center justify-center py-12">
 <svg className="w-6 h-6 cth-text-accent animate-spin" fill="none" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
 </svg>
 </div>
 ) : filteredLibrary.length > 0 ? (
 <div className="grid grid-cols-2 gap-2">
 {filteredLibrary.map((item, idx) => (
 <button
 key={item.id}
 onClick={() => setSelectedMedia(item)}
 className={`relative aspect-square overflow-hidden rounded-xl border transition-all ${
 selectedMedia?.id === item.id
 ? 'border-[var(--cth-admin-accent)] ring-2 ring-[rgba(224,78,53,0.30)] shadow-sm'
 : 'border-[var(--cth-admin-border)] hover:border-[rgba(224,78,53,0.24)] hover:-translate-y-[1px]'
 }`}
 style={{ background: 'var(--cth-admin-panel-alt)' }}
 >
 {item.url || item.thumbnail_url ? (
 item.type === 'video' ? (
 <div className="w-full h-full cth-card flex items-center justify-center">
 <svg className="w-8 h-8 cth-muted" fill="currentColor" viewBox="0 0 24 24">
 <path d="M8 5v14l11-7z" />
 </svg>
 </div>
 ) : (
 <img
 src={buildMediaUrl(item.thumbnail_url || item.url)}
 alt=""
 className="w-full h-full object-cover"
 />
 )
 ) : (
 <PlaceholderMedia index={idx} type={item.type} />
 )}

 <span className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-semibold ${
 item.type === 'video' ? 'bg-purple-500/80 text-white' : 'bg-blue-500/80 text-white'
 }`}>
 {item.type === 'video' ? 'VID' : 'IMG'}
 </span>

 {item.is_saved && (
 <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
 <svg className="w-2.5 h-2.5 cth-heading" fill="currentColor" viewBox="0 0 20 20">
 <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
 </svg>
 </span>
 )}
 </button>
 ))}
 </div>
 ) : (
 <div className="text-center py-12">
 <p className="text-xs cth-muted">No media found</p>
 </div>
 )}

 {selectedMedia && (
 <div className="cth-card mt-2 overflow-hidden rounded-[24px]">
 <div className="border-b border-[var(--cth-admin-border)] px-4 py-3">
 <p className="cth-kicker mb-1">Selected asset</p>
 <h4 className="text-sm font-semibold cth-heading">
 {selectedMedia.type === 'video' ? 'Video Asset' : 'Image Asset'}
 </h4>
 </div>

 <div className="p-4">
 <div className="mb-4 overflow-hidden rounded-[18px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)]">
 <div className="aspect-square">
 {selectedMedia.url || selectedMedia.thumbnail_url ? (
 selectedMedia.type === 'video' ? (
 <div className="flex h-full w-full items-center justify-center bg-black/85">
 <svg className="h-10 w-10 cth-muted" fill="currentColor" viewBox="0 0 24 24">
 <path d="M8 5v14l11-7z" />
 </svg>
 </div>
 ) : (
 <img
 src={buildMediaUrl(selectedMedia.thumbnail_url || selectedMedia.url)}
 alt={selectedMedia.prompt || 'Selected asset'}
 className="h-full w-full object-cover"
 />
 )
 ) : (
 <PlaceholderMedia index={0} type={selectedMedia.type} />
 )}
 </div>
 </div>

 <div className="mb-3 rounded-[18px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-3 py-3">
 <p className="mb-2 line-clamp-3 text-xs cth-muted">{selectedMedia.prompt}</p>
 <div className="space-y-1 text-[10px] cth-muted">
 <div className="flex items-center justify-between">
 <span>Provider</span>
 <span>{selectedMedia.provider}</span>
 </div>
 <div className="flex items-center justify-between">
 <span>Created</span>
 <span>{timeAgo(selectedMedia.created_at)}</span>
 </div>
 <div className="flex items-center justify-between">
 <span>Type</span>
 <span className="capitalize">{selectedMedia.type}</span>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-2">
 <button
 onClick={() => handleDownload(selectedMedia)}
 className="rounded-xl bg-white/5 px-3 py-2.5 text-[10px] cth-muted transition-colors hover:cth-heading"
 >
 Download
 </button>
 <button
 onClick={() => handleDelete(selectedMedia.id)}
 className="rounded-xl bg-red-500/10 px-3 py-2.5 text-[10px] text-red-400 transition-colors hover:bg-red-500/20"
 >
 Delete
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 </DashboardLayout>
 );
}

export default function MediaStudio() {
 return <MediaStudioContent />;
}
