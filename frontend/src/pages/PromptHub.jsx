import React, { useState, useEffect } from 'react';
import { useUser } from '../hooks/useAuth';
import axios from 'axios';
import { DashboardLayout } from '../components/Layout';
import { Search, Star, Trash2, Copy, Download, ShoppingBag, Wand2, Plus, ChevronRight, Check, Loader2, Sparkles } from 'lucide-react';
import { PromptCard } from '../components/prompts/PromptCard';

const API = import.meta.env.VITE_BACKEND_URL;

// Tabs configuration
const TABS = [
  { id: 'library', label: 'My Prompts', icon: Sparkles },
  { id: 'store', label: 'Store', icon: ShoppingBag },
  { id: 'generators', label: 'Generators', icon: Wand2 },
];

// Generator configurations
const PLAN_ORDER = { FOUNDATION: 0, STRUCTURE: 1, HOUSE: 2, ESTATE: 3 };

const GENERATORS = [
  {
    id: 'scene',
    title: 'Infinite Scene Generator',
    description: 'Create unlimited cinematic brand scenes with consistent visual DNA',
    icon: '◎',
    color: '#e04e35',
    requiredPlan: 'STRUCTURE',
    fields: [
      { key: 'archetype', label: 'Brand Archetype', placeholder: 'e.g., Luxury Coach, Bold Creator' },
      { key: 'model_description', label: 'Model Description', placeholder: 'e.g., Professional woman, 30s, confident' },
      { key: 'location', label: 'Location', placeholder: 'e.g., Modern minimalist studio' },
      { key: 'mood', label: 'Mood', placeholder: 'e.g., Empowering and sophisticated' },
      { key: 'platform', label: 'Platform', placeholder: 'Instagram, LinkedIn, Website' },
      { key: 'colors', label: 'Color Palette', placeholder: '#AF0024, #e04e35, #1c0828' },
    ]
  },
  {
    id: 'dna',
    title: 'Brand DNA Scene Builder',
    description: 'Build a consistent visual DNA system for all your brand imagery',
    icon: '⬡',
    color: '#763b5b',
    requiredPlan: 'STRUCTURE',
    fields: [
      { key: 'character', label: 'Character', placeholder: 'Brand founder/representative description' },
      { key: 'lighting', label: 'Lighting Style', placeholder: 'e.g., Soft, directional, golden hour' },
      { key: 'colors', label: 'Color Palette', placeholder: '#AF0024, #e04e35' },
      { key: 'mood', label: 'Mood/Emotion', placeholder: 'e.g., Confident, warm, approachable' },
      { key: 'style', label: 'Visual Style', placeholder: 'e.g., Editorial luxury, minimalist modern' },
    ]
  },
  {
    id: 'content-pillars',
    title: 'Content Pillar Architect',
    description: 'Define 4–6 brand content pillars with messaging frameworks for each',
    icon: '◱',
    color: '#c7a09d',
    requiredPlan: 'STRUCTURE',
    fields: [
      { key: 'brand_name', label: 'Brand Name', placeholder: 'e.g., Core Truth House' },
      { key: 'audience', label: 'Target Audience', placeholder: 'e.g., Female entrepreneurs, 30–50' },
      { key: 'transformation', label: 'Transformation You Deliver', placeholder: 'e.g., From scattered to systematic brand' },
      { key: 'platforms', label: 'Content Platforms', placeholder: 'Instagram, LinkedIn, Podcast' },
      { key: 'brand_voice', label: 'Brand Voice', placeholder: 'e.g., Authoritative, warm, direct' },
    ]
  },
  {
    id: 'god-prompt',
    title: 'God Prompt Builder',
    description: 'Create a comprehensive 10-component brand prompt architecture',
    icon: '◈',
    color: '#AF0024',
    requiredPlan: 'HOUSE',
    fields: [
      { key: 'industry', label: 'Industry', placeholder: 'e.g., Coaching, Consulting, Wellness' },
      { key: 'product', label: 'Product/Service', placeholder: 'e.g., Premium coaching program' },
      { key: 'audience', label: 'Target Audience', placeholder: 'e.g., Ambitious professionals' },
      { key: 'visual_style', label: 'Visual Style', placeholder: 'e.g., Luxury editorial' },
      { key: 'emotional_tone', label: 'Emotional Tone', placeholder: 'e.g., Empowering, sophisticated' },
    ]
  },
  {
    id: 'launch',
    title: 'Launch Content Machine',
    description: 'Generate a complete 7-day launch content calendar with copy, hooks, and CTAs',
    icon: '◆',
    color: '#33033c',
    requiredPlan: 'HOUSE',
    fields: [
      { key: 'offer_name', label: 'Offer Name', placeholder: 'e.g., Brand Builder Accelerator' },
      { key: 'launch_date', label: 'Launch Date', placeholder: 'e.g., January 15, 2025' },
      { key: 'pain_point', label: 'Audience Pain Point', placeholder: 'e.g., Struggling with inconsistent branding' },
      { key: 'transformation', label: 'Transformation Promise', placeholder: 'e.g., Build a brand that attracts premium clients' },
      { key: 'brand_voice', label: 'Brand Voice', placeholder: 'e.g., Confident, warm, expert' },
    ]
  },
  {
    id: 'ica-builder',
    title: 'ICA Deep-Dive Builder',
    description: 'Map your Ideal Client Avatar in psychological depth — fears, desires, objections, language patterns',
    icon: '◎',
    color: '#4a1040',
    requiredPlan: 'HOUSE',
    fields: [
      { key: 'industry', label: 'Your Industry', placeholder: 'e.g., Brand Consulting' },
      { key: 'offer_type', label: 'Offer Type', placeholder: 'e.g., 1:1 coaching, group program, done-for-you' },
      { key: 'client_stage', label: 'Client Stage', placeholder: 'e.g., 6-figure entrepreneur ready to scale' },
      { key: 'transformation', label: 'Core Transformation', placeholder: 'e.g., From invisible to recognized authority' },
      { key: 'price_point', label: 'Price Point', placeholder: 'e.g., $5,000–$15,000' },
    ]
  },
  {
    id: 'email-sequence',
    title: 'Email Nurture Sequence',
    description: 'Generate a 5-part email sequence that converts subscribers into buyers using your brand voice',
    icon: '◻',
    color: '#5d1a3a',
    requiredPlan: 'HOUSE',
    fields: [
      { key: 'offer_name', label: 'Offer Name', placeholder: 'e.g., Brand Mastery Program' },
      { key: 'audience_pain', label: 'Audience Pain', placeholder: 'e.g., Inconsistent revenue, unclear messaging' },
      { key: 'brand_voice', label: 'Brand Voice', placeholder: 'e.g., Bold, direct, no-fluff' },
      { key: 'sequence_goal', label: 'Sequence Goal', placeholder: 'e.g., Book a discovery call, enroll in course' },
    ]
  },
  {
    id: 'brand-story',
    title: 'Brand Story Arc Generator',
    description: "Craft your brand's hero journey narrative — origin, turning point, mission, and transformation arc",
    icon: '◬',
    color: '#6b0f2a',
    requiredPlan: 'ESTATE',
    fields: [
      { key: 'founders_journey', label: "Founder's Journey", placeholder: 'e.g., Left corporate after burnout to build this' },
      { key: 'turning_point', label: 'Turning Point Moment', placeholder: 'e.g., The moment you realized the old way was broken' },
      { key: 'mission', label: 'Brand Mission', placeholder: 'e.g., Help women monetize their expertise unapologetically' },
      { key: 'audience_mirror', label: 'How Client Mirrors You', placeholder: 'e.g., They were exactly where I was 3 years ago' },
    ]
  },
];

