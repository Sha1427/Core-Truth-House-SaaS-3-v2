/**
 * UI Tooltips Configuration
 * 
 * Central configuration for all tooltips across the application.
 * Import specific tooltip content where needed.
 */

// Brand Foundation Tooltips
export const BRAND_FOUNDATION_TOOLTIPS = {
  brandName: "Your official brand name. This will be used across all generated content and materials.",
  tagline: "A memorable one-liner that captures your brand essence. Keep it under 10 words.",
  mission: "Your brand's purpose — why you exist beyond making money. What change do you want to create?",
  vision: "Where you're headed. Paint a picture of the future you're building toward.",
  values: "3-5 guiding principles that shape how you operate and make decisions.",
  brandVoice: "How your brand sounds when it speaks. Describe the tone, style, and personality.",
  targetAudience: "Who you serve. Be specific about demographics, psychographics, and pain points.",
  uvp: "What makes you different? Why should someone choose you over alternatives?",
  brandStory: "Your origin narrative. How did you get here? What drives you?",
  brandPromise: "What clients can always expect from you. The guarantee you make.",
  foundationScore: "Your brand completeness score. Aim for 80%+ to unlock Strategic OS.",
  aiGenerate: "Use AI to generate suggestions based on your existing brand context.",
};

// Strategic OS Tooltips
export const STRATEGIC_OS_TOOLTIPS = {
  fullMode: "Complete 9-step strategic build. Best for new brands or major pivots. Takes 2-4 hours.",
  fastStart: "Quick 6-step version (steps 1,2,3,5,7,9). Launch faster in 1-2 hours.",
  contextChaining: "Each step builds on previous ones. The AI remembers everything for cohesive strategy.",
  lockStep: "Lock this step when you're satisfied. Locked steps can't be edited but provide stable context.",
  readinessScore: "Shows how prepared you are to generate this step based on completed fields.",
  stepInputs: "Answer these questions to give the AI context for better generation.",
};

// Content Studio Tooltips
export const CONTENT_STUDIO_TOOLTIPS = {
  contentType: "Choose the type of content you want to create. Each has different formats and lengths.",
  creditCost: "AI credits required to generate this content type. Credits reset monthly.",
  tone: "The emotional quality of your content. Match this to your brand voice.",
  regenerate: "Not satisfied? Click to generate a new version with the same inputs.",
  saveToLibrary: "Save this content to your library for later use or reference.",
  wordCount: "Approximate word count for this content type.",
};

// Media Studio Tooltips
export const MEDIA_STUDIO_TOOLTIPS = {
  imageMode: "Generate AI images from text prompts. Multiple providers available.",
  videoMode: "Generate AI videos. Note: Video generation uses more credits.",
  fineTune: "Train custom AI models on your brand assets for consistent imagery.",
  provider: "Different AI providers have different strengths. Hover to see details.",
  aspectRatio: "Choose dimensions based on where you'll use the image (social, web, print).",
  stylePreset: "Pre-configured style settings for consistent aesthetics.",
  watermark: "Add your brand watermark to protect and identify your images.",
  negativePrompt: "Tell the AI what NOT to include in the image.",
};

// CRM Tooltips
export const CRM_TOOLTIPS = {
  pipeline: "Drag deals between stages to track their progress through your sales process.",
  dealValue: "The potential revenue from this deal. Used for forecasting.",
  daysInStage: "How long this deal has been in the current stage. Watch for stale deals.",
  riskScore: "AI-calculated risk based on deal age, engagement, and historical patterns.",
  automation: "Set up automatic actions when certain conditions are met.",
  forecast: "Predicted revenue based on deal probability and value.",
};

// Campaign Builder Tooltips
export const CAMPAIGN_TOOLTIPS = {
  magnet: "MAGNET Framework: Mission, Audience, Gravity Message, Narrative, Engagement, Transaction",
  mission: "Campaign objective and measurable goals. What does success look like?",
  audience: "Target segment for this campaign. Be specific about who you're reaching.",
  gravityMessage: "The core hook that pulls your audience in. What makes them stop scrolling?",
  narrative: "The story arc and emotional journey you're taking them through.",
  engagement: "Content types, touchpoints, and channels for this campaign.",
  transaction: "The conversion path and offer. How do they become customers?",
  contentPlan: "4-week content arc: Awareness → Education → Authority → Promotion",
  results: "Track target vs actual metrics to measure campaign performance.",
};

