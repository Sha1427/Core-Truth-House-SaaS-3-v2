import React, { useState, useEffect } from 'react';
import { 
  X, Search, Book, Rocket, PlayCircle, HelpCircle, 
  ChevronRight, ExternalLink, MessageCircle, Keyboard,
  Lightbulb, Target, Palette, PenTool, BarChart3, Users,
  Calendar, Mail, Video, FileText, Settings, CreditCard
} from 'lucide-react';

// Help content data structure
const HELP_SECTIONS = {
  quickStart: {
    title: 'Quick Start',
    icon: Rocket,
    description: 'Get up and running in 30 minutes',
    articles: [
      { id: 'setup-workspace', title: 'Set Up Your Workspace', duration: '5 min', steps: [
        'Sign in to your account',
        'Click your workspace name (top-left)',
        'Go to Settings',
        'Fill in: Brand name, Industry, Brief description'
      ]},
      { id: 'brand-foundation', title: 'Complete Brand Foundation', duration: '15 min', steps: [
        'Navigate to Brand Foundation > Brand Foundation',
        'Fill in Brand Name, Mission, Target Audience, Brand Voice, UVP',
        'Use AI Generate for instant suggestions',
        'Reach 60%+ Foundation Score to unlock AI features'
      ]},
      { id: 'first-content', title: 'Generate Your First Content', duration: '5 min', steps: [
        'Navigate to Content Tools > Content Studio',
        'Select "Instagram Caption" from the left panel',
        'Enter a topic and choose your tone',
        'Click Generate and copy your content!'
      ]},
      { id: 'first-image', title: 'Create Your First Image', duration: '5 min', steps: [
        'Navigate to Content Tools > Media Studio',
        'Select Image mode and write a prompt',
        'Choose Nano Banana (fast) or GPT Image 1 (quality)',
        'Click Generate and download!'
      ]},
    ]
  },
  features: {
    title: 'Feature Guides',
    icon: Book,
    description: 'Deep dives into each module',
    articles: [
      { id: 'strategic-os', title: 'Strategic OS Workflow', icon: Target, description: '9-step AI strategy builder' },
      { id: 'content-studio', title: 'Content Studio', icon: PenTool, description: '13 content types with AI' },
      { id: 'media-studio', title: 'Media Studio', icon: Palette, description: 'AI image & video generation' },
      { id: 'blog-cms', title: 'Blog CMS', icon: FileText, description: 'Create and publish posts' },
      { id: 'crm-suite', title: 'CRM Suite', icon: Users, description: 'Manage contacts & deals' },
      { id: 'campaign-builder', title: 'Campaign Builder', icon: BarChart3, description: 'MAGNET framework campaigns' },
      { id: 'calendar', title: 'Calendar', icon: Calendar, description: 'Schedule your content' },
      { id: 'identity-studio', title: 'Identity Studio', icon: Palette, description: 'Visual brand identity' },
    ]
  },
  videos: {
    title: 'Video Tutorials',
    icon: PlayCircle,
    description: 'Watch and learn',
    articles: [
      { id: 'vid-overview', title: 'Platform Overview', duration: '8 min', thumbnail: 'overview' },
      { id: 'vid-foundation', title: 'Building Your Brand Foundation', duration: '12 min', thumbnail: 'foundation' },
      { id: 'vid-strategic', title: 'Strategic OS Masterclass', duration: '25 min', thumbnail: 'strategic' },
      { id: 'vid-content', title: 'Content Studio Deep Dive', duration: '15 min', thumbnail: 'content' },
      { id: 'vid-media', title: 'Media Studio & AI Images', duration: '18 min', thumbnail: 'media' },
      { id: 'vid-campaigns', title: 'Campaign Builder Tutorial', duration: '20 min', thumbnail: 'campaigns' },
    ]
  },
  shortcuts: {
    title: 'Keyboard Shortcuts',
    icon: Keyboard,
    description: 'Speed up your workflow',
    shortcuts: [
      { keys: ['⌘', '1'], action: 'Command Center' },
      { keys: ['⌘', '2'], action: 'Brand Foundation' },
      { keys: ['⌘', '3'], action: 'Strategic OS' },
      { keys: ['⌘', '4'], action: 'Content Studio' },
      { keys: ['⌘', '5'], action: 'Media Studio' },
      { keys: ['⌘', '6'], action: 'CRM Suite' },
      { keys: ['⌘', '7'], action: 'Calendar' },
      { keys: ['⌘', '8'], action: 'Settings' },
      { keys: ['⌘', '9'], action: 'Billing' },
      { keys: ['⌘', 'K'], action: 'Toggle shortcuts' },
    ]
  }
};

