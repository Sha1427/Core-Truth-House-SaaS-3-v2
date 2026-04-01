import React, { useState } from 'react';
import { DashboardLayout } from '../components/Layout';
import { 
  PlayCircle, Clock, BookOpen, Filter, Search, 
  ChevronRight, Star, CheckCircle, Lock, X,
  Target, PenTool, Palette, Users, BarChart3, 
  FileText, Calendar, Settings, Rocket
} from 'lucide-react';

const VIDEO_CATEGORIES = [
  { id: 'all', label: 'All Tutorials', icon: BookOpen },
  { id: 'getting-started', label: 'Getting Started', icon: Rocket },
  { id: 'brand-building', label: 'Brand Building', icon: Target },
  { id: 'content', label: 'Content Creation', icon: PenTool },
  { id: 'media', label: 'Media & Design', icon: Palette },
  { id: 'business', label: 'Business Tools', icon: Users },
  { id: 'advanced', label: 'Advanced', icon: Settings },
];

const TUTORIALS = [
  // Getting Started
  {
    id: 'platform-overview',
    title: 'Platform Overview',
    description: 'A complete tour of Core Truth House OS and its capabilities',
    duration: '8:24',
    category: 'getting-started',
    difficulty: 'beginner',
    thumbnail: 'from-purple-600 to-pink-500',
    featured: true,
    completed: false,
  },
  {
    id: 'workspace-setup',
    title: 'Setting Up Your Workspace',
    description: 'Configure your workspace, brand settings, and preferences',
    duration: '5:12',
    category: 'getting-started',
    difficulty: 'beginner',
    thumbnail: 'from-blue-600 to-cyan-500',
    completed: false,
  },
  {
    id: 'navigation-shortcuts',
    title: 'Navigation & Keyboard Shortcuts',
    description: 'Master the interface and boost your productivity',
    duration: '4:45',
    category: 'getting-started',
    difficulty: 'beginner',
    thumbnail: 'from-green-500 to-emerald-400',
    completed: false,
  },

  // Brand Building
  {
    id: 'brand-foundation-mastery',
    title: 'Brand Foundation Mastery',
    description: 'Complete guide to building your brand DNA from scratch',
    duration: '15:30',
    category: 'brand-building',
    difficulty: 'beginner',
    thumbnail: 'from-orange-500 to-red-500',
    featured: true,
    completed: false,
  },
  {
    id: 'strategic-os-masterclass',
    title: 'Strategic OS Masterclass',
    description: 'Deep dive into the 9-step AI strategy workflow',
    duration: '28:15',
    category: 'brand-building',
    difficulty: 'intermediate',
    thumbnail: 'from-red-600 to-orange-500',
    featured: true,
    completed: false,
  },
  {
    id: 'brand-voice-development',
    title: 'Developing Your Brand Voice',
    description: 'Create a consistent, authentic voice that resonates',
    duration: '12:45',
    category: 'brand-building',
    difficulty: 'intermediate',
    thumbnail: 'from-violet-600 to-purple-500',
    completed: false,
  },

  // Content Creation
  {
    id: 'content-studio-guide',
    title: 'Content Studio Deep Dive',
    description: 'Generate on-brand content for every platform',
    duration: '18:20',
    category: 'content',
    difficulty: 'beginner',
    thumbnail: 'from-green-600 to-teal-500',
    completed: false,
  },
  {
    id: 'blog-cms-tutorial',
    title: 'Blog CMS Tutorial',
    description: 'Create, manage, and publish blog posts with AI assistance',
    duration: '14:10',
    category: 'content',
    difficulty: 'beginner',
    thumbnail: 'from-blue-500 to-indigo-500',
    completed: false,
  },
  {
    id: 'content-calendar-planning',
    title: 'Content Calendar Planning',
    description: 'Plan and schedule your content strategy',
    duration: '10:30',
    category: 'content',
    difficulty: 'intermediate',
    thumbnail: 'from-amber-500 to-yellow-500',
    completed: false,
  },

  // Media & Design
  {
    id: 'media-studio-images',
    title: 'AI Image Generation',
    description: 'Create stunning visuals with multiple AI providers',
    duration: '16:45',
    category: 'media',
    difficulty: 'beginner',
    thumbnail: 'from-pink-500 to-rose-500',
    featured: true,
    completed: false,
  },
  {
    id: 'media-studio-video',
    title: 'AI Video Generation',
    description: 'Generate videos with Sora, Kling, and more',
    duration: '20:15',
    category: 'media',
    difficulty: 'intermediate',
    thumbnail: 'from-purple-600 to-pink-600',
    completed: false,
  },
  {
    id: 'identity-studio-guide',
    title: 'Identity Studio Guide',
    description: 'Define your visual brand identity',
    duration: '11:30',
    category: 'media',
    difficulty: 'beginner',
    thumbnail: 'from-cyan-500 to-blue-500',
    completed: false,
  },
  {
    id: 'watermarking-branding',
    title: 'Watermarking & Brand Assets',
    description: 'Protect and brand your visual content',
    duration: '7:20',
    category: 'media',
    difficulty: 'beginner',
    thumbnail: 'from-slate-500 to-gray-600',
    completed: false,
  },

  // Business Tools
  {
    id: 'crm-mastery',
    title: 'CRM Suite Mastery',
    description: 'Manage contacts, deals, and client relationships',
    duration: '22:40',
    category: 'business',
    difficulty: 'intermediate',
    thumbnail: 'from-emerald-500 to-green-600',
    completed: false,
  },
  {
    id: 'campaign-builder-tutorial',
    title: 'Campaign Builder Tutorial',
    description: 'Plan campaigns with the MAGNET framework',
    duration: '19:55',
    category: 'business',
    difficulty: 'intermediate',
    thumbnail: 'from-orange-600 to-amber-500',
    featured: true,
    completed: false,
  },
  {
    id: 'pipeline-forecasting',
    title: 'Pipeline Forecasting',
    description: 'Predict revenue and identify opportunities',
    duration: '13:15',
    category: 'business',
    difficulty: 'advanced',
    thumbnail: 'from-indigo-600 to-purple-600',
    completed: false,
  },

  // Advanced
  {
    id: 'automations-setup',
    title: 'Setting Up Automations',
    description: 'Create powerful IF/THEN automation rules',
    duration: '17:30',
    category: 'advanced',
    difficulty: 'advanced',
    thumbnail: 'from-red-600 to-pink-600',
    completed: false,
  },
  {
    id: 'custom-domains',
    title: 'Custom Domain Setup',
    description: 'Connect your domain with DNS verification',
    duration: '9:45',
    category: 'advanced',
    difficulty: 'advanced',
    thumbnail: 'from-gray-600 to-slate-700',
    completed: false,
  },
  {
    id: 'team-collaboration',
    title: 'Team Collaboration',
    description: 'Invite team members and manage permissions',
    duration: '11:20',
    category: 'advanced',
    difficulty: 'intermediate',
    thumbnail: 'from-blue-600 to-violet-600',
    completed: false,
  },
  {
    id: 'api-integrations',
    title: 'API Keys & Integrations',
    description: 'Connect your own API keys for extended features',
    duration: '14:50',
    category: 'advanced',
    difficulty: 'advanced',
    thumbnail: 'from-slate-600 to-zinc-700',
    completed: false,
  },
];