export default function PromptHub() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('library');
  const [prompts, setPrompts] = useState([]);
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenerator, setSelectedGenerator] = useState(null);
  const [generatorInputs, setGeneratorInputs] = useState({});
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [purchasingPack, setPurchasingPack] = useState(null);
  const [userPlan, setUserPlan] = useState('FOUNDATION');
  const [showUpgradeModal, setShowUpgradeModal] = useState(null);

  const userId = user?.id || 'default';

  // Fetch prompts and packs on mount; handle post-checkout session
  useEffect(() => {
    fetchPrompts();
    fetchPacks();
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const packSuccess = params.get('pack_success');
    if (sessionId && packSuccess === 'true') {
      const packId = params.get('pack_id');
      axios.get(`${API}/api/prompt-packs/checkout/status/${sessionId}`)
        .then(() => { fetchPacks(); })
        .catch(console.error);
      window.history.replaceState({}, '', '/prompt-hub');
    }
    // Fetch user's plan
    axios.get(`${API}/api/usage/summary?workspace_id=default`)
      .then(r => { if (r.data?.plan) setUserPlan(r.data.plan); })
      .catch(() => {});
  }, [userId]);

  const handlePurchasePack = async (pack) => {
    if (!user?.id) { alert('Please sign in to purchase packs.'); return; }
    setPurchasingPack(pack.id);
    try {
      const res = await axios.post(`${API}/api/prompt-packs/checkout`, {
        pack_id: pack.id,
        user_id: user.id,
        user_email: user.primaryEmailAddress?.emailAddress,
        origin_url: window.location.origin,
      });
      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      }
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to start checkout. Please try again.');
    } finally {
      setPurchasingPack(null);
    }
  };

  const fetchPrompts = async () => {
    try {
      const res = await axios.get(`${API}/api/prompts?user_id=${userId}`);
      setPrompts(res.data.prompts || []);
    } catch (err) {
      console.error('Error fetching prompts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPacks = async () => {
    try {
      const res = await axios.get(`${API}/api/prompt-packs?user_id=${userId}`);
      setPacks(res.data.packs || []);
    } catch (err) {
      console.error('Error fetching packs:', err);
    }
  };

  const handleCopyPrompt = async (content, id) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleFavorite = async (promptId) => {
    try {
      await axios.put(`${API}/api/prompts/${promptId}/favorite?user_id=${userId}`);
      setPrompts(prompts.map(p => 
        p.id === promptId ? { ...p, is_favorite: !p.is_favorite } : p
      ));
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleDeletePrompt = async (promptId) => {
    if (!window.confirm('Delete this prompt?')) return;
    try {
      await axios.delete(`${API}/api/prompts/${promptId}?user_id=${userId}`);
      setPrompts(prompts.filter(p => p.id !== promptId));
    } catch (err) {
      console.error('Error deleting prompt:', err);
    }
  };

  const handleGeneratorSubmit = async () => {
    if (!selectedGenerator) return;
    setGenerating(true);
    setGeneratedResult(null);

    try {
      const res = await axios.post(`${API}/api/generators/${selectedGenerator.id}?user_id=${userId}`, {
        generator_type: selectedGenerator.id,
        inputs: generatorInputs
      });
      setGeneratedResult(res.data.result);
      fetchPrompts(); // Refresh prompts to show the saved one
    } catch (err) {
      console.error('Generator error:', err);
      alert(err.response?.data?.detail?.message || 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Filter prompts by search
  const filteredPrompts = prompts.filter(p => 
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate favorites
  const favoritePrompts = filteredPrompts.filter(p => p.is_favorite);
  const otherPrompts = filteredPrompts.filter(p => !p.is_favorite);

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="prompt-hub-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Prompt Hub</h1>
            <p className="text-sm text-gray-400 mt-1">Your AI prompt library, premium packs, and generators</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 pb-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-all text-sm font-medium ${
                activeTab === tab.id
                  ? 'bg-[#2b1040] text-[#e04e35] border-b-2 border-[#e04e35]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: My Prompts Library */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#2b1040] border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#e04e35]/50"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#e04e35]" />
              </div>
            ) : filteredPrompts.length === 0 ? (
              <div className="text-center py-20">
                <Sparkles className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No prompts yet</h3>
                <p className="text-sm text-gray-400 mb-6">Use the generators to create your first prompts</p>
                <button
                  onClick={() => setActiveTab('generators')}
                  className="px-6 py-2.5 bg-[#e04e35] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Go to Generators
                </button>
              </div>
            ) : (
              <>
                {/* Favorites */}
                {favoritePrompts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-[#e04e35] mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 fill-current" /> Favorites
                    </h3>
                    <div className="grid gap-3">
                      {favoritePrompts.map(prompt => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          onCopy={handleCopyPrompt}
                          onFavorite={handleToggleFavorite}
                          onDelete={handleDeletePrompt}
                          copied={copiedId === prompt.id}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* All Prompts */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">All Prompts ({otherPrompts.length})</h3>
                  <div className="grid gap-3">
                    {otherPrompts.map(prompt => (
                      <PromptCard
                        key={prompt.id}
                        prompt={prompt}
                        onCopy={handleCopyPrompt}
                        onFavorite={handleToggleFavorite}
                        onDelete={handleDeletePrompt}
                        copied={copiedId === prompt.id}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB: Store */}
        {activeTab === 'store' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#e04e35]/10 to-[#763b5b]/10 border border-[#e04e35]/20">
              <h3 className="text-white font-semibold mb-1">Premium Prompt Packs</h3>
              <p className="text-sm text-gray-400">One-time purchase add-ons to expand your brand toolkit</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packs.map(pack => (
                <div
                  key={pack.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    pack.is_purchased
                      ? 'bg-[#2b1040] border-green-500/30'
                      : 'bg-[#2b1040] border-white/10 hover:border-[#e04e35]/30'
                  }`}
                  data-testid={`pack-${pack.slug}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, #e04e35, #af0024)' }}>
                      {pack.icon}
                    </div>
                    {pack.is_purchased && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Owned
                      </span>
                    )}
                  </div>

                  <h3 className="text-white font-semibold mb-1">{pack.title}</h3>
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">{pack.description}</p>

                  <div className="space-y-1.5 mb-4">
                    {pack.includes?.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                        <ChevronRight className="w-3 h-3 text-[#e04e35]" />
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-[#e04e35]">${pack.price}</div>
                    {pack.is_purchased ? (
                      <button className="px-4 py-2 bg-white/5 text-gray-400 rounded-lg text-sm">
                        View Prompts
                      </button>
                    ) : (
                      <button
                        data-testid={`purchase-pack-${pack.id}`}
                        onClick={() => handlePurchasePack(pack)}
                        disabled={purchasingPack === pack.id}
                        className="px-4 py-2 bg-[#e04e35] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-60"
                      >
                        {purchasingPack === pack.id ? <><Loader2 className="w-3 h-3 animate-spin" />Processing…</> : <>Purchase</>}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: Generators */}
        {activeTab === 'generators' && (
          <div className="space-y-6">
            {!selectedGenerator ? (
              <>
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#e04e35]/10 to-[#763b5b]/10 border border-[#e04e35]/20">
                  <h3 className="text-white font-semibold mb-1">AI Prompt Generators</h3>
                  <p className="text-sm text-gray-400">Create professional prompts powered by your Brand Memory</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {GENERATORS.map(gen => {
                    const planRequired = gen.requiredPlan || 'FOUNDATION';
                    const isLocked = PLAN_ORDER[userPlan] < PLAN_ORDER[planRequired];
                    const planLabels = { STRUCTURE: 'The Structure', HOUSE: 'The House', ESTATE: 'The Estate' };
                    return (
                    <button
                      key={gen.id}
                      onClick={() => {
                        if (isLocked) { setShowUpgradeModal(gen); return; }
                        setSelectedGenerator(gen);
                        setGeneratorInputs({});
                        setGeneratedResult(null);
                      }}
                      className="p-5 rounded-2xl border text-left group relative overflow-hidden transition-all"
                      style={{
                        background: isLocked ? 'rgba(255,255,255,0.02)' : '#2b1040',
                        borderColor: isLocked ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)',
                        opacity: isLocked ? 0.75 : 1,
                      }}
                      data-testid={`generator-${gen.id}`}
                    >
                      {isLocked && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(224,78,53,0.15)', color: '#e04e35' }}>
                          🔒 {planLabels[planRequired] || planRequired}
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                          style={{ background: isLocked ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${gen.color}, ${gen.color}88)` }}
                        >
                          {gen.icon}
                        </div>
                        {!isLocked && <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-[#e04e35] transition-colors" />}
                      </div>
                      <h3 className="text-white font-semibold mb-1">{gen.title}</h3>
                      <p className="text-sm text-gray-400">{gen.description}</p>
                      {isLocked && (
                        <div className="mt-3 text-xs font-semibold" style={{ color: '#e04e35' }}>
                          Upgrade to {planLabels[planRequired]} to unlock →
                        </div>
                      )}
                    </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="space-y-6">
                {/* Back button */}
                <button
                  onClick={() => {
                    setSelectedGenerator(null);
                    setGeneratedResult(null);
                  }}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Back to generators
                </button>

                {/* Generator header */}
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: `linear-gradient(135deg, ${selectedGenerator.color}, ${selectedGenerator.color}88)` }}
                  >
                    {selectedGenerator.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedGenerator.title}</h2>
                    <p className="text-sm text-gray-400">{selectedGenerator.description}</p>
                  </div>
                </div>

                {/* Generator form */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Inputs</h3>
                    {selectedGenerator.fields.map(field => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">{field.label}</label>
                        <input
                          type="text"
                          placeholder={field.placeholder}
                          value={generatorInputs[field.key] || ''}
                          onChange={(e) => setGeneratorInputs({ ...generatorInputs, [field.key]: e.target.value })}
                          className="w-full px-4 py-2.5 bg-[#1c0828] border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#e04e35]/50"
                        />
                      </div>
                    ))}

                    <button
                      onClick={handleGeneratorSubmit}
                      disabled={generating}
                      className="w-full mt-4 py-3 rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-2"
                      style={{ 
                        background: generating ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #e04e35, #af0024)',
                        cursor: generating ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          Generate Prompts
                        </>
                      )}
                    </button>
                  </div>

                  {/* Output */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Output</h3>
                    <div className="p-4 rounded-xl bg-[#1c0828] border border-white/10 min-h-[400px]">
                      {generatedResult ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-green-400 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Generated & Saved
                            </span>
                            <button
                              onClick={() => handleCopyPrompt(generatedResult, 'result')}
                              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                            >
                              {copiedId === 'result' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {copiedId === 'result' ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                            {generatedResult}
                          </pre>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-16">
                          <Wand2 className="w-10 h-10 text-gray-600 mb-3" />
                          <p className="text-gray-500 text-sm">Fill in the inputs and click Generate</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div data-testid="upgrade-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setShowUpgradeModal(null)}>
          <div style={{ background: '#1c0828', border: '1px solid rgba(224,78,53,0.3)', borderRadius: 20, padding: 32, maxWidth: 400, width: '100%' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{showUpgradeModal.icon}</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 8 }}>Upgrade to unlock</h2>
            <p style={{ fontSize: 14, color: '#c7a09d', marginBottom: 6 }}>
              <strong style={{ color: 'white' }}>{showUpgradeModal.title}</strong> is available on {' '}
              <strong style={{ color: '#e04e35' }}>
                {{ STRUCTURE: 'The Structure ($97/mo)', HOUSE: 'The House ($197/mo)', ESTATE: 'The Estate ($497/mo)' }[showUpgradeModal.requiredPlan]}
              </strong> and above.
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>{showUpgradeModal.description}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href="/billing" data-testid="upgrade-modal-billing-link" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg,#af0024,#e04e35)', color: 'white', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                View Plans & Upgrade
              </a>
              <button data-testid="upgrade-modal-close" onClick={() => setShowUpgradeModal(null)} style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// Prompt Card Component


