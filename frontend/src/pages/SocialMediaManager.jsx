import React, { useState, useEffect } from 'react';
import { useUser } from '../hooks/useAuth';
import axios from 'axios';
import { DashboardLayout } from '../components/Layout';
import {
  Plus, Search, ChevronLeft, ChevronRight,
  Instagram, Twitter, Linkedin, Facebook, Clock, Send,
  Trash2, Wand2, Loader2, X, Share2, Hash, Sparkles,
  Image, Video, Upload
} from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL;

const PLATFORM_CFG = {
  instagram: { icon: Instagram, color: '#E1306C', limit: 2200, label: 'Instagram' },
  twitter: { icon: Twitter, color: '#1DA1F2', limit: 280, label: 'Twitter / X' },
  linkedin: { icon: Linkedin, color: '#0A66C2', limit: 3000, label: 'LinkedIn' },
  facebook: { icon: Facebook, color: '#1877F2', limit: 5000, label: 'Facebook' },
  tiktok: { icon: Hash, color: '#FF0050', limit: 2200, label: 'TikTok' },
};

const STATUS_CFG = {
  draft: { label: 'Draft', color: '#4a3550', bg: 'rgba(74,53,80,0.15)' },
  scheduled: { label: 'Scheduled', color: '#e04e35', bg: 'rgba(224,78,53,0.1)' },
  published: { label: 'Published', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  failed: { label: 'Failed', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

const TONES = ['professional', 'casual', 'witty', 'inspirational', 'educational', 'conversational'];

function PlatformBadge({ platform, size = 'sm' }) {
  const cfg = PLATFORM_CFG[platform] || PLATFORM_CFG.instagram;
  const Icon = cfg.icon;
  const px = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1.5';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full text-xs font-medium ${px}`}
      style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}25` }}>
      <Icon size={size === 'sm' ? 10 : 14} /> {cfg.label}
    </span>
  );
}

export default function SocialMediaManager() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [calendarData, setCalendarData] = useState({});
  const [platforms, setPlatforms] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(null);
  const [formData, setFormData] = useState({});
  const [generating, setGenerating] = useState(false);
  const [activeView, setActiveView] = useState('calendar');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaPreview, setMediaPreview] = useState([]);
  const mediaInputRef = React.useRef(null);

  const userId = user?.id || 'default';
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  useEffect(() => { fetchAllData(); }, [userId, currentYear, currentMonth]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [postsRes, calRes, platRes, anaRes] = await Promise.all([
        axios.get(`${API}/api/social/posts?user_id=${userId}&limit=50`),
        axios.get(`${API}/api/social/posts/calendar?user_id=${userId}&year=${currentYear}&month=${currentMonth}`),
        axios.get(`${API}/api/social/platforms`),
        axios.get(`${API}/api/social/analytics?user_id=${userId}`),
      ]);
      setPosts(postsRes.data.posts || []);
      setCalendarData(calRes.data.calendar || {});
      setPlatforms(platRes.data.platforms || []);
      setAnalytics(anaRes.data);
    } catch (err) { console.error('Social fetch error:', err); }
    setLoading(false);
  };

  const handleCreatePost = async () => {
    try {
      const postData = { ...formData, media_urls: formData.media_urls || [] };
      await axios.post(`${API}/api/social/posts?user_id=${userId}`, postData);
      setShowModal(null);
      setFormData({});
      setMediaPreview([]);
      fetchAllData();
    } catch (err) { console.error('Create post error:', err); }
  };

  const handleMediaUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadingMedia(true);
    try {
      const newUrls = [...(formData.media_urls || [])];
      const newPreviews = [...mediaPreview];
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('user_id', userId);
        const res = await axios.post(`${API}/api/social/upload-media`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        newUrls.push(res.data.file_url);
        newPreviews.push({
          url: res.data.file_url,
          name: file.name,
          type: res.data.media_type,
        });
      }
      setFormData(d => ({ ...d, media_urls: newUrls }));
      setMediaPreview(newPreviews);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Media upload failed');
    } finally {
      setUploadingMedia(false);
      if (mediaInputRef.current) mediaInputRef.current.value = '';
    }
  };

  const removeMedia = (index) => {
    const urls = [...(formData.media_urls || [])];
    urls.splice(index, 1);
    const previews = [...mediaPreview];
    previews.splice(index, 1);
    setFormData(d => ({ ...d, media_urls: urls }));
    setMediaPreview(previews);
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await axios.delete(`${API}/api/social/posts/${id}?user_id=${userId}`);
      fetchAllData();
    } catch (err) { console.error('Delete error:', err); }
  };

  const handlePublishPost = async (id) => {
    try {
      await axios.post(`${API}/api/social/posts/${id}/publish?user_id=${userId}`);
      fetchAllData();
    } catch (err) { console.error('Publish error:', err); }
  };

  const handleGenerateContent = async () => {
    if (!formData.topic || !formData.platform) return;
    setGenerating(true);
    try {
      const res = await axios.post(`${API}/api/social/generate?user_id=${userId}`, {
        topic: formData.topic, platform: formData.platform,
        tone: formData.tone || 'professional', include_hashtags: true, include_cta: true,
      });
      setFormData(d => ({
        ...d, content: res.data.generated_content, hashtags: res.data.hashtags,
      }));
    } catch (err) { console.error('AI gen error:', err); }
    setGenerating(false);
  };

  const navigateMonth = (dir) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e-${i}`} className="h-28 rounded-xl" style={{ background: 'rgba(13,0,16,0.3)' }} />);
    const today = new Date().toISOString().slice(0, 10);
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayPosts = calendarData[dateStr] || [];
      const isToday = today === dateStr;
      cells.push(
        <div key={day} className="h-28 rounded-xl p-2 transition-all border"
          style={{
            background: isToday ? 'rgba(224,78,53,0.08)' : 'rgba(26,0,32,0.5)',
            borderColor: isToday ? 'rgba(224,78,53,0.3)' : 'transparent',
          }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-lg"
              style={{ color: isToday ? '#fff' : '#a08aaa', background: isToday ? '#e04e35' : 'transparent' }}>
              {day}
            </span>
            {dayPosts.length > 0 && <span className="text-xs text-[#4a3550]">{dayPosts.length}</span>}
          </div>
          <div className="space-y-0.5 overflow-hidden">
            {dayPosts.slice(0, 3).map((post, i) => {
              const cfg = PLATFORM_CFG[post.platform] || PLATFORM_CFG.instagram;
              const Icon = cfg.icon;
              return (
                <div key={i} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs truncate"
                  style={{ background: `${cfg.color}12` }}>
                  <Icon size={10} style={{ color: cfg.color }} />
                  <span className="truncate text-[#a08aaa]">{post.content?.slice(0, 18)}</span>
                </div>
              );
            })}
            {dayPosts.length > 3 && <span className="text-xs text-[#4a3550] pl-1">+{dayPosts.length - 3}</span>}
          </div>
        </div>
      );
    }
    return cells;
  };

  const filteredPosts = posts.filter(p => filterPlatform === 'all' || p.platform === filterPlatform);
  const charLimit = PLATFORM_CFG[formData.platform]?.limit || 2200;
  const charCount = (formData.content || '').length;

  return (
    <DashboardLayout>
      <div data-testid="social-media-manager" className="flex-1 overflow-y-auto" style={{ background: '#1c0828' }}>
        {/* Header */}
        <div className="border-b border-white/5 bg-[#1c0828]/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1 pl-10 md:pl-0">
                <h1 className="font-bold text-white text-lg md:text-xl flex items-center gap-2">
                  <Share2 size={20} className="text-[#e04e35] flex-shrink-0" /> Social Media Manager
                </h1>
                <p className="text-xs text-[#4a3550] mt-0.5">
                  {analytics?.total_posts || 0} posts / {analytics?.total_scheduled || 0} scheduled / {analytics?.total_published || 0} published
                </p>
              </div>
              <button data-testid="create-post-btn" onClick={() => setShowModal('post')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #e04e35, #af0024)', boxShadow: '0 4px 16px rgba(224,78,53,0.3)' }}>
                <Plus size={16} /> Create Post
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-6">
          {loading ? (
            <div className="text-center py-20"><Loader2 size={32} className="mx-auto animate-spin text-[#e04e35]" /></div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                {Object.entries(PLATFORM_CFG).map(([id, cfg]) => {
                  const Icon = cfg.icon;
                  const count = (analytics?.by_platform || {})[id] || 0;
                  return (
                    <div key={id} data-testid={`stat-${id}`}
                      className="p-4 rounded-2xl border border-white/5 text-center"
                      style={{ background: `${cfg.color}06` }}>
                      <Icon size={20} className="mx-auto mb-2" style={{ color: cfg.color }} />
                      <div className="text-lg font-bold text-white">{count}</div>
                      <div className="text-xs text-[#4a3550]">{cfg.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* View Toggle + Filters */}
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-[#2b1040] border border-white/5">
                  {['calendar', 'posts'].map(v => (
                    <button key={v} onClick={() => setActiveView(v)} data-testid={`view-${v}`}
                      className="px-4 py-2 rounded-lg text-xs font-medium capitalize transition-all"
                      style={{
                        background: activeView === v ? 'rgba(224,78,53,0.15)' : 'transparent',
                        color: activeView === v ? '#e04e35' : '#4a3550',
                      }}>
                      {v === 'calendar' ? 'Content Calendar' : 'All Posts'}
                    </button>
                  ))}
                </div>

                {activeView === 'posts' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#4a3550]">Platform:</span>
                    <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}
                      data-testid="platform-filter"
                      className="text-xs rounded-lg px-3 py-1.5 border border-white/10 bg-[#2b1040] text-[#a08aaa] focus:outline-none">
                      <option value="all">All</option>
                      {Object.entries(PLATFORM_CFG).map(([id, c]) => <option key={id} value={id}>{c.label}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Calendar View */}
              {activeView === 'calendar' && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <button data-testid="prev-month" onClick={() => navigateMonth(-1)}
                      className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-[#a08aaa] hover:text-white transition-all">
                      <ChevronLeft size={18} />
                    </button>
                    <h2 className="font-bold text-white text-lg">
                      {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button data-testid="next-month" onClick={() => navigateMonth(1)}
                      className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-[#a08aaa] hover:text-white transition-all">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                      <div key={d} className="text-center text-xs font-medium text-[#4a3550] py-2">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
                </>
              )}

              {/* Posts List View */}
              {activeView === 'posts' && (
                <div className="space-y-3" data-testid="posts-list">
                  {filteredPosts.length > 0 ? filteredPosts.map(post => {
                    const statusCfg = STATUS_CFG[post.status] || STATUS_CFG.draft;
                    return (
                      <div key={post.id} data-testid={`post-${post.id}`}
                        className="group p-5 rounded-2xl border border-white/5 bg-[#2b1040] hover:border-[rgba(224,78,53,0.15)] transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <PlatformBadge platform={post.platform} />
                              <span className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.color}30` }}>
                                {statusCfg.label}
                              </span>
                            </div>
                            <p className="text-sm text-white leading-relaxed mb-2 line-clamp-3">{post.content}</p>
                            {/* Post media thumbnails */}
                            {post.media_urls?.length > 0 && (
                              <div className="flex gap-1.5 mb-2">
                                {post.media_urls.slice(0, 4).map((url, i) => (
                                  <img key={i} src={`${import.meta.env.VITE_BACKEND_URL}${url}`} alt=""
                                    className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                                ))}
                                {post.media_urls.length > 4 && (
                                  <span className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs text-[#4a3550]">
                                    +{post.media_urls.length - 4}
                                  </span>
                                )}
                              </div>
                            )}
                            {post.hashtags && post.hashtags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {post.hashtags.slice(0, 5).map((tag, i) => (
                                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[rgba(224,78,53,0.1)] text-[#e04e35]">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-xs text-[#4a3550]">
                              {post.scheduled_for && (
                                <span className="flex items-center gap-1">
                                  <Clock size={10} /> {new Date(post.scheduled_for).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                              {post.content && <span>{post.content.length} chars</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {post.status === 'scheduled' && (
                              <button data-testid={`publish-${post.id}`} onClick={() => handlePublishPost(post.id)}
                                className="p-2 rounded-lg text-[#4a3550] hover:text-green-400 hover:bg-green-400/10 transition-all"
                                title="Publish now">
                                <Send size={14} />
                              </button>
                            )}
                            <button onClick={() => handleDeletePost(post.id)}
                              className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-[#4a3550] hover:text-red-400 hover:bg-red-400/10 transition-all">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-16" data-testid="empty-posts">
                      <Share2 size={32} className="mx-auto text-[#4a3550] mb-3" />
                      <p className="text-white font-semibold mb-1">No posts yet</p>
                      <p className="text-xs text-[#4a3550]">Create your first social media post.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal: Create Post */}
        {showModal === 'post' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="post-modal">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(null)} />
            <div className="relative w-full max-w-lg rounded-3xl overflow-hidden max-h-[90vh] flex flex-col"
              style={{ background: '#1c0828', border: '1px solid rgba(224,78,53,0.2)' }}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <span className="font-semibold text-white text-sm">Create Post</span>
                <button onClick={() => setShowModal(null)} className="text-[#4a3550] hover:text-white"><X size={18} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Platform select */}
                <div>
                  <label className="text-xs text-[#763b5b] font-medium uppercase tracking-widest mb-1.5 block">Platform</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {Object.entries(PLATFORM_CFG).map(([id, cfg]) => {
                      const Icon = cfg.icon;
                      const active = formData.platform === id;
                      return (
                        <button key={id} onClick={() => setFormData(d => ({ ...d, platform: id }))}
                          data-testid={`select-${id}`}
                          className="flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all text-xs"
                          style={{
                            background: active ? `${cfg.color}15` : 'transparent',
                            borderColor: active ? `${cfg.color}50` : 'rgba(255,255,255,0.05)',
                            color: active ? cfg.color : '#4a3550',
                          }}>
                          <Icon size={18} />
                          <span>{cfg.label.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* AI Generate */}
                <div className="rounded-2xl border border-[rgba(224,78,53,0.15)] overflow-hidden" style={{ background: 'rgba(224,78,53,0.04)' }}>
                  <div className="px-4 py-3 flex items-center gap-2 border-b border-[rgba(224,78,53,0.1)]">
                    <Sparkles size={14} className="text-[#e04e35]" />
                    <span className="text-xs font-semibold text-[#e04e35]">AI Content Generator</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <input data-testid="ai-topic-input" placeholder="What should the post be about?"
                      value={formData.topic || ''} onChange={e => setFormData(d => ({ ...d, topic: e.target.value }))}
                      className="w-full text-sm rounded-xl px-4 py-2.5 border border-white/10 bg-[#2b1040] text-white placeholder-[#4a3550] focus:outline-none focus:border-[rgba(224,78,53,0.4)]" />
                    <div className="flex gap-2">
                      <select value={formData.tone || 'professional'}
                        onChange={e => setFormData(d => ({ ...d, tone: e.target.value }))}
                        className="flex-1 text-xs rounded-xl px-3 py-2.5 border border-white/10 bg-[#2b1040] text-[#a08aaa] focus:outline-none capitalize">
                        {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <button data-testid="generate-btn" onClick={handleGenerateContent}
                        disabled={!formData.topic || !formData.platform || generating}
                        className="px-4 py-2.5 rounded-xl text-white text-xs font-semibold disabled:opacity-40 flex items-center gap-1.5"
                        style={{ background: 'linear-gradient(135deg, #e04e35, #af0024)' }}>
                        {generating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                        {generating ? 'Generating...' : 'Generate'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-[#763b5b] font-medium uppercase tracking-widest">Content</label>
                    <span className="text-xs" style={{ color: charCount > charLimit ? '#ef4444' : '#4a3550' }}>
                      {charCount}/{charLimit}
                    </span>
                  </div>
                  <textarea data-testid="post-content-textarea" value={formData.content || ''}
                    onChange={e => setFormData(d => ({ ...d, content: e.target.value }))}
                    placeholder="Write your post or use the AI generator above..." rows={5}
                    className="w-full text-sm rounded-xl px-4 py-3 border border-white/10 bg-[#2b1040] text-white placeholder-[#4a3550] resize-none focus:outline-none focus:border-[rgba(224,78,53,0.4)]" />
                </div>

                {/* Hashtags */}
                {formData.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {formData.hashtags.map((tag, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-[rgba(224,78,53,0.1)] text-[#e04e35] border border-[rgba(224,78,53,0.15)]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Media Upload */}
                <div>
                  <label className="text-xs text-[#763b5b] font-medium uppercase tracking-widest mb-1.5 block">Media (optional)</label>
                  <input
                    ref={mediaInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaUpload}
                    style={{ display: 'none' }}
                    data-testid="social-media-file-input"
                  />
                  {/* Preview uploaded media */}
                  {mediaPreview.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {mediaPreview.map((m, i) => (
                        <div key={i} className="relative group">
                          {m.type === 'video' ? (
                            <div className="w-20 h-20 rounded-xl bg-[#2b1040] border border-white/10 flex items-center justify-center">
                              <Video size={24} className="text-[#e04e35]" />
                              <span className="text-[8px] text-gray-400 absolute bottom-1 inset-x-0 text-center truncate px-1">{m.name}</span>
                            </div>
                          ) : (
                            <img
                              src={`${import.meta.env.VITE_BACKEND_URL}${m.url}`}
                              alt={m.name}
                              className="w-20 h-20 rounded-xl object-cover border border-white/10"
                            />
                          )}
                          <button
                            onClick={() => removeMedia(i)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    data-testid="upload-media-btn"
                    onClick={() => mediaInputRef.current?.click()}
                    disabled={uploadingMedia}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/15 text-[#4a3550] text-xs hover:text-[#e04e35] hover:border-[rgba(224,78,53,0.3)] transition-all"
                  >
                    {uploadingMedia ? (
                      <><Loader2 size={14} className="animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload size={14} /> Upload Images or Videos</>
                    )}
                  </button>
                </div>

                {/* Schedule */}
                <div>
                  <label className="text-xs text-[#763b5b] font-medium uppercase tracking-widest mb-1.5 block">Schedule (optional)</label>
                  <input type="datetime-local" value={formData.scheduled_for ? formData.scheduled_for.slice(0, 16) : ''}
                    onChange={e => setFormData(d => ({
                      ...d,
                      scheduled_for: e.target.value ? new Date(e.target.value).toISOString() : null,
                      status: e.target.value ? 'scheduled' : 'draft',
                    }))}
                    className="w-full text-sm rounded-xl px-4 py-3 border border-white/10 bg-[#2b1040] text-white focus:outline-none"
                    style={{ colorScheme: 'dark' }} />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-2">
                <button onClick={() => setShowModal(null)}
                  className="text-xs px-4 py-2.5 rounded-xl border border-white/10 text-[#a08aaa]">Cancel</button>
                <button data-testid="save-post-btn" onClick={handleCreatePost}
                  disabled={!formData.content || !formData.platform}
                  className="text-xs px-5 py-2.5 rounded-xl text-white font-semibold disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #e04e35, #af0024)' }}>
                  {formData.scheduled_for ? 'Schedule Post' : 'Save as Draft'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