const FEATURE_CONTENT = {
  'strategic-os': {
    title: 'Strategic OS Workflow',
    description: 'A 9-step AI-powered workflow that builds your complete brand strategy.',
    sections: [
      {
        title: 'The 9 Steps',
        content: `
1. **Strategic Brand & Market Analysis** — Market positioning, competitive landscape
2. **Audience Psychology & Messaging** — Deep audience insights, psychological triggers
3. **Authority Positioning & Differentiation** — Your unique authority angle
4. **Competitor Content Breakdown** — White space opportunities
5. **Conversion-Oriented Content Pillars** — 4-6 content themes
6. **Platform-Specific Adaptation** — Tailored strategies per platform
7. **30-Day Strategic Content Plan** — Ready-to-execute calendar
8. **Scroll-Stopping Post Generator** — High-engagement content ideas
9. **Monetization & Conversion Strategy** — Revenue pathways
        `
      },
      {
        title: 'Workflow Modes',
        content: `
**Full OS Mode (9 Steps)** — Complete strategic build, best for new brands or major pivots. Takes 2-4 hours with AI.

**Fast-Start Mode (6 Steps)** — Steps 1, 2, 3, 5, 7, 9. Quick launch strategy. Takes 1-2 hours.
        `
      },
      {
        title: 'How to Use',
        content: `
1. Select a step from the left panel
2. Fill in the input questions (2-4 per step)
3. Click "Generate" to create AI content
4. Review and edit the generated strategy
5. Click "Lock Step" when satisfied
6. Move to the next step
        `
      }
    ]
  },
  'content-studio': {
    title: 'Content Studio',
    description: 'Generate on-brand content for any platform with AI that knows your brand voice.',
    sections: [
      {
        title: 'Content Types',
        content: `
| Type | Best For | Credits |
|------|----------|---------|
| Instagram Caption | Feed posts | 1 |
| Reel Hook | Video openers | 1 |
| Carousel Outline | Slide content | 2 |
| Thread | Twitter/X | 2 |
| Email Newsletter | Updates | 2 |
| Sales Page | Landing copy | 3 |
| Full Blog Post | Articles | 4 |
        `
      },
      {
        title: 'Tips for Best Results',
        content: `
- Be specific in your topic/prompt
- Reference your Brand Memory for consistency
- Use the tone selector to match your brand voice
- Regenerate if the first output doesn't resonate
        `
      }
    ]
  },
  'media-studio': {
    title: 'Media Studio',
    description: 'Generate AI images and videos with multiple provider options.',
    sections: [
      {
        title: 'Image Providers',
        content: `
- **GPT Image 1** (2 credits) — Photorealistic, product shots
- **Nano Banana** (1 credit) — Quick concepts, illustrations
- **Flux Pro** (3 credits) — High-quality artistic
- **SDXL** (2 credits) — Versatile, detailed
        `
      },
      {
        title: 'Video Providers',
        content: `
- **Sora 2** (5 credits) — Cinematic, storytelling
- **Kling AI** (4 credits) — Character animation
- **Luma Ray 3** (4 credits) — 3D visualization
- **Runway Gen 4.5** (4 credits) — Motion graphics
        `
      },
      {
        title: 'Watermarking',
        content: `
1. Generate or select an image
2. Click "Watermark" tab
3. Configure text, position, opacity, size, color
4. Click "Apply Watermark"
5. Download or save
        `
      }
    ]
  },
  'blog-cms': {
    title: 'Blog CMS',
    description: 'Create, manage, and publish blog content with AI assistance.',
    sections: [
      {
        title: 'Creating a Post',
        content: `
1. Click "+ New Post"
2. **Content Tab**: Title, Excerpt, Rich Text Editor, Featured Image, Media Gallery, Tags
3. **SEO Tab**: SEO Title, Description, Search Preview
4. **Settings Tab**: Publish date, Author name
        `
      },
      {
        title: 'Media Gallery',
        content: `
- Bulk upload up to 20 images per post
- 4-column grid preview
- Hover to insert into content or remove
- "Clear all" option available
        `
      }
    ]
  },
  'crm-suite': {
    title: 'CRM Suite',
    description: 'Manage contacts, track deals, and build client relationships.',
    sections: [
      {
        title: 'Deal Pipeline',
        content: `
Drag-and-drop deals across stages:
- Lead → Qualified → Proposal → Negotiation → Closed Won/Lost

Each deal shows: Contact name, Deal value, Days in stage, Next action date
        `
      },
      {
        title: 'Automations',
        content: `
Set up IF/THEN rules:
- **Triggers**: New lead, stage change, engagement threshold
- **Actions**: Send notification, change status, add tag, create task
        `
      }
    ]
  },
  'campaign-builder': {
    title: 'Campaign Builder',
    description: 'Plan and execute marketing campaigns using the MAGNET framework.',
    sections: [
      {
        title: 'MAGNET Framework',
        content: `
- **M**ission — Campaign objective and goals
- **A**udience — Target segment and pain points
- **G**ravity Message — Core hook that pulls them in
- **N**arrative — Story arc and emotional journey
- **E**ngagement — Content types and touchpoints
- **T**ransaction — Conversion path and offer
        `
      },
      {
        title: 'Campaign Tabs',
        content: `
- **Overview**: MAGNET completion tracker, status, dates
- **Content Plan**: 4-week arc (Awareness → Education → Authority → Promotion)
- **Conversion Funnel**: Drag-to-reorder steps
- **Results**: Target vs Actual metrics, weekly breakdown, verdict
        `
      }
    ]
  },
  'calendar': {
    title: 'Calendar',
    description: 'Plan and visualize your content schedule.',
    sections: [
      {
        title: 'Adding Content',
        content: `
1. Click on a date
2. Select content type
3. Add title and details
4. Set time (optional)
5. Link to campaign (optional)
6. Save
        `
      },
      {
        title: 'Status Colors',
        content: `
- 🔵 Blue — Scheduled
- 🟢 Green — Published
- 🟡 Yellow — Draft
- 🔴 Red — Missed
        `
      }
    ]
  },
  'identity-studio': {
    title: 'Identity Studio',
    description: 'Define and manage your brand\'s visual identity.',
    sections: [
      {
        title: 'Sections',
        content: `
- **Color Palette**: Primary, secondary, accent, background, text colors
- **Typography**: Primary, secondary, accent fonts with weights
- **Logo Assets**: Upload logo variations (primary, mark, horizontal, reversed)
- **Brand Keywords**: Visual descriptors, mood words, style references
- **AI Image Prompts**: Pre-configured prompts for consistent imagery
        `
      }
    ]
  }
};

