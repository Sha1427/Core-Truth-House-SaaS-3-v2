import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DashboardLayout } from '../components/Layout';
import { useUser } from '../hooks/useAuth';
import { useWorkspace } from '../context/WorkspaceContext';
import { usePlan } from '../context/PlanContext';
import axios from 'axios';
import MediaStudioUploadPanel from '../components/shared/MediaStudioUploadZones';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

// ─── Config ───────────────────────────────────────────────────────────────────

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

// ─── Searchable Provider Dropdown ─────────────────────────────────────────────

function ProviderDropdown({ providers, selectedId, onSelect, mode }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = providers.filter(p =>
    p.label.toLowerCase().includes(search.toLowerCase()) ||
    p.tag.toLowerCase().includes(search.toLowerCase())
  );

  const available = filtered.filter(p => p.available !== false);
  const unavailable = filtered.filter(p => p.available === false);
  const selected = providers.find(p => p.id === selectedId);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        data-testid="provider-dropdown-trigger"
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-white/[0.09] bg-white/[0.04] text-left hover:border-white/20 transition-all"
      >
        <div className="flex items-center gap-2">
          {selected ? (
            <>
              <span className="text-sm text-white font-medium">{selected.label}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/10 text-white/50">{selected.tag}</span>
            </>
          ) : (
            <span className="text-sm text-white/30">Select AI model...</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selected && <span className="text-[11px] text-white/40">{selected.creditCost} credits</span>}
          <svg className={`w-4 h-4 text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-[#1A0020] border border-white/[0.12] rounded-xl shadow-2xl shadow-black/40 overflow-hidden" data-testid="provider-dropdown-menu">
          {/* Search */}
          <div className="p-2 border-b border-white/[0.07]">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] rounded-lg">
              <svg className="w-3.5 h-3.5 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search models..."
                autoFocus
                data-testid="provider-search-input"
                className="bg-transparent text-xs text-white placeholder:text-white/20 focus:outline-none w-full"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {/* Available models */}
            {available.length > 0 && (
              <>
                <p className="px-3 py-1.5 text-[9px] font-semibold tracking-widest uppercase text-white/20">Available</p>
                {available.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { onSelect(p.id); setOpen(false); setSearch(''); }}
                    data-testid={`provider-${p.id}`}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-all hover:bg-white/[0.06] ${selectedId === p.id ? 'bg-[#E04E35]/10' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedId === p.id ? 'bg-[#E04E35]' : 'bg-emerald-400/60'}`} />
                      <span className="text-xs text-white/80 font-medium">{p.label}</span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] bg-white/[0.08] text-white/40">{p.tag}</span>
                    </div>
                    <span className="text-[10px] text-white/30">{p.creditCost} cr</span>
                  </button>
                ))}
              </>
            )}

            {/* Unavailable models */}
            {unavailable.length > 0 && (
              <>
                <p className="px-3 py-1.5 text-[9px] font-semibold tracking-widest uppercase text-white/20 mt-1 border-t border-white/[0.05] pt-2">Coming Soon — API Key Required</p>
                {unavailable.map(p => (
                  <div
                    key={p.id}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 opacity-40 cursor-not-allowed"
                    data-testid={`provider-${p.id}-unavailable`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-white/15 flex-shrink-0" />
                      <span className="text-xs text-white/50">{p.label}</span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] bg-white/[0.05] text-white/30">{p.tag}</span>
                    </div>
                    <span className="text-[9px] text-white/20 italic">key needed</span>
                  </div>
                ))}
              </>
            )}

            {filtered.length === 0 && (
              <p className="text-xs text-white/25 text-center py-6">No models match "{search}"</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Placeholder component
function PlaceholderMedia({ index, type }) {
  const colors = ['#2d0640', '#1a0020', '#33033C', '#5D0012', '#763B5B'];
  const bg = colors[index % colors.length];
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${bg} 0%, #1c0828 100%)` }}
    >
      {type === 'video' ? (
        <svg className="w-10 h-10 text-white/20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      ) : (
        <svg className="w-10 h-10 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

// Media Studio inner component
function MediaStudioContent() {
  const { user } = useUser();
  const { currentWorkspace } = useWorkspace();
  const { plan } = usePlan();
  const userId = user?.id || 'default';

  // Mode
  const [mode, setMode] = useState('image'); // 'image' | 'video' | 'finetune'

  // Prompt
  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState(null);
  const referenceInputRef = useRef(null);

  // Image settings
  const [imageSettings, setImageSettings] = useState({
    provider: 'openai',
    style: 'brand',
    aspectRatio: '1:1',
    quality: 'hd',
    brandColors: true,
  });

  // Video settings
  const [videoSettings, setVideoSettings] = useState({
    provider: 'sora',
    duration: '5s',
    aspectRatio: '16:9',
    motionAmount: 'medium',
  });

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedResults, setGeneratedResults] = useState([]);
  const [generationError, setGenerationError] = useState(null);

  // Library
  const [library, setLibrary] = useState([]);
  const [libraryFilter, setLibraryFilter] = useState('all');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [libraryLoading, setLibraryLoading] = useState(true);

  // Video polling
  const pollRef = useRef(null);

  // Watermark state
  const [watermarkSettings, setWatermarkSettings] = useState({
    text: 'Core Truth House',
    position: 'bottom-right',
    opacity: 0.5,
    fontSize: 24,
    color: '#ffffff',
  });
  const [watermarkImage, setWatermarkImage] = useState(null);
  const [watermarkResult, setWatermarkResult] = useState(null);
  const [isWatermarking, setIsWatermarking] = useState(false);
  const watermarkInputRef = useRef(null);

  // Credit info
  const [credits, setCredits] = useState({ remaining: 75, total: 75 });

  // Upload panel state for reference images, AI Twin, brand assets
  const [uploadData, setUploadData] = useState({
    referenceImage: null,
    referenceStrength: 0.65,
    aiTwinPhotos: [],
    brandAsset: null,
  });

  // Computed
  const getCreditCost = () => {
    if (mode === 'image') return IMAGE_PROVIDERS.find(p => p.id === imageSettings.provider)?.creditCost ?? 2;
    if (mode === 'video') return VIDEO_PROVIDERS.find(p => p.id === videoSettings.provider)?.creditCost ?? 5;
    return 0;
  };
  const creditCost = getCreditCost();
  const canGenerate = prompt.trim().length > 0 && !isGenerating;

  const filteredLibrary = library.filter(item => {
    if (libraryFilter === 'all') return true;
    if (libraryFilter === 'images') return item.type === 'image';
    if (libraryFilter === 'videos') return item.type === 'video';
    if (libraryFilter === 'saved') return item.is_saved;
    return true;
  });

  // Load library
  useEffect(() => {
    loadLibrary();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [userId]);

  const loadLibrary = async () => {
    setLibraryLoading(true);
    try {
      const res = await axios.get(`${API}/api/media/gallery?user_id=${userId}&limit=40`);
      setLibrary(res.data.items || []);
    } catch (err) {
      console.error('Failed to load gallery:', err);
    } finally {
      setLibraryLoading(false);
    }
  };

  // Handle image generation
  const handleGenerateImage = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setGeneratedResults([]);
    setGenerationError(null);

    const progressInterval = setInterval(() => {
      setGenerationProgress(p => Math.min(p + 8, 92));
    }, 500);

    try {
      let res;
      const provider = imageSettings.provider;

      if (provider === 'nano-banana') {
        // Nano Banana — Gemini image generation
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('style', imageSettings.style);
        formData.append('user_id', userId);
        res = await axios.post(`${API}/api/media/nano-banana/generate`, formData);
      } else if (provider === 'flux-pro' || provider === 'sdxl') {
        // Replicate image models
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('model', provider === 'flux-pro' ? 'black-forest-labs/flux-1.1-pro' : 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b');
        formData.append('user_id', userId);
        res = await axios.post(`${API}/api/media/replicate/generate-image`, formData);
      } else {
        // Default: OpenAI GPT Image 1
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('style', imageSettings.style);
        formData.append('user_id', userId);
        if (referenceImage) formData.append('reference_image', referenceImage);
        res = await axios.post(`${API}/api/media/generate-image`, formData);
      }

      const newMedia = {
        id: res.data.media_id || res.data.id || Date.now().toString(),
        type: 'image',
        url: res.data.image_url || res.data.url,
        thumbnailUrl: res.data.image_url || res.data.url,
        prompt,
        provider: IMAGE_PROVIDERS.find(p => p.id === imageSettings.provider)?.label || imageSettings.provider,
        settings: { style: imageSettings.style, aspectRatio: imageSettings.aspectRatio },
        created_at: new Date().toISOString(),
        is_saved: false,
        dimensions: res.data.dimensions || '1024×1024',
      };

      setGeneratedResults([newMedia]);
      setLibrary(prev => [newMedia, ...prev]);
      setGenerationProgress(100);
    } catch (err) {
      console.error('Image generation failed:', err);
      setGenerationError(err.response?.data?.detail || 'Image generation failed. Please try again.');
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  // Handle video generation
  const handleGenerateVideo = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setGeneratedResults([]);
    setGenerationError(null);

    try {
      const provider = videoSettings.provider;
      let startRes;

      if (provider === 'kling') {
        // Kling v3 Omni via Replicate
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('model', 'kwaivgi/kling-v3-omni-video');
        formData.append('duration', videoSettings.duration);
        formData.append('aspect_ratio', videoSettings.aspectRatio);
        formData.append('user_id', userId);
        startRes = await axios.post(`${API}/api/media/replicate/generate-video`, formData);
      } else {
        // Default: OpenAI Sora / other
        startRes = await axios.post(`${API}/api/media/generate-video`, {
          prompt,
          size: videoSettings.aspectRatio === '16:9' ? '1280x720' : videoSettings.aspectRatio === '9:16' ? '720x1280' : '1024x1024',
          duration: parseInt(videoSettings.duration),
          provider: provider,
          reference_image: referenceImage,
          user_id: userId,
        });
      }

      const jobId = startRes.data.job_id;

      // Poll for completion
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await axios.get(`${API}/api/media/video-status/${jobId}?user_id=${userId}`);
          const status = statusRes.data.status;

          if (status === 'processing') {
            setGenerationProgress(p => Math.min(p + 3, 92));
          } else if (status === 'completed') {
            clearInterval(pollRef.current);
            
            const newMedia = {
              id: jobId,
              type: 'video',
              url: statusRes.data.video_url,
              thumbnailUrl: statusRes.data.thumbnail_url || statusRes.data.video_url,
              prompt,
              provider: VIDEO_PROVIDERS.find(p => p.id === videoSettings.provider)?.label || videoSettings.provider,
              settings: { duration: videoSettings.duration, aspectRatio: videoSettings.aspectRatio },
              created_at: new Date().toISOString(),
              is_saved: false,
              dimensions: videoSettings.aspectRatio === '16:9' ? '1920×1080' : '1080×1920',
            };

            setGeneratedResults([newMedia]);
            setLibrary(prev => [newMedia, ...prev]);
            setGenerationProgress(100);
            setIsGenerating(false);
          } else if (status === 'failed') {
            clearInterval(pollRef.current);
            setGenerationError(statusRes.data.error || 'Video generation failed');
            setIsGenerating(false);
          }
        } catch (err) {
          console.error('Video status check failed:', err);
        }
      }, 3000);
    } catch (err) {
      console.error('Video generation failed:', err);
      setGenerationError(err.response?.data?.detail || 'Video generation failed. Please try again.');
      setIsGenerating(false);
    }
  };

  const handleGenerate = () => {
    if (mode === 'image') {
      handleGenerateImage();
    } else if (mode === 'video') {
      handleGenerateVideo();
    }
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
      formData.append('opacity', watermarkSettings.opacity);
      formData.append('font_size', watermarkSettings.fontSize);
      formData.append('color', watermarkSettings.color);
      formData.append('user_id', userId);

      const res = await axios.post(`${API}/api/media/watermark`, formData);
      setWatermarkResult(res.data);

      const newMedia = {
        id: res.data.media_id || Date.now().toString(),
        type: 'image',
        url: res.data.image_url,
        thumbnailUrl: res.data.image_url,
        prompt: `Watermarked: ${watermarkSettings.text}`,
        provider: 'Watermark',
        created_at: new Date().toISOString(),
        is_saved: false,
      };
      setLibrary(prev => [newMedia, ...prev]);
    } catch (err) {
      console.error('Watermark failed:', err);
      setGenerationError(err.response?.data?.detail || 'Watermark failed');
    }
    setIsWatermarking(false);
  };

  const handleSave = async (media) => {
    try {
      await axios.post(`${API}/api/media/save`, {
        id: media.id,
        user_id: userId,
      });
      setLibrary(prev => prev.map(m => m.id === media.id ? { ...m, is_saved: true } : m));
      setGeneratedResults(prev => prev.map(m => m.id === media.id ? { ...m, is_saved: true } : m));
    } catch (err) {
      console.error('Failed to save media:', err);
    }
  };

  const handleDelete = async (mediaId) => {
    try {
      await axios.delete(`${API}/api/media/${mediaId}?user_id=${userId}`);
      setLibrary(prev => prev.filter(m => m.id !== mediaId));
      setSelectedMedia(null);
    } catch (err) {
      console.error('Failed to delete media:', err);
    }
  };

  const handleDownload = async (media) => {
    try {
      const link = document.createElement('a');
      link.href = media.url;
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
    const reader = new FileReader();
    reader.onload = (ev) => setReferenceImage(ev.target?.result);
    reader.readAsDataURL(file);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full min-h-screen bg-[#1c0828]" data-testid="media-studio-page">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pl-14 pr-4 py-3 md:px-8 md:py-4 border-b border-white/[0.07] bg-[#1c0828]/90 backdrop-blur-sm sticky top-0 z-20">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-xl font-semibold text-white truncate" style={{ fontFamily: 'Georgia, serif' }}>
              Media Studio
            </h1>
            <p className="text-[11px] md:text-xs text-white/40 mt-0.5">
              Generate on-brand images and videos with AI
            </p>
          </div>

          <div className="flex items-center gap-3 md:gap-6 flex-shrink-0 ml-2">
            {/* Credits */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-white/80">{credits.remaining} / {credits.total} credits</p>
                <p className="text-[10px] text-white/40">remaining this month</p>
              </div>
              <div className="w-12 md:w-16 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#E04E35]"
                  style={{ width: `${(credits.remaining / credits.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Three-zone body ───────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

          {/* ── LEFT PANEL — Generation Controls ─────────────────────── */}
          <div className="md:w-80 flex-shrink-0 border-b md:border-b-0 md:border-r border-white/[0.07] overflow-y-auto py-4 px-4 md:py-5 md:px-5 bg-[#1c0828]">

            {/* Mode Tabs */}
            <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl mb-4 md:mb-6 overflow-x-auto">
              {[
                { id: 'image', label: 'Image', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
                { id: 'video', label: 'Video', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
                { id: 'watermark', label: 'Watermark', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
                { id: 'finetune', label: 'Fine-tune', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setMode(tab.id)}
                  data-testid={`mode-tab-${tab.id}`}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    mode === tab.id
                      ? 'bg-[#E04E35] text-white shadow-lg shadow-[#E04E35]/20'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Prompt Input (hidden in watermark mode) */}
            {mode !== 'watermark' && (
            <div className="mb-5">
              <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/30 mb-2">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === 'video' ? 'Describe the video you want to create...' : 'Describe the image you want to create...'}
                data-testid="prompt-input"
                className="w-full h-28 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#E04E35]/50 resize-none"
              />
            </div>
            )}

            {/* Reference Image (for video) */}
            {mode === 'video' && (
              <div className="mb-5">
                <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/30 mb-2">
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
                    <img src={referenceImage} alt="Reference" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setReferenceImage(null)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => referenceInputRef.current?.click()}
                    className="w-full h-20 border border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center gap-1 text-white/40 hover:text-white/60 hover:border-white/30 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-[11px]">Upload reference</span>
                  </button>
                )}
              </div>
            )}

            {/* Provider Selection (hidden in watermark mode) */}
            {mode !== 'watermark' && (
            <div className="mb-5 relative">
              <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/30 mb-2">
                AI Model
              </label>
              <ProviderDropdown
                providers={mode === 'image' ? IMAGE_PROVIDERS : VIDEO_PROVIDERS}
                selectedId={mode === 'image' ? imageSettings.provider : videoSettings.provider}
                onSelect={(id) => mode === 'image' 
                  ? setImageSettings(s => ({ ...s, provider: id }))
                  : setVideoSettings(s => ({ ...s, provider: id }))
                }
                mode={mode}
              />
            </div>
            )}

            {/* Image Style (image mode only) */}
            {mode === 'image' && (
              <div className="mb-5">
                <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/30 mb-2">
                  Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {IMAGE_STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setImageSettings(s => ({ ...s, style: style.id }))}
                      data-testid={`style-${style.id}`}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        imageSettings.style === style.id
                          ? 'bg-[#E04E35] text-white'
                          : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.08]'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Media Upload Zones (image mode only) */}
            {mode === 'image' && (
              <div className="mb-5">
                <MediaStudioUploadPanel onChange={setUploadData} />
              </div>
            )}

            {/* Aspect Ratio */}
            <div className="mb-5">
              <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/30 mb-2">
                Aspect Ratio
              </label>
              <div className="flex flex-wrap gap-2">
                {(mode === 'image' ? ASPECT_RATIOS_IMAGE : ASPECT_RATIOS_VIDEO).map(ratio => (
                  <button
                    key={ratio}
                    onClick={() => mode === 'image'
                      ? setImageSettings(s => ({ ...s, aspectRatio: ratio }))
                      : setVideoSettings(s => ({ ...s, aspectRatio: ratio }))
                    }
                    data-testid={`ratio-${ratio}`}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                      (mode === 'image' ? imageSettings.aspectRatio : videoSettings.aspectRatio) === ratio
                        ? 'bg-[#E04E35] text-white'
                        : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration (video mode only) */}
            {mode === 'video' && (
              <div className="mb-5">
                <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/30 mb-2">
                  Duration
                </label>
                <div className="flex gap-2">
                  {['5s', '10s'].map(dur => (
                    <button
                      key={dur}
                      onClick={() => setVideoSettings(s => ({ ...s, duration: dur }))}
                      data-testid={`duration-${dur}`}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs transition-all ${
                        videoSettings.duration === dur
                          ? 'bg-[#E04E35] text-white'
                          : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'
                      }`}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Watermark UI */}
            {mode === 'watermark' && (
              <div className="space-y-5 mb-5">
                <div>
                  <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/30 mb-2">Upload Image</label>
                  <input
                    ref={watermarkInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setWatermarkImage(e.target.files[0])}
                    data-testid="watermark-image-input"
                    className="hidden"
                  />
                  <button
                    onClick={() => watermarkInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-white/20 text-xs text-white/50 hover:border-[#E04E35]/40 hover:text-white/70 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {watermarkImage ? watermarkImage.name : 'Select image to watermark'}
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/30 mb-2">Watermark Text</label>
                  <input
                    value={watermarkSettings.text}
                    onChange={(e) => setWatermarkSettings(s => ({ ...s, text: e.target.value }))}
                    data-testid="watermark-text-input"
                    placeholder="e.g. Core Truth House"
                    className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#E04E35]/40 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/30 mb-2">Position</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['top-left', 'top-center', 'top-right', 'center', 'bottom-left', 'bottom-center', 'bottom-right'].map(pos => (
                      <button
                        key={pos}
                        onClick={() => setWatermarkSettings(s => ({ ...s, position: pos }))}
                        data-testid={`watermark-pos-${pos}`}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-medium capitalize transition-all ${watermarkSettings.position === pos ? 'bg-[#E04E35] text-white' : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08]'}`}
                      >
                        {pos.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/30 mb-2">Opacity</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={watermarkSettings.opacity}
                      onChange={(e) => setWatermarkSettings(s => ({ ...s, opacity: parseFloat(e.target.value) }))}
                      data-testid="watermark-opacity"
                      className="w-full accent-[#E04E35]"
                    />
                    <p className="text-[10px] text-white/30 text-center mt-1">{Math.round(watermarkSettings.opacity * 100)}%</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/30 mb-2">Font Size</label>
                    <input
                      type="range"
                      min="12"
                      max="72"
                      step="2"
                      value={watermarkSettings.fontSize}
                      onChange={(e) => setWatermarkSettings(s => ({ ...s, fontSize: parseInt(e.target.value) }))}
                      data-testid="watermark-fontsize"
                      className="w-full accent-[#E04E35]"
                    />
                    <p className="text-[10px] text-white/30 text-center mt-1">{watermarkSettings.fontSize}px</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold tracking-widest uppercase text-white/30 mb-2">Color</label>
                  <div className="flex gap-2">
                    {['#ffffff', '#000000', '#E04E35', '#AF0024', '#5D0012', '#763B5B'].map(c => (
                      <button
                        key={c}
                        onClick={() => setWatermarkSettings(s => ({ ...s, color: c }))}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${watermarkSettings.color === c ? 'border-[#E04E35] scale-110' : 'border-white/10'}`}
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
                      ? 'bg-[#E04E35] text-white hover:bg-[#c73e28] shadow-lg shadow-[#E04E35]/20'
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                  }`}
                >
                  {isWatermarking ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Applying watermark...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg> Apply Watermark</>
                  )}
                </button>

                {watermarkResult && (
                  <div className="p-3 bg-emerald-400/10 border border-emerald-400/20 rounded-lg">
                    <p className="text-xs text-emerald-400 font-medium">Watermark applied successfully!</p>
                    <a href={`${import.meta.env.VITE_BACKEND_URL}${watermarkResult.image_url}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#E04E35] hover:underline mt-1 block">View watermarked image</a>
                  </div>
                )}
              </div>
            )}

            {/* Generate Button (image/video modes only) */}
            {(mode === 'image' || mode === 'video') && (
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              data-testid="generate-btn"
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                canGenerate
                  ? 'bg-[#E04E35] text-white hover:bg-[#c73e28] shadow-lg shadow-[#E04E35]/20'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
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

            {/* Generation Progress */}
            {isGenerating && (
              <div className="mt-4">
                <div className="flex justify-between text-[10px] text-white/40 mb-1.5">
                  <span>Generating {mode}...</span>
                  <span>{generationProgress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#E04E35] transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {generationError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-400">{generationError}</p>
              </div>
            )}
          </div>

          {/* ── CENTER PANEL — Canvas / Results ───────────────────────── */}
          <div className="flex-1 overflow-y-auto p-8">
            {generatedResults.length > 0 ? (
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white">Generated Result</h2>
                  <button
                    onClick={() => setGeneratedResults([])}
                    className="text-xs text-white/40 hover:text-white/60"
                  >
                    Clear
                  </button>
                </div>
                
                <div className="grid gap-6">
                  {generatedResults.map((media, idx) => (
                    <div key={media.id} className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
                      <div className="aspect-video relative">
                        {media.url ? (
                          media.type === 'video' ? (
                            <video
                              src={media.url}
                              controls
                              className="w-full h-full object-contain bg-black"
                            />
                          ) : (
                            <img
                              src={media.url}
                              alt={media.prompt}
                              className="w-full h-full object-contain bg-black"
                            />
                          )
                        ) : (
                          <PlaceholderMedia index={idx} type={media.type} />
                        )}
                      </div>
                      
                      <div className="p-4">
                        <p className="text-sm text-white/80 mb-3">{media.prompt}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-white/40">
                            <span>{media.provider}</span>
                            <span>•</span>
                            <span>{media.dimensions}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDownload(media)}
                              className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white text-xs transition-colors"
                            >
                              Download
                            </button>
                            {!media.is_saved && (
                              <button
                                onClick={() => handleSave(media)}
                                className="px-3 py-1.5 rounded-lg bg-[#E04E35] text-white text-xs hover:bg-[#c73e28] transition-colors"
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
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-[#E04E35]/10 flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-[#E04E35]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                  Create something amazing
                </h3>
                <p className="text-sm text-white/40 max-w-md">
                  Enter a prompt on the left to generate on-brand images or videos. Your creations will appear here.
                </p>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL — Media Library ───────────────────────────── */}
          <div className="hidden lg:block w-72 flex-shrink-0 border-l border-white/[0.07] overflow-y-auto py-5 px-4 bg-[#1c0828]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Media Library</h3>
              <span className="text-[10px] text-white/40">{library.length} items</span>
            </div>

            {/* Filters */}
            <div className="flex gap-1 mb-4 p-1 bg-white/[0.03] rounded-lg">
              {['all', 'images', 'videos', 'saved'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setLibraryFilter(filter)}
                  data-testid={`filter-${filter}`}
                  className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                    libraryFilter === filter
                      ? 'bg-[#E04E35] text-white'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            {/* Library Grid */}
            {libraryLoading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="w-6 h-6 text-[#E04E35] animate-spin" fill="none" viewBox="0 0 24 24">
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
                    className={`relative aspect-square rounded-lg overflow-hidden border transition-all ${
                      selectedMedia?.id === item.id
                        ? 'border-[#E04E35] ring-2 ring-[#E04E35]/30'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    {item.url || item.thumbnail_url ? (
                      item.type === 'video' ? (
                        <div className="w-full h-full bg-[#1a0020] flex items-center justify-center">
                          <svg className="w-8 h-8 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      ) : (
                        <img
                          src={item.thumbnail_url || item.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <PlaceholderMedia index={idx} type={item.type} />
                    )}
                    
                    {/* Type badge */}
                    <span className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-semibold ${
                      item.type === 'video' ? 'bg-purple-500/80 text-white' : 'bg-blue-500/80 text-white'
                    }`}>
                      {item.type === 'video' ? 'VID' : 'IMG'}
                    </span>
                    
                    {/* Saved indicator */}
                    {item.is_saved && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-xs text-white/40">No media found</p>
              </div>
            )}

            {/* Selected Media Details */}
            {selectedMedia && (
              <div className="mt-4 p-3 bg-white/[0.03] border border-white/10 rounded-xl">
                <p className="text-xs text-white/60 line-clamp-2 mb-2">{selectedMedia.prompt}</p>
                <div className="flex items-center justify-between text-[10px] text-white/40 mb-3">
                  <span>{selectedMedia.provider}</span>
                  <span>{timeAgo(selectedMedia.created_at)}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(selectedMedia)}
                    className="flex-1 py-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white text-[10px] transition-colors"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(selectedMedia.id)}
                    className="py-1.5 px-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[10px] transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Export with plan gate wrapper
export default function MediaStudio() {
  return (
      <MediaStudioContent />
  );
}