// Blog CMS Tooltips
export const BLOG_TOOLTIPS = {
  aiDraft: "Describe your topic and let AI generate a full draft including title, content, and SEO.",
  featuredImage: "The main image displayed at the top of your post and in previews.",
  mediaGallery: "Upload multiple images to use throughout your post. Max 20 images.",
  seoTitle: "How your post title appears in search results. Keep under 60 characters.",
  seoDescription: "The snippet shown below your title in search. Keep under 160 characters.",
  slug: "The URL-friendly version of your title. Auto-generated but editable.",
  excerpt: "A brief summary shown in post listings and social shares.",
  publishDate: "Schedule your post for future publication.",
};

// Identity Studio Tooltips
export const IDENTITY_TOOLTIPS = {
  colorPalette: "Your brand's color system. Click any swatch to edit.",
  primaryColor: "Your main brand color. Used for headlines, buttons, and key elements.",
  secondaryColor: "Supporting color that complements your primary. Used for accents.",
  typography: "Font combinations that define your brand's visual voice.",
  primaryFont: "Used for headlines and important text. Should be distinctive.",
  secondaryFont: "Used for body text. Should be highly readable.",
  logoAssets: "Different versions of your logo for various use cases.",
  brandKeywords: "Visual descriptors that guide AI image generation.",
};

// Calendar Tooltips
export const CALENDAR_TOOLTIPS = {
  addContent: "Click any date to schedule content.",
  status: "Color indicates status: Blue=Scheduled, Green=Published, Yellow=Draft, Red=Missed",
  linkCampaign: "Connect this content to a campaign for better tracking.",
  recurring: "Set up content that repeats on a schedule.",
};

// Settings Tooltips
export const SETTINGS_TOOLTIPS = {
  workspace: "Your brand's home base. All team members share this workspace.",
  customDomain: "Connect your own domain (House/Estate plans). Requires DNS verification.",
  notifications: "Control what notifications you receive and how.",
  apiKeys: "Add your own API keys for extended features and higher limits.",
  team: "Invite collaborators and manage their access levels.",
};

// General UI Tooltips
export const UI_TOOLTIPS = {
  aiCredits: "AI generation credits. Click to see usage details and upgrade options.",
  save: "Save your changes. Some sections auto-save as you type.",
  export: "Download this content in your preferred format.",
  copy: "Copy to clipboard for easy pasting elsewhere.",
  delete: "Permanently remove this item. This cannot be undone.",
  archive: "Move to archive. Archived items can be restored later.",
  refresh: "Reload data from the server.",
  filter: "Narrow down results based on specific criteria.",
  sort: "Change the order of items.",
  search: "Find items by name, content, or tags.",
  newItem: "Create a new item in this section.",
  viewAll: "See all items in this category.",
  learnMore: "Get detailed help about this feature.",
};

// Shortcut Tooltips (for buttons)
export const SHORTCUT_TOOLTIPS = {
  commandCenter: { title: "Command Center", shortcut: "⌘1", description: "Your brand dashboard" },
  brandFoundation: { title: "Brand Foundation", shortcut: "⌘2", description: "Define your brand DNA" },
  strategicOS: { title: "Strategic OS", shortcut: "⌘3", description: "AI strategy builder" },
  contentStudio: { title: "Content Studio", shortcut: "⌘4", description: "Generate content" },
  mediaStudio: { title: "Media Studio", shortcut: "⌘5", description: "Create images & videos" },
  crmSuite: { title: "CRM Suite", shortcut: "⌘6", description: "Manage relationships" },
  calendar: { title: "Calendar", shortcut: "⌘7", description: "Schedule content" },
  settings: { title: "Settings", shortcut: "⌘8", description: "Account settings" },
  billing: { title: "Billing", shortcut: "⌘9", description: "Subscription & payments" },
  shortcuts: { title: "Keyboard Shortcuts", shortcut: "⌘K", description: "View all shortcuts" },
};

// Helper to get tooltip by path
export function getTooltip(category, key) {
  const categories = {
    brandFoundation: BRAND_FOUNDATION_TOOLTIPS,
    strategicOS: STRATEGIC_OS_TOOLTIPS,
    contentStudio: CONTENT_STUDIO_TOOLTIPS,
    mediaStudio: MEDIA_STUDIO_TOOLTIPS,
    crm: CRM_TOOLTIPS,
    campaign: CAMPAIGN_TOOLTIPS,
    blog: BLOG_TOOLTIPS,
    identity: IDENTITY_TOOLTIPS,
    calendar: CALENDAR_TOOLTIPS,
    settings: SETTINGS_TOOLTIPS,
    ui: UI_TOOLTIPS,
    shortcuts: SHORTCUT_TOOLTIPS,
  };
  
  return categories[category]?.[key] || '';
}