// Searchable help content
function searchHelp(query) {
  const results = [];
  const q = query.toLowerCase();
  
  Object.entries(HELP_SECTIONS).forEach(([key, section]) => {
    if (section.articles) {
      section.articles.forEach(article => {
        if (article.title.toLowerCase().includes(q) || 
            article.description?.toLowerCase().includes(q)) {
          results.push({ ...article, section: section.title });
        }
      });
    }
  });
  
  Object.entries(FEATURE_CONTENT).forEach(([key, content]) => {
    if (content.title.toLowerCase().includes(q) || 
        content.description.toLowerCase().includes(q)) {
      results.push({ id: key, title: content.title, description: content.description, section: 'Features' });
    }
  });
  
  return results;
}

// Video Tutorial Card
function VideoCard({ video, onClick }) {
  const thumbnailColors = {
    overview: 'from-purple-600 to-pink-500',
    foundation: 'from-blue-600 to-cyan-500',
    strategic: 'from-orange-500 to-red-500',
    content: 'from-green-500 to-emerald-400',
    media: 'from-violet-600 to-purple-500',
    campaigns: 'from-amber-500 to-orange-500',
  };

  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer rounded-xl overflow-hidden border transition-all cth-card" style={{ borderColor: "var(--cth-admin-border)" }}
    >
      <div className={`aspect-video bg-gradient-to-br ${thumbnailColors[video.thumbnail] || 'from-gray-600 to-gray-700'} flex items-center justify-center relative`}>
        <PlayCircle size={48} className="cth-body group-hover:opacity-90 group-hover:scale-110 transition-all" />
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs">
          {video.duration}
        </div>
      </div>
      <div className="p-3 cth-card-muted">
        <h4 className="text-sm font-medium cth-heading group-hover:cth-text-accent transition-colors">
          {video.title}
        </h4>
      </div>
    </div>
  );
}