const DIFFICULTY_CONFIG = {
  beginner: { label: 'Beginner', color: 'text-green-400', bg: 'bg-green-400/10' },
  intermediate: { label: 'Intermediate', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  advanced: { label: 'Advanced', color: 'text-red-400', bg: 'bg-red-400/10' },
};

function VideoCard({ video, onClick }) {
  const difficulty = DIFFICULTY_CONFIG[video.difficulty];
  
  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer rounded-2xl overflow-hidden border border-white/5 hover:border-[rgba(224,78,53,0.3)] transition-all bg-[#2b1040]"
      data-testid={`video-card-${video.id}`}
    >
      {/* Thumbnail */}
      <div className={`aspect-video bg-gradient-to-br ${video.thumbnail} flex items-center justify-center relative`}>
        <PlayCircle size={48} className="text-white/80 group-hover:text-white group-hover:scale-110 transition-all" />
        
        {video.featured && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e04e35] text-white text-[10px] font-medium">
            <Star size={10} fill="currentColor" /> Featured
          </div>
        )}
        
        {video.completed && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <CheckCircle size={14} className="text-white" />
          </div>
        )}
        
        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 text-white text-xs">
          <Clock size={10} /> {video.duration}
        </div>
      </div>
      
      {/* Info */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${difficulty.bg} ${difficulty.color}`}>
            {difficulty.label}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-white group-hover:text-[#e04e35] transition-colors mb-1">
          {video.title}
        </h3>
        <p className="text-xs text-[#4a3550] line-clamp-2">{video.description}</p>
      </div>
    </div>
  );
}

function VideoPlayer({ video, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="w-full max-w-5xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white">{video.title}</h3>
            <p className="text-sm text-[#a08aaa]">{video.description}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
            data-testid="close-video-player"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Video Area */}
        <div className={`aspect-video bg-gradient-to-br ${video.thumbnail} rounded-2xl border border-white/10 flex items-center justify-center`}>
          <div className="text-center max-w-lg">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
              <PlayCircle size={48} className="text-white" />
            </div>
            <h4 className="text-2xl font-bold text-white mb-3">{video.title}</h4>
            <p className="text-white/70 mb-6">Duration: {video.duration}</p>
            <div className="p-4 rounded-xl bg-black/30 backdrop-blur-sm">
              <p className="text-sm text-white/60">
                Video tutorials are coming soon! We're creating high-quality, 
                step-by-step walkthroughs for every feature in Core Truth House OS.
              </p>
            </div>
          </div>
        </div>
        
        {/* Video Info */}
        <div className="flex items-center justify-between mt-4 p-4 rounded-xl bg-[#2b1040] border border-white/5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-[#a08aaa]">
              <Clock size={14} /> {video.duration}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${DIFFICULTY_CONFIG[video.difficulty].bg} ${DIFFICULTY_CONFIG[video.difficulty].color}`}>
              {DIFFICULTY_CONFIG[video.difficulty].label}
            </span>
          </div>
          <button className="text-sm px-4 py-2 rounded-lg bg-[#e04e35] text-white hover:bg-[#e04e35]/90 transition-colors">
            Mark as Completed
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VideoTutorialsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  // Filter tutorials
  const filteredTutorials = TUTORIALS.filter(video => {
    const matchesCategory = activeCategory === 'all' || video.category === activeCategory;
    const matchesDifficulty = difficultyFilter === 'all' || video.difficulty === difficultyFilter;
    const matchesSearch = !searchQuery || 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const featuredTutorials = TUTORIALS.filter(v => v.featured);

  return (
    <DashboardLayout>
      <div data-testid="video-tutorials-page" className="flex-1 overflow-y-auto" style={{ background: '#1c0828' }}>
        {/* Header */}
        <div className="border-b border-white/5 bg-[#1c0828]/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="font-bold text-white text-xl flex items-center gap-2">
                  <PlayCircle size={22} className="text-[#e04e35]" /> Video Tutorials
                </h1>
                <p className="text-xs text-[#4a3550] mt-0.5">
                  {TUTORIALS.length} tutorials • Learn at your own pace
                </p>
              </div>
              
              {/* Search */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a3550]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tutorials..."
                    className="w-64 text-sm rounded-xl pl-9 pr-4 py-2.5 border border-white/10 bg-[#2b1040] text-white placeholder-[#4a3550] focus:outline-none focus:border-[rgba(224,78,53,0.4)]"
                    data-testid="tutorial-search"
                  />
                </div>
                
                {/* Difficulty Filter */}
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="text-sm rounded-xl px-3 py-2.5 border border-white/10 bg-[#2b1040] text-[#a08aaa] focus:outline-none"
                  data-testid="difficulty-filter"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Featured Section */}
          {activeCategory === 'all' && !searchQuery && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Star size={18} className="text-[#e04e35]" /> Featured Tutorials
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredTutorials.map(video => (
                  <VideoCard 
                    key={video.id} 
                    video={video} 
                    onClick={() => setSelectedVideo(video)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Category Tabs */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {VIDEO_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const count = cat.id === 'all' 
                ? TUTORIALS.length 
                : TUTORIALS.filter(v => v.category === cat.id).length;
              
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? 'bg-[#e04e35]/15 text-[#e04e35] border border-[#e04e35]/30'
                      : 'bg-[#2b1040] text-[#a08aaa] border border-white/5 hover:border-white/10'
                  }`}
                  data-testid={`category-${cat.id}`}
                >
                  <Icon size={14} />
                  {cat.label}
                  <span className="text-xs opacity-60">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Tutorials Grid */}
          {filteredTutorials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTutorials.map(video => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  onClick={() => setSelectedVideo(video)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <BookOpen size={48} className="mx-auto text-[#4a3550] mb-4" />
              <p className="text-white font-medium mb-1">No tutorials found</p>
              <p className="text-sm text-[#4a3550]">Try adjusting your search or filters</p>
            </div>
          )}

          {/* Learning Path Suggestion */}
          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-[#e04e35]/10 to-purple-500/10 border border-[#e04e35]/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#e04e35]/20 flex items-center justify-center flex-shrink-0">
                <Rocket size={24} className="text-[#e04e35]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Suggested Learning Path</h3>
                <p className="text-sm text-[#a08aaa] mb-4">
                  New to Core Truth House? Follow this path to master the platform:
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Platform Overview', 'Brand Foundation Mastery', 'Strategic OS Masterclass', 'Content Studio Deep Dive', 'Campaign Builder Tutorial'].map((title, idx) => (
                    <span 
                      key={idx}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-sm text-[#a08aaa]"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#e04e35]/20 text-[#e04e35] flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      {title}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayer video={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}
    </DashboardLayout>
  );
}