// Feature Article View
function FeatureArticle({ articleId, onBack }) {
  const content = FEATURE_CONTENT[articleId];
  
  if (!content) return null;

  return (
    <div className="h-full flex flex-col">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm cth-muted hover:opacity-80 mb-4 transition-colors"
      >
        <ChevronRight size={16} className="rotate-180" /> Back to guides
      </button>
      
      <h2 className="text-xl font-bold cth-heading mb-2">{content.title}</h2>
      <p className="text-sm cth-muted mb-6">{content.description}</p>
      
      <div className="flex-1 overflow-y-auto space-y-6">
        {content.sections.map((section, idx) => (
          <div key={idx} className="p-4 rounded-xl cth-card border" style={{ borderColor: "var(--cth-admin-border)" }}>
            <h3 className="text-sm font-semibold cth-text-accent mb-3">{section.title}</h3>
            <div className="text-sm cth-body whitespace-pre-line leading-relaxed">
              {section.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Quick Start Steps View
function QuickStartView({ article, onBack }) {
  return (
    <div className="h-full flex flex-col">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm cth-muted hover:opacity-80 mb-4 transition-colors"
      >
        <ChevronRight size={16} className="rotate-180" /> Back
      </button>
      
      <h2 className="text-lg font-bold cth-heading mb-1">{article.title}</h2>
      <p className="text-xs cth-muted mb-6">Estimated time: {article.duration}</p>
      
      <div className="space-y-3">
        {article.steps.map((step, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 rounded-xl cth-card border" style={{ borderColor: "var(--cth-admin-border)" }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "rgba(224,78,53,0.14)", color: "var(--cth-admin-accent)" }}>
              {idx + 1}
            </div>
            <p className="text-sm cth-body pt-0.5">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Video Player Modal
function VideoPlayer({ video, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold cth-heading">{video.title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--cth-admin-panel-alt)] cth-heading transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="aspect-video cth-card-muted rounded-xl border border-[var(--cth-admin-border)] flex items-center justify-center">
          <div className="text-center">
            <PlayCircle size={64} className="mx-auto text-[var(--cth-admin-accent)] mb-4" />
            <p className="cth-heading font-medium mb-2">{video.title}</p>
            <p className="text-sm text-[var(--cth-admin-muted)] mb-4">Duration: {video.duration}</p>
            <p className="text-xs text-[var(--cth-admin-muted)] max-w-md mx-auto">
              Video tutorials coming soon! We're creating high-quality walkthroughs for every feature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Help Center Component
export default function HelpCenter({ isOpen, onClose }) {
  const [activeSection, setActiveSection] = useState('quickStart');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      setSearchResults(searchHelp(searchQuery));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  if (!isOpen) return null;

  const currentSection = HELP_SECTIONS[activeSection];

  return (
    <>
      <div className="fixed inset-0 z-50 flex" data-testid="help-center">
        {/* Backdrop */}
        <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        {/* Help Panel */}
        <div className="w-full max-w-2xl h-full flex flex-col overflow-hidden"
          style={{ background: 'var(--cth-admin-bg)', borderLeft: '1px solid var(--cth-admin-border)' }}>
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--cth-admin-border)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(224,78,53,0.14)" }}>
                <HelpCircle size={20} className="cth-text-accent" />
              </div>
              <div>
                <h2 className="font-semibold cth-heading">Help Center</h2>
                <p className="text-xs cth-muted">Guides, tutorials & shortcuts</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg cth-muted hover:bg-[var(--cth-admin-panel-alt)] hover:opacity-80 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="px-6 py-4 border-b" style={{ borderColor: "var(--cth-admin-border)" }}>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 cth-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search help articles..."
                className="cth-input w-full text-sm rounded-xl pl-10 pr-4 py-2.5"
                data-testid="help-search"
              />
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-3 space-y-1">
                {searchResults.slice(0, 5).map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedArticle(result);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-[var(--cth-admin-panel-alt)] transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm cth-heading">{result.title}</p>
                      <p className="text-xs cth-muted">{result.section}</p>
                    </div>
                    <ChevronRight size={14} className="text-[var(--cth-admin-muted)]" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar */}
            <div className="w-48 border-r p-3 flex-shrink-0" style={{ borderColor: "var(--cth-admin-border)" }}>
              {Object.entries(HELP_SECTIONS).map(([key, section]) => {
                const Icon = section.icon;
                return (
                  <button
                    key={key}
                    onClick={() => { setActiveSection(key); setSelectedArticle(null); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-colors mb-1 ${
                      activeSection === key 
                        ? 'bg-[rgba(224,78,53,0.12)] text-[var(--cth-admin-accent)]' 
                        : 'cth-muted hover:bg-[var(--cth-admin-panel-alt)] hover:opacity-80'
                    }`}
                    data-testid={`help-tab-${key}`}
                  >
                    <Icon size={16} />
                    {section.title}
                  </button>
                );
              })}
              
              <div className="border-t mt-3 pt-3" style={{ borderColor: "var(--cth-admin-border)" }}>
                <a 
                  href="mailto:support@coretruthhouse.com"
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm cth-muted hover:bg-[var(--cth-admin-panel-alt)] hover:opacity-80 transition-colors"
                >
                  <Mail size={16} />
                  Contact Support
                </a>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {selectedArticle ? (
                selectedArticle.steps ? (
                  <QuickStartView 
                    article={selectedArticle} 
                    onBack={() => setSelectedArticle(null)} 
                  />
                ) : (
                  <FeatureArticle 
                    articleId={selectedArticle.id} 
                    onBack={() => setSelectedArticle(null)} 
                  />
                )
              ) : (
                <>
                  {/* Section Header */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold cth-heading mb-1">{currentSection.title}</h3>
                    <p className="text-sm text-[var(--cth-admin-muted)]">{currentSection.description}</p>
                  </div>

                  {/* Quick Start Articles */}
                  {activeSection === 'quickStart' && currentSection.articles && (
                    <div className="space-y-2">
                      {currentSection.articles.map((article) => (
                        <button
                          key={article.id}
                          onClick={() => setSelectedArticle(article)}
                          className="w-full flex items-center justify-between p-4 rounded-xl cth-card border transition-all text-left group" style={{ borderColor: "var(--cth-admin-border)" }}
                          data-testid={`help-article-${article.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(224,78,53,0.12)", color: "var(--cth-admin-accent)" }}>
                              <Lightbulb size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-medium cth-heading group-hover:cth-text-accent transition-colors">
                                {article.title}
                              </p>
                              <p className="text-xs cth-muted">{article.duration}</p>
                            </div>
                          </div>
                          <ChevronRight size={16} className="cth-muted group-hover:cth-text-accent transition-colors" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Feature Guides */}
                  {activeSection === 'features' && currentSection.articles && (
                    <div className="grid grid-cols-2 gap-3">
                      {currentSection.articles.map((article) => {
                        const Icon = article.icon;
                        return (
                          <button
                            key={article.id}
                            onClick={() => setSelectedArticle(article)}
                            className="p-4 rounded-xl cth-card border transition-all text-left group" style={{ borderColor: "var(--cth-admin-border)" }}
                            data-testid={`help-feature-${article.id}`}
                          >
                            <Icon size={20} className="cth-text-accent mb-2" />
                            <p className="text-sm font-medium cth-heading group-hover:cth-text-accent transition-colors mb-1">
                              {article.title}
                            </p>
                            <p className="text-xs cth-muted">{article.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Video Tutorials */}
                  {activeSection === 'videos' && currentSection.articles && (
                    <div className="grid grid-cols-2 gap-4">
                      {currentSection.articles.map((video) => (
                        <VideoCard 
                          key={video.id} 
                          video={video} 
                          onClick={() => setSelectedVideo(video)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Keyboard Shortcuts */}
                  {activeSection === 'shortcuts' && currentSection.shortcuts && (
                    <div className="space-y-2">
                      {currentSection.shortcuts.map((shortcut, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl cth-card border" style={{ borderColor: "var(--cth-admin-border)" }}
                        >
                          <span className="text-sm cth-body">{shortcut.action}</span>
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, kidx) => (
                              <kbd 
                                key={kidx}
                                className="px-2 py-1 rounded cth-card border text-xs cth-heading font-mono" style={{ borderColor: "var(--cth-admin-border)" }}
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                      <p className="text-xs cth-muted mt-4">
                        * On Windows, use Ctrl instead of ⌘
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayer video={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}
    </>
  );
}

// Help Button Component (for sidebar/topbar)
export function HelpButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cth-muted hover:bg-[var(--cth-admin-panel-alt)] hover:opacity-80 transition-colors"
      data-testid="help-button"
    >
      <HelpCircle size={18} />
      <span>Help</span>
    </button>
  );
}
